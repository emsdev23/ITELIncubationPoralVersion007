import React, { useEffect, useState, useMemo } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import ReusableDataGrid from "../Datafetching/ReusableDataGrid"; // Import the reusable component
import { IPAdress } from "../Datafetching/IPAdrees";

// Material UI imports
import { Box, Typography, CircularProgress, Chip } from "@mui/material";
import { styled } from "@mui/material/styles";
import api from "../Datafetching/api";
// Styled components for custom styling
const StyledChip = styled(Chip)(({ theme, status }) => {
  const getStatusColor = (status) => {
    return status === 1
      ? { backgroundColor: "#e8f5e9", color: "#2e7d32" }
      : { backgroundColor: "#ffebee", color: "#c62828" };
  };

  return {
    ...getStatusColor(status),
    fontWeight: 500,
    borderRadius: 4,
  };
});

export default function GroupApplicationDetails({
  groupId,
  groupName,
  token,
  userId,
  incUserid,
}) {
  const API_BASE_URL = IPAdress;

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if XLSX is available
  const isXLSXAvailable = !!XLSX;

  // Fetch applications whenever the groupId prop changes

  const fetchApplications = async () => {
    if (!groupId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await api.post(
        "/resources/generic/getapplicationdetails",
        {
          userId: userId || 1,
          incUserId: incUserid || 0,
          groupId: groupId.toString(),
        },
        {
          headers: {
            userid: userId || "1",
            "X-Module": "Application Management",
            "X-Action": "Fetching Application Details List",
          },
        }
      );
      if (response.data.statusCode === 200) {
        setApps(response.data.data || []);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch application details"
        );
      }
    } catch (err) {
      console.error("Error fetching application details:", err);
      setError("Failed to load application details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [groupId, token, userId, incUserid]);

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
      field: "grpappsgroupname",
      headerName: "Group",
      width: 150,
      sortable: true,
    },
    {
      field: "guiappsadminstate",
      headerName: "State",
      width: 120,
      sortable: true,
      renderCell: (params) => {
        return (
          <StyledChip
            label={params.value === 1 ? "Enabled" : "Disabled"}
            size="small"
            status={params.value}
          />
        );
      },
    },
    {
      field: "guiappscreatedtime",
      headerName: "Created Time",
      width: 180,
      sortable: true,
      renderCell: (params) => {
        return params.value?.replace("T", " ") || "-";
      },
    },
    {
      field: "guiappsmodifiedtime",
      headerName: "Modified Time",
      width: 180,
      sortable: true,
      renderCell: (params) => {
        return params.value?.replace("T", " ") || "-";
      },
    },
  ];

  // Custom export function to format data properly
  const onExportData = (data) => {
    return data.map((item) => ({
      "App Name": item.guiappsappname || "",
      Path: item.guiappspath || "",
      Group: item.grpappsgroupname || "",
      State: item.guiappsadminstate === 1 ? "Enabled" : "Disabled",
      "Created Time": item.guiappscreatedtime?.replace("T", " ") || "",
      "Modified Time": item.guiappsmodifiedtime?.replace("T", " ") || "",
    }));
  };

  // Export configuration
  const exportConfig = {
    filename: `group_${groupName}_apps`,
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
        <Typography variant="h5">📱 Applications for: {groupName}</Typography>
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
        uniqueIdField="guiappsrecid"
        onExportData={onExportData}
        exportConfig={exportConfig}
        className="group-applications-grid"
      />
    </Box>
  );
}
