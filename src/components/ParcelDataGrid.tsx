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
  Button,
  TextField,
  Alert,
  useMediaQuery,
} from "@mui/material";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import MapView from "@arcgis/core/views/MapView";
import { useTranslation } from "react-i18next";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { getResponsiveStyles } from "./ParcelDataGridStyles";
import {
  DeleteDialog,
  MultiDeleteDialog,
  ViewDialog,
  EditDialog,
  AddDialog,
} from "./ParcelDataGridDialogs";

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

  // Media query for screen width between 900px and 1100px (Responsive)
  const isMidRange = useMediaQuery("(min-width:900px) and (max-width:1100px)");

  // Get styles with isMidRange as parameter
  const responsiveStyles = getResponsiveStyles({ isMidRange });

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

  const handleEditDataChange = (
    key: keyof PopulationData,
    value: string | number
  ) => {
    setEditedData((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const handleNewDataChange = (
    key: keyof PopulationData,
    value: string | number
  ) => {
    setNewData((prev) => ({ ...prev, [key]: value }));
  };

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
      <Box sx={responsiveStyles.paginationContainer}>
        <Typography
          variant="caption"
          color="textSecondary"
          sx={responsiveStyles.paginationText}
        >
          {t("Showing")} {page * pageSize + 1} {t("to")}{" "}
          {Math.min((page + 1) * pageSize, filteredData.length)} {t("of")}{" "}
          {filteredData.length} {t("results")}
        </Typography>
        <Box sx={responsiveStyles.paginationButtonContainer}>
          <Button
            variant="text"
            disabled={page === 0}
            onClick={() => handlePageChange(page - 1)}
            sx={responsiveStyles.paginationPrevNextButton}
          >
            {t("Previous")}
          </Button>
          {pageNumbers.map((num) => (
            <Button
              key={num}
              variant={page + 1 === num ? "contained" : "text"}
              onClick={() => handlePageChange(num - 1)}
              sx={responsiveStyles.paginationPageButton}
            >
              {num}
            </Button>
          ))}
          <Button
            variant="text"
            disabled={(page + 1) * pageSize >= filteredData.length}
            onClick={() => handlePageChange(page + 1)}
            sx={responsiveStyles.paginationPrevNextButton}
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
          let borderRadius = "4px";
          if (params.value === "Active") {
            backgroundColor = "#b1d2c2";
            textColor = "#000";
            borderRadius = "45%";
          } else if (params.value === "Maintenance") {
            backgroundColor = "#FFF9C4";
            textColor = "#FFCA28";
          }
          return (
            <Box sx={responsiveStyles.statusBox}>
              <span
                style={{
                  backgroundColor,
                  color: textColor,
                  padding: "4px 12px",
                  borderRadius,
                  minWidth: "30px",
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
    <Box sx={responsiveStyles.container}>
      <Box sx={responsiveStyles.headerContainer}>
        <Typography variant="h5" sx={responsiveStyles.title}>
          {t("LocationData")}
        </Typography>
        <Box sx={responsiveStyles.buttonContainer}>
          <TextField
            placeholder={t("SearchLocations")}
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={responsiveStyles.searchField}
          />
          <Button
            variant="contained"
            onClick={() => setAddDialogOpen(true)}
            sx={responsiveStyles.addButton}
          >
            {t("addLocation")}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={rowSelectionModel.length === 0}
            onClick={handleOpenMultiDeleteDialog}
            sx={responsiveStyles.deleteSelectedButton}
          >
            {t("DeleteSelected")}
          </Button>
        </Box>
      </Box>

      <DataGrid
        rows={rowsToDisplay}
        columns={columns}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={(newRowSelectionModel) => {
          setRowSelectionModel(newRowSelectionModel as number[]);
        }}
        rowSelectionModel={rowSelectionModel}
        hideFooter
        autoHeight
        sx={responsiveStyles.dataGrid}
        localeText={{
          noRowsLabel: t("noResultsFound") || "No results found",
        }}
      />

      <CustomPagination />

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={responsiveStyles.snackbar}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          sx={responsiveStyles.alert}
        >
          {t("operationSuccess")}
        </Alert>
      </Snackbar>

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        styles={responsiveStyles}
      />

      <MultiDeleteDialog
        open={multiDeleteDialogOpen}
        onClose={handleCancelMultiDelete}
        onConfirm={handleMultiDelete}
        count={rowSelectionModel.length}
        styles={responsiveStyles}
      />

      <ViewDialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        data={selectedRow}
        styles={responsiveStyles}
      />

      <EditDialog
        open={editDialogOpen}
        onClose={handleCancelEdit}
        onConfirm={handleSaveEdit}
        data={editedData}
        onChange={handleEditDataChange}
        styles={responsiveStyles}
      />

      <AddDialog
        open={addDialogOpen}
        onClose={handleCancelAdd}
        onConfirm={handleSaveAdd}
        data={newData}
        onChange={handleNewDataChange}
        styles={responsiveStyles}
      />
    </Box>
  );
};

export default PopulationDataGrid;
