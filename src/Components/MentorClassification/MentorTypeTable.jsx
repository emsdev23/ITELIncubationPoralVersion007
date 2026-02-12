import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaEdit,
  FaTrash,
  FaChalkboardTeacher,
  FaPlus,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "./MentorClassificationTable.css"; // Reusing existing CSS or rename if needed
import api from "../Datafetching/api";
import { useWriteAccess } from "../Datafetching/useWriteAccess";

// Material-UI imports
import {
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  CircularProgress,
  Backdrop,
  Snackbar,
  Alert,
  Grid,
  styled,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Import your reusable component
import ReusableDataGrid from "../Datafetching/ReusableDataGrid";

// Styled Backdrop for loading state
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

// Date formatting function updated to handle both legacy timestamp and ISO strings
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    // Handle standard ISO strings or Date objects (from the new Mentor Type API response example)
    if (typeof dateStr === "string" && dateStr.includes("T")) {
      const date = new Date(dateStr);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    
    // Handle legacy timestamp format from API (Existing logic)
    if (Array.isArray(dateStr)) {
      dateStr = dateStr.map((num) => num.toString().padStart(2, "0")).join("");
    } else {
      dateStr = String(dateStr).replace(/,/g, "");
    }
    if (dateStr.length < 14) dateStr = dateStr.padEnd(14, "0");
    
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const minute = dateStr.substring(10, 12);
    const second = dateStr.substring(12, 14);
    
    const formattedDate = new Date(
      `${year}-${month}-${day}T${hour}:${minute}:${second}`
    );
    return formattedDate.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateStr;
  }
};

