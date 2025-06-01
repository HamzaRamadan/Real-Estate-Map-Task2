import { DataGrid } from "@mui/x-data-grid";
import { TextField, Box, Backdrop, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { GridSelectionModel } from "@mui/x-data-grid";

const columns = [
  {
    field: "objectid",
    headerName: "ID",
    width: 80,
    filterable: true,
    flex: 0.4,
  },
  {
    field: "st_dist_ara",
    headerName: "District (AR)",
    width: 120,
    filterable: true,
    flex: 1,
    hideable: true,
    // display: { xs: "none", sm: "flex" },
  },
  {
    field: "region",
    headerName: "Region",
    width: 120,
    filterable: true,
    flex: 1,
  },
];

export default function ParcelTable({
  onSelectParcel,
  selectedIds,
  onExportDataRequest,
}: {
  onSelectParcel: (ids: number[] | null) => void;
  selectedIds: number[] | null;
  onExportDataRequest: (data: any[]) => void;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [filteredRows, setFilteredRows] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectionModel, setSelectionModel] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    setIsLoading(true);
    axios
      .get(
        "https://infomapapp.com/ksaarcgis/rest/services/Hosted/AbuDhabi_Boundary/FeatureServer/2/query",
        {
          params: {
            where: "1=1",
            outFields: "*",
            f: "json",
          },
        }
      )
      .then((res) => {
        const data = res.data.features.map((f: any) => ({ ...f.attributes }));
        setRows(data);
        setFilteredRows(data);
        onExportDataRequest(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      });
  }, [onExportDataRequest]);

  useEffect(() => {
    const lower = searchText.toLowerCase();
    const filtered = rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(lower)
      )
    );
    setFilteredRows(filtered);
  }, [searchText, rows]);

  useEffect(() => {
    if (!rows.length) return;

    if (!selectedIds || selectedIds.length === 0) {
      setSelectionModel([]);
      setFilteredRows(rows);
      return;
    }

    const selectedRows = rows.filter((row) =>
      selectedIds.includes(Number(row.objectid))
    );

    setSelectionModel(selectedIds);
    setFilteredRows(selectedRows.length ? selectedRows : rows);
  }, [selectedIds, rows]);

  const responsiveStyles = {
    container: {
      width: "100%",
      maxWidth: "100vw",
      overflowX: "hidden",
      display: "flex",
      flexDirection: "column",
      gap: { xs: 1, sm: 1.5 },
      p: { xs: 0.5, sm: 1, md: 2 },
      height: { xs: "50vh", sm: "100%" },
      maxHeight: { sm: "calc(100vh - 80px)" }, // منع التمدد الزايد
    },
    textField: {
      width: { xs: "100%", sm: "300px" },
      "& .MuiInputBase-root": {
        fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
      },
    },
    tableContainer: {
      flexGrow: 1,
      position: "relative",
      width: "100%",
      maxHeight: "100%", // التحكم في الارتفاع
      overflowY: "auto", // السماح بالـ scroll عمودي
    },
    backdrop: {
      color: "#fff",
      zIndex: (theme) => theme.zIndex.drawer + 1,
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      mt: 2,
      color: "#fff",
      fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
    },
    dataGrid: {
      "& .MuiDataGrid-cell": {
        fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.9rem" },
      },
      "& .MuiDataGrid-columnHeaderTitle": {
        fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.9rem" },
      },
      width: "100%",
      height: "100%",
      maxHeight: "100%", // منع الـ DataGrid من التمدد
      overflowX: "hidden",
    },
  };

  return (
    <Box sx={responsiveStyles.container}>
      <TextField
        label={i18n.language === "en" ? "🔍 Search ..." : "🔍 ...ابحث"}
        variant="outlined"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        size="small"
        sx={responsiveStyles.textField}
      />

      <Box sx={responsiveStyles.tableContainer}>
        <Backdrop
          open={isLoading}
          sx={responsiveStyles.backdrop}
        >
          <CircularProgress color="inherit" />
          <Typography sx={responsiveStyles.loadingText}>
            {i18n.language === "en" ? "Loading..." : "جاري التحميل..."}
          </Typography>
        </Backdrop>
        <DataGrid
          key={`table-${selectionModel.join("-")}`}
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => Number(row.objectid)}
          checkboxSelection
          selectionModel={selectionModel}
          onRowClick={(params) => onSelectParcel([Number(params.row.objectid)])}
          onSelectionModelChange={(newSelection: GridSelectionModel) => {
            const ids = newSelection.map(Number);
            setSelectionModel(ids);
            onSelectParcel(ids.length > 0 ? ids : null);
          }}
          sortingMode="client"
          filterMode="client"
          disableColumnFilter={false}
          disableColumnMenu={false}
          sx={responsiveStyles.dataGrid}
        />
      </Box>
    </Box>
  );
}