import React, { useEffect, useState, useMemo } from "react";
import { FaSpinner, FaSave, FaTimes } from "react-icons/fa";
import { Download } from "lucide-react";
import Swal from "sweetalert2";
import ReusableDataGrid from "../Datafetching/ReusableDataGrid"; // Import the reusable component

// Material UI imports
import { IPAdress } from "../Datafetching/IPAdrees";
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Checkbox,
} from "@mui/material";
import { styled } from "@mui/material/styles";

// Styled components for custom styling
const PermissionLabel = styled(Box)(({ theme, enabled }) => ({
  marginLeft: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: enabled ? "#e8f5e9" : "#ffebee",
  color: enabled ? "#2e7d32" : "#c62828",
  fontSize: "0.75rem",
  fontWeight: 500,
}));

export default function RoleAppList({ roleId, roleName, token, userId }) {
  const API_BASE_URL = IPAdress;

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch applications whenever the roleId prop changes
  useEffect(() => {
    if (roleId === null || roleId === undefined) return;

    console.log("Fetching apps for roleId:", roleId);

    setLoading(true);
    setError(null);

    fetch(`${API_BASE_URL}/itelinc/resources/generic/getapplist`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        userid: userId || "1",
        "X-Module": "Roles Management",
        "X-Action": "Fetching Apps List",
      },
      body: JSON.stringify({
        userId: userId || 35,
        roleId: roleId,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("API Response:", data);
        if (data.statusCode === 200) {
          // Add a unique ID for each app using the appsinrolesguiid field
          const processedData = (data.data || []).map((app) => ({
            ...app,
            // Check if the app is assigned to the current role
            isAssigned: app.appsinrolesroleid === roleId,
            // Use the appsinrolesguiid as the app ID
            appId: app.appsinrolesguiid,
          }));
          setApps(processedData);
        } else {
          throw new Error(data.message || "Failed to fetch application list");
        }
      })
      .catch((err) => {
        console.error("Error fetching application list:", err);
        setError("Failed to load application list. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [roleId, token, userId]);

  // Handle checkbox changes for permissions
  const handlePermissionChange = (appId, accessType, isChecked) => {
    const updatedApps = apps.map((app) => {
      if (app.appId === appId) {
        return {
          ...app,
          [accessType]: isChecked ? 1 : 0,
        };
      }
      return app;
    });

    setApps(updatedApps);
    setHasChanges(true);
  };

  // Handle assignment checkbox changes
  const handleAssignmentChange = (appId, isChecked) => {
    const updatedApps = apps.map((app) => {
      if (app.appId === appId) {
        return {
          ...app,
          isAssigned: isChecked,
          // When unassigning, reset permissions
          appsreadaccess: isChecked ? app.appsreadaccess : 0,
          appswriteaccess: isChecked ? app.appswriteaccess : 0,
        };
      }
      return app;
    });

    setApps(updatedApps);
    setHasChanges(true);
  };

  // Save changes to the API
  const saveChanges = () => {
    setIsSaving(true);

    // Create promises for each app update
    const updatePromises = apps.map((app) => {
      const params = new URLSearchParams();
      params.append("appsinrolesroleid", app.isAssigned ? roleId : 0);
      // Use the actual appsinrolesguiid from the API response
      params.append("appsinrolesguiid", app.appsinrolesguiid);
      params.append("appsreadaccess", app.isAssigned ? app.appsreadaccess : 0);
      params.append(
        "appswriteaccess",
        app.isAssigned ? app.appswriteaccess : 0
      );
      params.append("appsinrolesadminstate", "1"); // Default to enabled
      params.append("appsinrolescreatedby", userId || "system");
      params.append("appsinrolesmodifiedby", userId || "system");

      return fetch(
        `${API_BASE_URL}/itelinc/addAppsInRoles?${params.toString()}`,
        {
          method: "POST",
          mode: "cors",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
    });

    Promise.all(updatePromises)
      .then((responses) => Promise.all(responses.map((res) => res.json())))
      .then((data) => {
        console.log("Update responses:", data);
        setHasChanges(false);
        // Show success message with SweetAlert2
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Applications and permissions updated successfully!",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "OK",
        });
      })
      .catch((err) => {
        console.error("Error updating permissions:", err);
        // Show error message with SweetAlert2
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Failed to update applications and permissions. Please try again.",
          confirmButtonColor: "#d33",
          confirmButtonText: "OK",
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  // Cancel changes
  const cancelChanges = () => {
    // Reset to original data
    setLoading(true);

    fetch(`${API_BASE_URL}/itelinc/resources/generic/getapplist`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId || 35,
        roleId: roleId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200) {
          const processedData = (data.data || []).map((app) => ({
            ...app,
            isAssigned: app.appsinrolesroleid === roleId,
            appId: app.appsinrolesguiid,
          }));
          setApps(processedData);
          setHasChanges(false);
        } else {
          throw new Error(data.message || "Failed to fetch application list");
        }
      })
      .catch((err) => {
        console.error("Error resetting application list:", err);
        setError("Failed to reset application list. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  // Define columns for ReusableDataGrid
  const columns = [
    {
      field: "id",
      headerName: "S.No",
      width: 80,
      sortable: false,
      renderCell: (params) => {
        // Ensure we have valid params and row
        if (!params || !params.api || !params.row) return "1";

        const rowIndex = params.api.getRowIndexRelativeToVisibleRows(
          params.row.id
        );
        const pageSize = params.api.state.pagination.pageSize;
        const currentPage = params.api.state.pagination.page;

        // Ensure we have valid numbers
        const validRowIndex = isNaN(rowIndex) ? 0 : rowIndex;
        const validPageSize = isNaN(pageSize) ? 10 : pageSize;
        const validCurrentPage = isNaN(currentPage) ? 0 : currentPage;

        return (
          validRowIndex +
          1 +
          validCurrentPage * validPageSize
        ).toString();
      },
    },
    {
      field: "guiappsappname",
      headerName: "App Name",
      width: 200,
      sortable: true,
    },
    {
      field: "guiappspath",
      headerName: "Path",
      width: 300,
      sortable: true,
      renderCell: (params) => (
        <Box
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }}
          title={params.value || ""}
        >
          {params.value || ""}
        </Box>
      ),
    },
    {
      field: "isAssigned",
      headerName: "Assigned",
      width: 120,
      sortable: true,
      renderCell: (params) => (
        <Checkbox
          checked={params.row.isAssigned || false}
          onChange={(e) =>
            handleAssignmentChange(params.row.appId, e.target.checked)
          }
        />
      ),
    },
    {
      field: "appsreadaccess",
      headerName: "Read Access",
      width: 150,
      sortable: true,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Checkbox
            checked={params.row.appsreadaccess === 1}
            onChange={(e) =>
              handlePermissionChange(
                params.row.appId,
                "appsreadaccess",
                e.target.checked
              )
            }
            disabled={!params.row.isAssigned}
          />
          <PermissionLabel enabled={params.row.appsreadaccess === 1}>
            {params.row.appsreadaccess === 1 ? "Enabled" : "Disabled"}
          </PermissionLabel>
        </Box>
      ),
    },
    {
      field: "appswriteaccess",
      headerName: "Write Access",
      width: 150,
      sortable: true,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Checkbox
            checked={params.row.appswriteaccess === 1}
            onChange={(e) =>
              handlePermissionChange(
                params.row.appId,
                "appswriteaccess",
                e.target.checked
              )
            }
            disabled={!params.row.isAssigned}
          />
          <PermissionLabel enabled={params.row.appswriteaccess === 1}>
            {params.row.appswriteaccess === 1 ? "Enabled" : "Disabled"}
          </PermissionLabel>
        </Box>
      ),
    },
  ];

  // Custom export function to format data properly
  const onExportData = (data) => {
    return data.map((item) => ({
      "App Name": item.guiappsappname || "",
      Path: item.guiappspath || "",
      Assigned: item.isAssigned ? "Yes" : "No",
      "Read Access": item.appsreadaccess === 1 ? "Enabled" : "Disabled",
      "Write Access": item.appswriteaccess === 1 ? "Enabled" : "Disabled",
    }));
  };

  // Export configuration
  const exportConfig = {
    filename: `role_${roleName}_apps`,
    sheetName: "Applications",
  };

  return (
    <Box sx={{ width: "100%", mt: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5">
          📱 Applications for Role: {roleName}
        </Typography>
        {hasChanges && (
          <>
            <Button
              variant="contained"
              color="success"
              startIcon={
                isSaving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <FaSave />
                )
              }
              onClick={saveChanges}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<FaTimes />}
              onClick={cancelChanges}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </>
        )}
      </Box>

      {error && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            bgcolor: "error.light",
            color: "error.contrastText",
            borderRadius: 1,
          }}
        >
          {error}
        </Box>
      )}

      {/* Use the ReusableDataGrid component */}
      <ReusableDataGrid
        data={apps}
        columns={columns}
        title=""
        enableExport={true}
        enableColumnFilters={true}
        searchPlaceholder="Search by name or path..."
        searchFields={["guiappsappname", "guiappspath"]}
        uniqueIdField="appId"
        onExportData={onExportData}
        exportConfig={exportConfig}
        className="role-apps-grid"
      />

      {/* Loading overlay for operations */}
      {isSaving && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              p: 3,
              bgcolor: "background.paper",
              borderRadius: 1,
            }}
          >
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography>Saving changes...</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
