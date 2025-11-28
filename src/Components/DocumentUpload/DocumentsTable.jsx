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
import * as XLSX from "xlsx";
import { Download } from "lucide-react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  CircularProgress,
  Backdrop,
  Snackbar,
  Alert,
  Grid,
  Tooltip,
  LinearProgress,
  Popover,
  Card,
  CardContent,
  CardActions,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ArticleIcon from "@mui/icons-material/Article";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HowToRegIcon from "@mui/icons-material/HowToReg";

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

const ApplyButton = styled(Button)(({ theme, disabled }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: disabled
    ? theme.palette.grey[300]
    : theme.palette.success.main,
  color: disabled ? theme.palette.text.disabled : "white",
  "&:hover": {
    backgroundColor: disabled
      ? theme.palette.grey[300]
      : theme.palette.success.dark,
  },
}));

const FileUploadButton = styled(Button)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  "& input[type=file]": {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: "100%",
    minHeight: "100%",
    fontSize: "100px",
    textAlign: "right",
    cursor: "pointer",
    opacity: 0,
    outline: "none",
    background: "white",
    display: "block",
  },
}));

const FileIcon = ({ fileName }) => {
  if (!fileName) return <InsertDriveFileIcon />;

  const extension = fileName.split(".").pop().toLowerCase();

  switch (extension) {
    case "pdf":
      return <PictureAsPdfIcon sx={{ color: "#dc2626" }} />;
    case "doc":
    case "docx":
      return <DescriptionIcon sx={{ color: "#2563eb" }} />;
    case "xls":
    case "xlsx":
      return <ArticleIcon sx={{ color: "#16a34a" }} />;
    default:
      return <InsertDriveFileIcon sx={{ color: "#6b7280" }} />;
  }
};

// Common date formatting function
const formatDate = (dateStr) => {
  if (!dateStr) return "-";

  try {
    // Handle array format [year, month, day, hour, minute, second]
    if (Array.isArray(dateStr) && dateStr.length >= 6) {
      const [year, month, day, hour, minute, second] = dateStr;
      // Create a date object (month is 0-indexed in JavaScript Date)
      const date = new Date(year, month - 1, day, hour, minute, second);

      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }

    // Handle YYYYMMDDHHMMSS format (e.g., "2025919124643")
    if (
      typeof dateStr === "string" &&
      dateStr.length === 14 &&
      /^\d+$/.test(dateStr)
    ) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      const hour = dateStr.substring(8, 10);
      const minute = dateStr.substring(10, 12);
      const second = dateStr.substring(12, 14);

      // Create a date object in YYYY-MM-DDTHH:MM:SS format
      const isoDateStr = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
      const date = new Date(isoDateStr);

      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    }

    // Handle date strings with question mark (e.g., "Sep 19, 2025, 12:46:43?PM")
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
    return dateStr; // Return original if error
  }
};

