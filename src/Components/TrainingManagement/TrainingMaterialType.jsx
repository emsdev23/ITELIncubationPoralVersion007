import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback,
} from "react";
import Swal from "sweetalert2";
import { IPAdress } from "../Datafetching/IPAdrees";
import { FaTimes } from "react-icons/fa";

// Material UI imports
import {
  Button,
  Box,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Backdrop,
  Snackbar,
  Alert,
  Grid,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

// Import your reusable component
import ReusableDataGrid from "../Datafetching/ReusableDataGrid";
import api from "../Datafetching/api"; // Assuming configured axios instance
import { useWriteAccess } from "../Datafetching/UseWriteAccess";
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

// Component Definition
const TrainingMaterialType = forwardRef(
  ({ title = "📚 Training Material Types" }, ref) => {
    const userId = sessionStorage.getItem("userid");
    const token = sessionStorage.getItem("token");
    const roleid = sessionStorage.getItem("roleid");
    const IP = IPAdress;

    const hasWriteAccess = useWriteAccess(
      "/Incubation/Dashboard/TrainingManagementPage",
    );

    // STATE DECLARATIONS
    const [materialTypes, setMaterialTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editType, setEditType] = useState(null);

    const [formData, setFormData] = useState({
      trainingmattype: "", // This is the name of the material type (e.g., Video, PDF)
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState({});
    const [toast, setToast] = useState({
      open: false,
      message: "",
      severity: "success",
    });

    // Expose the openAddModal function to parent components
    useImperativeHandle(ref, () => ({
      openAddModal,
    }));

    // --- API CALLS ---

    const fetchMaterialTypes = useCallback(async () => {
      setLoading(true);
      try {
        const response = await api.post(
          "/resources/generic/gettrainingmattypelist",
          {
            userId: parseInt(userId) || 1,
            userIncId: "ALL",
          },
          {
            headers: {
              "X-Module": "Training Management",
              "X-Action": "Fetch Material Types",
            },
          },
        );
        setMaterialTypes(response.data.data || []);
      } catch (err) {
        console.error("Error fetching material types:", err);
        Swal.fire("Error", "Failed to load material types.", "error");
      } finally {
        setLoading(false);
      }
    }, [userId]);

    const refreshData = useCallback(() => {
      fetchMaterialTypes();
    }, [fetchMaterialTypes]);

    // --- HANDLERS ---

    const showToast = useCallback((message, severity = "success") => {
      setToast({ open: true, message, severity });
    }, []);

    const validateField = useCallback(
      (name, value) => {
        const errors = { ...fieldErrors };
        if (name === "trainingmattype") {
          if (!value || value.trim() === "") {
            errors[name] = "Material Type Name is required";
          } else {
            delete errors[name];
          }
        }
        setFieldErrors(errors);
        return !errors[name];
      },
      [fieldErrors],
    );

    const handleChange = useCallback(
      (e) => {
        const { name, value } = e.target;
        if (fieldErrors[name]) validateField(name, value);
        setFormData((prev) => ({ ...prev, [name]: value }));
      },
      [fieldErrors, validateField],
    );

    const openAddModal = useCallback(() => {
      setEditType(null);
      setFormData({ trainingmattype: "" });
      setFieldErrors({});
      setIsModalOpen(true);
    }, []);

    const openEditModal = useCallback((type) => {
      setEditType(type);
      setFormData({ trainingmattype: type.trainingmattype || "" });
      setFieldErrors({});
      setIsModalOpen(true);
    }, []);

    const createMaterialType = useCallback(async () => {
      try {
        const url = `${IP}/itelinc/addTrainingMatType`;
        const params = new URLSearchParams({
          trainingmattype: formData.trainingmattype,
          trainingmattypeadminstate: 1, // Default active state
          trainingmattypecreatedby: parseInt(userId) || 1,
          trainingmattypemodifiedby: parseInt(userId) || 1,
        });

        const response = await fetch(`${url}?${params.toString()}`, {
          method: "POST", // Note: Your snippet implies POST, but query params are used
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            userid: userId || "1",
            "X-Module": "Training Management",
            "X-Action": "Add Material Type",
          },
        });

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error creating material type:", error);
        throw error;
      }
    }, [IP, formData, token, userId]);

    const updateMaterialType = useCallback(async () => {
      try {
        const url = `${IP}/itelinc/updateTrainingMatType`;
        const params = new URLSearchParams({
          trainingmattypeid: editType.trainingmattypeid,
          trainingmattype: formData.trainingmattype,
          trainingmattypeadminstate: 1, // Default active state
          trainingmattypemodifiedby: parseInt(userId) || 1,
        });

        const response = await fetch(`${url}?${params.toString()}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            userid: userId || "1",
            "X-Module": "Training Management",
            "X-Action": "Update Material Type",
          },
        });

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error updating material type:", error);
        throw error;
      }
    }, [IP, formData, editType, token, userId]);

    const deleteMaterialType = useCallback(
      async (typeId) => {
        try {
          const url = `${IP}/itelinc/deleteTrainingMatType`;
          const params = new URLSearchParams({
            trainingmattypeid: typeId,
            trainingmattypemodifiedby: parseInt(userId) || 1,
          });

          const response = await fetch(`${url}?${params.toString()}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              userid: userId || "1",
              "X-Module": "Training Management",
              "X-Action": "Delete Material Type",
            },
          });

          const data = await response.json();
          return data;
        } catch (error) {
          console.error("Error deleting material type:", error);
          throw error;
        }
      },
      [IP, token, userId],
    );

    const handleSubmit = useCallback(
      async (e) => {
        e.preventDefault();

        // Validation
        if (!validateField("trainingmattype", formData.trainingmattype)) {
          showToast("Please fix errors in the form", "error");
          return;
        }

        setIsSaving(true);
        setIsModalOpen(false);

        try {
          let response;
          if (editType) {
            response = await updateMaterialType();
          } else {
            response = await createMaterialType();
          }

          if (response.statusCode === 200 || response.status === "success") {
            Swal.fire(
              "Success!",
              editType
                ? "Material type updated successfully"
                : "Material type added successfully",
              "success",
            );
            refreshData();
          } else {
            throw new Error(response.message || "Operation failed");
          }
        } catch (err) {
          console.error("Error in handleSubmit:", err);
          showToast(`Failed to save: ${err.message}`, "error");
          Swal.fire("Error", err.message || "Operation failed", "error");
          setIsModalOpen(true); // Reopen modal on error
        } finally {
          setIsSaving(false);
        }
      },
      [
        validateField,
        formData,
        editType,
        updateMaterialType,
        createMaterialType,
        refreshData,
        showToast,
      ],
    );

    const handleDelete = useCallback(
      (type) => {
        Swal.fire({
          title: "Are you sure?",
          text: "You won't be able to revert this!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Yes, delete it!",
        }).then(async (result) => {
          if (result.isConfirmed) {
            setIsDeleting((prev) => ({
              ...prev,
              [type.trainingmattypeid]: true,
            }));

            try {
              const response = await deleteMaterialType(type.trainingmattypeid);

              if (
                response.statusCode === 200 ||
                response.status === "success"
              ) {
                Swal.fire(
                  "Deleted!",
                  "Material type has been deleted.",
                  "success",
                );
                refreshData();
              } else {
                throw new Error(response.message || "Failed to delete");
              }
            } catch (error) {
              console.error("Error deleting material type:", error);
              showToast(`Failed to delete: ${error.message}`, "error");
              Swal.fire("Error", error.message, "error");
            } finally {
              setIsDeleting((prev) => ({
                ...prev,
                [type.trainingmattypeid]: false,
              }));
            }
          }
        });
      },
      [deleteMaterialType, refreshData, showToast],
    );

    // --- DATA GRID CONFIG ---

    const columns = useMemo(() => {
      const baseColumns = [
        {
          field: "trainingmattype",
          headerName: "Material Type",
          width: 300,
          sortable: true,
          flex: 1,
        },
        {
          field: "createdname",
          headerName: "Created By",
          width: 300,
          sortable: true,
          flex: 1,
        },
        {
          field: "trainingmattypecreatedtime",
          headerName: "Created Time",
          width: 180,
          sortable: true,
          renderCell: (params) => {
            // Basic date formatting, replace with your formatDate utility if available
            const date = params.row.trainingmattypecreatedtime;
            return date ? new Date(date).toLocaleString() : "-";
          },
        },
        {
          field: "modifiedname",
          headerName: "Modified By",
          width: 300,
          sortable: true,
          flex: 1,
        },
        {
          field: "trainingmattypemodifiedtime",
          headerName: "Modified Time",
          width: 180,
          sortable: true,
          renderCell: (params) => {
            // Basic date formatting, replace with your formatDate utility if available
            const date = params.row.trainingmattypemodifiedtime;
            return date ? new Date(date).toLocaleString() : "-";
          },
        },
      ];

      // Actions column - shown only if user has write access AND is admin (roleid 1)
      if (hasWriteAccess && Number(roleid) === 1) {
        baseColumns.push({
          field: "actions",
          headerName: "Actions",
          width: 120,
          sortable: false,
          filterable: false,
          renderCell: (params) => {
            if (!params || !params.row) return null;
            return (
              <Box>
                <ActionButton
                  color="edit"
                  onClick={() => openEditModal(params.row)}
                  disabled={
                    isSaving || isDeleting[params.row.trainingmattypeid]
                  }
                >
                  <EditIcon fontSize="small" />
                </ActionButton>
                <ActionButton
                  color="delete"
                  onClick={() => handleDelete(params.row)}
                  disabled={
                    isSaving || isDeleting[params.row.trainingmattypeid]
                  }
                >
                  {isDeleting[params.row.trainingmattypeid] ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <DeleteIcon fontSize="small" />
                  )}
                </ActionButton>
              </Box>
            );
          },
        });
      }

      return baseColumns;
    }, [
      hasWriteAccess,
      roleid,
      isSaving,
      isDeleting,
      openEditModal,
      handleDelete,
    ]);

    const exportConfig = useMemo(
      () => ({
        filename: "training_material_types",
        sheetName: "Material Types",
      }),
      [],
    );

    const onExportData = useMemo(
      () => (data) => {
        return data.map((item, index) => ({
          "S.No": index + 1,
          ID: item.trainingmattypeid || "",
          "Material Type": item.trainingmattype || "",
          "Created Time": item.trainingmattypecreatedtime
            ? new Date(item.trainingmattypecreatedtime).toLocaleString()
            : "",
        }));
      },
      [],
    );

    // EFFECTS
    useEffect(() => {
      refreshData();
    }, [refreshData]);

    // RENDER
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
          <Typography variant="h4">{title}</Typography>
          {Number(roleid) === 1 && hasWriteAccess && (
            <Button
              variant="contained"
              onClick={openAddModal}
              disabled={isSaving}
            >
              + Add Material Type
            </Button>
          )}
        </Box>

        <ReusableDataGrid
          data={materialTypes}
          columns={columns}
          title=""
          enableExport={true}
          enableColumnFilters={true}
          searchPlaceholder="Search material types..."
          searchFields={["trainingmattype"]}
          uniqueIdField="trainingmattypeid"
          onExportData={onExportData}
          exportConfig={exportConfig}
          loading={loading}
        />

        {/* Modal for Add/Edit */}
        <Dialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editType ? "Edit Material Type" : "Add Material Type"}
            <IconButton
              aria-label="close"
              onClick={() => setIsModalOpen(false)}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
              disabled={isSaving}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    margin="dense"
                    name="trainingmattype"
                    label="Material Type Name *"
                    variant="outlined"
                    value={formData.trainingmattype}
                    onChange={handleChange}
                    onBlur={(e) =>
                      validateField("trainingmattype", e.target.value)
                    }
                    required
                    disabled={isSaving}
                    error={!!fieldErrors.trainingmattype}
                    helperText={fieldErrors.trainingmattype}
                    autoFocus
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    e.g., Video, PDF, PPT, Document
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsModalOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSaving || Object.keys(fieldErrors).length > 0}
                startIcon={isSaving ? <CircularProgress size={20} /> : null}
              >
                {isSaving ? "Saving..." : editType ? "Update" : "Save"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Toast notification */}
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

        {/* Loading overlay */}
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
              {editType
                ? "Updating material type..."
                : "Creating material type..."}
            </Typography>
          </Box>
        </StyledBackdrop>
      </Box>
    );
  },
);

TrainingMaterialType.displayName = "TrainingMaterialType";

export default TrainingMaterialType;