export default function MentorTypeTable() {
  const userId = sessionStorage.getItem("userid");
  const incUserid = sessionStorage.getItem("incuserid");

  // Use the custom hook to check write access
  // Adjust the path string if permissions are different for Mentor Types
  const hasWriteAccess = useWriteAccess("/Incubation/Dashboard/MentorManagement");

  // States
  const [mentorTypes, setMentorTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState("add"); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    adminState: true,
  });

  // UI State Management
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState({});
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // --- API CALLS ---

  const fetchMentorTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Payload as requested: userId "ALL" and userIncId "1"
      const response = await api.post(
        "resources/generic/getmentortypedetails",
        {
          userId: "ALL",
          userIncId: "1",
        }
      );

      if (response.data.statusCode === 200) {
        const data = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setMentorTypes(data);
      } else {
        throw new Error(response.data.message || "Failed to fetch mentor types");
      }
    } catch (err) {
      console.error("Error fetching mentor types:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to load mentor types.";
      setError(errorMessage);
      setMentorTypes([]);
    } finally {
      setLoading(false);
    }
  }, []); // Removed dependencies as payload is static per requirement

  const createMentorType = useCallback(async () => {
    try {
      const payload = {
        mentortypename: formData.name,
        mentortypedescription: formData.description,
        mentortypeadminstate: formData.adminState ? 1 : 0,
        mentortypecreatedby: userId || "1",
        mentortypemodifiedby: userId || "1",
      };

      const response = await api.post("/addMentorType", null, {
        params: payload,
        headers: {
          "X-Module": "Mentor Type",
          "X-Action": "Add",
        },
      });
      return response.data;
    } catch (err) {
      throw err;
    }
  }, [formData, userId]);

  const updateMentorType = useCallback(async () => {
    try {
      const payload = {
        mentortypeid: editingId,
        mentortypename: formData.name,
        mentortypedescription: formData.description,
        mentortypeadminstate: 1,
        mentortypemodifiedby: userId || "1",
      };

      const response = await api.post("/updateMentorType", null, {
        params: payload,
        headers: {
          "X-Module": "Mentor Type",
          "X-Action": "Update",
        },
      });
      return response.data;
    } catch (err) {
      throw err;
    }
  }, [formData, editingId, userId]);

  const deleteMentorType = useCallback(
    async (id) => {
      try {
        const response = await api.post("/deleteMentorType", null, {
          params: {
            mentortypeid: id,
            mentortypemodifiedby: userId || "1",
          },
          headers: {
            "X-Module": "Mentor Type",
            "X-Action": "Delete",
          },
        });
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    [userId]
  );

  // --- HANDLERS ---

  const showToast = useCallback((message, severity = "success") => {
    setToast({ open: true, message, severity });
  }, []);

  const validateField = useCallback(
    (name, value) => {
      const errors = { ...fieldErrors };
      switch (name) {
        case "name":
          if (!value || value.trim() === "") {
            errors[name] = "Mentor Type Name is required";
          } else {
            delete errors[name];
          }
          break;
        default:
          break;
      }
      setFieldErrors(errors);
      return !errors[name];
    },
    [fieldErrors]
  );

  const validateForm = useCallback(() => {
    const isNameValid = validateField("name", formData.name);
    return isNameValid;
  }, [formData, validateField]);

  const handleInputChange = useCallback(
    (e) => {
      const { name, value, checked } = e.target;
      const finalValue = name === "adminState" ? checked : value;

      if (fieldErrors[name]) {
        validateField(name, finalValue);
      }

      setFormData((prev) => ({
        ...prev,
        [name]: finalValue,
      }));
    },
    [fieldErrors, validateField]
  );

  const openAddModal = useCallback(() => {
    if (!hasWriteAccess) {
      Swal.fire("Access Denied", "You do not have permission to add mentor types.", "warning");
      return;
    }
    setDialogType("add");
    setEditingId(null);
    setFormData({ name: "", description: "", adminState: true });
    setFieldErrors({});
    setOpenDialog(true);
  }, [hasWriteAccess]);

  const openEditModal = useCallback(
    (item) => {
      if (!hasWriteAccess) {
        Swal.fire("Access Denied", "You do not have permission to edit mentor types.", "warning");
        return;
      }
      setDialogType("edit");
      setEditingId(item.mentortypeid);
      setFormData({
        name: item.mentortypename || "",
        description: item.mentortypedescription || "",
        adminState: item.mentortypeadminstate === 1, // Default to true if missing
      });
      setFieldErrors({});
      setOpenDialog(true);
    },
    [hasWriteAccess]
  );

  const handleClose = useCallback(() => {
    setOpenDialog(false);
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      
      if (!validateForm()) {
        showToast("Please fix errors in the form", "error");
        return;
      }

      setIsSaving(true);
      setOpenDialog(false); 

      try {
        let response;
        if (dialogType === "add") {
          response = await createMentorType();
        } else {
          response = await updateMentorType();
        }

        if (response.statusCode === 200) {
          showToast(
            `Mentor Type ${dialogType === "add" ? "added" : "updated"} successfully!`,
            "success"
          );
          fetchMentorTypes();
        } else {
          throw new Error(response.message || "Operation failed");
        }
      } catch (err) {
        console.error(`Error ${dialogType === "add" ? "adding" : "updating"} mentor type:`, err);
        const errorMessage = err.response?.data?.message || err.message || "An unknown error occurred";
        showToast(errorMessage, "error");
        setOpenDialog(true);
      } finally {
        setIsSaving(false);
      }
    },
    [validateForm, showToast, dialogType, createMentorType, updateMentorType, fetchMentorTypes]
  );

  const handleDelete = useCallback(
    (item) => {
      if (!hasWriteAccess) {
        Swal.fire("Access Denied", "You do not have permission to delete mentor types.", "warning");
        return;
      }

      Swal.fire({
        title: "Are you sure?",
        text: "This mentor type will be deleted permanently.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          setIsDeleting((prev) => ({ ...prev, [item.mentortypeid]: true }));
          try {
            const response = await deleteMentorType(item.mentortypeid);
            if (response.statusCode !== 200) {
              throw new Error(response.message || "Failed to delete mentor type");
            }
            return response.data;
          } catch (error) {
            Swal.showValidationMessage(`Request failed: ${error.message}`);
            throw error;
          } finally {
             setIsDeleting((prev) => ({ ...prev, [item.mentortypeid]: false }));
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire("Deleted!", "Mentor type deleted successfully!", "success");
          fetchMentorTypes();
        }
      });
    },
    [hasWriteAccess, deleteMentorType, fetchMentorTypes]
  );

  // --- DATA GRID CONFIG ---

  const columns = useMemo(
    () => [
      {
        field: "mentortypename",
        headerName: "Name",
        width: 200,
        sortable: true,
      },
      {
        field: "mentortypedescription",
        headerName: "Description",
        width: 300,
        sortable: true,
      },
      {
        field: "createdname",
        headerName: "Created By",
        width: 150,
        sortable: true,
      },
      {
        field: "mentortypecreatedtime",
        headerName: "Created Time",
        width: 180,
        sortable: true,
        type: "date",
        valueFormatter: (params) => formatDate(params.value),
      },
      {
        field: "modifiedname",
        headerName: "Modified By",
        width: 150,
        sortable: true,
      },
      {
        field: "mentortypemodifiedtime",
        headerName: "Modified Time",
        width: 180,
        sortable: true,
        type: "date",
        valueFormatter: (params) => formatDate(params.value),
      },
      ...(hasWriteAccess
        ? [
            {
              field: "actions",
              headerName: "Actions",
              width: 150,
              sortable: false,
              filterable: false,
              renderCell: (params) => {
                if (!params?.row) return null;
                return (
                  <Box>
                    <ActionButton
                      color="edit"
                      onClick={() => openEditModal(params.row)}
                      disabled={
                        isSaving || isDeleting[params.row.mentortypeid]
                      }
                      title="Edit"
                    >
                      <FaEdit />
                    </ActionButton>
                    <ActionButton
                      color="delete"
                      onClick={() => handleDelete(params.row)}
                      disabled={
                        isSaving || isDeleting[params.row.mentortypeid]
                      }
                      title="Delete"
                    >
                      {isDeleting[params.row.mentortypeid] ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <FaTrash />
                      )}
                    </ActionButton>
                  </Box>
                );
              },
            },
          ]
        : []),
    ],
    [hasWriteAccess, isSaving, isDeleting, openEditModal, handleDelete]
  );

  const exportConfig = useMemo(
    () => ({
      filename: "mentor_types",
      sheetName: "Mentor Types",
    }),
    []
  );

  const onExportData = useMemo(
    () => (data) =>
      data.map((item, index) => ({
        "S.No": index + 1,
        "Mentor Type Name": item.mentortypename || "",
        Description: item.mentortypedescription || "",
        Status: item.mentortypeadminstate === 1 ? "Active" : "Inactive",
        "Created By": item.mentortypecreatedby || "system",
        "Created Time": formatDate(item.mentortypecreatedtime),
        "Modified By": item.mentortypemodifiedby || "system",
        "Modified Time": formatDate(item.mentortypemodifiedtime),
      })),
    []
  );

  // --- EFFECTS ---

  useEffect(() => {
    fetchMentorTypes();
  }, [fetchMentorTypes]);

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <FaChalkboardTeacher style={{ marginRight: "8px" }} />
          Mentor Types
        </Typography>
        <Button
          variant="contained"
          startIcon={<FaPlus />}
          onClick={openAddModal}
          disabled={!hasWriteAccess}
        >
          Add Mentor Type
        </Button>
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <ReusableDataGrid
        data={mentorTypes}
        columns={columns}
        title=""
        enableExport={true}
        enableColumnFilters={true}
        searchPlaceholder="Search mentor types..."
        searchFields={["mentortypename", "mentortypedescription"]}
        uniqueIdField="mentortypeid"
        onExportData={onExportData}
        exportConfig={exportConfig}
        loading={loading}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === "add" ? "Add" : "Edit"} Mentor Type
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  autoFocus
                  fullWidth
                  name="name"
                  label="Mentor Type Name"
                  type="text"
                  variant="outlined"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={(e) => validateField("name", e.target.value)}
                  error={!!fieldErrors.name}
                  helperText={fieldErrors.name}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="description"
                  label="Description"
                  type="text"
                  variant="outlined"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button 
                type="submit" 
                variant="contained"
                disabled={isSaving || Object.keys(fieldErrors).length > 0}
                startIcon={isSaving ? <CircularProgress size={20} /> : null}
            >
              {isSaving ? "Saving..." : dialogType === "add" ? "Add" : "Save Changes"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Toast Notification */}
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

      {/* Loading Overlay */}
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
            {dialogType === "add" ? "Adding mentor type..." : "Updating mentor type..."}
          </Typography>
        </Box>
      </StyledBackdrop>
    </Box>
  );
}