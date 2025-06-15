import { useEffect, useState, useCallback } from "react";
import {
  DataGrid,
  type GridColDef,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import {
  Box,
  Typography,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Alert,
} from "@mui/material";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapView from "@arcgis/core/views/MapView";
import { useTranslation } from "react-i18next";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditNoteIcon from "@mui/icons-material/EditNote";

interface PopulationData {
  id: number;
  location: string;
  region: string;
  coordinates: string;
  users: number;
  status: string;
  lastUpdated: string;
  OBJECTID?: number;
}

interface PopulationDataGridProps {
  data: PopulationData[];
  view?: MapView | null;
  layer?: FeatureLayer | null;
  filter?: string;
  onDataChange: (newData: PopulationData[]) => void;
}

const fallbackPopulationData: PopulationData[] = [
  {
    id: 1,
    location: "Al Nahda",
    region: "Amman",
    coordinates: "54.7400 - 24.2783",
    users: 13139,
    status: "Active",
    lastUpdated: "5/21/2025",
  },
  {
    id: 2,
    location: "Jabal Amman",
    region: "Amman",
    coordinates: "54.7215 - 24.6190",
    users: 8000,
    status: "Active",
    lastUpdated: "5/21/2025",
  },
  {
    id: 3,
    location: "Chicago Warehouse",
    region: "Amman",
    coordinates: "41.8781 - 87.6298",
    users: 567,
    status: "Maintenance",
    lastUpdated: "6/13/2025",
  },
];

const PopulationDataGrid: React.FC<PopulationDataGridProps> = ({
  data,
  view,
  filter,
  onDataChange,
}) => {
  const { t } = useTranslation();
  const [tableData, setTableData] = useState<PopulationData[]>([]);
  const [, setTotalRows] = useState(0);
  const [columns, setColumns] = useState<GridColDef[]>([]);
  const [isLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PopulationData | null>(null);
  const [editedData, setEditedData] = useState<PopulationData | null>(null);
  const [newData, setNewData] = useState<PopulationData>({
    id: 0,
    location: "",
    region: "",
    coordinates: "",
    users: 0,
    status: "Active",
    lastUpdated: new Date().toLocaleDateString(),
  });
  const [page, setPage] = useState(0);
  const [pageSize] = useState(3);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const saveToLocalStorage = useCallback(
    (data: PopulationData[]) => {
      const formattedData = data.map((item) => {
        const coords = item.coordinates.trim().split(/[, -]+/);
        const lat = parseFloat(coords[0]) || 0;
        const lon = parseFloat(coords[1]) || 0;
        return {
          ...item,
          coordinates: `${lat.toFixed(4)} - ${lon.toFixed(4)}`,
        };
      });
      localStorage.setItem("populationData", JSON.stringify(formattedData));
      onDataChange(formattedData);
    },
    [onDataChange]
  );

  const applyFilter = useCallback(
    (initialData: PopulationData[]) => {
      let filteredData = [...initialData];
      if (filter && filter.trim() !== "") {
        filteredData = initialData.filter((row) => row.region === filter);
      }
      setTableData(filteredData);
      setTotalRows(filteredData.length);
    },
    [filter]
  );

  const loadData = useCallback(() => {
    const storedData = localStorage.getItem("populationData");
    let initialData: PopulationData[] = [];
    if (storedData && JSON.parse(storedData).length > 0) {
      initialData = JSON.parse(storedData);
    } else {
      console.log("No data in localStorage, using fallback data.");
      initialData = data || fallbackPopulationData;
    }
    // تعديل الـ coordinates لـ 4 أرقام بعد العشرية عند التحميل
    const formattedInitialData = initialData.map((item) => {
      const coords = item.coordinates.trim().split(/[, -]+/);
      const lat = parseFloat(coords[0]) || 0;
      const lon = parseFloat(coords[1]) || 0;
      return {
        ...item,
        coordinates: `${lat.toFixed(4)} - ${lon.toFixed(4)}`,
      };
    });
    applyFilter(formattedInitialData);
    saveToLocalStorage(formattedInitialData); // حفظ البيانات المعدلة في localStorage
  }, [data, applyFilter, saveToLocalStorage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleView = (row: PopulationData) => {
    if (view) {
      try {
        const [lat, lon] = row.coordinates.split(" - ").map((coord) => {
          const num = parseFloat(coord);
          if (isNaN(num)) throw new Error("Invalid coordinate");
          return num;
        });
        view.goTo({
          center: [lon, lat],
          zoom: 10,
        });
      } catch (error) {
        console.error("Error viewing location:", error);
      }
    }
    setSelectedRow(row);
    setViewDialogOpen(true);
  };

  const handleEdit = (row: PopulationData) => {
    setSelectedRow(row);
    setEditedData({ ...row });
    setEditDialogOpen(true);
  };

  const handleDelete = (row: PopulationData) => {
    setSelectedRow(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedRow) {
      const storedData = localStorage.getItem("populationData");
      let allData = storedData
        ? JSON.parse(storedData)
        : data || fallbackPopulationData;
      const newAllData = allData.filter(
        (item: { id: number }) => item.id !== selectedRow.id
      );
      saveToLocalStorage(newAllData);
      applyFilter(newAllData);
      setDeleteDialogOpen(false);
      setOpenSnackbar(true);
    }
  };

  const handleSaveEdit = () => {
    if (editedData && selectedRow) {
      const storedData = localStorage.getItem("populationData");
      let allData = storedData
        ? JSON.parse(storedData)
        : data || fallbackPopulationData;
      const newAllData = allData.map((item: { id: number }) =>
        item.id === editedData.id ? editedData : item
      );
      saveToLocalStorage(newAllData);
      applyFilter(newAllData);
      setEditDialogOpen(false);
      setOpenSnackbar(true);
    }
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setEditedData(null);
  };

  const handleSaveAdd = () => {
    if (newData.location && newData.coordinates) {
      const storedData = localStorage.getItem("populationData");
      let allData = storedData
        ? JSON.parse(storedData)
        : data || fallbackPopulationData;
      const maxId = allData.reduce(
        (max: number, item: { id: number }) => Math.max(max, item.id),
        0
      );
      const coords = newData.coordinates.trim().split(/[, -]+/);
      const lat = parseFloat(coords[0]) || 0;
      const lon = parseFloat(coords[1]) || 0;
      const updatedNewData = {
        ...newData,
        id: maxId + 1,
        coordinates: `${lat.toFixed(4)} - ${lon.toFixed(4)}`,
      };
      const newAllData = [...allData, updatedNewData];
      saveToLocalStorage(newAllData);
      applyFilter(newAllData);
      setAddDialogOpen(false);
      setNewData({
        id: 0,
        location: "",
        region: "",
        coordinates: "",
        users: 0,
        status: "Active",
        lastUpdated: new Date().toLocaleDateString(),
      });
      setOpenSnackbar(true);
    }
  };

  const handleCancelAdd = () => {
    setAddDialogOpen(false);
    setNewData({
      id: 0,
      location: "",
      region: "",
      coordinates: "",
      users: 0,
      status: "Active",
      lastUpdated: new Date().toLocaleDateString(),
    });
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedRow(null);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const filteredData = tableData.filter(
    (row) =>
      row.location &&
      row.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rowsToDisplay =
    filteredData.length === 0 && !isLoading
      ? []
      : filteredData.slice(page * pageSize, (page + 1) * pageSize);

  const CustomPagination = () => {
    const totalPages = Math.ceil(filteredData.length / pageSize);
    let startPage = Math.max(0, page - 1);
    let endPage = Math.min(totalPages, startPage + 3);
    if (endPage - startPage < 3 && startPage > 0) {
      startPage = Math.max(0, endPage - 3);
    }

    const pageNumbers = Array.from(
      { length: endPage - startPage },
      (_, i) => startPage + i + 1
    );

    return (
      <Box
        sx={{
          p: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="caption"
          color="textSecondary"
          sx={{ color: "#000", fontSize: "0.75rem" }}
        >
          {t("Showing")} {page * pageSize + 1} {t("to")}{" "}
          {Math.min((page + 1) * pageSize, filteredData.length)} {t("of")}{" "}
          {filteredData.length} {t("results")}
        </Typography>
        <Box>
          <Button
            variant="text"
            disabled={page === 0}
            onClick={() => handlePageChange(page - 1)}
            sx={{
              textTransform: "none",
              fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.75rem" },
              padding: { xs: "2px 6px", sm: "4px 8px", md: "6px 12px" },
              border: "1px solid #000",
              color: "#000",
              minWidth: { xs: "60px", sm: "70px", md: "80px" },
            }}
          >
            {t("Previous")}
          </Button>
          {pageNumbers.map((num) => (
            <Button
              key={num}
              variant={page + 1 === num ? "contained" : "text"}
              onClick={() => handlePageChange(num - 1)}
              sx={{
                mx: { xs: 0.2, sm: 0.3, md: 0.5 },
                textTransform: "none",
                fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.75rem" },
                padding: { xs: "2px 4px", sm: "4px 6px", md: "6px 8px" },
              }}
            >
              {num}
            </Button>
          ))}
          <Button
            variant="text"
            disabled={(page + 1) * pageSize >= filteredData.length}
            onClick={() => handlePageChange(page + 1)}
            sx={{
              textTransform: "none",
              fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.75rem" },
              padding: { xs: "2px 6px", sm: "4px 8px", md: "6px 12px" },
              border: "1px solid #000",
              color: "#000",
              minWidth: { xs: "60px", sm: "70px", md: "80px" },
            }}
          >
            {t("Next")}
          </Button>
        </Box>
      </Box>
    );
  };

  useEffect(() => {
    const baseColumns: GridColDef[] = [
      {
        field: "location",
        headerName: (t("location") || "Location").toUpperCase(),
        flex: 1,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "coordinates",
        headerName: (t("coordinates") || "Coordinates").toUpperCase(),
        flex: 1,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "users",
        headerName: (t("users") || "Users").toUpperCase(),
        flex: 1,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "status",
        headerName: (t("status") || "Status").toUpperCase(),
        flex: 1,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => {
          let backgroundColor = "#ffffff";
          let textColor = "#000000";
          let borderRadius = "4px"; // Default square corners
          if (params.value === "Active") {
            backgroundColor = "#b1d2c2";
            textColor = "#000";
            borderRadius = "45%"; // Circular shape
          } else if (params.value === "Maintenance") {
            backgroundColor = "#FFF9C4";
            textColor = "#FFCA28";
          }
          return (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
              }}
            >
              <span
                style={{
                  backgroundColor,
                  color: textColor,
                  padding: "4px 12px",
                  borderRadius,
                  minWidth: "30px", // Ensure circle shape
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {params.value}
              </span>
            </Box>
          );
        },
      },
      {
        field: "lastUpdated",
        headerName: (t("lastUpdated") || "Last Updated").toUpperCase(),
        flex: 1,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "actions",
        headerName: (t("actions") || "Actions").toUpperCase(),
        type: "actions",
        align: "center",
        headerAlign: "center",
        getActions: (params) => [
          <GridActionsCellItem
            icon={<VisibilityIcon color="info" />}
            label="View"
            onClick={() => handleView(params.row as PopulationData)}
            showInMenu={false}
          />,
          <GridActionsCellItem
            icon={<EditNoteIcon color="primary" />}
            label="Edit"
            onClick={() => handleEdit(params.row as PopulationData)}
          />,
          <GridActionsCellItem
            icon={<DeleteIcon color="error" />}
            label="Delete"
            onClick={() => handleDelete(params.row as PopulationData)}
          />,
        ],
        width: 120,
      },
    ];

    setColumns(baseColumns);
  }, [t]);

  return (
    <Box
      sx={{
        height: "100%",
        maxHeight: "100%",
        width: "100%",
        mt: 2,
        backgroundColor: "#fff",
        padding: "20px 0",
        borderRadius: "10px",
        maxWidth: { md: "80%" }, // Reduced width to 80% on md and above
        margin: "0 auto", // Center the content
        "& .MuiDataGrid-root": {
          borderRadius: 0,
          backgroundColor: "#ffffff",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
          height: "100%",
          maxHeight: "100%",
        },
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: "#f5f5f5 !important",
          backgroundImage: "none !important",
          background: "#f5f5f5 !important",
        },
        "& .MuiDataGrid-columnHeader": {
          backgroundColor: "#f5f5f5 !important",
        },
        "& .MuiDataGrid-cell": {
          fontSize: "0.85rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
        "& .MuiDataGrid-row:nth-of-type(even)": {
          backgroundColor: "#fafafa",
        },
        "& .MuiDataGrid-row:hover": {
          backgroundColor: "#e5f3ff",
        },
      }}
    >
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {t("operationSuccess") || "تم تنفيذ العملية بنجاح"}
        </Alert>
      </Snackbar>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={1}
        sx={{
          width: "100%",
          flexDirection: { xs: "column", sm: "row" }, // Stack on mobile, row on tablet+
          alignItems: { xs: "flex-start", sm: "center" }, // Align start on mobile
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{
            fontSize: { xs: "1rem", sm: "1.2rem", md: "1.5rem" }, // Smaller on mobile, larger on tablet+
            mb: { xs: 1, sm: 0 }, // Margin bottom on mobile only
            color: "#000", // Ensure text is visible
          }}
        >
          {t("LocationData")}
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <TextField
            placeholder={t("SearchLocations")}
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: "65%", sm: "200px" } }} // Full width on mobile, fixed on tablet+
          />
          <Button
            variant="contained"
            onClick={() => setAddDialogOpen(true)}
            sx={{
              padding: { xs: "2px 6px", sm: "6px 12px" }, // Even smaller padding on mobile
              fontSize: { xs: "0.7rem", sm: "0.875rem" }, // Smaller font on mobile
              minWidth: { xs: "80px", sm: "120px" }, // Adjusted width, smaller on mobile
              height: { xs: "30px", sm: "36px" }, // Reduced height on mobile
            }}
          >
            {t("addLocation")}
          </Button>
        </Box>
      </Box>

      <Box sx={{ height: "100%", maxHeight: "100%", overflow: "auto" }}>
        <DataGrid
          rows={rowsToDisplay}
          columns={columns}
          loading={isLoading}
          paginationModel={{ pageSize, page }}
          rowCount={filteredData.length}
          onPaginationModelChange={({ page }) => {
            handlePageChange(page);
          }}
          paginationMode="server"
          hideFooterPagination
          slots={{
            footer: CustomPagination,
            noRowsOverlay: () => (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  fontSize: "1.5rem",
                  color: "textSecondary",
                }}
              >
                {t("NoResultsFound")}
              </Box>
            ),
            loadingOverlay: () => (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  fontSize: "1rem",
                  color: "textSecondary",
                }}
              >
                Loading...
              </Box>
            ),
          }}
        />
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: "#f5f5f5", color: "#d32f2f" }}>
          {t("confirmDelete")}
        </DialogTitle>
        <DialogContent sx={{ p: 3, backgroundColor: "#f5f5f5" }}>
          <DialogContentText
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "20px",
            }}
          >
            {t("areYouSure")}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            color="primary"
          >
            {t("cancel") || "إلغاء"}
          </Button>
          <Button onClick={confirmDelete} variant="contained" color="error">
            {t("delete") || "حذف"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={handleCancelEdit}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: "#f5f5f5", color: "#1976d2" }}>
          {t("editLocation") || "تعديل الموقع"}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {editedData && (
            <>
              <TextField
                autoFocus
                margin="dense"
                label={t("location") || "Location"}
                fullWidth
                value={editedData.location}
                onChange={(e) =>
                  setEditedData({ ...editedData, location: e.target.value })
                }
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label={t("users") || "Users"}
                type="number"
                fullWidth
                value={editedData.users}
                onChange={(e) =>
                  setEditedData({
                    ...editedData,
                    users: parseInt(e.target.value) || 0,
                  })
                }
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label={t("coordinates") || "Coordinates"}
                fullWidth
                value={editedData.coordinates}
                onChange={(e) =>
                  setEditedData({ ...editedData, coordinates: e.target.value })
                }
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
          <Button onClick={handleCancelEdit} variant="outlined" color="primary">
            {t("cancel") || "إلغاء"}
          </Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            {t("save") || "حفظ"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={addDialogOpen}
        onClose={handleCancelAdd}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: "#f5f5f5", color: "#2e7d32" }}>
          {t("addLocation") || "إضافة موقع جديد"}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label={t("location") || "Location"}
            fullWidth
            value={newData.location}
            onChange={(e) =>
              setNewData({ ...newData, location: e.target.value })
            }
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label={t("coordinates") || "Coordinates"}
            fullWidth
            value={newData.coordinates}
            onChange={(e) =>
              setNewData({ ...newData, coordinates: e.target.value })
            }
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label={t("users") || "Users"}
            type="number"
            fullWidth
            value={newData.users}
            onChange={(e) =>
              setNewData({ ...newData, users: parseInt(e.target.value) || 0 })
            }
            variant="outlined"
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
          <Button onClick={handleCancelAdd} variant="outlined" color="primary">
            {t("cancel") || "إلغاء"}
          </Button>
          <Button onClick={handleSaveAdd} variant="contained" color="success">
            {t("save") || "حفظ"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        sx={{ "& .MuiDialog-paper": { borderRadius: "12px", padding: "10px" } }}
      >
        <DialogTitle
          sx={{
            backgroundColor: "#f5f5f5",
            color: "#1976d2",
            textAlign: "center",
          }}
        >
          {t("Location Details") || "تفاصيل الموقع"}
        </DialogTitle>
        <DialogContent sx={{ p: 3, backgroundColor: "#fff" }}>
          {selectedRow && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                backgroundColor: "#f9f9f9",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              }}
            >
              <DialogContentText sx={{ fontSize: "1rem", color: "#333" }}>
                <strong>{t("location") || "Location"}:</strong>{" "}
                {selectedRow.location}
              </DialogContentText>
              <DialogContentText sx={{ fontSize: "1rem", color: "#333" }}>
                <strong>{t("coordinates") || "Coordinates"}:</strong>{" "}
                {selectedRow.coordinates}
              </DialogContentText>
              <DialogContentText sx={{ fontSize: "1rem", color: "#333" }}>
                <strong>{t("users") || "Users"}:</strong> {selectedRow.users}
              </DialogContentText>
              <DialogContentText sx={{ fontSize: "1rem", color: "#333" }}>
                <strong>{t("status") || "Status"}:</strong> {selectedRow.status}
              </DialogContentText>
              <DialogContentText sx={{ fontSize: "1rem", color: "#333" }}>
                <strong>{t("lastUpdated") || "Last Updated"}:</strong>{" "}
                {selectedRow.lastUpdated}
              </DialogContentText>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{ p: 2, backgroundColor: "#f5f5f5", justifyContent: "center" }}
        >
          <Button
            onClick={handleCloseViewDialog}
            variant="contained"
            color="primary"
            sx={{ padding: "8px 20px", fontSize: "1rem" }}
          >
            {t("close") || "إغلاق"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PopulationDataGrid;
