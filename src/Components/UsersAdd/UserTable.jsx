import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { FaTrash, FaEdit, FaPlus, FaSpinner } from "react-icons/fa";
import { Download } from "lucide-react";
import { FaFilter, FaTimes } from "react-icons/fa"; // Added this import
import "./UserTable.css";
import { IPAdress } from "../Datafetching/IPAdrees";
import * as XLSX from "xlsx";
import api from "../Datafetching/api";

// Material UI imports
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import {
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Chip,
  CircularProgress,
  Backdrop,
  Tooltip, // Added this import
  Popover, // Added this import
  Card, // Added this import
  CardContent, // Added this import
  CardActions, // Added this import
} from "@mui/material";
import { styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  // height: 600,
  width: "100%",
  marginBottom: theme.spacing(2),
}));

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
  "&.disabled": {
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.grey[500],
    cursor: "not-allowed",
  },
}));

export default function UserTable() {
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const incUserid = sessionStorage.getItem("incuserid");
  const roleId = sessionStorage.getItem("roleid");
  const IP = IPAdress;
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roles, setRoles] = useState([]);
  const [incubatees, setIncubatees] = useState([]);
  const [incubations, setIncubations] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIncubation, setSelectedIncubation] = useState(null);

  // Pagination state for Material UI
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 5,
  });

  // Column-specific filter states
  const [columnFilters, setColumnFilters] = useState({
    usersname: "",
    usersemail: "",
    usersrolesrecid: "",
    userscreatedtime: "",
    usersmodifiedtime: "",
    userscreatedby: "",
    usersmodifiedby: "",
  });

  // Filter popover states
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filterColumn, setFilterColumn] = useState(null);

  // Loading states for operations
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);

  // Check if XLSX is available
  const isXLSXAvailable = !!XLSX;

  // Define the role IDs that are allowed to select an incubatee
  const INCUBATEE_ROLE_IDS = [4, 5, 6];
  const rolebaseincuserid = roleId === "0" ? 1 : incUserid;

  // Check if current user can select incubation (only when roleId is 0)
  const canSelectIncubation = roleId === "0";

  // Check if incubatee dropdown should be enabled
  const isIncubateeEnabled = selectedIncubation !== null;

  // Function to map role ID to correct role name
  const getRoleName = (roleId) => {
    const roleMap = {
      1: "Incubator admin",
      2: "Incubator manager",
      3: "Incubator operator",
      4: "Incubatee admin",
      5: "Incubatee manager",
      6: "Incubatee operator",
      7: "DDI admin",
      8: "DDI manager",
    };
    return roleMap[roleId] || "Unknown Role";
  };

  // Function to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      // Handle ISO format dates
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr; // Return original if invalid date

      // Format to readable format
      return date
        .toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false, // Use 24-hour format
        })
        .replace(",", ""); // Remove comma between date and time
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateStr; // Return original if error
    }
  };

  // Filter users based on search query and column filters
  const filteredData = useMemo(() => {
    let result = users;

    // Apply search query filter
    if (searchQuery.trim() !== "") {
      result = result.filter((user) =>
        user.usersname.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply column filters
    result = result.filter((user) => {
      // Name filter
      const matchesName =
        !columnFilters.usersname ||
        (user.usersname || "")
          .toLowerCase()
          .includes(columnFilters.usersname.toLowerCase());

      // Email filter
      const matchesEmail =
        !columnFilters.usersemail ||
        (user.usersemail || "")
          .toLowerCase()
          .includes(columnFilters.usersemail.toLowerCase());

      // Role filter
      const matchesRole =
        !columnFilters.usersrolesrecid ||
        getRoleName(user.usersrolesrecid)
          .toLowerCase()
          .includes(columnFilters.usersrolesrecid.toLowerCase());

      // Created time filter
      const matchesCreatedTime =
        !columnFilters.userscreatedtime ||
        formatDate(user.userscreatedtime)
          .toLowerCase()
          .includes(columnFilters.userscreatedtime.toLowerCase());

      // Modified time filter
      const matchesModifiedTime =
        !columnFilters.usersmodifiedtime ||
        formatDate(user.usersmodifiedtime)
          .toLowerCase()
          .includes(columnFilters.usersmodifiedtime.toLowerCase());

      // Created by filter
      const matchesCreatedBy =
        !columnFilters.userscreatedby ||
        (user.userscreatedby || "")
          .toLowerCase()
          .includes(columnFilters.userscreatedby.toLowerCase());

      // Modified by filter
      const matchesModifiedBy =
        !columnFilters.usersmodifiedby ||
        (user.usersmodifiedby || "")
          .toLowerCase()
          .includes(columnFilters.usersmodifiedby.toLowerCase());

      return (
        matchesName &&
        matchesEmail &&
        matchesRole &&
        matchesCreatedTime &&
        matchesModifiedTime &&
        matchesCreatedBy &&
        matchesModifiedBy
      );
    });

    return result;
  }, [users, searchQuery, columnFilters]);

  // Function to clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Function to handle incubation selection
  const handleIncubationSelect = (incubation) => {
    setSelectedIncubation(incubation);
  };

  // Export to CSV function
  const exportToCSV = () => {
    // Create a copy of data for export
    const exportData = filteredData.map((user, index) => ({
      "S.No": index + 1,
      Name: user.usersname || "",
      Email: user.usersemail || "",
      Role: getRoleName(user.usersrolesrecid),
      "Created Time": formatDate(user.userscreatedtime),
      "Modified Time": formatDate(user.usersmodifiedtime),
      "Created By": user.userscreatedby || "",
      "Modified By": user.usersmodifiedby || "",
    }));

    // Convert to CSV
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(","),
      ...exportData.map((row) =>
        headers
          .map((header) => {
            // Handle values that might contain commas
            const value = row[header];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      ),
    ].join("\n");

    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `users_${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel function
  const exportToExcel = () => {
    if (!isXLSXAvailable) {
      console.error("XLSX library not available");
      alert("Excel export is not available. Please install the xlsx package.");
      return;
    }

    try {
      // Create a copy of data for export
      const exportData = filteredData.map((user, index) => ({
        "S.No": index + 1,
        Name: user.usersname || "",
        Email: user.usersemail || "",
        Role: getRoleName(user.usersrolesrecid),
        "Created Time": formatDate(user.userscreatedtime),
        "Modified Time": formatDate(user.usersmodifiedtime),
        "Created By": user.userscreatedby || "",
        "Modified By": user.usersmodifiedby || "",
      }));

      // Create a workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, "Users");

      // Generate the Excel file and download
      XLSX.writeFile(wb, `users_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting to Excel. Falling back to CSV export.");
      exportToCSV();
    }
  };

  // Define columns for DataGrid with filter icons
  const columns = useMemo(
    () => [
      {
        field: "usersname",
        headerName: "Name",
        width: 150,
        sortable: true,
        renderHeader: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography>Name</Typography>
            <Tooltip title="Filter">
              <IconButton
                size="small"
                onClick={(e) => handleFilterClick(e, "usersname")}
                color={columnFilters.usersname ? "primary" : "default"}
              >
                <FaFilter size={14} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "usersemail",
        headerName: "Email",
        width: 230,
        sortable: true,
        renderHeader: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography>Email</Typography>
            <Tooltip title="Filter">
              <IconButton
                size="small"
                onClick={(e) => handleFilterClick(e, "usersemail")}
                color={columnFilters.usersemail ? "primary" : "default"}
              >
                <FaFilter size={14} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "usersrolesrecid",
        headerName: "Role Name",
        width: 180,
        sortable: true,
        renderHeader: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography>Role Name</Typography>
            <Tooltip title="Filter">
              <IconButton
                size="small"
                onClick={(e) => handleFilterClick(e, "usersrolesrecid")}
                color={columnFilters.usersrolesrecid ? "primary" : "default"}
              >
                <FaFilter size={14} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
        valueGetter: (params) => {
          if (!params || !params.row) return "Unknown Role";
          return getRoleName(params.row.usersrolesrecid);
        },
        renderCell: (params) => {
          if (!params || !params.row)
            return <Chip label="Unknown Role" size="small" />;
          return (
            <Chip
              label={getRoleName(params.row.usersrolesrecid)}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        field: "userscreatedtime",
        headerName: "Created Time",
        width: 180,
        sortable: true,
        renderHeader: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography>Created Time</Typography>
            <Tooltip title="Filter">
              <IconButton
                size="small"
                onClick={(e) => handleFilterClick(e, "userscreatedtime")}
                color={columnFilters.userscreatedtime ? "primary" : "default"}
              >
                <FaFilter size={14} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
        valueGetter: (params) => {
          // Keep this for sorting purposes
          if (!params || !params.row) return null;
          return params.row.userscreatedtime
            ? new Date(params.row.userscreatedtime)
            : null;
        },
        renderCell: (params) => {
          // Use this for display
          if (!params || !params.row) return "-";
          return formatDate(params.row.userscreatedtime);
        },
        sortComparator: (v1, v2) => {
          // Custom sort comparator for dates
          const date1 = v1 || new Date(0);
          const date2 = v2 || new Date(0);
          return date1.getTime() - date2.getTime();
        },
      },
      {
        field: "usersmodifiedtime",
        headerName: "Modified Time",
        width: 180,
        sortable: true,
        renderHeader: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography>Modified Time</Typography>
            <Tooltip title="Filter">
              <IconButton
                size="small"
                onClick={(e) => handleFilterClick(e, "usersmodifiedtime")}
                color={columnFilters.usersmodifiedtime ? "primary" : "default"}
              >
                <FaFilter size={14} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
        valueGetter: (params) => {
          // Keep this for sorting purposes
          if (!params || !params.row) return null;
          return params.row.usersmodifiedtime
            ? new Date(params.row.usersmodifiedtime)
            : null;
        },
        renderCell: (params) => {
          // Use this for display
          if (!params || !params.row) return "-";
          return formatDate(params.row.usersmodifiedtime);
        },
        sortComparator: (v1, v2) => {
          // Custom sort comparator for dates
          const date1 = v1 || new Date(0);
          const date2 = v2 || new Date(0);
          return date1.getTime() - date2.getTime();
        },
      },
      {
        field: "userscreatedby",
        headerName: "Created By",
        width: 140,
        sortable: true,
        renderHeader: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography>Created By</Typography>
            <Tooltip title="Filter">
              <IconButton
                size="small"
                onClick={(e) => handleFilterClick(e, "userscreatedby")}
                color={columnFilters.userscreatedby ? "primary" : "default"}
              >
                <FaFilter size={14} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "usersmodifiedby",
        headerName: "Modified By",
        width: 140,
        sortable: true,
        renderHeader: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography>Modified By</Typography>
            <Tooltip title="Filter">
              <IconButton
                size="small"
                onClick={(e) => handleFilterClick(e, "usersmodifiedby")}
                color={columnFilters.usersmodifiedby ? "primary" : "default"}
              >
                <FaFilter size={14} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 150,
        sortable: false,
        renderCell: (params) => {
          if (!params || !params.row) return null;

          const shouldDisableDelete =
            params.row.usersrolesrecid === 4 ||
            params.row.usersrolesrecid === 1;

          return (
            <Box>
              <ActionButton
                color="edit"
                onClick={() => handleEdit(params.row)}
                disabled={
                  isUpdating === params.row.usersrecid ||
                  isDeleting === params.row.usersrecid
                }
                title="Edit"
              >
                {isUpdating === params.row.usersrecid ? (
                  <FaSpinner className="spinner" size={18} />
                ) : (
                  <EditIcon fontSize="small" />
                )}
              </ActionButton>
              <ActionButton
                color="delete"
                onClick={() => handleDelete(params.row)}
                disabled={
                  isDeleting === params.row.usersrecid ||
                  isUpdating === params.row.usersrecid ||
                  shouldDisableDelete
                }
                className={shouldDisableDelete ? "disabled" : ""}
                title={
                  shouldDisableDelete
                    ? "Cannot delete users with role ID 1 or 4"
                    : "Delete"
                }
              >
                {isDeleting === params.row.usersrecid ? (
                  <FaSpinner className="spinner" size={18} />
                ) : (
                  <DeleteIcon fontSize="small" />
                )}
              </ActionButton>
            </Box>
          );
        },
      },
    ],
    [isUpdating, isDeleting, columnFilters, getRoleName]
  );

  // Add unique ID to each row if not present
  const rowsWithId = useMemo(() => {
    return filteredData.map((user, index) => ({
      ...user,
      id: user.usersrecid || `user-${index}`,
    }));
  }, [filteredData]);

  // Filter popover handlers
  const handleFilterClick = (event, column) => {
    setFilterAnchorEl(event.currentTarget);
    setFilterColumn(column);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
    setFilterColumn(null);
  };

  const handleFilterChange = (column, value) => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    setPaginationModel({ ...paginationModel, page: 0 }); // Reset to first page when filtering
  };

  const clearFilter = () => {
    setColumnFilters((prev) => ({
      ...prev,
      [filterColumn]: "",
    }));
  };

  const clearAllFilters = () => {
    setColumnFilters({
      usersname: "",
      usersemail: "",
      usersrolesrecid: "",
      userscreatedtime: "",
      usersmodifiedtime: "",
      userscreatedby: "",
      usersmodifiedby: "",
    });
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  // Check if any column has an active filter
  const hasActiveFilters = Object.values(columnFilters).some(
    (value) => value !== ""
  );

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // The api instance handles:
      // 1. Building the full URL
      // 2. Adding the correct headers (Authorization, userid, X-Module, X-Action)
      // 3. Encrypting the request body into a 'payload'
      const response = await api.post("/resources/generic/getusers", {
        userId: userId || null,
        userIncId: selectedIncubation
          ? selectedIncubation.incubationsrecid
          : incUserid,
      });

      // The response interceptor handles decrypting the payload.
      // 'response.data' is already the parsed, decrypted JSON object.
      if (response.data.statusCode === 200) {
        const userData = response.data.data || [];
        console.log("Fetched users:", userData);
        setUsers(userData);
        setFilteredUsers(userData);
      } else {
        // If the server sends an error message, it will be available here
        throw new Error(response.data.message || "Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      // The error object from axios is detailed. We can get a specific message if available.
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to load users. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch roles for dropdown
  const fetchRoles = async () => {
    try {
      const response = await api.post("/resources/generic/getrolelist", {
        userId: userId || null,
        incUserId: selectedIncubation
          ? selectedIncubation.incubationsrecid
          : incUserid,
      });

      if (response.data.statusCode === 200) {
        // Map the roles to ensure correct display names
        const mappedRoles = (response.data.data || []).map((role) => ({
          ...role,
          text: getRoleName(role.value),
        }));
        setRoles(mappedRoles);
        return mappedRoles;
      } else {
        throw new Error(response.data.message || "Failed to fetch roles");
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to load roles.";
      Swal.fire("❌ Error", errorMessage, "error");
      return [];
    }
  };

  // Fetch incubatees for dropdown
  const fetchIncubatees = async (incubationId = null) => {
    try {
      // Use the provided incubationId or selectedIncubation
      const targetIncubationId =
        incubationId ||
        (selectedIncubation ? selectedIncubation.incubationsrecid : incUserid);

      const response = await api.post("/resources/generic/getinclist", {
        userId: userId || null,
        incUserId: targetIncubationId,
      });

      if (response.data.statusCode === 200) {
        setIncubatees(response.data.data || []);
        return response.data.data || [];
      } else {
        throw new Error(response.data.message || "Failed to fetch incubatees");
      }
    } catch (err) {
      console.error("Error fetching incubatees:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to load incubatees.";
      Swal.fire("❌ Error", errorMessage, "error");
      return [];
    }
  };

  // Fetch incubations for dropdown (only if roleId is 0)
  const fetchIncubations = async () => {
    // If roleId is not 0, we don't need to fetch incubations.
    if (!canSelectIncubation) {
      return Promise.resolve([]);
    }

    try {
      // Corrected URL path - removed the leading "/resources"
      const response = await api.post("/resources/generic/getincubationlist", {
        userId: userId || null,
        userIncId: "ALL", // Use "ALL" to get all incubations
      });

      if (response.data.statusCode === 200) {
        setIncubations(response.data.data || []);
        return response.data.data || [];
      } else {
        throw new Error(response.data.message || "Failed to fetch incubations");
      }
    } catch (err) {
      console.error("Error fetching incubations:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to load incubations.";
      Swal.fire("❌ Error", errorMessage, "error");
      return [];
    }
  };

  // Fetch all required data
  useEffect(() => {
    fetchUsers();
    // Load dropdown data on component mount
    setDropdownsLoading(true);
    Promise.all([fetchRoles(), fetchIncubatees(), fetchIncubations()])
      .then(() => setDropdownsLoading(false))
      .catch(() => setDropdownsLoading(false));
  }, []);

  // Refetch data when selectedIncubation changes
  useEffect(() => {
    // Fetch users and roles when selectedIncubation changes
    fetchUsers();
    fetchRoles();

    // Fetch incubatees only when an incubation is selected
    if (selectedIncubation) {
      setDropdownsLoading(true);
      fetchIncubatees()
        .then(() => setDropdownsLoading(false))
        .catch(() => setDropdownsLoading(false));
    } else {
      // Clear incubatees when no incubation is selected
      setIncubatees([]);
    }
  }, [selectedIncubation]);

  // Delete user
  const handleDelete = (user) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${user.usersname}. This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setIsDeleting(user.usersrecid);
        const deleteUrl = `${IP}/itelinc/deleteUser?usersmodifiedby=${
          userId || "system"
        }&usersrecid=${user.usersrecid}`;

        fetch(deleteUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
            userid: userId || "1",
            "X-Module": "user Management",
            "X-Action": "Delete User",
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.statusCode === 200) {
              Swal.fire(
                "Deleted!",
                `${user.usersname} has been deleted successfully.`,
                "success"
              );
              fetchUsers(); // Refresh user list
            } else {
              throw new Error(data.message || "Failed to delete user");
            }
          })
          .catch((err) => {
            console.error("Error deleting user:", err);
            Swal.fire(
              "Error",
              `Failed to delete ${user.usersname}: ${err.message}`,
              "error"
            );
          })
          .finally(() => {
            setIsDeleting(null);
          });
      }
    });
  };

  const handleAddUser = async () => {
    // Check if dropdown data is loaded, if not, wait for it
    if (
      dropdownsLoading ||
      roles.length === 0 ||
      (canSelectIncubation && incubations.length === 0)
    ) {
      Swal.fire({
        title: "Loading...",
        text: "Please wait while we load required data",
        icon: "info",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
      });

      try {
        await Promise.all([
          fetchRoles(),
          fetchIncubatees(),
          fetchIncubations(),
        ]);
        setDropdownsLoading(false);
        Swal.close();
      } catch (error) {
        Swal.close();
        Swal.fire("❌ Error", "Failed to load dropdown data", "error");
        return;
      }
    }

    // ... (rest of the role/incubation/incubatee HTML generation is fine) ...
    const roleOptions = roles
      .map((role) => `<option value="${role.value}">${role.text}</option>`)
      .join("");
    const incubationOptions = canSelectIncubation
      ? [
          `<option value="" disabled selected>Select incubation</option>`,
          ...incubations.map(
            (incubation) =>
              `<option value="${incubation.incubationsrecid}">${incubation.incubationshortname}</option>`
          ),
        ].join("")
      : "";
    const incubateeOptions = [
      `<option value="" disabled selected>Select incubatee</option>`,
      ...incubatees.map(
        (incubatee) =>
          `<option value="${incubatee.incubateesrecid}">${incubatee.incubateesname}</option>`
      ),
    ].join("");

    // --- CHANGE 1: Await the SweetAlert result ---
    const result = await Swal.fire({
      title: "Add New User",
      html: `
      <div class="swal-form-container">
        <!-- ... (your swal-form HTML is fine) ... -->
        <div class="swal-form-row">
          <input id="swal-name" class="swal2-input" placeholder="Name" required>
        </div>
        <div class="swal-form-row">
          <input id="swal-email" class="swal2-input" placeholder="Email" required>
        </div>
        <div class="swal-form-row">
          <input id="swal-password" type="password" class="swal2-input" placeholder="Password" required>
        </div>
        <div class="swal-form-row">
          <select id="swal-role" class="swal2-select" required>
            <option value="" disabled selected>Select a role</option>
            ${roleOptions}
          </select>
        </div>
        ${
          canSelectIncubation
            ? `
          <div class="swal-form-row">
            <select id="swal-incubation" class="swal2-select" required>
              ${incubationOptions}
            </select>
          </div>
          `
            : ""
        }
        <div class="swal-form-row">
          <select id="swal-incubatee" class="swal2-select" disabled>
            ${incubateeOptions}
          </select>
        </div>
      </div>
    `,
      width: "600px",
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        // ... (your preConfirm logic is fine) ...
        const name = document.getElementById("swal-name");
        const email = document.getElementById("swal-email");
        const password = document.getElementById("swal-password");
        const role = document.getElementById("swal-role");
        const incubation = canSelectIncubation
          ? document.getElementById("swal-incubation")
          : null;
        const incubatee = document.getElementById("swal-incubatee");

        if (
          !name ||
          !email ||
          !password ||
          !role ||
          !incubatee ||
          (canSelectIncubation && !incubation)
        ) {
          Swal.showValidationMessage("Form elements not found");
          return false;
        }

        if (
          !name.value ||
          !email.value ||
          !password.value ||
          !role.value ||
          (canSelectIncubation && !incubation.value)
        ) {
          Swal.showValidationMessage("Please fill all required fields");
          return false;
        }

        return {
          usersname: name.value,
          usersemail: email.value,
          userspassword: password.value,
          usersrolesrecid: role.value,
          usersincubationsrecid: canSelectIncubation
            ? incubation.value
            : selectedIncubation
            ? selectedIncubation.incubationsrecid
            : incUserid,
          usersincubateesrecid: incubatee.value || null,
        };
      },
      didOpen: () => {
        // ... (your didOpen CSS styling is fine) ...
        const style = document.createElement("style");
        style.textContent = `
        .swal-form-container { display: flex; flex-direction: column; gap: 12px; }
        .swal-form-row { width: 100%; }
        .swal2-input, .swal2-select { width: 100% !important; margin: 0 !important; }
        .swal2-select { padding: 0.75em !important; }
        select:disabled { background-color: #f8f9fa; cursor: not-allowed; opacity: 0.8; }
      `;
        document.head.appendChild(style);

        const roleSelect = document.getElementById("swal-role");
        const incubateeSelect = document.getElementById("swal-incubatee");
        const incubationSelect = canSelectIncubation
          ? document.getElementById("swal-incubation")
          : null;

        // --- CHANGE 2: Corrected URL in updateIncubateeOptions ---
        const updateIncubateeOptions = async (incubationId) => {
          incubateeSelect.innerHTML =
            '<option value="" disabled>Loading...</option>';
          try {
            // Corrected URL path from "/resources/generic/getinclist" to "/generic/getinclist"
            const response = await api.post("/generic/getinclist", {
              userId: userId || null,
              incUserId: incubationId,
            });
            if (response.data.statusCode === 200) {
              const options = [
                '<option value="" disabled selected>Select incubatee</option>',
                ...(response.data.data || []).map(
                  (incubatee) =>
                    `<option value="${incubatee.incubateesrecid}">${incubatee.incubateesname}</option>`
                ),
              ].join("");
              incubateeSelect.innerHTML = options;
            } else {
              incubateeSelect.innerHTML =
                '<option value="" disabled>No incubatees found</option>';
            }
          } catch (err) {
            console.error("Error fetching incubatees:", err);
            incubateeSelect.innerHTML =
              '<option value="" disabled>Error loading incubatees</option>';
          }
        };

        const toggleIncubateeDropdown = () => {
          const selectedRole = parseInt(roleSelect.value);
          const shouldEnableIncubatee = canSelectIncubation
            ? incubationSelect && incubationSelect.value !== ""
            : INCUBATEE_ROLE_IDS.includes(selectedRole);

          if (shouldEnableIncubatee) {
            if (canSelectIncubation && incubationSelect) {
              updateIncubateeOptions(incubationSelect.value);
            } else {
              updateIncubateeOptions(incUserid);
            }
            incubateeSelect.disabled = false;
          } else {
            incubateeSelect.disabled = true;
            incubateeSelect.value = "";
          }
        };

        roleSelect.addEventListener("change", toggleIncubateeDropdown);
        if (incubationSelect) {
          incubationSelect.addEventListener("change", () => {
            const selectedRole = parseInt(roleSelect.value);
            if (INCUBATEE_ROLE_IDS.includes(selectedRole)) {
              updateIncubateeOptions(incubationSelect.value);
              incubateeSelect.disabled = false;
            }
          });
        }
        toggleIncubateeDropdown();
      },
    });

    // --- CHANGE 3: Refactored API call using await and try/catch ---
    if (result.isConfirmed && result.value) {
      const formData = result.value;
      setIsAdding(true);

      try {
        // Create a plain object to be sent in the encrypted request body
        const bodyPayload = {
          usersemail: formData.usersemail,
          userspassword: formData.userspassword,
          usersname: formData.usersname,
          usersrolesrecid: formData.usersrolesrecid,
          usersadminstate: "1",
          userscreatedby: userId || "system",
          usersmodifiedby: userId || "system",
          usersincubationsrecid: formData.usersincubationsrecid,
        };

        // Only add incubateesrecid if it's not null or empty
        if (formData.usersincubateesrecid) {
          bodyPayload.usersincubateesrecid = formData.usersincubateesrecid;
        }

        // Use the api instance. It will encrypt the bodyPayload and add all necessary headers.
        const response = await api.post("/addUser", bodyPayload);

        if (response.data.statusCode === 200) {
          Swal.fire("✅ Success", "User added successfully", "success");
          fetchUsers(); // This should also be refactored to use the api instance
        } else {
          Swal.fire(
            "❌ Error",
            response.data.message || "Failed to add user",
            "error"
          );
        }
      } catch (err) {
        console.error("Error adding user:", err);
        const errorMessage =
          err.response?.data?.message || err.message || "Something went wrong";
        Swal.fire("❌ Error", errorMessage, "error");
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleEdit = async (user) => {
    // Check if dropdown data is loaded, if not, wait for it
    if (
      dropdownsLoading ||
      roles.length === 0 ||
      incubatees.length === 0 ||
      (canSelectIncubation && incubations.length === 0)
    ) {
      Swal.fire({
        title: "Loading...",
        text: "Please wait while we load the required data",
        icon: "info",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
      });

      try {
        await Promise.all([
          fetchRoles(),
          fetchIncubatees(),
          fetchIncubations(),
        ]);
        setDropdownsLoading(false);
        Swal.close();
      } catch (error) {
        Swal.close();
        Swal.fire("❌ Error", "Failed to load dropdown data", "error");
        return;
      }
    }

    // ... (rest of the role/incubation/incubatee HTML generation is fine) ...
    const roleOptions = roles
      .map(
        (role) =>
          `<option value="${role.value}" ${
            user.usersrolesrecid == role.value ? "selected" : ""
          }>${role.text}</option>`
      )
      .join("");
    const incubationOptions = canSelectIncubation
      ? [
          `<option value="" ${
            !user.usersincubationsrecid ? "selected" : ""
          }>Select incubation</option>`,
          ...incubations.map(
            (incubation) =>
              `<option value="${incubation.incubationsrecid}" ${
                user.usersincubationsrecid == incubation.incubationsrecid
                  ? "selected"
                  : ""
              }>${incubation.incubationshortname}</option>`
          ),
        ].join("")
      : "";
    const incubateeOptions = [
      `<option value="" ${
        !user.usersincubateesrecid ? "selected" : ""
      }>Select incubatee</option>`,
      ...incubatees.map(
        (incubatee) =>
          `<option value="${incubatee.incubateesrecid}" ${
            user.usersincubateesrecid == incubatee.incubateesrecid
              ? "selected"
              : ""
          }>${incubatee.incubateesname}</option>`
      ),
    ].join("");

    // --- CHANGE 1: Await the SweetAlert result ---
    const result = await Swal.fire({
      title: "Edit User",
      html: `
      <div class="swal-form-container">
        <!-- ... (your swal-form HTML is fine) ... -->
        <div class="swal-form-row">
          <input id="swal-name" class="swal2-input" placeholder="Name" value="${
            user.usersname || ""
          }">
        </div>
        <div class="swal-form-row">
          <input id="swal-email" class="swal2-input" placeholder="Email" value="${
            user.usersemail || ""
          }">
        </div>
        <div class="swal-form-row">
          <input id="swal-password" type="password" class="swal2-input" placeholder="Password" value="${
            user.userspassword || ""
          }" readonly>
        </div>
        <div class="swal-form-row">
          <select id="swal-role" class="swal2-select">
            ${roleOptions}
          </select>
        </div>
        ${
          canSelectIncubation
            ? `
          <div class="swal-form-row">
            <select id="swal-incubation" class="swal2-select">
              ${incubationOptions}
            </select>
          </div>
          `
            : ""
        }
        <div class="swal-form-row">
          <select id="swal-incubatee" class="swal2-select" ${
            !INCUBATEE_ROLE_IDS.includes(parseInt(user.usersrolesrecid))
              ? "disabled"
              : ""
          }>
            ${incubateeOptions}
          </select>
        </div>
      </div>
    `,
      width: "600px",
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        // ... (your preConfirm logic is fine) ...
        const name = document.getElementById("swal-name");
        const email = document.getElementById("swal-email");
        const password = document.getElementById("swal-password");
        const role = document.getElementById("swal-role");
        const incubation = canSelectIncubation
          ? document.getElementById("swal-incubation")
          : null;
        const incubatee = document.getElementById("swal-incubatee");
        if (
          !name ||
          !email ||
          !password ||
          !role ||
          !incubatee ||
          (canSelectIncubation && !incubation)
        ) {
          Swal.showValidationMessage("Form elements not found");
          return false;
        }
        return {
          usersname: name.value,
          usersemail: email.value,
          userspassword: password.value,
          usersrolesrecid: role.value,
          usersincubationsrecid: canSelectIncubation
            ? incubation.value
            : selectedIncubation
            ? selectedIncubation.incubationsrecid
            : incUserid,
          usersincubateesrecid: incubatee.value || null,
        };
      },
      didOpen: () => {
        // ... (your didOpen CSS styling is fine) ...
        const style = document.createElement("style");
        style.textContent = `
        .swal-form-container { display: flex; flex-direction: column; gap: 12px; }
        .swal-form-row { width: 100%; }
        .swal2-input, .swal2-select { width: 100% !important; margin: 0 !important; }
        .swal2-select { padding: 0.75em !important; }
        input[readonly] { background-color: #f8f9fa; cursor: not-allowed; opacity: 0.8; }
        select:disabled { background-color: #f8f9fa; cursor: not-allowed; opacity: 0.8; }
      `;
        document.head.appendChild(style);

        const roleSelect = document.getElementById("swal-role");
        const incubateeSelect = document.getElementById("swal-incubatee");
        const incubationSelect = canSelectIncubation
          ? document.getElementById("swal-incubation")
          : null;

        // --- CHANGE 2: Corrected URL in updateIncubateeOptions ---
        const updateIncubateeOptions = async (incubationId) => {
          if (!incubationId) {
            incubateeSelect.innerHTML =
              '<option value="" disabled selected>Select incubatee</option>';
            return;
          }
          incubateeSelect.innerHTML =
            '<option value="" disabled>Loading incubatees...</option>';
          incubateeSelect.disabled = true;
          try {
            // Corrected URL path from "/resources/generic/getinclist" to "/generic/getinclist"
            const response = await api.post("/generic/getinclist", {
              userId: userId || null,
              incUserId: incubationId,
            });
            if (response.data.statusCode === 200) {
              const options = [
                '<option value="" disabled selected>Select incubatee</option>',
                ...(response.data.data || []).map(
                  (incubatee) =>
                    `<option value="${incubatee.incubateesrecid}">${incubatee.incubateesname}</option>`
                ),
              ].join("");
              incubateeSelect.innerHTML = options;
            } else {
              incubateeSelect.innerHTML =
                '<option value="" disabled>No incubatees found</option>';
            }
          } catch (err) {
            console.error("Error fetching incubatees:", err);
            incubateeSelect.innerHTML =
              '<option value="" disabled>Error loading incubatees</option>';
          } finally {
            incubateeSelect.disabled = false;
          }
        };

        const toggleIncubateeDropdown = () => {
          const selectedRole = parseInt(roleSelect.value);
          const shouldEnableIncubatee = canSelectIncubation
            ? incubationSelect && incubationSelect.value !== ""
            : INCUBATEE_ROLE_IDS.includes(selectedRole);
          if (shouldEnableIncubatee) {
            if (canSelectIncubation && incubationSelect) {
              updateIncubateeOptions(incubationSelect.value);
            } else {
              updateIncubateeOptions(incUserid);
            }
            incubateeSelect.disabled = false;
          } else {
            incubateeSelect.disabled = true;
            incubateeSelect.value = "";
          }
        };
        roleSelect.addEventListener("change", toggleIncubateeDropdown);
        if (incubationSelect) {
          incubationSelect.addEventListener("change", () => {
            const selectedRole = parseInt(roleSelect.value);
            if (INCUBATEE_ROLE_IDS.includes(selectedRole)) {
              updateIncubateeOptions(incubationSelect.value);
              incubateeSelect.disabled = false;
            }
          });
        }
        toggleIncubateeDropdown();
      },
    });

    // --- CHANGE 3: Refactored API call using await and try/catch ---
    if (result.isConfirmed && result.value) {
      const formData = result.value;
      setIsUpdating(user.usersrecid);

      try {
        // Create a plain object to be sent in the encrypted request body
        const bodyPayload = {
          usersemail: formData.usersemail,
          usersname: formData.usersname,
          usersrolesrecid: formData.usersrolesrecid,
          userspassword: formData.userspassword, // Including password in update
          usersadminstate: "1",
          usersmodifiedby: userId,
          usersrecid: user.usersrecid, // The ID of the user to update
          usersincubationsrecid: formData.usersincubationsrecid,
        };

        // Only add incubateesrecid if it's not null or empty
        if (formData.usersincubateesrecid) {
          bodyPayload.usersincubateesrecid = formData.usersincubateesrecid;
        }

        // Use the api instance. It will encrypt the bodyPayload and add all necessary headers.
        const response = await api.post("/updateUser", bodyPayload);

        if (response.data.statusCode === 200) {
          Swal.fire("✅ Success", "User updated successfully", "success");
          fetchUsers(); // This should also be refactored to use the api instance
        } else {
          Swal.fire(
            "❌ Error",
            response.data.message || "Failed to update user",
            "error"
          );
        }
      } catch (err) {
        console.error("Error updating user:", err);
        const errorMessage =
          err.response?.data?.message || err.message || "Something went wrong";
        Swal.fire("❌ Error", errorMessage, "error");
      } finally {
        setIsUpdating(null);
      }
    }
  };

  return (
    <Box className="doccat-container" sx={{ p: 2 }}>
      <Box
        className="doccat-header"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">👤 Users</Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              endAdornment: searchQuery && (
                <IconButton size="small" onClick={clearSearch}>
                  <ClearIcon />
                </IconButton>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={
              isAdding ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <FaPlus />
              )
            }
            onClick={handleAddUser}
            disabled={isAdding}
          >
            {isAdding ? "Adding..." : "Add User"}
          </Button>
          {/* Export Buttons */}
          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            onClick={exportToCSV}
            title="Export as CSV"
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            onClick={exportToExcel}
            title="Export as Excel"
            disabled={!isXLSXAvailable}
          >
            Export Excel
          </Button>
        </Box>
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

      {/* Results Info */}
      <Box sx={{ mb: 1, color: "text.secondary" }}>
        Showing {paginationModel.page * paginationModel.pageSize + 1} to{" "}
        {Math.min(
          (paginationModel.page + 1) * paginationModel.pageSize,
          filteredData.length
        )}{" "}
        of {filteredData.length} entries
      </Box>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FaTimes />}
            onClick={clearAllFilters}
          >
            Clear All Filters
          </Button>
        </Box>
      )}

      {/* Material UI DataGrid */}
      <StyledPaper>
        <DataGrid
          rows={rowsWithId}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 25, 50]}
          disableRowSelectionOnClick
          sx={{ border: 0 }}
          loading={loading}
          autoHeight
          disableColumnMenu
        />
      </StyledPaper>

      {filteredData.length === 0 && !loading && (
        <Box sx={{ textAlign: "center", py: 3, color: "text.secondary" }}>
          {searchQuery
            ? "No users found matching your search"
            : "No users found"}
        </Box>
      )}

      {/* Filter Popover */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        <Card sx={{ minWidth: 280, maxWidth: 400 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filter by {filterColumn === "usersname" && "Name"}
              {filterColumn === "usersemail" && "Email"}
              {filterColumn === "usersrolesrecid" && "Role"}
              {filterColumn === "userscreatedtime" && "Created Time"}
              {filterColumn === "usersmodifiedtime" && "Modified Time"}
              {filterColumn === "userscreatedby" && "Created By"}
              {filterColumn === "usersmodifiedby" && "Modified By"}
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder={`Enter ${filterColumn === "usersname" && "name"}${
                filterColumn === "usersemail" && "email"
              }${filterColumn === "usersrolesrecid" && "role"}${
                filterColumn === "userscreatedtime" && "created time"
              }${filterColumn === "usersmodifiedtime" && "modified time"}${
                filterColumn === "userscreatedby" && "created by"
              }${filterColumn === "usersmodifiedby" && "modified by"}...`}
              value={columnFilters[filterColumn] || ""}
              onChange={(e) => handleFilterChange(filterColumn, e.target.value)}
              variant="outlined"
              margin="normal"
            />
          </CardContent>
          <CardActions sx={{ justifyContent: "flex-end" }}>
            <Button size="small" onClick={clearFilter}>
              Clear
            </Button>
            <Button size="small" onClick={handleFilterClose}>
              Close
            </Button>
          </CardActions>
        </Card>
      </Popover>

      {/* Loading overlay for operations */}
      <StyledBackdrop
        open={isAdding || isUpdating !== null || isDeleting !== null}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <CircularProgress color="inherit" />
          <Typography sx={{ mt: 2 }}>
            {isAdding
              ? "Adding user..."
              : isUpdating !== null
              ? "Updating user..."
              : "Deleting user..."}
          </Typography>
        </Box>
      </StyledBackdrop>
    </Box>
  );
}
