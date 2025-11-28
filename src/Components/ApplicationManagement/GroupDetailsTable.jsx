import React, { useEffect, useState, useMemo } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import GroupApplicationDetails from "./GroupApplicationDetails"; // Import detail component
import ReusableDataGrid from "../Datafetching/ReusableDataGrid"; // Import the reusable component
import { IPAdress } from "../Datafetching/IPAdrees";

// Material UI imports
import { Box, Typography, Button, Chip } from "@mui/material";
import { styled } from "@mui/material/styles";

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

export default function GroupDetailsTable() {
  const userId = sessionStorage.getItem("userid");
  const token = sessionStorage.getItem("token");
  const incUserid = sessionStorage.getItem("incuserid");

  const API_BASE_URL = IPAdress;

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State to manage the selected group for the detail view
  const [selectedGroup, setSelectedGroup] = useState({ id: null, name: "" });

  // Check if XLSX is available
  const isXLSXAvailable = !!XLSX;

  const fetchGroups = () => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE_URL}/itelinc/resources/generic/getgroupdetails`, {
      method: "POST",
      mode: "cors",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        userid: userId || "1",
        "X-Module": "Application Management",
        "X-Action": "Fetching Application Group Details",
      },
      body: JSON.stringify({
        userId: userId || 1,
        userIncId: incUserid || 0,
        groupId: "ALL",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.statusCode === 200) {
          setGroups(data.data || []);
        } else {
          throw new Error(data.message || "Failed to fetch group details");
        }
      })
      .catch((err) => {
        console.error("Error fetching group details:", err);
        setError("Failed to load group details. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Handler for when a group is clicked
  const handleGroupClick = (group) => {
    setSelectedGroup({ id: group.grpappsrecid, name: group.grpappsgroupname });
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
      field: "grpappsgroupname",
      headerName: "Group Name",
      width: 200,
      sortable: true,
      renderCell: (params) => {
        return (
          <Button
            variant="text"
            color="primary"
            onClick={() => handleGroupClick(params.row)}
            sx={{ justifyContent: "flex-start", textTransform: "none" }}
          >
            {params.row.grpappsgroupname || ""}
          </Button>
        );
      },
    },
    {
      field: "grpappsdescription",
      headerName: "Description",
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
      field: "grpappsadminstate",
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
      field: "grpappscreatedtime",
      headerName: "Created Time",
      width: 180,
      sortable: true,
      renderCell: (params) => {
        return params.value?.replace("T", " ") || "-";
      },
    },
    {
      field: "grpappsmodifiedtime",
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
      "Group Name": item.grpappsgroupname || "",
      Description: item.grpappsdescription || "",
      State: item.grpappsadminstate === 1 ? "Enabled" : "Disabled",
      "Created Time": item.grpappscreatedtime?.replace("T", " ") || "",
      "Modified Time": item.grpappsmodifiedtime?.replace("T", " ") || "",
    }));
  };

  // Export configuration
  const exportConfig = {
    filename: "application_groups",
    sheetName: "Application Groups",
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5">📋 Application Group Details</Typography>
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
        data={groups}
        columns={columns}
        title=""
        enableExport={true}
        enableColumnFilters={true}
        searchPlaceholder="Search by name or description..."
        searchFields={["grpappsgroupname", "grpappsdescription"]}
        uniqueIdField="grpappsrecid"
        onExportData={onExportData}
        exportConfig={exportConfig}
        className="group-details-table"
      />

      {/* Render the detail component below */}
      {selectedGroup.id && (
        <Box sx={{ mt: 3 }}>
          <GroupApplicationDetails
            groupId={selectedGroup.id}
            groupName={selectedGroup.name}
            token={token}
            userId={userId}
            incUserid={incUserid}
          />
        </Box>
      )}
    </Box>
  );
}
