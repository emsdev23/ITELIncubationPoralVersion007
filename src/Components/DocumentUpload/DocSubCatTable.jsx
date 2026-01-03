import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import api from "../Datafetching/api";

// Import your reusable component
import ReusableDataGrid from "../Datafetching/ReusableDataGrid"; // Adjust path as needed

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

export default function DocSubCatTable() {
  // --- 1. STATE DECLARATIONS ---
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const incUserid = sessionStorage.getItem("incuserid");
  const IP = IPAdress;

  const [subcats, setSubcats] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editSubCat, setEditSubCat] = useState(null);
  const [formData, setFormData] = useState({
    docsubcatname: "",
    docsubcatdescription: "",
    docsubcatscatrecid: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // --- 2. HANDLER FUNCTIONS (Must be defined before useMemo) ---
  const fetchSubCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use api.get for GET request with encryption
      const response = await api.get(
        `/getDocsubcatAll?incuserid=${encodeURIComponent(incUserid)}`,
        {
          headers: {
            "X-Module": "Document Management",
            "X-Action": "Fetch Document SubCategories",
          },
        }
      );

      // Response is already decrypted by interceptor
      setSubcats(response.data.data || []);
    } catch (err) {
      console.error("Error fetching subcategories:", err);
      setError("Failed to load subcategories. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [IP, incUserid, userId]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use api.get for GET request with encryption
      const response = await api.get(`/getDoccatAll?incuserid=${incUserid}`, {
        headers: {
          "X-Module": "Document Management",
          "X-Action": "Fetch Document Categories",
        },
      });

      // Response is already decrypted by interceptor
      setCats(response.data.data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [incUserid]);

  const refreshData = useCallback(() => {
    fetchSubCategories();
    fetchCategories();
  }, [fetchSubCategories, fetchCategories]);

  const openAddModal = useCallback(() => {
    setEditSubCat(null);
    setFormData({
      docsubcatname: "",
      docsubcatdescription: "",
      docsubcatscatrecid: "",
    });
    fetchCategories();
    setIsModalOpen(true);
    setError(null);
  }, [fetchCategories]);

  const openEditModal = useCallback(
    (subcat) => {
      setEditSubCat(subcat);
      setFormData({
        docsubcatname: subcat.docsubcatname || "",
        docsubcatdescription: subcat.docsubcatdescription || "",
        docsubcatscatrecid: subcat.docsubcatscatrecid || "",
      });
      fetchCategories();
      setIsModalOpen(true);
      setError(null);
    },
    [fetchCategories]
  );

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []); // Use functional update

  const handleDelete = useCallback(
    (subcatId) => {
      Swal.fire({
        title: "Are you sure?",
        text: "This subcategory will be deleted permanently.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          setIsDeleting((prev) => ({ ...prev, [subcatId]: true }));
          Swal.fire({
            title: "Deleting...",
            text: "Please wait while we delete subcategory",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
          });
          const deleteUrl = `${IP}/itelinc/deleteDocsubcat?docsubcatrecid=${subcatId}&docsubcatmodifiedby=${userId}`;
          fetch(deleteUrl, {
            method: "POST",
            mode: "cors",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/x-www-form-urlencoded",
              userid: userId || "1",
              "X-Module": "Document Management",
              "X-Action": "Delete Document SubCategory",
            },
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.statusCode === 200) {
                Swal.fire(
                  "Deleted!",
                  "Subcategory deleted successfully!",
                  "success"
                );
                refreshData();
              } else {
                throw new Error(data.message || "Failed to delete subcategory");
              }
            })
            .catch((err) => {
              console.error("Error deleting subcategory:", err);
              Swal.fire("Error", `Failed to delete: ${err.message}`, "error");
            })
            .finally(() => {
              setIsDeleting((prev) => ({ ...prev, [subcatId]: false }));
            });
        }
      });
    },
    [IP, userId, token, refreshData]
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setIsSaving(true);
      setError(null);
      if (
        !formData.docsubcatname.trim() ||
        !formData.docsubcatdescription.trim() ||
        !formData.docsubcatscatrecid
      ) {
        setError("All fields are required");
        setIsSaving(false);
        return;
      }
      setIsModalOpen(false);
      const params = new URLSearchParams();
      if (editSubCat) {
        params.append("docsubcatrecid", editSubCat.docsubcatrecid);
      }
      params.append("docsubcatname", formData.docsubcatname.trim());
      params.append(
        "docsubcatdescription",
        formData.docsubcatdescription.trim()
      );
      params.append("docsubcatscatrecid", formData.docsubcatscatrecid);
      if (editSubCat) {
        params.append("docsubcatmodifiedby", userId || "1");
      } else {
        params.append("docsubcatcreatedby", userId || "1");
        params.append("docsubcatmodifiedby", userId || "1");
      }
      const baseUrl = editSubCat
        ? `${IP}/itelinc/updateDocsubcat`
        : `${IP}/itelinc/addDocsubcat`;
      const url = `${baseUrl}?${params.toString()}`;
      const action = editSubCat
        ? "Edit Document SubCategory"
        : "Add Document SubCategory";
      fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
          userid: userId || "1",
          "X-Module": "Document Management",
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
              setError("Subcategory name already exists for this category");
              Swal.fire(
                "Duplicate",
                "Subcategory name already exists for this category!",
                "warning"
              ).then(() => setIsModalOpen(true));
            } else {
              setEditSubCat(null);
              setFormData({
                docsubcatname: "",
                docsubcatdescription: "",
                docsubcatscatrecid: "",
              });
              refreshData();
              Swal.fire(
                "Success",
                data.message || "Subcategory saved successfully!",
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
          console.error("Error saving subcategory:", err);
          setError(`Failed to save: ${err.message}`);
          Swal.fire(
            "Error",
            `Failed to save subcategory: ${err.message}`,
            "error"
          ).then(() => setIsModalOpen(true));
        })
        .finally(() => setIsSaving(false));
    },
    [formData, editSubCat, IP, userId, token, refreshData]
  );

  // --- 3. MEMOIZED VALUES (Must be defined after handler functions) ---
  const columns = useMemo(
    () => [
      {
        field: "doccatname",
        headerName: "Category",
        width: 180,
        sortable: true,
        renderCell: (params) =>
          params?.row ? params.row.doccatname || "N/A" : "N/A",
      },
      {
        field: "docsubcatname",
        headerName: "Subcategory Name",
        width: 200,
        sortable: true,
      },
      {
        field: "docsubcatdescription",
        headerName: "Description",
        width: 250,
        sortable: true,
      },
      {
        field: "docsubcatcreatedby",
        headerName: "Created By",
        width: 150,
        sortable: true,
        renderCell: (params) =>
          params?.row
            ? isNaN(params.row.docsubcatcreatedby)
              ? params.row.docsubcatcreatedby
              : "Admin"
            : "Admin",
      },
      {
        field: "docsubcatcreatedtime",
        headerName: "Created Time",
        width: 180,
        sortable: true,
        type: "date",
      },
      {
        field: "docsubcatmodifiedby",
        headerName: "Modified By",
        width: 150,
        sortable: true,
        renderCell: (params) =>
          params?.row
            ? isNaN(params.row.docsubcatmodifiedby)
              ? params.row.docsubcatmodifiedby
              : "Admin"
            : "Admin",
      },
      {
        field: "docsubcatmodifiedtime",
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
        filterable: false,
        renderCell: (params) => {
          if (!params?.row) return null;
          return (
            <Box>
              <ActionButton
                color="edit"
                onClick={() => openEditModal(params.row)}
                disabled={isSaving || isDeleting[params.row.docsubcatrecid]}
                title="Edit"
              >
                <EditIcon fontSize="small" />
              </ActionButton>
              <ActionButton
                color="delete"
                onClick={() => handleDelete(params.row.docsubcatrecid)}
                disabled={isSaving || isDeleting[params.row.docsubcatrecid]}
                title="Delete"
              >
                {isDeleting[params.row.docsubcatrecid] ? (
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
  ); // Dependencies are now available

  const exportConfig = useMemo(
    () => ({
      filename: "document_subcategories",
      sheetName: "Document Subcategories",
    }),
    []
  );
  const onExportData = useMemo(
    () => (data) =>
      data.map((subcat, index) => ({
        "S.No": index + 1,
        Category: subcat.doccatname || "N/A",
        "Subcategory Name": subcat.docsubcatname || "",
        Description: subcat.docsubcatdescription || "",
        "Created By": isNaN(subcat.docsubcatcreatedby)
          ? subcat.docsubcatcreatedby
          : "Admin",
        "Created Time": formatDate(subcat.docsubcatcreatedtime),
        "Modified By": isNaN(subcat.docsubcatmodifiedby)
          ? subcat.docsubcatmodifiedby
          : "Admin",
        "Modified Time": formatDate(subcat.docsubcatmodifiedtime),
      })),
    []
  );

  // --- 4. EFFECTS ---
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // --- 5. RENDER (JSX) ---
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
        <Typography variant="h4">📂 Document Subcategories</Typography>
        <Button variant="contained" onClick={openAddModal} disabled={isSaving}>
          + Add Subcategory
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
        data={subcats}
        columns={columns}
        title="Document Subcategories"
        enableExport={true}
        enableColumnFilters={true}
        searchPlaceholder="Search subcategories..."
        searchFields={["doccatname", "docsubcatname", "docsubcatdescription"]}
        uniqueIdField="docsubcatrecid"
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
          {editSubCat ? "Edit Subcategory" : "Add Subcategory"}
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
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
              <InputLabel id="category-select-label">Category *</InputLabel>
              <Select
                labelId="category-select-label"
                name="docsubcatscatrecid"
                value={formData.docsubcatscatrecid}
                onChange={handleChange}
                required
                disabled={isSaving}
                label="Category *"
              >
                <MenuItem value="">Select Category</MenuItem>
                {cats.map((cat) => (
                  <MenuItem key={cat.doccatrecid} value={cat.doccatrecid}>
                    {cat.doccatname}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              autoFocus
              margin="dense"
              name="docsubcatname"
              label="Subcategory Name"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.docsubcatname}
              onChange={handleChange}
              required
              disabled={isSaving}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="docsubcatdescription"
              label="Description"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={formData.docsubcatdescription}
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
              {editSubCat ? "Update" : "Save"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
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
            {editSubCat ? "Updating subcategory..." : "Saving subcategory..."}
          </Typography>
        </Box>
      </StyledBackdrop>
    </Box>
  );
}
