import { useEffect, useState, useCallback, useMemo } from "react";
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
import { useResponsiveStyles } from "./useResponsiveStyles";

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

const PopulationDataGrid: React.FC<PopulationDataGridProps> = ({
  data,
  view,
  filter,
  onDataChange,
}) => {
  const { t } = useTranslation();
  const {
    boxStyles,
    headerBoxStyles,
    typographyStyles,
    textFieldStyles,
    buttonStyles,
    dataGridStyles,
    paginationBoxStyles,
    paginationTypographyStyles,
    paginationButtonStyles,
    paginationPageButtonStyles,
    statusCellStyles,
    confirmDialogStyles,
    dialogTitleStyles,
    dialogContentStyles,
    dialogContentTextStyles,
    dialogActionsStyles,
    dialogButtonStyles,
    viewDialogStyles,
    viewDialogContentStyles,
    viewDialogBoxStyles,
    viewDialogContentTextStyles,
    viewDialogButtonStyles,
    noRowsOverlayStyles,
    loadingOverlayStyles,
    snackbarAlertStyles,
    columnFlex,
    dialogFullScreen,
  } = useResponsiveStyles();

  const [tableData, setTableData] = useState<PopulationData[]>([]);
  const [, setTotalRows] = useState(0);
  const [columns, setColumns] = useState<GridColDef[]>([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [multiDeleteDialogOpen, setMultiDeleteDialogOpen] = useState(false);
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
  const [rowSelectionModel, setRowSelectionModel] = useState<number[]>([]);

  const saveToLocalStorage = useCallback(
    (data: PopulationData[], userAction: boolean = false) => {
      const formattedData = data.map((item) => {
        const coords = item.coordinates.trim().split(/[, -]+/);
        const lat = parseFloat(coords[0]) || 0;
        const lon = parseFloat(coords[1]) || 0;
        return {
          id: item.id,
          location: item.location,
          region: item.region,
          coordinates: `${lat.toFixed(4)},${lon.toFixed(4)}`,
          users: item.users,
          status: item.status,
          lastUpdated: item.lastUpdated,
          OBJECTID: item.OBJECTID,
        };
      });
      try {
        localStorage.setItem("populationData", JSON.stringify(formattedData));
        console.log("Saved to localStorage:", formattedData.length, "items");
        if (userAction) {
          onDataChange(formattedData);
        }
      } catch (e) {
        console.error("Error saving to localStorage:", e);
      }
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

  const formattedData = useMemo(() => {
    return data.map((item) => {
      const coords = item.coordinates.trim().split(/[, -]+/);
      const lat = parseFloat(coords[0]) || 0;
      const lon = parseFloat(coords[1]) || 0;
      return {
        ...item,
        coordinates: `${lat.toFixed(4)},${lon.toFixed(4)}`,
      };
    });
  }, [data]);

  useEffect(() => {
    applyFilter(formattedData);
  }, [formattedData, applyFilter]);

  const handleView = (row: PopulationData) => {
    if (view) {
      try {
        const [lat, lon] = row.coordinates.split(",").map((coord) => {
          const num = parseFloat(coord);
          if (isNaN(num)) throw new Error("Invalid coordinate");
          return num;
        });
        console.log("Zooming to:", { center: [lon, lat], zoom: 10 });
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
      const newData = tableData.filter((item) => item.id !== selectedRow.id);
      saveToLocalStorage(newData, true);
      applyFilter(newData);
      setDeleteDialogOpen(false);
      setOpenSnackbar(true);
    }
  };

  const handleOpenMultiDeleteDialog = () => {
    if (rowSelectionModel.length > 0) {
      setMultiDeleteDialogOpen(true);
    }
  };

  const handleMultiDelete = () => {
    if (rowSelectionModel.length > 0) {
      const updatedData = tableData.filter(
        (item) => !rowSelectionModel.includes(item.id)
      );
      saveToLocalStorage(updatedData, true);
      applyFilter(updatedData);
      setRowSelectionModel([]);
      setMultiDeleteDialogOpen(false);
      setOpenSnackbar(true);
    }
  };

  const handleCancelMultiDelete = () => {
    setMultiDeleteDialogOpen(false);
  };

  const handleSaveEdit = () => {
    if (editedData && selectedRow) {
      const newData = tableData.map((item) =>
        item.id === editedData.id ? editedData : item
      );
      saveToLocalStorage(newData, true);
      applyFilter(newData);
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
      const maxId = tableData.reduce(
        (max: number, item: { id: number }) => Math.max(max, item.id),
        0
      );
      const coords = newData.coordinates.trim().split(/[, -]+/);
      const lat = parseFloat(coords[0]) || 0;
      const lon = parseFloat(coords[1]) || 0;
      const updatedNewData = {
        ...newData,
        id: maxId + 1,
        coordinates: `${lat.toFixed(4)},${lon.toFixed(4)}`,
      };
      const newDataArray = [...tableData, updatedNewData];
      saveToLocalStorage(newDataArray, true);
      applyFilter(newDataArray);
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

  const filteredData = useMemo(
    () =>
      tableData.filter(
        (row) =>
          row.location &&
          row.location.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [tableData, searchQuery]
  );

  const rowsToDisplay = useMemo(
    () =>
      filteredData.length === 0
        ? []
        : filteredData.slice(page * pageSize, (page + 1) * pageSize),
    [filteredData, page, pageSize]
  );

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
      <Box sx={paginationBoxStyles}>
        <Typography variant="caption" color="textSecondary" sx={paginationTypographyStyles}>
          {t("Showing")} {page * pageSize + 1} {t("to")}{" "}
          {Math.min((page + 1) * pageSize, filteredData.length)} {t("of")}{" "}
          {filteredData.length} {t("results")}
        </Typography>
        <Box display="flex" gap={0.5}>
          <Button
            variant="text"
            disabled={page === 0}
            onClick={() => handlePageChange(page - 1)}
            sx={paginationButtonStyles}
          >
            {t("Previous")}
          </Button>
          {pageNumbers.map((num) => (
            <Button
              key={num}
              variant={page + 1 === num ? "contained" : "text"}
              onClick={() => handlePageChange(num - 1)}
              sx={paginationPageButtonStyles}
            >
              {num}
            </Button>
          ))}
          <Button
            variant="text"
            disabled={(page + 1) * pageSize >= filteredData.length}
            onClick={() => handlePageChange(page + 1)}
            sx={paginationButtonStyles}
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
        flex: columnFlex.location,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "coordinates",
        headerName: (t("coordinates") || "Coordinates").toUpperCase(),
        flex: columnFlex.coordinates,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "users",
        headerName: (t("users") || "Users").toUpperCase(),
        flex: columnFlex.users,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "status",
        headerName: (t("status") || "Status").toUpperCase(),
        flex: columnFlex.status,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
            }}
          >
            <span style={statusCellStyles(params)}>{params.value}</span>
          </Box>
        ),
      },
      {
        field: "lastUpdated",
        headerName: (t("lastUpdated") || "Last Updated").toUpperCase(),
        flex: columnFlex.lastUpdated,
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
        width: columnFlex.actions,
      },
    ];

    setColumns(baseColumns);
  }, [t, columnFlex]);

  return (
    <Box sx={boxStyles}>
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
          sx={snackbarAlertStyles}
        >
          {t("operationSuccess") || "تم تنفيذ العملية بنجاح"}
        </Alert>
      </Snackbar>

      <Box sx={headerBoxStyles}>
        <Typography variant="h5" fontWeight="bold" sx={typographyStyles}>
          {t("LocationData")}
        </Typography>
        <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
          <TextField
            placeholder={t("SearchLocations")}
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={textFieldStyles}
          />
          <Button
            variant="contained"
            onClick={() => setAddDialogOpen(true)}
            sx={buttonStyles}
          >
            {t("addLocation")}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={rowSelectionModel.length === 0}
            onClick={handleOpenMultiDeleteDialog}
            sx={buttonStyles}
          >
            {t("DeleteSelected")}
          </Button>
        </Box>
      </Box>

      <Box sx={{ height: "100%", maxHeight: "100%", overflow: "auto" }}>
        <DataGrid
          rows={rowsToDisplay}
          columns={columns}
          paginationModel={{ pageSize, page }}
          rowCount={filteredData.length}
          onPaginationModelChange={({ page }) => {
            handlePageChange(page);
          }}
          paginationMode="server"
          hideFooterPagination
          checkboxSelection
          disableRowSelectionOnClick
          onRowSelectionModelChange={(newSelection) => {
            setRowSelectionModel(
              Array.isArray(newSelection) ? newSelection.map(Number) : []
            );
          }}
          rowSelectionModel={rowSelectionModel}
          autoHeight
          sx={dataGridStyles}
          slots={{
            footer: CustomPagination,
            noRowsOverlay: () => <Box sx={noRowsOverlayStyles}>{t("NoResultsFound")}</Box>,
            loadingOverlay: () => <Box sx={loadingOverlayStyles}>Loading...</Box>,
          }}
        />
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={confirmDialogStyles}
      >
        <DialogTitle sx={{ backgroundColor: "#f5f5f5", color: "#d32f2f", ...dialogTitleStyles }}>
          {t("confirmDelete")}
        </DialogTitle>
        <DialogContent sx={dialogContentStyles}>
          <DialogContentText sx={dialogContentTextStyles}>
            {t("areYouSure")}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={dialogActionsStyles}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            color="primary"
            sx={dialogButtonStyles}
          >
            {t("cancel") || "إلغاء"}
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            sx={dialogButtonStyles}
          >
            {t("delete") || "حذف"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={multiDeleteDialogOpen}
        onClose={handleCancelMultiDelete}
        maxWidth="sm"
        fullWidth
        sx={confirmDialogStyles}
      >
        <DialogTitle sx={{ backgroundColor: "#f5f5f5", color: "#d32f2f", ...dialogTitleStyles }}>
          {t("confirmMultiDelete")}
        </DialogTitle>
        <DialogContent sx={dialogContentStyles}>
          <DialogContentText sx={dialogContentTextStyles}>
            {t("areYouSureMultiDelete")}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={dialogActionsStyles}>
          <Button
            onClick={handleCancelMultiDelete}
            variant="outlined"
            color="primary"
            sx={dialogButtonStyles}
          >
            {t("cancel") || "إلغاء"}
          </Button>
          <Button
            onClick={handleMultiDelete}
            variant="contained"
            color="error"
            sx={dialogButtonStyles}
          >
            {t("delete") || "حذف"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={handleCancelEdit}
        maxWidth="sm"
        fullWidth
        fullScreen={dialogFullScreen}
      >
        <DialogTitle sx={{ backgroundColor: "#f5f5f5", color: "#1976d2", ...dialogTitleStyles }}>
          {t("editLocation") || "تعديل الموقع"}
        </DialogTitle>
        <DialogContent sx={dialogContentStyles}>
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
                sx={{ mb: 1, ...textFieldStyles }}
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
                sx={{ mb: 1, ...textFieldStyles }}
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
                sx={{ mb: 1, ...textFieldStyles }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={dialogActionsStyles}>
          <Button
            onClick={handleCancelEdit}
            variant="outlined"
            color="primary"
            sx={dialogButtonStyles}
          >
            {t("cancel") || "إلغاء"}
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            color="primary"
            sx={dialogButtonStyles}
          >
            {t("save") || "حفظ"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={addDialogOpen}
        onClose={handleCancelAdd}
        maxWidth="sm"
        fullWidth
        fullScreen={dialogFullScreen}
      >
        <DialogTitle sx={{ backgroundColor: "#f5f5f5", color: "#2e7d32", ...dialogTitleStyles }}>
          {t("addLocation") || "إضافة موقع جديد"}
        </DialogTitle>
        <DialogContent sx={dialogContentStyles}>
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
            sx={{ mb: 1, ...textFieldStyles }}
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
            sx={{ mb: 1, ...textFieldStyles }}
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
            sx={{ mb: 1, ...textFieldStyles }}
          />
        </DialogContent>
        <DialogActions sx={dialogActionsStyles}>
          <Button
            onClick={handleCancelAdd}
            variant="outlined"
            color="primary"
            sx={dialogButtonStyles}
          >
            {t("cancel") || "إلغاء"}
          </Button>
          <Button
            onClick={handleSaveAdd}
            variant="contained"
            color="success"
            sx={dialogButtonStyles}
          >
            {t("save") || "حفظ"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        fullScreen={dialogFullScreen}
        sx={viewDialogStyles}
      >
        <DialogTitle
          sx={{
            backgroundColor: "#f5f5f5",
            color: "#1976d2",
            textAlign: "center",
            ...dialogTitleStyles,
          }}
        >
          {t("Location Details") || "تفاصيل الموقع"}
        </DialogTitle>
        <DialogContent sx={viewDialogContentStyles}>
          {selectedRow && (
            <Box sx={viewDialogBoxStyles}>
              <DialogContentText sx={viewDialogContentTextStyles}>
                <strong>{t("location") || "Location"}:</strong>{" "}
                {selectedRow.location}
              </DialogContentText>
              <DialogContentText sx={viewDialogContentTextStyles}>
                <strong>{t("coordinates") || "Coordinates"}:</strong>{" "}
                {selectedRow.coordinates}
              </DialogContentText>
              <DialogContentText sx={viewDialogContentTextStyles}>
                <strong>{t("users") || "Users"}:</strong> {selectedRow.users}
              </DialogContentText>
              <DialogContentText sx={viewDialogContentTextStyles}>
                <strong>{t("status") || "Status"}:</strong> {selectedRow.status}
              </DialogContentText>
              <DialogContentText sx={viewDialogContentTextStyles}>
                <strong>{t("lastUpdated") || "Last Updated"}:</strong>{" "}
                {selectedRow.lastUpdated}
              </DialogContentText>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={dialogActionsStyles}>
          <Button
            onClick={handleCloseViewDialog}
            variant="contained"
            color="primary"
            sx={viewDialogButtonStyles}
          >
            {t("close") || "إغلاق"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PopulationDataGrid;
