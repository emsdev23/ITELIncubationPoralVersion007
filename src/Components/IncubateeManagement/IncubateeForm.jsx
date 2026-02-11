import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import PropTypes from "prop-types";

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
  TextField,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  AppBar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import DescriptionIcon from "@mui/icons-material/Description";
import SettingsIcon from "@mui/icons-material/Settings";

// Import API instance
import api from "../Datafetching/api";

// Styled components (unchanged)
const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: 16,
    boxShadow: theme.shadows[10],
  },
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  maxHeight: "80vh",
  overflowY: "auto",
}));

const SectionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
  },
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.primary.light,
  borderRadius: 8,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    transition: "all 0.3s ease",
    "&:hover": {
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.primary.main,
      },
    },
    "&.Mui-focused": {
      "& .MuiOutlinedInput-notchedOutline": {
        borderWidth: 2,
      },
    },
  },
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  width: "100%",
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    transition: "all 0.3s ease",
    "&:hover": {
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.primary.main,
      },
    },
    "&.Mui-focused": {
      "& .MuiOutlinedInput-notchedOutline": {
        borderWidth: 2,
      },
    },
  },
  "& .MuiSelect-select": {
    minWidth: "200px",
  },
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`incubatee-tabpanel-${index}`}
    aria-labelledby={`incubatee-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

// Validation functions (unchanged)
const validateGST = (gst) => {
  const gstPattern =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstPattern.test(gst.toUpperCase());
};

const validatePAN = (pan) => {
  const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panPattern.test(pan.toUpperCase());
};

const validateCIN = (cin) => {
  const cinPattern = /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
  return cinPattern.test(cin.toUpperCase());
};

const validateUAN = (uan) => {
  const uanPattern = /^[0-9]{12}$/;
  return uanPattern.test(uan);
};

const validateEmail = (email) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

// Debounce function to limit API calls
const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

const IncubateeForm = ({
  open,
  onClose,
  onSave,
  editIncubatee,
  fieldOfWorkOptions,
  stageLevelOptions,
}) => {
  // State declarations
  const userId = sessionStorage.getItem("userid");
  const incUserid = sessionStorage.getItem("incuserid");

  const [formData, setFormData] = useState({
    incubateesfieldofwork: "",
    incubateesstagelevel: "",
    incubateesname: "",
    incubateesemail: "",
    incubateesshortname: "",
    incubateestotalshare: "",
    incubateesshareperprice: "",
    incubateescin: "",
    incubateesdin: "",
    incubateesgst: "",
    incubateesgstregdate: "",
    incubateesdpiitnumber: "",
    incubateeslogopath: "",
    incubateesdurationofextension: "",
    incubateesaddress: "",
    incubateesincubatorname: "",
    incubateesincubatoremail: "",
    incubateesincubatorphone: "",
    incubateespannumber: "",
    incubateesuan: "",
    incubateesnooffounders: "",
    incubateesaccountantname: "",
    incubateesauditorname: "",
    incubateessecretaryname: "",
    incubateesadminstate: 0,
    incubateesfoundername: "",
    incubateesdateofincubation: "",
    incubateesdateofincorporation: "",
    incubateesdateofextension: "",
    incubateeswebsite: "",
    incubateesincrecid: "",
    incubateescreatedtime: "",
    incubateesmodifiedtime: "",
    incubateescreatedby: "",
    incubateesmodifiedby: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [checkingUniqueness, setCheckingUniqueness] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [uniquenessErrors, setUniquenessErrors] = useState({});

  // Initialize form data when editIncubatee changes
  useEffect(() => {
    if (editIncubatee) {
      setFormData({
        incubateesfieldofwork: editIncubatee.incubateesfieldofwork || "",
        incubateesstagelevel: editIncubatee.incubateesstagelevel || "",
        incubateesname: editIncubatee.incubateesname || "",
        incubateesemail: editIncubatee.incubateesemail || "",
        incubateesshortname: editIncubatee.incubateesshortname || "",
        incubateestotalshare: editIncubatee.incubateestotalshare || "",
        incubateesshareperprice: editIncubatee.incubateesshareperprice || "",
        incubateescin: editIncubatee.incubateescin || "",
        incubateesdin: editIncubatee.incubateesdin || "",
        incubateesgst: editIncubatee.incubateesgst || "",
        incubateesgstregdate: editIncubatee.incubateesgstregdate || "",
        incubateesdpiitnumber: editIncubatee.incubateesdpiitnumber || "",
        incubateeslogopath: editIncubatee.incubateeslogopath || "",
        incubateesdurationofextension:
          editIncubatee.incubateesdurationofextension || "",
        incubateesaddress: editIncubatee.incubateesaddress || "",
        incubateesincubatorname: editIncubatee.incubateesincubatorname || "",
        incubateesincubatoremail: editIncubatee.incubateesincubatoremail || "",
        incubateesincubatorphone: editIncubatee.incubateesincubatorphone || "",
        incubateespannumber: editIncubatee.incubateespannumber || "",
        incubateesuan: editIncubatee.incubateesuan || "",
        incubateesnooffounders: editIncubatee.incubateesnooffounders || "",
        incubateesaccountantname: editIncubatee.incubateesaccountantname || "",
        incubateesauditorname: editIncubatee.incubateesauditorname || "",
        incubateessecretaryname: editIncubatee.incubateessecretaryname || "",
        incubateesadminstate: editIncubatee.incubateesadminstate || 0,
        incubateesfoundername: editIncubatee.incubateesfoundername || "",
        incubateesdateofincubation:
          editIncubatee.incubateesdateofincubation || "",
        incubateesdateofincorporation:
          editIncubatee.incubateesdateofincorporation || "",
        incubateesdateofextension:
          editIncubatee.incubateesdateofextension || "",
        incubateeswebsite: editIncubatee.incubateeswebsite || "",
        incubateesincrecid: editIncubatee.incubateesincrecid || "",
        incubateescreatedtime:
          editIncubatee.incubateescreatedtime ||
          new Date().toISOString().split("T")[0],
        incubateesmodifiedtime: new Date().toISOString().split("T")[0],
        incubateescreatedby: editIncubatee.incubateescreatedby || userId || 1,
        incubateesmodifiedby: userId || 1,
      });
    } else {
      setFormData({
        incubateesfieldofwork: "",
        incubateesstagelevel: "",
        incubateesname: "",
        incubateesemail: "",
        incubateesshortname: "",
        incubateestotalshare: "",
        incubateesshareperprice: "",
        incubateescin: "",
        incubateesdin: "",
        incubateesgst: "",
        incubateesgstregdate: "",
        incubateesdpiitnumber: "",
        incubateeslogopath: "",
        incubateesdurationofextension: "",
        incubateesaddress: "",
        incubateesincubatorname: "",
        incubateesincubatoremail: "",
        incubateesincubatorphone: "",
        incubateespannumber: "",
        incubateesuan: "",
        incubateesnooffounders: "",
        incubateesaccountantname: "",
        incubateesauditorname: "",
        incubateessecretaryname: "",
        incubateesadminstate: 0,
        incubateesfoundername: "",
        incubateesdateofincubation: "",
        incubateesdateofincorporation: "",
        incubateesdateofextension: "",
        incubateeswebsite: "",
        incubateesincrecid: "",
        incubateescreatedtime: new Date().toISOString().split("T")[0],
        incubateesmodifiedtime: new Date().toISOString().split("T")[0],
        incubateescreatedby: userId || 1,
        incubateesmodifiedby: userId || 1,
      });
    }
    setTabValue(0);
    setFormErrors({});
    setTouchedFields({});
    setUniquenessErrors({});
  }, [editIncubatee, userId]);

  // Check uniqueness API call - FIXED VERSION
  const checkUniqueness = useCallback(
    async (fieldName, value) => {
      if (!value || value.trim() === "") {
        return;
      }

      // Skip checking if we're in edit mode and the value hasn't changed
      if (editIncubatee && editIncubatee[`incubatees${fieldName}`] === value) {
        return;
      }

      setCheckingUniqueness((prev) => ({ ...prev, [fieldName]: true }));

      try {
        // Use the correct endpoint as specified by the user
        const response = await api.post(
          "/resources/generic/check-incubatee-unique",
          {
            email: fieldName === "email" ? value : "",
            incubatorphone: fieldName === "incubatorphone" ? value : "",
            shortname: fieldName === "shortname" ? value : "",
            cin: fieldName === "cin" ? value : "",
            din: fieldName === "din" ? value : "",
            pan: fieldName === "pan" ? value : "",
            uan: fieldName === "uan" ? value : "",
          },
          {
            headers: {
              "X-Module": "Incubatee Management",
              "X-Action": "Check Uniqueness",
            },
          },
        );

        console.log("Uniqueness check response:", response.data); // Debug log

        // Handle the response based on its actual structure
        if (response.data && response.data.data) {
          // Check if the specific field is unique
          const isUnique = response.data.data[fieldName] === true;

          if (!isUnique) {
            setUniquenessErrors((prev) => ({
              ...prev,
              [`incubatees${fieldName}`]: `This ${fieldName} already exists`,
            }));
            setFormErrors((prev) => ({
              ...prev,
              [`incubatees${fieldName}`]: `This ${fieldName} already exists`,
            }));
          } else {
            // Clear the error if it's unique
            setUniquenessErrors((prev) => ({
              ...prev,
              [`incubatees${fieldName}`]: "",
            }));
            // Only clear the form error if it's a uniqueness error
            if (
              formErrors[`incubatees${fieldName}`] ===
              `This ${fieldName} already exists`
            ) {
              setFormErrors((prev) => ({
                ...prev,
                [`incubatees${fieldName}`]: "",
              }));
            }
          }
        } else if (response.data && response.data.statusCode === 200) {
          // Alternative response format handling
          const isUnique =
            response.data.message && response.data.message.includes("unique");

          if (!isUnique) {
            setUniquenessErrors((prev) => ({
              ...prev,
              [`incubatees${fieldName}`]: `This ${fieldName} already exists`,
            }));
            setFormErrors((prev) => ({
              ...prev,
              [`incubatees${fieldName}`]: `This ${fieldName} already exists`,
            }));
          } else {
            // Clear the error if it's unique
            setUniquenessErrors((prev) => ({
              ...prev,
              [`incubatees${fieldName}`]: "",
            }));
            // Only clear the form error if it's a uniqueness error
            if (
              formErrors[`incubatees${fieldName}`] ===
              `This ${fieldName} already exists`
            ) {
              setFormErrors((prev) => ({
                ...prev,
                [`incubatees${fieldName}`]: "",
              }));
            }
          }
        }
      } catch (err) {
        console.error(`Error checking uniqueness for ${fieldName}:`, err);
        // Log the full error response for debugging
        if (err.response) {
          console.error("Error response data:", err.response.data);
        }
      } finally {
        setCheckingUniqueness((prev) => ({ ...prev, [fieldName]: false }));
      }
    },
    [editIncubatee, formErrors],
  );

  // Debounced version of checkUniqueness to avoid too many API calls
  const debouncedCheckUniqueness = useMemo(
    () =>
      debounce((fieldName, value) => {
        checkUniqueness(fieldName, value);
      }, 500),
    [checkUniqueness],
  );

  // Validate a single field
  const validateField = useCallback(
    (name, value) => {
      let error = "";

      switch (name) {
        case "incubateesname":
          if (!value.trim()) {
            error = "Incubatee name is required";
          }
          break;
        case "incubateesemail":
          if (!value.trim()) {
            error = "Email is required";
          } else if (!validateEmail(value)) {
            error = "Please enter a valid email address";
          }
          break;
        case "incubateesgst":
          if (value && !validateGST(value)) {
            error = "Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)";
          }
          break;
        case "incubateespannumber":
          if (value && !validatePAN(value)) {
            error = "Please enter a valid PAN number (e.g., ABCDE1234F)";
          }
          break;
        case "incubateescin":
          if (value && !validateCIN(value)) {
            error =
              "Please enter a valid CIN number (e.g., U74140DL2014PTC272828)";
          }
          break;
        case "incubateesuan":
          if (value && !validateUAN(value)) {
            error = "Please enter a valid 12-digit UAN number";
          }
          break;
        case "incubateesincubatoremail":
          if (value && !validateEmail(value)) {
            error = "Please enter a valid incubator email address";
          }
          break;
        default:
          break;
      }

      // Don't overwrite uniqueness errors
      if (!uniquenessErrors[name]) {
        setFormErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
    },
    [uniquenessErrors],
  );

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;

      // Handle checkbox/toggle differently
      if (type === "checkbox") {
        setFormData((prev) => ({ ...prev, [name]: checked ? 1 : 0 }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }

      // Mark field as touched
      setTouchedFields((prev) => ({ ...prev, [name]: true }));

      // Clear error for this field when user starts typing (unless it's a uniqueness error)
      if (formErrors[name] && !uniquenessErrors[name]) {
        setFormErrors((prev) => ({ ...prev, [name]: "" }));
      }

      // Check uniqueness for specific fields on change (debounced)
      if (
        [
          "incubateesemail",
          "incubateesincubatorphone",
          "incubateesshortname",
          "incubateescin",
          "incubateesdin",
          "incubateespannumber",
          "incubateesuan",
        ].includes(name)
      ) {
        // Map form field names to API field names
        const fieldNameMap = {
          incubateesemail: "email",
          incubateesincubatorphone: "incubatorphone",
          incubateesshortname: "shortname",
          incubateescin: "cin",
          incubateesdin: "din",
          incubateespannumber: "pan",
          incubateesuan: "uan",
        };

        // Check if the field passes format validation before checking uniqueness
        let isValidFormat = true;

        if (name === "incubateesemail" && !validateEmail(value)) {
          isValidFormat = false;
        } else if (name === "incubateescin" && value && !validateCIN(value)) {
          isValidFormat = false;
        } else if (
          name === "incubateespannumber" &&
          value &&
          !validatePAN(value)
        ) {
          isValidFormat = false;
        } else if (name === "incubateesuan" && value && !validateUAN(value)) {
          isValidFormat = false;
        }

        // Only check uniqueness if the format is valid
        if (isValidFormat) {
          debouncedCheckUniqueness(fieldNameMap[name], value);
        }
      }

      // Validate other fields
      validateField(name, value);
    },
    [formErrors, uniquenessErrors, debouncedCheckUniqueness, validateField],
  );

  // Handle field blur for validation and uniqueness checking
  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;

      // Mark field as touched
      setTouchedFields((prev) => ({ ...prev, [name]: true }));

      // Validate the field
      validateField(name, value);

      // Check uniqueness for specific fields on blur (immediate)
      if (
        [
          "incubateesemail",
          "incubateesincubatorphone",
          "incubateesshortname",
          "incubateescin",
          "incubateesdin",
          "incubateespannumber",
          "incubateesuan",
        ].includes(name)
      ) {
        // Map form field names to API field names
        const fieldNameMap = {
          incubateesemail: "email",
          incubateesincubatorphone: "incubatorphone",
          incubateesshortname: "shortname",
          incubateescin: "cin",
          incubateesdin: "din",
          incubateespannumber: "pan",
          incubateesuan: "uan",
        };

        // Check if the field passes format validation before checking uniqueness
        let isValidFormat = true;

        if (name === "incubateesemail" && !validateEmail(value)) {
          isValidFormat = false;
        } else if (name === "incubateescin" && value && !validateCIN(value)) {
          isValidFormat = false;
        } else if (
          name === "incubateespannumber" &&
          value &&
          !validatePAN(value)
        ) {
          isValidFormat = false;
        } else if (name === "incubateesuan" && value && !validateUAN(value)) {
          isValidFormat = false;
        }

        // Only check uniqueness if the format is valid
        if (isValidFormat) {
          checkUniqueness(fieldNameMap[name], value);
        }
      }
    },
    [validateField, checkUniqueness],
  );

  const handleTabChange = useCallback((event, newValue) => {
    setTabValue(newValue);
  }, []);

  // Get fields for each tab
  const getTabFields = useCallback((tabIndex) => {
    switch (tabIndex) {
      case 0: // Basic Info
        return [
          "incubateesname",
          "incubateesemail",
          "incubateesshortname",
          "incubateesfoundername",
          "incubateesaddress",
          "incubateeswebsite",
        ];
      case 1: // Legal & Financial
        return [
          "incubateescin",
          "incubateesdin",
          "incubateesgst",
          "incubateesgstregdate",
          "incubateesdpiitnumber",
          "incubateespannumber",
          "incubateesuan",
          "incubateestotalshare",
          "incubateesshareperprice",
          "incubateesnooffounders",
        ];
      case 2: // Incubation Details
        return [
          "incubateesdateofincubation",
          "incubateesdateofincorporation",
          "incubateesdurationofextension",
          "incubateesdateofextension",
          "incubateesincubatorname",
          "incubateesincubatoremail",
          "incubateesincubatorphone",
        ];
      case 3: // Additional Info
        return [
          "incubateesaccountantname",
          "incubateesauditorname",
          "incubateessecretaryname",
          "incubateeslogopath",
          "incubateesincrecid",
          "incubateescreatedtime",
          "incubateesmodifiedtime",
        ];
      default:
        return [];
    }
  }, []);

  const handleNextTab = useCallback(() => {
    // Get all fields in current tab
    const currentTabFields = getTabFields(tabValue);
    let hasErrors = false;

    // Validate all fields in current tab
    currentTabFields.forEach((fieldName) => {
      validateField(fieldName, formData[fieldName]);
      if (formErrors[fieldName] || uniquenessErrors[fieldName]) {
        hasErrors = true;
      }
    });

    if (!hasErrors && tabValue < 3) {
      setTabValue(tabValue + 1);
    } else if (hasErrors) {
      // Instead of showing a popup, just scroll to the first error field
      const firstErrorField = currentTabFields.find(
        (fieldName) => formErrors[fieldName] || uniquenessErrors[fieldName],
      );

      if (firstErrorField) {
        const element = document.getElementsByName(firstErrorField)[0];
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }
    }
  }, [
    tabValue,
    getTabFields,
    validateField,
    formData,
    formErrors,
    uniquenessErrors,
  ]);

  const handlePrevTab = useCallback(() => {
    if (tabValue > 0) {
      setTabValue(tabValue - 1);
    }
  }, [tabValue]);

  // Validate form
  const validateForm = useCallback(() => {
    const errors = {};

    // Required fields
    if (!formData.incubateesname.trim()) {
      errors.incubateesname = "Incubatee name is required";
    }

    if (!formData.incubateesemail.trim()) {
      errors.incubateesemail = "Email is required";
    } else if (!validateEmail(formData.incubateesemail)) {
      errors.incubateesemail = "Please enter a valid email address";
    }

    // Field validations
    if (formData.incubateesgst && !validateGST(formData.incubateesgst)) {
      errors.incubateesgst =
        "Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)";
    }

    if (
      formData.incubateespannumber &&
      !validatePAN(formData.incubateespannumber)
    ) {
      errors.incubateespannumber =
        "Please enter a valid PAN number (e.g., ABCDE1234F)";
    }

    if (formData.incubateescin && !validateCIN(formData.incubateescin)) {
      errors.incubateescin =
        "Please enter a valid CIN number (e.g., U74140DL2014PTC272828)";
    }

    if (formData.incubateesuan && !validateUAN(formData.incubateesuan)) {
      errors.incubateesuan = "Please enter a valid 12-digit UAN number";
    }

    if (
      formData.incubateesincubatoremail &&
      !validateEmail(formData.incubateesincubatoremail)
    ) {
      errors.incubateesincubatoremail =
        "Please enter a valid incubator email address";
    }

    // Include uniqueness errors
    Object.keys(uniquenessErrors).forEach((key) => {
      if (uniquenessErrors[key]) {
        errors[key] = uniquenessErrors[key];
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, uniquenessErrors]);

  // Handle Submit (Add/Edit)
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      // Check if any uniqueness checks are still in progress
      const isCheckingUniqueness = Object.values(checkingUniqueness).some(
        (checking) => checking,
      );

      if (isCheckingUniqueness) {
        Swal.fire({
          icon: "warning",
          title: "Please Wait",
          text: "Please wait for uniqueness checks to complete",
        });
        return;
      }

      // Validate form before submission
      if (!validateForm()) {
        // Find the first error field and scroll to it
        const firstErrorField = Object.keys(formErrors).find(
          (key) => formErrors[key],
        );

        if (firstErrorField) {
          const element = document.getElementsByName(firstErrorField)[0];
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.focus();
          }
        }
        return;
      }

      // Check for uniqueness errors
      const hasUniquenessErrors = Object.values(uniquenessErrors).some(
        (error) => error,
      );

      if (hasUniquenessErrors) {
        // Find the first uniqueness error field and scroll to it
        const firstUniquenessErrorField = Object.keys(uniquenessErrors).find(
          (key) => uniquenessErrors[key],
        );

        if (firstUniquenessErrorField) {
          const element = document.getElementsByName(
            firstUniquenessErrorField,
          )[0];
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.focus();
          }
        }
        return;
      }

      setIsSaving(true);

      const isEdit = !!editIncubatee;
      const endpoint = isEdit ? "/updateIncubatee" : "/addIncubatee";
      const module = "Incubatee Management";
      const action = isEdit ? "Update Incubatee" : "Add Incubatee";

      api
        .post(
          endpoint,
          {},
          {
            params: {
              ...(isEdit && { incubateesrecid: editIncubatee.incubateesrecid }),
              incubateesfieldofwork: formData.incubateesfieldofwork,
              incubateesstagelevel: formData.incubateesstagelevel,
              incubateesname: formData.incubateesname.trim(),
              incubateesemail: formData.incubateesemail.trim(),
              incubateesshortname: formData.incubateesshortname.trim(),
              incubateestotalshare: formData.incubateestotalshare,
              incubateesshareperprice: formData.incubateesshareperprice,
              incubateescin: formData.incubateescin.trim(),
              incubateesdin: formData.incubateesdin.trim(),
              incubateesgst: formData.incubateesgst.trim(),
              incubateesgstregdate: formData.incubateesgstregdate,
              incubateesdpiitnumber: formData.incubateesdpiitnumber.trim(),
              incubateeslogopath: formData.incubateeslogopath.trim(),
              incubateesdurationofextension:
                formData.incubateesdurationofextension,
              incubateesaddress: formData.incubateesaddress.trim(),
              incubateesincubatorname: formData.incubateesincubatorname.trim(),
              incubateesincubatoremail:
                formData.incubateesincubatoremail.trim(),
              incubateesincubatorphone:
                formData.incubateesincubatorphone.trim(),
              incubateespannumber: formData.incubateespannumber.trim(),
              incubateesuan: formData.incubateesuan.trim(),
              incubateesnooffounders: formData.incubateesnooffounders,
              incubateesaccountantname:
                formData.incubateesaccountantname.trim(),
              incubateesauditorname: formData.incubateesauditorname.trim(),
              incubateessecretaryname: formData.incubateessecretaryname.trim(),
              incubateesadminstate: formData.incubateesadminstate,
              incubateesfoundername: formData.incubateesfoundername.trim(),
              incubateesdateofincubation: formData.incubateesdateofincubation,
              incubateesdateofincorporation:
                formData.incubateesdateofincorporation,
              incubateesdateofextension: formData.incubateesdateofextension,
              incubateeswebsite: formData.incubateeswebsite,
              incubateesincrecid: formData.incubateesincrecid,
              incubateescreatedtime: formData.incubateescreatedtime,
              incubateesmodifiedtime: formData.incubateesmodifiedtime,
              incubateescreatedby: formData.incubateescreatedby,
              incubateesmodifiedby: formData.incubateesmodifiedby,
            },
            headers: {
              "X-Module": module,
              "X-Action": action,
            },
          },
        )
        .then((response) => {
          if (response.data.statusCode === 200) {
            Swal.fire(
              "Success",
              response.data.message || "Incubatee saved successfully!",
              "success",
            );
            onSave();
          } else {
            throw new Error(
              response.data.message ||
                `Operation failed with status: ${response.data.statusCode}`,
            );
          }
        })
        .catch((err) => {
          console.error("Error saving incubatee:", err);
          Swal.fire(
            "Error",
            `Failed to save incubatee: ${err.message}`,
            "error",
          );
        })
        .finally(() => setIsSaving(false));
    },
    [
      editIncubatee,
      formData,
      checkingUniqueness,
      uniquenessErrors,
      validateForm,
      onSave,
      formErrors,
    ],
  );

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {editIncubatee ? "Edit Incubatee" : "Add New Incubatee"}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
            color: (theme) => theme.palette.grey[500],
          }}
          disabled={isSaving}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <StyledDialogContent>
          <AppBar position="static" color="default" elevation={0}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              sx={{ borderBottom: "1px solid #e0e0e0" }}
            >
              <Tab
                icon={<BusinessIcon />}
                label="Basic Info"
                iconPosition="start"
              />
              <Tab
                icon={<PersonIcon />}
                label="Legal & Financial"
                iconPosition="start"
              />
              <Tab
                icon={<DescriptionIcon />}
                label="Incubation Details"
                iconPosition="start"
              />
              <Tab
                icon={<SettingsIcon />}
                label="Additional Info"
                iconPosition="start"
              />
            </Tabs>
          </AppBar>

          <TabPanel value={tabValue} index={0}>
            <SectionCard>
              <CardContent>
                <SectionHeader>
                  <BusinessIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Basic Information
                  </Typography>
                </SectionHeader>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Incubatee Name"
                      name="incubateesname"
                      value={formData.incubateesname}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      disabled={isSaving}
                      variant="outlined"
                      error={
                        !!formErrors.incubateesname &&
                        touchedFields.incubateesname
                      }
                      helperText={
                        touchedFields.incubateesname &&
                        formErrors.incubateesname
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Email"
                      name="incubateesemail"
                      type="email"
                      value={formData.incubateesemail}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      disabled={isSaving}
                      variant="outlined"
                      error={
                        !!formErrors.incubateesemail &&
                        touchedFields.incubateesemail
                      }
                      helperText={
                        touchedFields.incubateesemail &&
                        formErrors.incubateesemail
                      }
                      InputProps={{
                        endAdornment: checkingUniqueness.email ? (
                          <CircularProgress size={20} />
                        ) : null,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Short Name"
                      name="incubateesshortname"
                      value={formData.incubateesshortname}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                      error={
                        !!formErrors.incubateesshortname &&
                        touchedFields.incubateesshortname
                      }
                      helperText={
                        touchedFields.incubateesshortname &&
                        formErrors.incubateesshortname
                      }
                      InputProps={{
                        endAdornment: checkingUniqueness.shortname ? (
                          <CircularProgress size={20} />
                        ) : null,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledFormControl
                      fullWidth
                      variant="outlined"
                      disabled={isSaving}
                    >
                      <InputLabel id="field-of-work-label">
                        Field of Work
                      </InputLabel>
                      <Select
                        labelId="field-of-work-label"
                        id="incubateesfieldofwork"
                        name="incubateesfieldofwork"
                        value={formData.incubateesfieldofwork}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        label="Field of Work"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300,
                            },
                          },
                        }}
                      >
                        {fieldOfWorkOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.text}
                          </MenuItem>
                        ))}
                      </Select>
                    </StyledFormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledFormControl
                      fullWidth
                      variant="outlined"
                      disabled={isSaving}
                    >
                      <InputLabel id="stage-level-label">
                        Stage Level
                      </InputLabel>
                      <Select
                        labelId="stage-level-label"
                        id="incubateesstagelevel"
                        name="incubateesstagelevel"
                        value={formData.incubateesstagelevel}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        label="Stage Level"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300,
                            },
                          },
                        }}
                      >
                        {stageLevelOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.text}
                          </MenuItem>
                        ))}
                      </Select>
                    </StyledFormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Founder Name"
                      name="incubateesfoundername"
                      value={formData.incubateesfoundername}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <StyledTextField
                      fullWidth
                      label="Address"
                      name="incubateesaddress"
                      value={formData.incubateesaddress}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <StyledTextField
                      fullWidth
                      label="Website"
                      name="incubateeswebsite"
                      value={formData.incubateeswebsite}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                      placeholder="https://example.com"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </SectionCard>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleNextTab}
                sx={{ minWidth: 120 }}
              >
                Next
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <SectionCard>
              <CardContent>
                <SectionHeader>
                  <DescriptionIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Legal & Financial Information
                  </Typography>
                </SectionHeader>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="CIN"
                      name="incubateescin"
                      value={formData.incubateescin}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                      error={
                        !!formErrors.incubateescin &&
                        touchedFields.incubateescin
                      }
                      helperText={
                        (touchedFields.incubateescin &&
                          formErrors.incubateescin) ||
                        "Format: U74140DL2014PTC272828"
                      }
                      InputProps={{
                        endAdornment: checkingUniqueness.cin ? (
                          <CircularProgress size={20} />
                        ) : null,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="DIN"
                      name="incubateesdin"
                      value={formData.incubateesdin}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                      error={
                        !!formErrors.incubateesdin &&
                        touchedFields.incubateesdin
                      }
                      helperText={
                        touchedFields.incubateesdin && formErrors.incubateesdin
                      }
                      InputProps={{
                        endAdornment: checkingUniqueness.din ? (
                          <CircularProgress size={20} />
                        ) : null,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="GST"
                      name="incubateesgst"
                      value={formData.incubateesgst}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                      error={
                        !!formErrors.incubateesgst &&
                        touchedFields.incubateesgst
                      }
                      helperText={
                        (touchedFields.incubateesgst &&
                          formErrors.incubateesgst) ||
                        "Format: 22AAAAA0000A1Z5"
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="GST Registration Date"
                      name="incubateesgstregdate"
                      type="date"
                      value={formData.incubateesgstregdate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="DPIIT Number"
                      name="incubateesdpiitnumber"
                      value={formData.incubateesdpiitnumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="PAN Number"
                      name="incubateespannumber"
                      value={formData.incubateespannumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                      error={
                        !!formErrors.incubateespannumber &&
                        touchedFields.incubateespannumber
                      }
                      helperText={
                        (touchedFields.incubateespannumber &&
                          formErrors.incubateespannumber) ||
                        "Format: ABCDE1234F"
                      }
                      InputProps={{
                        endAdornment: checkingUniqueness.pan ? (
                          <CircularProgress size={20} />
                        ) : null,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="UAN"
                      name="incubateesuan"
                      value={formData.incubateesuan}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                      error={
                        !!formErrors.incubateesuan &&
                        touchedFields.incubateesuan
                      }
                      helperText={
                        (touchedFields.incubateesuan &&
                          formErrors.incubateesuan) ||
                        "12-digit number"
                      }
                      InputProps={{
                        endAdornment: checkingUniqueness.uan ? (
                          <CircularProgress size={20} />
                        ) : null,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Total Share"
                      name="incubateestotalshare"
                      type="number"
                      value={formData.incubateestotalshare}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Share Per Price"
                      name="incubateesshareperprice"
                      type="number"
                      value={formData.incubateesshareperprice}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Number of Founders"
                      name="incubateesnooffounders"
                      type="number"
                      value={formData.incubateesnooffounders}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </SectionCard>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}
            >
              <Button
                variant="outlined"
                onClick={handlePrevTab}
                sx={{ minWidth: 120 }}
              >
                Previous
              </Button>
              <Button
                variant="contained"
                onClick={handleNextTab}
                sx={{ minWidth: 120 }}
              >
                Next
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <SectionCard>
              <CardContent>
                <SectionHeader>
                  <PersonIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Incubation Details
                  </Typography>
                </SectionHeader>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Date of Incubation"
                      name="incubateesdateofincubation"
                      type="date"
                      value={formData.incubateesdateofincubation}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Date of Incorporation"
                      name="incubateesdateofincorporation"
                      type="date"
                      value={formData.incubateesdateofincorporation}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Duration of Extension (months)"
                      name="incubateesdurationofextension"
                      type="number"
                      value={formData.incubateesdurationofextension}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Date of Extension"
                      name="incubateesdateofextension"
                      type="date"
                      value={formData.incubateesdateofextension}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Incubator Name"
                      name="incubateesincubatorname"
                      value={formData.incubateesincubatorname}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Incubator Email"
                      name="incubateesincubatoremail"
                      type="email"
                      value={formData.incubateesincubatoremail}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                      error={
                        !!formErrors.incubateesincubatoremail &&
                        touchedFields.incubateesincubatoremail
                      }
                      helperText={
                        touchedFields.incubateesincubatoremail &&
                        formErrors.incubateesincubatoremail
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Incubator Phone"
                      name="incubateesincubatorphone"
                      value={formData.incubateesincubatorphone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                      error={
                        !!formErrors.incubateesincubatorphone &&
                        touchedFields.incubateesincubatorphone
                      }
                      helperText={
                        touchedFields.incubateesincubatorphone &&
                        formErrors.incubateesincubatorphone
                      }
                      InputProps={{
                        endAdornment: checkingUniqueness.incubatorphone ? (
                          <CircularProgress size={20} />
                        ) : null,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.incubateesadminstate === 1}
                            onChange={handleChange}
                            name="incubateesadminstate"
                            color="primary"
                            disabled={isSaving}
                          />
                        }
                        label="Admin State"
                      />
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        {formData.incubateesadminstate === 1
                          ? "Active"
                          : "Inactive"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </SectionCard>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}
            >
              <Button
                variant="outlined"
                onClick={handlePrevTab}
                sx={{ minWidth: 120 }}
              >
                Previous
              </Button>
              <Button
                variant="contained"
                onClick={handleNextTab}
                sx={{ minWidth: 120 }}
              >
                Next
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <SectionCard>
              <CardContent>
                <SectionHeader>
                  <SettingsIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Additional Information
                  </Typography>
                </SectionHeader>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Accountant Name"
                      name="incubateesaccountantname"
                      value={formData.incubateesaccountantname}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Auditor Name"
                      name="incubateesauditorname"
                      value={formData.incubateesauditorname}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Secretary Name"
                      name="incubateessecretaryname"
                      value={formData.incubateessecretaryname}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Logo Path"
                      name="incubateeslogopath"
                      value={formData.incubateeslogopath}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Incubatee Rec ID"
                      name="incubateesincrecid"
                      value={formData.incubateesincrecid}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Created Time"
                      name="incubateescreatedtime"
                      type="date"
                      value={formData.incubateescreatedtime}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Modified Time"
                      name="incubateesmodifiedtime"
                      type="date"
                      value={formData.incubateesmodifiedtime}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isSaving}
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </SectionCard>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}
            >
              <Button
                variant="outlined"
                onClick={handlePrevTab}
                sx={{ minWidth: 120 }}
              >
                Previous
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSaving}
                startIcon={isSaving ? <CircularProgress size={20} /> : null}
                sx={{ minWidth: 120 }}
              >
                {editIncubatee ? "Update" : "Save"}
              </Button>
            </Box>
          </TabPanel>
        </StyledDialogContent>
      </form>
    </StyledDialog>
  );
};

IncubateeForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  editIncubatee: PropTypes.object,
  fieldOfWorkOptions: PropTypes.array.isRequired,
  stageLevelOptions: PropTypes.array.isRequired,
};

export default React.memo(IncubateeForm);