// Using forwardRef to allow parent components to access methods
const DocumentsTable = forwardRef(({ title = "📄 Documents" }, ref) => {
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const roleid = sessionStorage.getItem("roleid");
  const incUserid = sessionStorage.getItem("incuserid");
  const incubateeId = sessionStorage.getItem("incubateeId");
  const IP = IPAdress;

  // STATE DECLARATIONS
  const [documents, setDocuments] = useState([]);
  const [cats, setCats] = useState([]);
  const [subcats, setSubcats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [editDoc, setEditDoc] = useState(null);
  const [formData, setFormData] = useState({
    documentname: "",
    documentdescription: "",
    documentcatrecid: "",
    documentsubcatrecid: "",
    documentperiodicityrecid: "",
    documentremarks: "",
    sampleDocName: "",
    sampleDocBase64: "",
    templateDocName: "",
    templateDocBase64: "",
    documentapplystatus: 1, // Default to Mandatory (1)
    documentreferencelink: "", // New field for Reference Link
    documentapplicability: "", // New field for Note for Applicability
  });
  const [originalFileNames, setOriginalFileNames] = useState({
    sample: "",
    template: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isUploading, setIsUploading] = useState({
    sample: false,
    template: false,
  });
  const [isDeleting, setIsDeleting] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isApplying, setIsApplying] = useState({});
  const [appliedDocuments, setAppliedDocuments] = useState(new Set());
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // New state for additional categories and subcategories
  const [showAdditionalCategories, setShowAdditionalCategories] =
    useState(false);
  const [selectedAdditionalCategories, setSelectedAdditionalCategories] =
    useState({});
  const [selectedAdditionalSubcategories, setSelectedAdditionalSubcategories] =
    useState({});

  // Check if XLSX is available
  const isXLSXAvailable = !!XLSX;

  // Expose the openAddModal function to parent components
  useImperativeHandle(ref, () => ({
    openAddModal,
  }));

  // HANDLER FUNCTIONS (Must be defined before useMemo)
  const fetchDocuments = useCallback(() => {
    const url = `${IP}/itelinc/api/documents/getDocumentsAll?incuserid=${encodeURIComponent(
      incUserid
    )}`;
    setLoading(true);
    fetch(url, {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        userid: userId || "1",
        "X-Module": "Document Management",
        "X-Action": "fetch All Documents",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching documents:", err);
        setToast({
          open: true,
          message: "Failed to load documents. Please try again.",
          severity: "error",
        });
        setLoading(false);
      });
  }, [IP, incUserid, userId]);

  const fetchCategories = useCallback(() => {
    const url = `${IP}/itelinc/getDoccatAll?incuserid=${encodeURIComponent(
      incUserid
    )}`;
    fetch(url, {
      method: "GET",
      mode: "cors",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Categories data:", data);
        setCats(data.data || []);
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
      });
  }, [IP, incUserid]);

  const fetchSubCategories = useCallback(() => {
    const url = `${IP}/itelinc/getDocsubcatAll?incuserid=${encodeURIComponent(
      incUserid
    )}`;
    fetch(url, {
      method: "GET",
      mode: "cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Subcategories data:", data);
        if (data && data.data && Array.isArray(data.data)) {
          setSubcats(data.data);
        } else if (data && Array.isArray(data)) {
          setSubcats(data);
        } else {
          console.warn("Unexpected subcategories data structure:", data);
          setSubcats([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching subcategories:", err);
        setSubcats([]);
      });
  }, [IP, incUserid]);

  // NEW FUNCTION: Fetch applicability details from the new API
  const fetchApplicabilityDetails = useCallback(() => {
    if (Number(roleid) !== 4) return;

    const url = `${IP}/itelinc/resources/generic/getapplicabilitydetails`;
    const requestBody = {
      userId: incubateeId, // Use incubateeId as userId
      roleId: roleid,
    };

    fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        userid: userId || "1",
        "X-Module": "Document Management",
        "X-Action": "fetch Applicability Details",
      },
      body: JSON.stringify(requestBody),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200 && data.data) {
          // Handle the response - it might be an object or an array
          let appliedDocs = [];

          if (Array.isArray(data.data)) {
            // If it's an array, use it directly
            appliedDocs = data.data;
          } else if (data.data.incdocapplydocumentid) {
            // If it's a single object, convert to array
            appliedDocs = [data.data];
          }

          // Extract document IDs from the response
          const appliedIds = new Set(
            appliedDocs.map((doc) => doc.incdocapplydocumentid)
          );
          setAppliedDocuments(appliedIds);
        }
      })
      .catch((err) => {
        console.error("Error fetching applicability details:", err);
      });
  }, [IP, incubateeId, roleid, token, userId]);

  const fetchAppliedDocuments = useCallback(() => {
    if (Number(roleid) !== 4) return;

    const url = `${IP}/itelinc/getIncubateeAppliedDocuments?incubateeid=${incUserid}`;
    fetch(url, {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        userid: userId || "1",
        "X-Module": "Document Management",
        "X-Action": "fetch Applied Documents",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200 && data.data) {
          const appliedIds = new Set(
            data.data.map((doc) => doc.incdocapplydocumentid)
          );
          setAppliedDocuments(appliedIds);
        }
      })
      .catch((err) => {
        console.error("Error fetching applied documents:", err);
      });
  }, [IP, incUserid, userId, roleid]);

  const refreshData = useCallback(() => {
    fetchDocuments();
    fetchCategories();
    fetchSubCategories();
    fetchAppliedDocuments();
    fetchApplicabilityDetails(); // Add the new function call
  }, [
    fetchDocuments,
    fetchCategories,
    fetchSubCategories,
    fetchAppliedDocuments,
    fetchApplicabilityDetails,
  ]);

  const refreshDropdownData = useCallback(() => {
    fetchCategories();
    fetchSubCategories();
  }, [fetchCategories, fetchSubCategories]);

  const showToast = useCallback((message, severity = "success") => {
    setToast({ open: true, message, severity });
  }, []);

  const validateField = useCallback(
    (name, value) => {
      const errors = { ...fieldErrors };

      switch (name) {
        case "documentname":
          if (!value || value.trim() === "") {
            errors[name] = "Document name is required";
          } else if (value.length < 3) {
            errors[name] = "Document name must be at least 3 characters";
          } else if (value.length > 100) {
            errors[name] = "Document name must be less than 100 characters";
          } else {
            delete errors[name];
          }
          break;

        case "documentdescription":
          if (!value || value.trim() === "") {
            errors[name] = "Description is required";
          } else if (value.length < 10) {
            errors[name] = "Description must be at least 10 characters";
          } else if (value.length > 500) {
            errors[name] = "Description must be less than 500 characters";
          } else {
            delete errors[name];
          }
          break;

        case "documentcatrecid":
          if (!value) {
            errors[name] = "Please select a category";
          } else {
            delete errors[name];
          }
          break;

        case "documentsubcatrecid":
          if (!value) {
            errors[name] = "Please select a subcategory";
          } else {
            delete errors[name];
          }
          break;

        case "documentperiodicityrecid":
          if (!value) {
            errors[name] = "Please select periodicity";
          } else {
            delete errors[name];
          }
          break;

        case "documentapplystatus":
          if (value === "" || value === null || value === undefined) {
            errors[name] = "Please select document applicability status";
          } else {
            delete errors[name];
          }
          break;

        case "documentreferencelink":
          if (value && !/^https?:\/\/.+/i.test(value)) {
            errors[name] = "Please enter a valid URL (http:// or https://)";
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
    const isValid =
      validateField("documentname", formData.documentname) &&
      validateField("documentdescription", formData.documentdescription) &&
      validateField("documentcatrecid", formData.documentcatrecid) &&
      validateField("documentsubcatrecid", formData.documentsubcatrecid) &&
      validateField(
        "documentperiodicityrecid",
        formData.documentperiodicityrecid
      ) &&
      validateField("documentapplystatus", formData.documentapplystatus) &&
      validateField("documentreferencelink", formData.documentreferencelink);

    return isValid;
  }, [formData, validateField]);

  // Validate additional categories selection
  const validateAdditionalCategories = useCallback(() => {
    const errors = { ...fieldErrors };
    let hasValidationError = false;

    Object.keys(selectedAdditionalCategories).forEach((catId) => {
      if (selectedAdditionalCategories[catId]) {
        // Find all selected subcategories for this category
        const selectedSubcatsForCategory = Object.keys(
          selectedAdditionalSubcategories
        ).filter(
          (subcatId) =>
            selectedAdditionalSubcategories[subcatId] &&
            subcats.find(
              (sc) =>
                String(sc.docsubcatrecid) === String(subcatId) &&
                String(sc.docsubcatscatrecid) === String(catId)
            )
        );

        // If a category is selected but no subcategories are selected for it, it's an error
        if (selectedSubcatsForCategory.length === 0) {
          hasValidationError = true;
          const categoryName =
            cats.find((c) => String(c.doccatrecid) === catId)?.doccatname ||
            "Selected category";
          errors[
            `additional_cat_${catId}`
          ] = `Please select at least one subcategory for "${categoryName}"`;
        }
      }
    });

    setFieldErrors(errors);
    return !hasValidationError;
  }, [
    fieldErrors,
    selectedAdditionalCategories,
    selectedAdditionalSubcategories,
    subcats,
    cats,
  ]);

  const convertFileToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result;
        const base64Data = result.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  }, []);

  const getFileUrl = useCallback(
    async (path) => {
      try {
        const response = await fetch(
          `${IP}/itelinc/resources/generic/getfileurl`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              userid: userId || "1",
              "X-Module": "Document Management",
              "X-Action": "Document Preview Fetch",
            },
            body: JSON.stringify({
              userid: userId || "39",
              url: path,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.statusCode === 200 && data.data) {
          return data.data;
        } else {
          throw new Error(data.message || "Invalid response format");
        }
      } catch (error) {
        console.error("Error getting file URL:", error);
        throw error;
      }
    },
    [IP, token, userId]
  );

  const downloadDocument = useCallback(
    async (docPath, docName) => {
      if (!docPath) {
        showToast("Document not available", "warning");
        return null;
      }

      setIsDownloading(true);
      showToast(`Preparing download for ${docName}...`, "info");

      try {
        const response = await fetch(
          `${IP}/itelinc/resources/generic/getfileurl`,
          {
            method: "POST",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              userid: userId || "1",
              "X-Module": "Document Management",
              "X-Action": "Document Preview Fetch",
            },
            body: JSON.stringify({
              userid: userId || "39",
              url: docPath,
            }),
          }
        );

        const data = await response.json();

        if (data.statusCode === 200 && data.data) {
          const fileResponse = await fetch(data.data, {
            method: "GET",
            mode: "cors",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!fileResponse.ok) {
            const fileResponseNoAuth = await fetch(data.data, {
              method: "GET",
              mode: "cors",
            });

            if (!fileResponseNoAuth.ok) {
              throw new Error(
                `Failed to fetch file. Status: ${fileResponseNoAuth.status}`
              );
            }

            const blob = await fileResponseNoAuth.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = docName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          } else {
            const blob = await fileResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = docName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }

          showToast(`Downloaded ${docName}`, "success");
        } else {
          throw new Error(data.message || "Failed to get download URL");
        }
      } catch (error) {
        console.error("Error downloading document:", error);
        showToast(`Failed to download: ${error.message}`, "error");
      } finally {
        setIsDownloading(false);
      }
    },
    [IP, token, userId, showToast]
  );

  const previewDocument = useCallback(
    async (docPath, docName) => {
      if (!docPath) {
        showToast("Document not available", "warning");
        return;
      }

      setPreviewLoading(true);
      setIsPreviewModalOpen(true);
      setPreviewDoc({
        name: docName,
        url: null,
        type: null,
        originalPath: docPath,
      });
      setPreviewContent(null);

      try {
        const fileUrl = await getFileUrl(docPath);
        const extension = docName.split(".").pop().toLowerCase();
        let type = "unknown";

        switch (extension) {
          case "pdf":
            type = "pdf";
            break;
          case "doc":
          case "docx":
            type = "word";
            break;
          case "xls":
          case "xlsx":
            type = "excel";
            break;
          case "txt":
          case "csv":
          case "json":
          case "xml":
          case "html":
          case "css":
          case "js":
          case "md":
            type = "text";
            break;
          case "jpg":
          case "jpeg":
          case "png":
          case "gif":
          case "bmp":
          case "webp":
            type = "image";
            break;
          default:
            type = "unknown";
        }

        let content = null;

        if (type === "image") {
          content = { type: "image", url: fileUrl };
        } else if (type === "pdf") {
          content = { type: "pdf", url: fileUrl };
        } else if (type === "text") {
          try {
            const response = await fetch(fileUrl, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
              const responseNoAuth = await fetch(fileUrl);
              if (!responseNoAuth.ok) {
                throw new Error("Failed to fetch text content");
              }
              const text = await responseNoAuth.text();
              content = { type: "text", content: text };
            } else {
              const text = await response.text();
              content = { type: "text", content: text };
            }
          } catch (error) {
            content = { type: "error", message: "Failed to load text content" };
          }
        } else {
          content = { type: "file", url: fileUrl, fileName: docName };
        }

        setPreviewDoc({
          name: docName,
          url: fileUrl,
          type: type,
          originalPath: docPath,
        });
        setPreviewContent(content);
      } catch (error) {
        console.error("Error previewing document:", error);
        showToast(`Failed to preview: ${error.message}`, "error");
        setPreviewContent({
          type: "error",
          message: `Failed to load preview: ${error.message}`,
        });
      } finally {
        setPreviewLoading(false);
      }
    },
    [getFileUrl, showToast, token]
  );

  const openAddModal = useCallback(() => {
    setEditDoc(null);
    setOriginalFileNames({ sample: "", template: "" });
    setFormData({
      documentname: "",
      documentdescription: "",
      documentcatrecid: "",
      documentsubcatrecid: "",
      documentperiodicityrecid: "",
      documentremarks: "",
      sampleDocName: "",
      sampleDocBase64: "",
      templateDocName: "",
      templateDocBase64: "",
      documentapplystatus: 1, // Default to Mandatory (1)
      documentreferencelink: "", // New field
      documentapplicability: "", // New field
    });
    setFieldErrors({});
    setShowAdditionalCategories(false);
    setSelectedAdditionalCategories({});
    setSelectedAdditionalSubcategories({});
    refreshDropdownData();
    setIsModalOpen(true);
  }, [refreshDropdownData]);

  const openEditModal = useCallback(
    (doc) => {
      setEditDoc(doc);
      setOriginalFileNames({
        sample: doc.documentsampledocname || "",
        template: doc.documenttemplatedocname || "",
      });
      setFormData({
        documentname: doc.documentname || "",
        documentdescription: doc.documentdescription || "",
        documentcatrecid: doc.documentcatrecid || "",
        documentsubcatrecid: doc.documentsubcatrecid || "",
        documentperiodicityrecid: doc.documentperiodicityrecid || "",
        documentremarks: doc.documentremarks || "",
        sampleDocName: doc.documentsampledocname || "",
        sampleDocBase64: "",
        templateDocName: doc.documenttemplatedocname || "",
        templateDocBase64: "",
        documentapplystatus:
          doc.documentapplystatus !== undefined ? doc.documentapplystatus : 1, // Default to 1 if not set
        documentreferencelink: doc.documentreferencelink || "", // New field
        documentapplicability: doc.documentapplicability || "", // New field
      });
      setFieldErrors({});
      setShowAdditionalCategories(false);
      setSelectedAdditionalCategories({});
      setSelectedAdditionalSubcategories({});
      refreshDropdownData();
      setIsModalOpen(true);
    },
    [refreshDropdownData]
  );

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      if (fieldErrors[name]) {
        validateField(name, value);
      }

      setFormData((prev) => ({ ...prev, [name]: value }));

      if (name === "documentcatrecid") {
        setFormData((prev) => ({ ...prev, documentsubcatrecid: "" }));
        // Reset additional categories when primary category changes
        setSelectedAdditionalCategories({});
        setSelectedAdditionalSubcategories({});
      }
    },
    [fieldErrors, validateField]
  );

  const handleSampleDocChange = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (file) {
        setIsUploading((prev) => ({ ...prev, sample: true }));

        try {
          if (file.size > 10 * 1024 * 1024) {
            showToast(
              `File size ${(file.size / (1024 * 1024)).toFixed(
                2
              )}MB exceeds the 10MB limit`,
              "error"
            );
            e.target.value = "";
            return;
          }

          const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
          ];
          if (!allowedTypes.includes(file.type)) {
            showToast(
              "Invalid file type. Please select PDF, DOC, DOCX, XLS, XLSX, or TXT files.",
              "error"
            );
            e.target.value = "";
            return;
          }

          const base64 = await convertFileToBase64(file);
          setFormData((prev) => ({
            ...prev,
            sampleDocName: file.name,
            sampleDocBase64: base64,
          }));
          showToast("Sample document uploaded successfully", "success");
        } catch (error) {
          console.error("Error converting file to base64:", error);
          showToast("Failed to process sample document", "error");
          e.target.value = "";
        } finally {
          setIsUploading((prev) => ({ ...prev, sample: false }));
        }
      }
    },
    [convertFileToBase64, showToast]
  );

  const handleTemplateDocChange = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (file) {
        setIsUploading((prev) => ({ ...prev, template: true }));

        try {
          if (file.size > 10 * 1024 * 1024) {
            showToast(
              `File size ${(file.size / (1024 * 1024)).toFixed(
                2
              )}MB exceeds the 10MB limit`,
              "error"
            );
            e.target.value = "";
            return;
          }

          const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
          ];
          if (!allowedTypes.includes(file.type)) {
            showToast(
              "Invalid file type. Please select PDF, DOC, DOCX, XLS, XLSX, or TXT files.",
              "error"
            );
            e.target.value = "";
            return;
          }

          const base64 = await convertFileToBase64(file);
          setFormData((prev) => ({
            ...prev,
            templateDocName: file.name,
            templateDocBase64: base64,
          }));
          showToast("Template document uploaded successfully", "success");
        } catch (error) {
          console.error("Error converting file to base64:", error);
          showToast("Failed to process template document", "error");
          e.target.value = "";
        } finally {
          setIsUploading((prev) => ({ ...prev, template: false }));
        }
      }
    },
    [convertFileToBase64, showToast]
  );

  const getFilteredSubcategories = useCallback(() => {
    if (!formData.documentcatrecid || subcats.length === 0) {
      return [];
    }

    const filtered = subcats.filter((sc) => {
      const catId = String(formData.documentcatrecid);
      return sc.docsubcatscatrecid && String(sc.docsubcatscatrecid) === catId;
    });

    return filtered;
  }, [formData.documentcatrecid, subcats]);

  // New functions for handling multiple categories
  const handleCategoryCheckboxChange = useCallback(
    (categoryId, isChecked) => {
      setSelectedAdditionalCategories((prev) => ({
        ...prev,
        [categoryId]: isChecked,
      }));

      // If a category is unchecked, uncheck all its subcategories
      if (!isChecked) {
        setSelectedAdditionalSubcategories((prev) => {
          const newState = { ...prev };
          subcats
            .filter((sc) => String(sc.docsubcatrecid) === String(categoryId))
            .forEach((sc) => {
              delete newState[sc.docsubcatrecid];
            });
          return newState;
        });
      }
    },
    [subcats]
  );

  const handleSubcategoryCheckboxChange = useCallback(
    (subcategoryId, categoryId, isChecked) => {
      setSelectedAdditionalSubcategories((prev) => ({
        ...prev,
        [subcategoryId]: isChecked,
      }));

      // If a subcategory is checked, make sure its parent category is also checked
      if (isChecked) {
        setSelectedAdditionalCategories((prev) => ({
          ...prev,
          [categoryId]: true,
        }));
      }
    },
    []
  );

  const getSubcategoriesForCategory = useCallback(
    (categoryId) => {
      return subcats.filter(
        (sc) => String(sc.docsubcatscatrecid) === String(categoryId)
      );
    },
    [subcats]
  );

  // Function to add linked document
  const addLinkedDocument = useCallback(
    async (documentId, subcategoryId) => {
      try {
        const url = `${IP}/itelinc/addLinkedDocument`;
        const params = new URLSearchParams({
          linkeddocdocumentid: documentId,
          linkeddocdocsubcatid: subcategoryId,
          linkeddocadminstate: 1,
          linkeddoccreatedby: parseInt(userId) || 1,
          linkeddocmodifiedby: parseInt(userId) || 1,
        });

        console.log(
          "Calling addLinkedDocument API:",
          `${url}?${params.toString()}`
        );

        const response = await fetch(`${url}?${params.toString()}`, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            userid: userId || "1",
            "X-Module": "Document Management",
            "X-Action": "Add Linked Document",
          },
        });

        const data = await response.json();
        console.log("addLinkedDocument response:", data);
        return data;
      } catch (error) {
        console.error("Error adding linked document:", error);
        throw error;
      }
    },
    [IP, token, userId]
  );

  // Function to create a single document
  const createDocument = useCallback(
    async (documentData) => {
      try {
        const url = `${IP}/itelinc/api/documents/addDocumentDetails`;

        console.log("Creating document with data:", documentData);

        const response = await fetch(url, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            userid: userId || "1",
            "X-Module": "Document Management",
            "X-Action": "Add Document",
          },
          body: JSON.stringify(documentData),
        });

        const data = await response.json();
        console.log("Document creation response:", data);
        return data;
      } catch (error) {
        console.error("Error creating document:", error);
        throw error;
      }
    },
    [IP, token, userId]
  );

  // Function to extract document ID from response
  const extractDocumentId = useCallback((response) => {
    let documentId = null;

    console.log("Extracting document ID from response:", response);

    // Try different ways to extract document ID
    if (response.data) {
      // If response.data is a string, try to extract numeric ID
      if (typeof response.data === "string") {
        const idMatch = response.data.match(/(\d+)/);
        if (idMatch) {
          documentId = parseInt(idMatch[1]);
          console.log("Extracted ID from string:", documentId);
        } else if (!isNaN(response.data)) {
          // If entire data is a number
          documentId = parseInt(response.data);
          console.log("Extracted ID from number:", documentId);
        }
      } else if (response.data.documentsrecid) {
        // If response.data has documentsrecid property
        documentId = response.data.documentsrecid;
        console.log("Extracted ID from data.documentsrecid:", documentId);
      } else if (response.data.id) {
        // If response.data has id property
        documentId = response.data.id;
        console.log("Extracted ID from data.id:", documentId);
      }
    } else if (response.documentsrecid) {
      // If response has documentsrecid property at root level
      documentId = response.documentsrecid;
      console.log("Extracted ID from response.documentsrecid:", documentId);
    }

    // Final check - if we still don't have an ID, log the entire response
    if (!documentId) {
      console.error(
        "Could not extract document ID from response. Full response:",
        response
      );
    }

    return documentId;
  }, []);

  // Function to get document ID from table after refresh
  const getDocumentIdFromTable = useCallback(
    (docName, docCatId, docSubcatId) => {
      const doc = documents.find(
        (d) =>
          d.documentname === docName &&
          d.documentcatrecid === docCatId &&
          d.documentsubcatrecid === docSubcatId
      );
      return doc ? doc.documentsrecid : null;
    },
    [documents]
  );

  // Function to apply for a document (for incubatees)
  const applyForDocument = useCallback(
    async (documentId) => {
      setIsApplying((prev) => ({ ...prev, [documentId]: true }));

      try {
        const url = `${IP}/itelinc/addIncubateeApplicability`;
        const params = new URLSearchParams({
          incdocapplyincubateeid: incubateeId,
          incdocapplydocumentid: documentId,
          incdocapplyadminstate: 1,
          incdocapplycreatedby: userId || "1",
          incdocapplymodifiedby: userId || "1",
        });

        const response = await fetch(`${url}?${params.toString()}`, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            userid: userId || "1",
            "X-Module": "Document Management",
            "X-Action": "Apply for Document",
          },
        });

        const data = await response.json();

        if (data.statusCode === 200) {
          showToast("Application submitted successfully!", "success");
          // Add to applied documents set
          setAppliedDocuments((prev) => new Set([...prev, documentId]));
          // Refresh data to update the UI
          fetchDocuments();
        } else {
          throw new Error(data.message || "Failed to apply for document");
        }
      } catch (error) {
        console.error("Error applying for document:", error);
        showToast(`Failed to apply: ${error.message}`, "error");
      } finally {
        setIsApplying((prev) => ({ ...prev, [documentId]: false }));
      }
    },
    [IP, incUserid, userId, token, showToast, fetchDocuments]
  );

  const handleApplyForDocument = useCallback(
    (doc) => {
      Swal.fire({
        title: "Mark Not Applicable",
        text: `Are you sure you want to mark Not Applicable "${doc.documentname}"?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#28a745",
      }).then((result) => {
        if (result.isConfirmed) {
          applyForDocument(doc.documentsrecid);
        }
      });
    },
    [applyForDocument]
  );

  const handleDelete = useCallback(
    (docId) => {
      Swal.fire({
        title: "Are you sure?",
        text: "This document will be deleted permanently.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          setIsDeleting((prev) => ({ ...prev, [docId]: true }));

          Swal.fire({
            title: "Deleting...",
            text: "Please wait while we delete the document",
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          const url = `${IP}/itelinc/api/documents/deleteDocumentDetails`;
          const requestBody = {
            documentsrecid: docId,
            documentmodifiedby: parseInt(userId) || 39,
            userid: userId || "1",
            "X-Module": "Document Management",
            "X-Action": "Delete Document",
          };

          fetch(url, {
            method: "POST",
            mode: "cors",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.statusCode === 200) {
                Swal.fire(
                  "Deleted!",
                  "Document deleted successfully!",
                  "success"
                );
                refreshData();
              } else {
                throw new Error(data.message || "Failed to delete document");
              }
            })
            .catch((err) => {
              console.error("Error deleting document:", err);
              showToast(`Failed to delete: ${err.message}`, "error");
              Swal.close();
            })
            .finally(() => {
              setIsDeleting((prev) => ({ ...prev, [docId]: false }));
            });
        }
      });
    },
    [IP, token, userId, refreshData, showToast]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // Validate main form fields first
      if (!validateForm()) {
        showToast("Please fix errors in form", "error");
        return;
      }

      // Validate additional categories selection
      if (!validateAdditionalCategories()) {
        showToast(
          "Please select at least one subcategory for each selected category",
          "error"
        );
        return;
      }

      setIsSaving(true);
      setIsModalOpen(false);

      try {
        let subcatId = formData.documentsubcatrecid;

        if (isNaN(formData.documentsubcatrecid)) {
          const subcatByName = subcats.find(
            (sc) => sc.docsubcatname === formData.documentsubcatrecid
          );
          if (subcatByName) {
            subcatId = subcatByName.docsubcatrecid;
          } else {
            showToast("Invalid subcategory selected", "error");
            setIsSaving(false);
            return;
          }
        } else {
          if (typeof subcatId === "string" && subcatId !== "") {
            subcatId = parseInt(subcatId);
          }
        }

        if (!subcatId || isNaN(subcatId)) {
          showToast("Please select a valid subcategory", "error");
          setIsSaving(false);
          return;
        }

        // Prepare base document data
        const baseDocumentData = {
          userid: parseInt(userId) || 39,
          doccatid: parseInt(formData.documentcatrecid),
          docsubcatid: subcatId,
          documentperiodicityrecid: parseInt(formData.documentperiodicityrecid),
          documentname: formData.documentname.trim(),
          documentdescription: formData.documentdescription.trim(),
          documentremarks: formData.documentremarks || "",
          sampleDocName: formData.sampleDocName || originalFileNames.sample,
          templateDocName:
            formData.templateDocName || originalFileNames.template,
          documentcreatedby: parseInt(userId) || 39,
          documentmodifiedby: parseInt(userId) || 39,
          documentapplystatus: parseInt(formData.documentapplystatus), // Add document applicability status
          documentreferencelink: formData.documentreferencelink, // New field
          documentapplicability: formData.documentapplicability, // New field
        };

        if (formData.sampleDocBase64) {
          baseDocumentData.sampleDocBase64 = formData.sampleDocBase64;
        }
        if (formData.templateDocBase64) {
          baseDocumentData.templateDocBase64 = formData.templateDocBase64;
        }

        if (editDoc) {
          // For editing, update the original document
          baseDocumentData.documentsrecid = editDoc.documentsrecid;
          baseDocumentData.documentcreatedby =
            typeof editDoc.documentcreatedby === "string"
              ? 0
              : editDoc.documentcreatedby;

          const response = await createDocument(baseDocumentData);

          if (response.statusCode === 200) {
            setEditDoc(null);
            refreshData();
            Swal.fire(
              "Success",
              response.message || "Document updated successfully!",
              "success"
            );
          } else {
            throw new Error(response.message || "Operation failed");
          }
        } else {
          // Collect all subcategories for which documents need to be created
          const allSubcategories = [];

          // Add primary subcategory
          allSubcategories.push({
            catId: parseInt(formData.documentcatrecid),
            subcatId: subcatId,
          });

          // Debug: Log selected categories and subcategories
          console.log(
            "Selected additional categories:",
            selectedAdditionalCategories
          );
          console.log(
            "Selected additional subcategories:",
            selectedAdditionalSubcategories
          );

          // Collect all selected subcategories from additional categories
          Object.keys(selectedAdditionalCategories).forEach((catId) => {
            if (selectedAdditionalCategories[catId]) {
              // Find all selected subcategories for this category
              const selectedSubcats = Object.keys(
                selectedAdditionalSubcategories
              ).filter(
                (subcatId) =>
                  selectedAdditionalSubcategories[subcatId] &&
                  subcats.find(
                    (sc) =>
                      String(sc.docsubcatrecid) === String(subcatId) &&
                      String(sc.docsubcatscatrecid) === String(catId)
                  )
              );

              // If no specific subcategories selected, use first subcategory of this category
              if (selectedSubcats.length === 0) {
                const firstSubcat = subcats.find(
                  (sc) => String(sc.docsubcatscatrecid) === String(catId)
                );
                if (firstSubcat) {
                  allSubcategories.push({
                    catId: parseInt(catId),
                    subcatId: firstSubcat.docsubcatrecid,
                  });
                  console.log(
                    `Added first subcategory for category ${catId}:`,
                    firstSubcat.docsubcatrecid
                  );
                }
              } else {
                // Add each selected subcategory
                selectedSubcats.forEach((subcatId) => {
                  // Skip if this is the same as the primary subcategory
                  if (
                    String(catId) === String(formData.documentcatrecid) &&
                    String(subcatId) === String(formData.documentsubcatrecid)
                  ) {
                    console.log(`Skipping primary subcategory: ${subcatId}`);
                    return;
                  }

                  allSubcategories.push({
                    catId: parseInt(catId),
                    subcatId: parseInt(subcatId),
                  });
                  console.log(`Added additional subcategory: ${subcatId}`);
                });
              }
            }
          });

          console.log(
            "Final all subcategories for document creation:",
            allSubcategories
          );

          // Create documents for each subcategory
          const documentCreationPromises = allSubcategories.map(
            async (subcatInfo, index) => {
              const documentData = {
                ...baseDocumentData,
                doccatid: subcatInfo.catId,
                docsubcatid: subcatInfo.subcatId,
              };

              try {
                // Create document
                const result = await createDocument(documentData);

                if (result.statusCode === 200) {
                  // Use the extractDocumentId function to get the ID
                  const documentId = extractDocumentId(result);

                  console.log(
                    `Created document ${index + 1} with ID:`,
                    documentId
                  );

                  return {
                    success: true,
                    documentResult: result,
                    documentId,
                    subcatId: subcatInfo.subcatId,
                    catId: subcatInfo.catId,
                  };
                } else {
                  throw new Error(
                    result.message || "Failed to create document"
                  );
                }
              } catch (error) {
                console.error(
                  `Error creating document for subcategory ${subcatInfo.subcatId}:`,
                  error
                );
                return {
                  success: false,
                  error,
                  subcatId: subcatInfo.subcatId,
                  catId: subcatInfo.catId,
                };
              }
            }
          );

          // Wait for all document creation operations to complete
          const results = await Promise.allSettled(documentCreationPromises);

          // Process results
          const successfulDocuments = [];
          const failedDocuments = [];

          results.forEach((result) => {
            if (result.status === "fulfilled" && result.value.success) {
              successfulDocuments.push(result.value);
            } else {
              failedDocuments.push(result.value || { error: result.reason });
            }
          });

          console.log("Document creation summary:");
          console.log("Successful documents:", successfulDocuments.length);
          console.log("Failed documents:", failedDocuments.length);

          // Refresh the documents table to get the latest data with actual IDs
          await refreshData();

          // Wait a bit for the refresh to complete
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Now get the actual document IDs from the refreshed table
          const documentIdsFromTable = successfulDocuments.map((doc) => {
            const docId = getDocumentIdFromTable(
              formData.documentname,
              doc.catId,
              doc.subcatId
            );
            return {
              documentId: docId,
              subcatId: doc.subcatId,
              catId: doc.catId,
            };
          });

          console.log("Document IDs from table:", documentIdsFromTable);

          // Create links between all documents
          const linkPromises = [];
          const successfulLinks = [];
          const failedLinks = [];

          if (documentIdsFromTable.length > 1) {
            // Create links from all documents to the first document
            for (let i = 1; i < documentIdsFromTable.length; i++) {
              // Link document i to the subcategory of the first document
              linkPromises.push(
                addLinkedDocument(
                  documentIdsFromTable[i].documentId,
                  documentIdsFromTable[0].subcatId
                )
                  .then((linkResult) => {
                    console.log(
                      `Link created: Document ${documentIdsFromTable[i].documentId} -> Subcategory ${documentIdsFromTable[0].subcatId}`
                    );
                    successfulLinks.push({
                      fromDocId: documentIdsFromTable[i].documentId,
                      toSubcatId: documentIdsFromTable[0].subcatId,
                      result: linkResult,
                    });
                    return linkResult;
                  })
                  .catch((error) => {
                    console.error(
                      `Failed to link document ${documentIdsFromTable[i].documentId} to subcategory ${documentIdsFromTable[0].subcatId}:`,
                      error
                    );
                    failedLinks.push({
                      fromDocId: documentIdsFromTable[i].documentId,
                      toSubcatId: documentIdsFromTable[0].subcatId,
                      error,
                    });
                    throw error;
                  })
              );
            }

            // Also link the first document to all other documents
            for (let i = 1; i < documentIdsFromTable.length; i++) {
              // Link first document to the subcategory of document i
              linkPromises.push(
                addLinkedDocument(
                  documentIdsFromTable[0].documentId,
                  documentIdsFromTable[i].subcatId
                )
                  .then((linkResult) => {
                    console.log(
                      `Link created: Document ${documentIdsFromTable[0].documentId} -> Subcategory ${documentIdsFromTable[i].subcatId}`
                    );
                    successfulLinks.push({
                      fromDocId: documentIdsFromTable[0].documentId,
                      toSubcatId: documentIdsFromTable[i].subcatId,
                      result: linkResult,
                    });
                    return linkResult;
                  })
                  .catch((error) => {
                    console.error(
                      `Failed to link document ${documentIdsFromTable[0].documentId} to subcategory ${documentIdsFromTable[i].subcatId}:`,
                      error
                    );
                    failedLinks.push({
                      fromDocId: documentIdsFromTable[0].documentId,
                      toSubcatId: documentIdsFromTable[i].subcatId,
                      error,
                    });
                    throw error;
                  })
              );
            }

            // Wait for all link operations to complete
            await Promise.allSettled(linkPromises);
          }

          console.log("Link creation summary:");
          console.log("Successful links:", successfulLinks.length);
          console.log("Failed links:", failedLinks.length);

          // Show a comprehensive summary
          let summaryMessage = "";
          if (successfulDocuments.length > 0) {
            summaryMessage += `Successfully created ${successfulDocuments.length} document(s). `;
          }
          if (failedDocuments.length > 0) {
            summaryMessage += `Failed to create ${failedDocuments.length} document(s). `;
          }
          if (successfulLinks.length > 0) {
            summaryMessage += `Successfully created ${successfulLinks.length} link(s). `;
          }
          if (failedLinks.length > 0) {
            summaryMessage += `Failed to create ${failedLinks.length} link(s).`;
          }

          if (successfulDocuments.length > 0) {
            showToast(
              `Operation completed: ${successfulDocuments.length} documents created, ${successfulLinks.length} links created`,
              "success"
            );
          } else {
            showToast("Failed to create any documents", "error");
          }

          setEditDoc(null);
          refreshData();
          Swal.fire(
            "Operation Complete",
            summaryMessage || "Operation completed",
            successfulDocuments.length > 0 ? "success" : "error"
          );
        }
      } catch (err) {
        console.error("Error in handleSubmit:", err);
        showToast(`Failed to save: ${err.message}`, "error");
        Swal.close();
        setIsModalOpen(true);
      } finally {
        setIsSaving(false);
      }
    },
    [
      formData,
      editDoc,
      originalFileNames,
      subcats,
      IP,
      token,
      userId,
      refreshData,
      showToast,
      validateForm,
      validateAdditionalCategories,
      selectedAdditionalCategories,
      selectedAdditionalSubcategories,
      createDocument,
      extractDocumentId,
      getDocumentIdFromTable,
      addLinkedDocument,
    ]
  );

  // Check if form is valid for enabling save button
  const isFormValid = useCallback(() => {
    return (
      formData.documentname &&
      formData.documentdescription &&
      formData.documentcatrecid &&
      formData.documentsubcatrecid &&
      formData.documentperiodicityrecid &&
      formData.documentapplystatus !== undefined &&
      formData.documentapplystatus !== null &&
      Object.keys(fieldErrors).length === 0
    );
  }, [formData, fieldErrors]);

  // MEMOIZED VALUES (Must be defined after handler functions)
  const columns = useMemo(() => {
    const baseColumns = [
      {
        field: "doccatname",
        headerName: "Category",
        width: 150,
        sortable: true,
      },
      {
        field: "docsubcatname",
        headerName: "Subcategory",
        width: 150,
        sortable: true,
      },
      {
        field: "documentname",
        headerName: "Document Name",
        width: 200,
        sortable: true,
      },
      {
        field: "documentdescription",
        headerName: "Description",
        width: 250,
        sortable: true,
      },
      {
        field: "docperiodicityname",
        headerName: "Periodicity",
        width: 120,
        sortable: true,
      },
      {
        field: "documentapplystatus",
        headerName: "Applicability",
        width: 120,
        sortable: true,
        renderCell: (params) => {
          if (!params || !params.row) return "-";
          const status = params.row.documentapplystatus;
          return status === 1 ? "Mandatory" : status === 0 ? "Selective" : "-";
        },
      },
      {
        field: "documentreferencelink",
        headerName: "Reference Link",
        width: 150,
        sortable: true,
        renderCell: (params) => {
          if (!params || !params.row || !params.row.documentreferencelink)
            return "-";
          return (
            <Tooltip title={params.row.documentreferencelink} arrow>
              <Button
                size="small"
                onClick={() =>
                  window.open(params.row.documentreferencelink, "_blank")
                }
                sx={{ textTransform: "none" }}
              >
                {params.row.documentreferencelink.length > 20
                  ? `${params.row.documentreferencelink.substring(0, 20)}...`
                  : params.row.documentreferencelink}
              </Button>
            </Tooltip>
          );
        },
      },
      {
        field: "documentapplicability",
        headerName: "Note for Applicability",
        width: 180,
        sortable: true,
        renderCell: (params) => {
          if (!params || !params.row || !params.row.documentapplicability)
            return "-";
          return (
            <Tooltip title={params.row.documentapplicability} arrow>
              <span>
                {params.row.documentapplicability.length > 30
                  ? `${params.row.documentapplicability.substring(0, 30)}...`
                  : params.row.documentapplicability}
              </span>
            </Tooltip>
          );
        },
      },
      {
        field: "documentremarks",
        headerName: "Remarks",
        width: 150,
        sortable: true,
        renderCell: (params) => {
          if (!params || !params.row) return "-";
          const remarks = params.row.documentremarks;
          return remarks ? (
            <Tooltip title={remarks} arrow>
              <span>
                {remarks.length > 20
                  ? `${remarks.substring(0, 20)}...`
                  : remarks}
              </span>
            </Tooltip>
          ) : (
            "-"
          );
        },
      },
      {
        field: "documentsampledocname",
        headerName: "Sample Document",
        width: 180,
        sortable: false,
        renderCell: (params) => {
          if (!params || !params.row) return "-";
          const docName = params.row.documentsampledocname;
          const docPath = params.row.documentsampledoc;
          return docName ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FileIcon fileName={docName} />
              <Tooltip title={`Click to preview ${docName}`} arrow>
                <Button
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => previewDocument(docPath, docName)}
                >
                  {docName.length > 15
                    ? `${docName.substring(0, 15)}...`
                    : docName}
                </Button>
              </Tooltip>
            </Box>
          ) : (
            "-"
          );
        },
      },
      {
        field: "documenttemplatedocname",
        headerName: "Template Document",
        width: 180,
        sortable: false,
        renderCell: (params) => {
          if (!params || !params.row) return "-";
          const docName = params.row.documenttemplatedocname;
          const docPath = params.row.documenttemplatedoc;
          return docName ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FileIcon fileName={docName} />
              <Tooltip title={`Click to preview ${docName}`} arrow>
                <Button
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => previewDocument(docPath, docName)}
                >
                  {docName.length > 15
                    ? `${docName.substring(0, 15)}...`
                    : docName}
                </Button>
              </Tooltip>
            </Box>
          ) : (
            "-"
          );
        },
      },
    ];

    // Add user-specific columns if not role 4
    if (Number(roleid) !== 4) {
      baseColumns.push(
        {
          field: "documentcreatedby",
          headerName: "Created By",
          width: 120,
          sortable: true,
          renderCell: (params) => {
            if (!params || !params.row) return "Admin";
            return isNaN(params.row.documentcreatedby)
              ? params.row.documentcreatedby
              : "Admin";
          },
        },
        {
          field: "documentcreatedtime",
          headerName: "Created Time",
          width: 180,
          sortable: true,
          type: "date",
        },
        {
          field: "documentmodifiedby",
          headerName: "Modified By",
          width: 120,
          sortable: true,
          renderCell: (params) => {
            if (!params || !params.row) return "Admin";
            return isNaN(params.row.documentmodifiedby)
              ? params.row.documentmodifiedby
              : "Admin";
          },
        },
        {
          field: "documentmodifiedtime",
          headerName: "Modified Time",
          width: 180,
          sortable: true,
          type: "date",
        }
      );
    }

    // Add actions column for role 1 (admin)
    if (Number(roleid) === 1) {
      baseColumns.push({
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
                onClick={() => openEditModal(params.row)}
                disabled={isSaving || isDeleting[params.row.documentsrecid]}
                title="Edit"
              >
                <EditIcon fontSize="small" />
              </ActionButton>
              <ActionButton
                color="delete"
                onClick={() => handleDelete(params.row.documentsrecid)}
                disabled={isSaving || isDeleting[params.row.documentsrecid]}
                title="Delete"
              >
                {isDeleting[params.row.documentsrecid] ? (
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

    // Add applicability column for role 4 (incubatee)
    if (Number(roleid) === 4) {
      baseColumns.push({
        field: "applicability",
        headerName: "Action",
        width: 180,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          if (!params || !params.row) return null;

          const isMandatory = params.row.documentapplystatus === 1;
          const isApplied = appliedDocuments.has(params.row.documentsrecid);

          return (
            <Box>
              {isApplied ? (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Marked (N/A)"
                  color="success"
                  variant="outlined"
                />
              ) : (
                <ApplyButton
                  variant="contained"
                  disabled={
                    isMandatory || isApplying[params.row.documentsrecid]
                  }
                  onClick={() => handleApplyForDocument(params.row)}
                  startIcon={
                    isApplying[params.row.documentsrecid] ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <HowToRegIcon />
                    )
                  }
                >
                  {isApplying[params.row.documentsrecid]
                    ? "Applying..."
                    : isMandatory
                    ? "Mandatory"
                    : "Mark (N/A)"}
                </ApplyButton>
              )}
            </Box>
          );
        },
      });
    }

    return baseColumns;
  }, [
    roleid,
    isSaving,
    isDeleting,
    isApplying,
    appliedDocuments,
    previewDocument,
    openEditModal,
    handleDelete,
    handleApplyForDocument,
  ]);

  // Define export configuration
  const exportConfig = useMemo(
    () => ({
      filename: "documents",
      sheetName: "Documents",
    }),
    []
  );

  // Custom export data transformer
  const onExportData = useMemo(
    () => (data) => {
      return data.map((doc, index) => ({
        "S.No": index + 1,
        Category: doc.doccatname || "",
        Subcategory: doc.docsubcatname || "",
        "Document Name": doc.documentname || "",
        Description: doc.documentdescription || "",
        Periodicity: doc.docperiodicityname || "",
        Applicability:
          doc.documentapplystatus === 1
            ? "Mandatory"
            : doc.documentapplystatus === 0
            ? "Selective"
            : "",
        "Reference Link": doc.documentreferencelink || "",
        "Note for Applicability": doc.documentapplicability || "",
        Remarks: doc.documentremarks || "",
        "Sample Document": doc.documentsampledocname || "",
        "Template Document": doc.documenttemplatedocname || "",
        "Created By": isNaN(doc.documentcreatedby)
          ? doc.documentcreatedby
          : "Admin",
        "Created Time": formatDate(doc.documentcreatedtime),
        "Modified By": isNaN(doc.documentmodifiedby)
          ? doc.documentmodifiedby
          : "Admin",
        "Modified Time": formatDate(doc.documentmodifiedtime),
      }));
    },
    []
  );

  // EFFECTS
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // RENDER (JSX)
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
        {Number(roleid) === 1 && (
          <Button
            variant="contained"
            onClick={openAddModal}
            disabled={isSaving}
          >
            + Add Document
          </Button>
        )}
      </Box>

      {/* Use the ReusableDataGrid component */}
      <ReusableDataGrid
        data={documents}
        columns={columns}
        title="Documents"
        enableExport={true}
        enableColumnFilters={true}
        searchPlaceholder="Search documents..."
        searchFields={[
          "doccatname",
          "docsubcatname",
          "documentname",
          "documentdescription",
        ]}
        uniqueIdField="documentsrecid"
        onExportData={onExportData}
        exportConfig={exportConfig}
        loading={loading}
      />

      {/* Modal for Add/Edit */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editDoc ? "Edit Document" : "Add Document"}
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
            <Grid container spacing={2} direction="column">
              <Grid item xs={12}>
                <FormControl
                  fullWidth
                  margin="dense"
                  error={!!fieldErrors.documentcatrecid}
                >
                  <InputLabel>Primary Category *</InputLabel>
                  <Select
                    name="documentcatrecid"
                    value={formData.documentcatrecid}
                    onChange={handleChange}
                    required
                    disabled={isSaving}
                    label="Primary Category *"
                  >
                    <MenuItem value="">Select Primary Category</MenuItem>
                    {cats.map((cat) => (
                      <MenuItem key={cat.doccatrecid} value={cat.doccatrecid}>
                        {cat.doccatname}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldErrors.documentcatrecid && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {fieldErrors.documentcatrecid}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    sx={{ mt: 1, display: "block", color: "text.secondary" }}
                  >
                    This will be the primary category for the document
                  </Typography>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl
                  fullWidth
                  margin="dense"
                  error={!!fieldErrors.documentsubcatrecid}
                >
                  <InputLabel>Primary Subcategory *</InputLabel>
                  <Select
                    name="documentsubcatrecid"
                    value={formData.documentsubcatrecid}
                    onChange={handleChange}
                    required
                    disabled={!formData.documentcatrecid || isSaving}
                    label="Primary Subcategory *"
                  >
                    <MenuItem value="">Select Primary Subcategory</MenuItem>
                    {getFilteredSubcategories().length > 0 ? (
                      getFilteredSubcategories().map((sc) => (
                        <MenuItem
                          key={sc.docsubcatrecid}
                          value={sc.docsubcatrecid}
                        >
                          {sc.docsubcatname}
                        </MenuItem>
                      ))
                    ) : formData.documentcatrecid ? (
                      <MenuItem value="" disabled>
                        No subcategories available for this category
                      </MenuItem>
                    ) : (
                      <MenuItem value="" disabled>
                        Please select a category first
                      </MenuItem>
                    )}
                  </Select>
                  {fieldErrors.documentsubcatrecid && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {fieldErrors.documentsubcatrecid}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    sx={{ mt: 1, display: "block", color: "text.secondary" }}
                  >
                    This will be the primary subcategory for the document
                  </Typography>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl
                  fullWidth
                  margin="dense"
                  error={!!fieldErrors.documentperiodicityrecid}
                >
                  <InputLabel>Periodicity *</InputLabel>
                  <Select
                    name="documentperiodicityrecid"
                    value={formData.documentperiodicityrecid}
                    onChange={handleChange}
                    required
                    disabled={isSaving}
                    label="Periodicity *"
                  >
                    <MenuItem value="">Select Periodicity</MenuItem>
                    <MenuItem value="1">One-time</MenuItem>
                    <MenuItem value="2">Monthly</MenuItem>
                    <MenuItem value="3">Quarterly</MenuItem>
                    <MenuItem value="4">Yearly</MenuItem>
                  </Select>
                  {fieldErrors.documentperiodicityrecid && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {fieldErrors.documentperiodicityrecid}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl
                  fullWidth
                  margin="dense"
                  error={!!fieldErrors.documentapplystatus}
                >
                  <InputLabel>Document Applicability Status *</InputLabel>
                  <Select
                    name="documentapplystatus"
                    value={formData.documentapplystatus}
                    onChange={handleChange}
                    required
                    disabled={isSaving}
                    label="Document Applicability Status *"
                  >
                    <MenuItem value="">Select Applicability Status</MenuItem>
                    <MenuItem value={1}>Mandatory</MenuItem>
                    <MenuItem value={0}>Selective Applicability</MenuItem>
                  </Select>
                  {fieldErrors.documentapplystatus && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {fieldErrors.documentapplystatus}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="dense"
                  name="documentname"
                  label="Document Name *"
                  type="text"
                  variant="outlined"
                  value={formData.documentname}
                  onChange={handleChange}
                  onBlur={(e) => validateField("documentname", e.target.value)}
                  required
                  disabled={isSaving}
                  error={!!fieldErrors.documentname}
                  helperText={fieldErrors.documentname}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="dense"
                  name="documentdescription"
                  label="Description *"
                  multiline
                  rows={3}
                  variant="outlined"
                  value={formData.documentdescription}
                  onChange={handleChange}
                  onBlur={(e) =>
                    validateField("documentdescription", e.target.value)
                  }
                  required
                  disabled={isSaving}
                  error={!!fieldErrors.documentdescription}
                  helperText={fieldErrors.documentdescription}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="dense"
                  name="documentreferencelink"
                  label="Reference Link"
                  type="url"
                  variant="outlined"
                  value={formData.documentreferencelink}
                  onChange={handleChange}
                  onBlur={(e) =>
                    validateField("documentreferencelink", e.target.value)
                  }
                  disabled={isSaving}
                  error={!!fieldErrors.documentreferencelink}
                  helperText={
                    fieldErrors.documentreferencelink ||
                    "Enter a valid URL (http:// or https://)"
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="dense"
                  name="documentapplicability"
                  label="Note for Applicability"
                  multiline
                  rows={2}
                  variant="outlined"
                  value={formData.documentapplicability}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="dense"
                  name="documentremarks"
                  label="Remarks"
                  variant="outlined"
                  value={formData.documentremarks}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {editDoc ? "Replace Sample Document" : "Sample Document"}
                </Typography>
                <FileUploadButton
                  variant="outlined"
                  component="label"
                  disabled={isSaving || isUploading.sample}
                  fullWidth
                >
                  {isUploading.sample ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CloudUploadIcon sx={{ mr: 1 }} />
                      Choose File
                    </>
                  )}
                  <input
                    type="file"
                    onChange={handleSampleDocChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                </FileUploadButton>
                <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                  {formData.sampleDocName || "No file chosen"}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {editDoc ? "Replace Template Document" : "Template Document"}
                </Typography>
                <FileUploadButton
                  variant="outlined"
                  component="label"
                  disabled={isSaving || isUploading.template}
                  fullWidth
                >
                  {isUploading.template ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CloudUploadIcon sx={{ mr: 1 }} />
                      Choose File
                    </>
                  )}
                  <input
                    type="file"
                    onChange={handleTemplateDocChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                </FileUploadButton>
                <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                  {formData.templateDocName || "No file chosen"}
                </Typography>
              </Grid>

              {/* Additional Categories Section */}
              {!editDoc && (
                <Grid item xs={12}>
                  <Box sx={{ mt: 2, mb: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() =>
                        setShowAdditionalCategories(!showAdditionalCategories)
                      }
                      startIcon={<ExpandMoreIcon />}
                      sx={{ mb: 1 }}
                    >
                      Add to Multiple Categories and Subcategories
                    </Button>
                    {showAdditionalCategories && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>
                          Select additional categories and subcategories. A
                          separate document will be created for each selected
                          subcategory:
                        </Typography>

                        {cats.map((cat) => {
                          const catId = String(cat.doccatrecid);
                          const isSelected =
                            selectedAdditionalCategories[catId] || false;
                          const subcatsForCat = getSubcategoriesForCategory(
                            cat.doccatrecid
                          );

                          return (
                            <Accordion key={cat.doccatrecid} sx={{ mb: 1 }}>
                              <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls={`panel-${cat.doccatrecid}-content`}
                                id={`panel-${cat.doccatrecid}-header`}
                              >
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={isSelected}
                                      onChange={(e) =>
                                        handleCategoryCheckboxChange(
                                          catId,
                                          e.target.checked
                                        )
                                      }
                                    />
                                  }
                                  label={cat.doccatname}
                                />
                              </AccordionSummary>
                              <AccordionDetails>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                  Subcategories:
                                </Typography>
                                <FormGroup>
                                  {subcatsForCat.length > 0 ? (
                                    subcatsForCat.map((subcat) => (
                                      <FormControlLabel
                                        key={subcat.docsubcatrecid}
                                        control={
                                          <Checkbox
                                            checked={
                                              selectedAdditionalSubcategories[
                                                subcat.docsubcatrecid
                                              ] || false
                                            }
                                            onChange={(e) =>
                                              handleSubcategoryCheckboxChange(
                                                subcat.docsubcatrecid,
                                                catId,
                                                e.target.checked
                                              )
                                            }
                                            disabled={!isSelected}
                                          />
                                        }
                                        label={subcat.docsubcatname}
                                      />
                                    ))
                                  ) : (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      No subcategories available for this
                                      category
                                    </Typography>
                                  )}
                                </FormGroup>
                                {fieldErrors[`additional_cat_${catId}`] && (
                                  <Typography
                                    variant="caption"
                                    color="error"
                                    sx={{ mt: 1 }}
                                  >
                                    {fieldErrors[`additional_cat_${catId}`]}
                                  </Typography>
                                )}
                              </AccordionDetails>
                            </Accordion>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                </Grid>
              )}

              {editDoc && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Existing Documents
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Sample Document
                    </Typography>
                    {editDoc.documentsampledocname ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <FileIcon fileName={editDoc.documentsampledocname} />
                        <Typography variant="body2">
                          {editDoc.documentsampledocname}
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() =>
                            previewDocument(
                              editDoc.documentsampledoc,
                              editDoc.documentsampledocname
                            )
                          }
                        >
                          Preview
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No sample document
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Template Document
                    </Typography>
                    {editDoc.documenttemplatedocname ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <FileIcon fileName={editDoc.documenttemplatedocname} />
                        <Typography variant="body2">
                          {editDoc.documenttemplatedocname}
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() =>
                            previewDocument(
                              editDoc.documenttemplatedoc,
                              editDoc.documenttemplatedocname
                            )
                          }
                        >
                          Preview
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No template document
                      </Typography>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving || !isFormValid()}
              startIcon={isSaving ? <CircularProgress size={20} /> : null}
            >
              {isSaving ? "Saving..." : editDoc ? "Update" : "Save"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Preview Modal */}
      <Dialog
        open={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {previewDoc?.name}
          <IconButton
            aria-label="close"
            onClick={() => setIsPreviewModalOpen(false)}
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
        <DialogContent sx={{ minHeight: 500 }}>
          {previewLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: 300,
              }}
            >
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>
                Loading document preview...
              </Typography>
            </Box>
          ) : (
            <>
              {previewContent && previewContent.type === "image" && (
                <Box sx={{ textAlign: "center" }}>
                  <img
                    src={previewContent.url}
                    alt="Preview"
                    style={{ maxWidth: "100%", maxHeight: "500px" }}
                  />
                </Box>
              )}

              {previewContent && previewContent.type === "pdf" && (
                <iframe
                  src={`${previewContent.url}#view=FitH`}
                  style={{ width: "100%", height: "500px", border: "none" }}
                  title="PDF Preview"
                />
              )}

              {previewContent && previewContent.type === "text" && (
                <Box
                  sx={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "monospace",
                    fontSize: "14px",
                  }}
                >
                  {previewContent.content}
                </Box>
              )}

              {previewContent && previewContent.type === "file" && (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <FileIcon
                    fileName={previewDoc?.name}
                    sx={{ fontSize: 64, mb: 2 }}
                  />
                  <Typography>
                    Preview not available for this file type.
                  </Typography>
                  <Typography>
                    Click the download button to view this file.
                  </Typography>
                </Box>
              )}

              {previewContent && previewContent.type === "error" && (
                <Box sx={{ textAlign: "center", py: 4, color: "error.main" }}>
                  <Typography>{previewContent.message}</Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPreviewModalOpen(false)}>Close</Button>
          {previewDoc?.originalPath && (
            <Button
              variant="contained"
              onClick={() =>
                downloadDocument(previewDoc.originalPath, previewDoc.name)
              }
              disabled={isDownloading}
              startIcon={
                isDownloading ? (
                  <CircularProgress size={20} />
                ) : (
                  <Download size={16} />
                )
              }
            >
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
          )}
        </DialogActions>
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

      {/* Loading overlay for operations */}
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
            {editDoc
              ? "Updating document..."
              : "Creating documents and links..."}
          </Typography>
        </Box>
      </StyledBackdrop>
    </Box>
  );
});

DocumentsTable.displayName = "DocumentsTable";

export default DocumentsTable;
