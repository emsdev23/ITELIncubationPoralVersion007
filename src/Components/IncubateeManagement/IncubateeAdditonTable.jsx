import React, { useEffect, useState, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import { Download } from "lucide-react";
import PropTypes from "prop-types";

// Material UI imports
import {
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Backdrop,
  Snackbar,
  Alert,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// Import your reusable component and API instances
import ReusableDataGrid from "../Datafetching/ReusableDataGrid";
import api from "../Datafetching/api";
import IncubateeForm from "./IncubateeForm";

// Styled components
const StyledBackdrop = styled(Backdrop)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  color: "#fff",
}));

const ActionButton = styled(IconButton)(({ theme, color }) => ({
  margin: theme.spacing(0.5),
  backgroundColor:
    color === "edit" ? theme.palette.primary.main : theme.palette.error.main,
  color: "white",
  "&:hover": {
    backgroundColor:
      color === "edit" ? theme.palette.primary.dark : theme.palette.error.dark,
  },
}));

// Common date formatting function
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const normalizedDate = dateStr.replace("?", " ");
    const date = new Date(normalizedDate);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateStr;
  }
};

const IncubateeTable = () => {
  // State declarations
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const incUserid = sessionStorage.getItem("incuserid");

  const [incubatees, setIncubatees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editIncubatee, setEditIncubatee] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [fieldOfWorkOptions, setFieldOfWorkOptions] = useState([]);
  const [stageLevelOptions, setStageLevelOptions] = useState([]);

  // Fetch dropdown options
  const fetchDropdownOptions = useCallback(() => {
    api
      .post(
        "/resources/generic/getincfield",
        {
          userId: parseInt(userId) || 1,
          userIncId: incUserid,
        },
        {
          headers: {
            "X-Module": "Incubatee Management",
            "X-Action": "Fetch Field of Work Options",
          },
        },
      )
      .then((response) => {
        if (response.data.statusCode === 200) {
          setFieldOfWorkOptions(response.data.data || []);
        }
      })
      .catch((err) => {
        console.error("Error fetching field of work options:", err);
      });

    api
      .post(
        "/resources/generic/getincstage",
        {
          userId: parseInt(userId) || 1,
          userIncId: incUserid,
        },
        {
          headers: {
            "X-Module": "Incubatee Management",
            "X-Action": "Fetch Stage Level Options",
          },
        },
      )
      .then((response) => {
        if (response.data.statusCode === 200) {
          setStageLevelOptions(response.data.data || []);
        }
      })
      .catch((err) => {
        console.error("Error fetching stage level options:", err);
      });
  }, [userId, incUserid]);

  // Fetch Incubatees
  const fetchIncubatees = useCallback(() => {
    setLoading(true);
    api
      .post(
        "/resources/generic/getincubatee",
        {
          userId: parseInt(userId) || 1,
          userIncId: incUserid,
        },
        {
          headers: {
            "X-Module": "Incubatee Management",
            "X-Action": "Fetch Incubatees",
          },
        },
      )
      .then((response) => {
        setIncubatees(response.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching incubatees:", err);
        setToast({
          open: true,
          message: "Failed to load incubatees. Please try again.",
          severity: "error",
        });
        setLoading(false);
      });
  }, [userId, incUserid]);

  useEffect(() => {
    fetchIncubatees();
    fetchDropdownOptions();
  }, [fetchIncubatees, fetchDropdownOptions]);

  // Handle Delete
  const handleDelete = useCallback(
    (incubateeId) => {
      Swal.fire({
        title: "Are you sure?",
        text: "This incubatee will be deleted permanently.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "Deleting...",
            text: "Please wait while we delete the incubatee",
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });
          api
            .post(
              "/deleteIncubatee",
              {},
              {
                params: {
                  incubateesrecid: incubateeId,
                  incubateesmodifiedby: userId || 1,
                },
                headers: {
                  "X-Module": "Incubatee Management",
                  "X-Action": "Delete Incubatee",
                },
              },
            )
            .then((response) => {
              if (response.data.statusCode === 200) {
                Swal.fire(
                  "Deleted!",
                  "Incubatee deleted successfully!",
                  "success",
                );
                fetchIncubatees();
              } else {
                throw new Error(
                  response.data.message || "Failed to delete incubatee",
                );
              }
            })
            .catch((err) => {
              console.error("Error deleting incubatee:", err);
              Swal.fire("Error", `Failed to delete: ${err.message}`, "error");
            });
        }
      });
    },
    [userId, fetchIncubatees],
  );

  // Handle Admin State Toggle
  const handleAdminStateToggle = useCallback(
    (incubatee) => {
      const newState = incubatee.incubateesadminstate === 1 ? 0 : 1;
      const stateText = newState === 1 ? "activate" : "deactivate";

      Swal.fire({
        title: "Are you sure?",
        text: `This incubatee will be ${stateText}d.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: `Yes, ${stateText} it!`,
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: "Updating...",
            text: `Please wait while we ${stateText} the incubatee`,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          api
            .post(
              "/updateIncubatee",
              {},
              {
                params: {
                  incubateesrecid: incubatee.incubateesrecid,
                  incubateesadminstate: newState,
                  incubateesmodifiedby: userId || 1,
                },
                headers: {
                  "X-Module": "Incubatee Management",
                  "X-Action": "Update Admin State",
                },
              },
            )
            .then((response) => {
              if (response.data.statusCode === 200) {
                Swal.fire(
                  "Updated!",
                  `Incubatee ${stateText}d successfully!`,
                  "success",
                );
                fetchIncubatees();
              } else {
                throw new Error(
                  response.data.message || "Failed to update incubatee",
                );
              }
            })
            .catch((err) => {
              console.error("Error updating incubatee:", err);
              Swal.fire("Error", `Failed to update: ${err.message}`, "error");
            });
        }
      });
    },
    [userId, fetchIncubatees],
  );

  // Handle opening the form for adding
  const handleAddIncubatee = useCallback(() => {
    setEditIncubatee(null);
    setIsModalOpen(true);
  }, []);

  // Handle opening the form for editing
  const handleEditIncubatee = useCallback((incubatee) => {
    setEditIncubatee(incubatee);
    setIsModalOpen(true);
  }, []);

  // Handle form close
  const handleFormClose = useCallback(() => {
    setIsModalOpen(false);
    setEditIncubatee(null);
  }, []);

  // Handle form save
  const handleFormSave = useCallback(() => {
    fetchIncubatees();
    setIsModalOpen(false);
    setEditIncubatee(null);
    setToast({
      open: true,
      message: "Incubatee saved successfully!",
      severity: "success",
    });
  }, [fetchIncubatees]);

  // Memoized values for columns
  const columns = useMemo(
    () => [
      {
        field: "incubateesname",
        headerName: "Incubatee Name",
        width: 200,
        sortable: true,
      },
      {
        field: "incubateesemail",
        headerName: "Email",
        width: 200,
        sortable: true,
      },
      {
        field: "incubateesshortname",
        headerName: "Short Name",
        width: 120,
        sortable: true,
      },
      {
        field: "fieldofworkname",
        headerName: "Field of Work",
        width: 150,
        sortable: true,
      },
      {
        field: "startupstagesname",
        headerName: "Stage Level",
        width: 120,
        sortable: true,
      },
      {
        field: "incubateesincubatorname",
        headerName: "Incubator Name",
        width: 180,
        sortable: true,
      },
      {
        field: "incubateesdateofincubation",
        headerName: "Date of Incubation",
        width: 180,
        sortable: true,
        type: "date",
        valueFormatter: (params) => formatDate(params.value),
      },
      {
        field: "incubateesadminstate",
        headerName: "Admin State",
        width: 120,
        sortable: true,
        renderCell: (params) => {
          if (!params || !params.row) return null;
          return (
            <Chip
              label={params.value === 1 ? "Active" : "Inactive"}
              color={params.value === 1 ? "success" : "default"}
              variant={params.value === 1 ? "filled" : "outlined"}
              size="small"
            />
          );
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 150,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          if (!params || !params.row) return null;
          return (
            <Box>
              <ActionButton
                color="edit"
                onClick={() => handleEditIncubatee(params.row)}
                disabled={isSaving}
                title="Edit"
              >
                <EditIcon fontSize="small" />
              </ActionButton>
              <ActionButton
                color="delete"
                onClick={() => handleDelete(params.row.incubateesrecid)}
                disabled={isSaving}
                title="Delete"
              >
                <DeleteIcon fontSize="small" />
              </ActionButton>
            </Box>
          );
        },
      },
    ],
    [isSaving, handleDelete, handleEditIncubatee],
  );

  const exportConfig = useMemo(
    () => ({
      filename: "incubatees",
      sheetName: "Incubatees",
    }),
    [],
  );

  const onExportData = useMemo(
    () => (data) => {
      return data.map((incubatee, index) => ({
        "S.No": index + 1,
        "Incubatee Name": incubatee.incubateesname || "",
        Email: incubatee.incubateesemail || "",
        "Short Name": incubatee.incubateesshortname || "",
        "Field of Work": incubatee.fieldofworkname || "",
        "Stage Level": incubatee.startupstagesname || "",
        "Incubator Name": incubatee.incubateesincubatorname || "",
        "Date of Incubation": formatDate(incubatee.incubateesdateofincubation),
        "Date of Incorporation": formatDate(
          incubatee.incubateesdateofincorporation,
        ),
        "Admin State":
          incubatee.incubateesadminstate === 1 ? "Active" : "Inactive",
        Website: incubatee.incubateeswebsite || "",
      }));
    },
    [],
  );

  return (
    <Box sx={{ p: 3 }} style={{ marginTop: "100px" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          🚀 Incubatees Management
        </Typography>
        <Button
          variant="contained"
          onClick={handleAddIncubatee}
          disabled={isSaving}
          sx={{
            px: 3,
            py: 1,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          + Add Incubatee
        </Button>
      </Box>

      <ReusableDataGrid
        data={incubatees}
        columns={columns}
        title="Incubatees"
        enableExport={true}
        enableColumnFilters={true}
        searchPlaceholder="Search incubatees..."
        searchFields={[
          "incubateesname",
          "incubateesemail",
          "incubateesshortname",
        ]}
        uniqueIdField="incubateesrecid"
        onExportData={onExportData}
        exportConfig={exportConfig}
        loading={loading}
      />

      <IncubateeForm
        open={isModalOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
        editIncubatee={editIncubatee}
        fieldOfWorkOptions={fieldOfWorkOptions}
        stageLevelOptions={stageLevelOptions}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      <StyledBackdrop open={isSaving}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>
            {editIncubatee ? "Updating incubatee..." : "Saving incubatee..."}
          </Typography>
        </Box>
      </StyledBackdrop>
    </Box>
  );
};

IncubateeTable.propTypes = {};

export default IncubateeTable;
