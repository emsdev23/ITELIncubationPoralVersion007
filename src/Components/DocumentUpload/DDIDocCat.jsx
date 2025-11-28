import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { IPAdress } from "../Datafetching/IPAdrees";
import { Download } from "lucide-react";
import { FaTimes } from "react-icons/fa";

// Material UI imports
import {
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Backdrop,
  Snackbar,
  Alert,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

// Import your reusable component
import ReusableDataGrid from "../Datafetching/ReusableDataGrid"; // Adjust path as needed

// Styled components
const StyledBackdrop = styled(Backdrop)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  color: "#fff",
}));

// RESTORED: This is the styled component for your original circular buttons
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

export default function DocCatTable() {
  // State declarations (same as before)
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const incUserid = sessionStorage.getItem("incuserid");
  const IP = IPAdress;

  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [formData, setFormData] = useState({
    ddidoccatname: "",
    ddidoccatdescription: "",
    ddidoccatadminstate: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Effects and handlers (fetchCategories, openEditModal, handleDelete, etc.)
  // ... (keeping them the same as the previous correct version for brevity)
  // I will include them fully in the final code block to avoid confusion.

  // --- HANDLER FUNCTIONS ---
  const fetchCategories = () => {
    setLoading(true);
    setError(null);
    fetch(`${IP}/itelinc/resources/generic/getddidoccatlist`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        userid: userId || "1",
        "X-Module": " DDI Document Management",
        "X-Action": "Fetch DDI Document Categories",
      },
      body: JSON.stringify({
        userId: parseInt(userId) || 1,
        incUserId: incUserid,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setCats(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try again.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditCat(null);
    setFormData({
      ddidoccatname: "",
      ddidoccatdescription: "",
      ddidoccatadminstate: 1,
    });
    setIsModalOpen(true);
    setError(null);
  };

  const openEditModal = (cat) => {
    setEditCat(cat);
    setFormData({
      ddidoccatname: cat.ddidoccatname || "",
      ddidoccatdescription: cat.ddidoccatdescription || "",
      ddidoccatadminstate: cat.ddidoccatadminstate || 1,
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDelete = (catId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This category will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setIsDeleting((prev) => ({ ...prev, [catId]: true }));
        Swal.fire({
          title: "Deleting...",
          text: "Please wait while we delete the category",
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        const deleteUrl = `${IP}/itelinc/ddidoccatdelete?ddidoccatrecid=${catId}&ddidoccatmodifiedby=${
          userId || 1
        }`;
        fetch(deleteUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${token}`,
            userid: userId || "1",
            "X-Module": "DDI Document Management",
            "X-Action": "Delete Category",
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.statusCode === 200) {
              Swal.fire(
                "Deleted!",
                "Category deleted successfully!",
                "success"
              );
              fetchCategories();
            } else {
              throw new Error(data.message || "Failed to delete category");
            }
          })
          .catch((err) => {
            console.error("Error deleting category:", err);
            Swal.fire("Error", `Failed to delete: ${err.message}`, "error");
          })
          .finally(() => {
            setIsDeleting((prev) => ({ ...prev, [catId]: false }));
          });
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    if (
      !formData.ddidoccatname.trim() ||
      !formData.ddidoccatdescription.trim()
    ) {
      setError("Category name and description are required");
      setIsSaving(false);
      return;
    }
    setIsModalOpen(false);
    let url;
    if (editCat) {
      url = `${IP}/itelinc/ddidoccatedit?ddidoccatrecid=${
        editCat.ddidoccatrecid
      }&ddidoccatname=${encodeURIComponent(
        formData.ddidoccatname.trim()
      )}&ddidoccatdescription=${encodeURIComponent(
        formData.ddidoccatdescription.trim()
      )}&ddidoccatmodifiedby=${userId || 1}&ddidoccatadminstate=${
        formData.ddidoccatadminstate
      }`;
    } else {
      url = `${IP}/itelinc/ddidoccatadd?ddidoccatname=${encodeURIComponent(
        formData.ddidoccatname.trim()
      )}&ddidoccatdescription=${encodeURIComponent(
        formData.ddidoccatdescription.trim()
      )}&ddidoccatcreatedby=${userId || 1}&ddidoccatmodifiedby=${
        userId || 1
      }&ddidoccatadminstate=${formData.ddidoccatadminstate}`;
    }
    const module = "DDI Document Management";
    const action = editCat ? "Edit Category" : "Add Category";
    fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
        userid: userId || "1",
        "X-Module": module,
        "X-Action": action,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.statusCode === 200) {
          if (
            data.data &&
            typeof data.data === "string" &&
            data.data.includes("Duplicate entry")
          ) {
            setError("Category name already exists");
            Swal.fire(
              "Duplicate",
              "Category name already exists!",
              "warning"
            ).then(() => setIsModalOpen(true));
          } else {
            setEditCat(null);
            setFormData({
              ddidoccatname: "",
              ddidoccatdescription: "",
              ddidoccatadminstate: 1,
            });
            fetchCategories();
            Swal.fire(
              "Success",
              data.message || "Category saved successfully!",
              "success"
            );
          }
        } else {
          throw new Error(
            data.message || `Operation failed with status: ${data.statusCode}`
          );
        }
      })
      .catch((err) => {
        console.error("Error saving category:", err);
        setError(`Failed to save: ${err.message}`);
        Swal.fire(
          "Error",
          `Failed to save category: ${err.message}`,
          "error"
        ).then(() => setIsModalOpen(true));
      })
      .finally(() => setIsSaving(false));
  };

  // --- MEMOIZED VALUES ---
  const columns = useMemo(
    () => [
      {
        field: "ddidoccatname",
        headerName: "Category Name",
        width: 200,
        sortable: true,
      },
      {
        field: "ddidoccatdescription",
        headerName: "Description",
        width: 300,
        sortable: true,
      },
      {
        field: "ddidoccatcreatedby",
        headerName: "Created By",
        width: 150,
        sortable: true,
        renderCell: (params) => {
          if (!params || !params.row) return "Admin";
          return isNaN(params.row.ddidoccatcreatedby)
            ? params.row.ddidoccatcreatedby
            : "Admin";
        },
      },
      {
        field: "ddidoccatcreatedtime",
        headerName: "Created Time",
        width: 180,
        sortable: true,
        type: "date",
      },
      {
        field: "ddidoccatmodifiedby",
        headerName: "Modified By",
        width: 150,
        sortable: true,
        renderCell: (params) => {
          if (!params || !params.row) return "Admin";
          return isNaN(params.row.ddidoccatmodifiedby)
            ? params.row.ddidoccatmodifiedby
            : "Admin";
        },
      },
      {
        field: "ddidoccatmodifiedtime",
        headerName: "Modified Time",
        width: 180,
        sortable: true,
        type: "date",
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 150,
        sortable: false,
        filterable: false, // Disable filter for this column
        // CORRECTED: Using a custom renderCell to restore original styling
        renderCell: (params) => {
          if (!params || !params.row) return null;
          return (
            <Box>
              <ActionButton
                color="edit"
                onClick={() => openEditModal(params.row)}
                disabled={isSaving || isDeleting[params.row.ddidoccatrecid]}
                title="Edit"
              >
                <EditIcon fontSize="small" />
              </ActionButton>
              <ActionButton
                color="delete"
                onClick={() => handleDelete(params.row.ddidoccatrecid)}
                disabled={isSaving || isDeleting[params.row.ddidoccatrecid]}
                title="Delete"
              >
                {isDeleting[params.row.ddidoccatrecid] ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <DeleteIcon fontSize="small" />
                )}
              </ActionButton>
            </Box>
          );
        },
      },
    ],
    [isSaving, isDeleting, openEditModal, handleDelete]
  );

  const exportConfig = useMemo(
    () => ({
      filename: "due_diligence_categories",
      sheetName: "Due Diligence Categories",
    }),
    []
  );
  const onExportData = useMemo(
    () => (data) => {
      return data.map((cat, index) => ({
        "S.No": index + 1,
        "Category Name": cat.ddidoccatname || "",
        Description: cat.ddidoccatdescription || "",
        "Created By": isNaN(cat.ddidoccatcreatedby)
          ? cat.ddidoccatcreatedby
          : "Admin",
        "Created Time": formatDate(cat.ddidoccatcreatedtime),
        "Modified By": isNaN(cat.ddidoccatmodifiedby)
          ? cat.ddidoccatmodifiedby
          : "Admin",
        "Modified Time": formatDate(cat.ddidoccatmodifiedtime),
      }));
    },
    []
  );

  // --- RENDER ---
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
        <Typography variant="h4">
          📂 Due Deligence Document Categories
        </Typography>
        <Button variant="contained" onClick={openAddModal} disabled={isSaving}>
          + Add Category
        </Button>
      </Box>
      {error && (
        <Box
          sx={{
            p: 2,
            mb: 2,
            bgcolor: "error.light",
            color: "error.contrastText",
            borderRadius: 1,
          }}
        >
          {error}
        </Box>
      )}
      <ReusableDataGrid
        data={cats}
        columns={columns}
        title="Document Categories"
        enableExport={true}
        enableColumnFilters={true}
        searchPlaceholder="Search categories..."
        searchFields={["ddidoccatname", "ddidoccatdescription"]}
        uniqueIdField="ddidoccatrecid"
        onExportData={onExportData}
        exportConfig={exportConfig}
        loading={loading}
      />
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editCat ? "Edit Category" : "Add Category"}
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
            <TextField
              autoFocus
              margin="dense"
              name="ddidoccatname"
              label="Category Name"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.ddidoccatname}
              onChange={handleChange}
              required
              disabled={isSaving}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="ddidoccatdescription"
              label="Description"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={formData.ddidoccatdescription}
              onChange={handleChange}
              required
              disabled={isSaving}
            />
            {error && <Box sx={{ color: "error.main", mt: 1 }}>{error}</Box>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} /> : null}
            >
              {editCat ? "Update" : "Save"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
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
            {editCat ? "Updating category..." : "Saving category..."}
          </Typography>
        </Box>
      </StyledBackdrop>
    </Box>
  );
}
