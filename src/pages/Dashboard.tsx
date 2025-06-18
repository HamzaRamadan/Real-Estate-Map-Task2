import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import ParcelDataGrid from "../components/ParcelDataGrid";
import ParcelMap from "../components/ParcelMap";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ShareLocationIcon from "@mui/icons-material/ShareLocation";
import axios from "axios";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";

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

interface ParcelMapRef {
  updateFilter: (region: string | null) => void;
}

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const [totalLocations, setTotalLocations] = useState(0);
  const [totalPopulation, setTotalPopulation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [locationData, setLocationData] = useState<PopulationData[]>([]);

  const mapRef = useRef<ParcelMapRef>({
    updateFilter: () => {}
  });

  const updateFilter = useCallback((region: string | null) => {
    if (mapRef.current) {
      mapRef.current.updateFilter(region);
    }
  }, []);

  useEffect(() => {
    document.body.dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const storedData = localStorage.getItem("populationData");
        let initialData: PopulationData[] = [];
        
        if (storedData) {
          try {
            initialData = JSON.parse(storedData);
            console.log("Retrieved from localStorage:", initialData.length, "items");
          } catch (e) {
            console.error("Error parsing localStorage data:", e);
            localStorage.removeItem("populationData");
          }
        }

        if (!initialData.length) {
          const response = await axios.get(
            "https://infomapapp.com/ksaarcgis/rest/services/Hosted/AbuDhabi_Boundary/FeatureServer/2/query",
            {
              params: {
                where: "1=1",
                outFields: "*",
                returnGeometry: true,
                f: "json",
              },
            }
          );
          console.log("API Response:", response.data.features.length, "features");
          const features = response.data.features || [];
          initialData = features.map((f: any, index: number) => {
            const geometry = f.geometry || {};
            const coords = geometry.rings ? geometry.rings[0][0] : [0, 0];
            const lastEdited = f.attributes?.last_edited_date
              ? new Date(f.attributes.last_edited_date).toLocaleDateString()
              : "N/A";

            return {
              id: index + 1,
              location:
                f.attributes?.st_district_eng ||
                f.attributes?.statistical_district ||
                "Unknown",
              region: f.attributes?.region || "Unknown",
              coordinates: `${coords[0] || 0},${coords[1] || 0}`,
              users: f.attributes?.total_population || 0,
              status: "Active",
              lastUpdated: lastEdited,
              OBJECTID: f.attributes?.objectid,
            };
          });
          try {
            localStorage.setItem("populationData", JSON.stringify(initialData));
            console.log("Successfully saved to localStorage:", initialData.length, "items");
          } catch (e) {
            console.error("Error saving to localStorage:", e);
            setError("فشل في حفظ البيانات في التخزين المحلي.");
          }
        }

        setLocationData(initialData);
        setTotalLocations(initialData.length);
        const totalPop = initialData.reduce((sum, item) => sum + item.users, 0);
        setTotalPopulation(totalPop);
        const uniqueRegions = [
          ...new Set(
            initialData
              .map((item) => item.region)
              .filter((region) => region && region !== "Unknown")
          ),
        ];
        setRegions(["All", ...uniqueRegions]);
      } catch (error) {
        console.error("Error fetching statistics:", error);
        setError("فشل في جلب البيانات من الـ API. حاول مرة أخرى لاحقًا.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [t]);

  useEffect(() => {
    if (selectedRegion !== null) {
      updateFilter(selectedRegion === "All" ? null : selectedRegion);
    }
  }, [selectedRegion, updateFilter]);

  const handleDataChange = useCallback((newData: PopulationData[]) => {
    if (JSON.stringify(newData) !== JSON.stringify(locationData)) {
      setLocationData(newData);
      setTotalLocations(newData.length);
      const totalPop = newData.reduce((sum, item) => sum + item.users, 0);
      setTotalPopulation(totalPop);
      const uniqueRegions = [
        ...new Set(
          newData
            .map((item) => item.region)
            .filter((region) => region && region !== "Unknown")
        ),
      ];
      setRegions(["All", ...uniqueRegions]);
    }
  }, [locationData]);

  const buttonStyle = useMemo(() => ({
    display: "flex",
    alignItems: "center",
    justifyContent: i18n.language === "ar" ? "flex-start" : "flex-start",
    textTransform: "none",
    fontWeight: 500,
    padding: { xs: "4px 8px", sm: "6px 12px" },
    fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
    gap: { xs: "4px", sm: "6px" },
    width: "100%",
    "&:hover": {
      backgroundColor: "#e0f2f1",
      borderColor: "#26a69a",
    },
  }), [i18n.language]);

  const cardStyle = useMemo(() => ({
    borderRadius: 2,
    boxShadow: 1,
    bgcolor: "#FFFFFF",
    height: "100%",
    width: "100%",
    overflow: "hidden",
  }), []);

  const handleFilterClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleRegionSelect = useCallback((region: string) => {
    setSelectedRegion(region === "All" ? null : region);
    setAnchorEl(null);
  }, []);

  const handleExportData = useCallback(() => {
    const exportData = locationData
      .filter((d) => !selectedRegion || d.region === selectedRegion)
      .map((d) => ({
        [t("location")]: d.location,
        [t("region")]: d.region,
        [t("coordinates")]: d.coordinates,
        [t("users")]: d.users,
        [t("status")]: d.status,
        [t("lastUpdated")]: d.lastUpdated,
      }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LocationData");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "LocationData.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [locationData, selectedRegion, t]);

  const handleShareMap = useCallback(() => {
    const baseUrl = window.location.origin + "/dashboard";
    const shareUrl = `${baseUrl}?region=${selectedRegion || "all"}`;
    setShareLink(shareUrl);
    setShareDialogOpen(true);
  }, [selectedRegion]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareLink);
    setShareDialogOpen(false);
  }, [shareLink]);

  const filteredData = useMemo(() => {
    const result = locationData.filter((d) => !selectedRegion || d.region === selectedRegion);
    // console.log("Filtered Data for ParcelMap:", result);
    return result;
  }, [locationData, selectedRegion]);

  return (
    <Box
      sx={{
        width: "100vw",
        maxWidth: "100%",
        mx: "auto",
        px: { xs: 1, sm: 2, md: 3 },
        py: { xs: 1, sm: 2 },
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: { xs: 1, sm: 2 },
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {error && (
        <Typography color="error" sx={{ textAlign: "center", mb: 2 }}>
          {error}
        </Typography>
      )}
      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        gap={{ xs: 1, md: 2 }}
        sx={{
          width: "100%",
          flex: "1 1 auto",
          minHeight: 0,
          overflow: "hidden",
          maxWidth: { md: "80%" },
          margin: "0 auto",
          direction:
            i18n.language === "ar" ? "rtl !important" : "ltr !important",
        }}
      >
        <Box
          flex={{ xs: "100%", md: "2" }}
          sx={{
            width: "100%",
            overflow: "hidden",
          }}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            mb={0.5}
            sx={{
              fontSize: { xs: "1.1rem", sm: "1.5rem" },
              textAlign:
                i18n.language === "ar" ? "right !important" : "left !important",
            }}
          >
            {t("locationAnalytics")}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            mb={0}
            sx={{
              fontSize: { xs: "0.8rem", sm: "0.9rem" },
              textAlign:
                i18n.language === "ar" ? "right !important" : "left !important",
            }}
          >
            {t("interactiveMapDescription")}
          </Typography>
        </Box>
      </Box>

      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        gap={{ xs: 1, md: 2 }}
        sx={{
          width: "100%",
          flex: "1 1 auto",
          minHeight: 0,
          overflow: "hidden",
          maxWidth: { md: "80%" },
          margin: "0 auto",
        }}
      >
        <Box
          flex={{ xs: "100%", md: "2" }}
          sx={{
            width: "100%",
            minHeight: { xs: 250, sm: 350, md: 400 },
            overflow: "hidden",
          }}
        >
          <Card sx={cardStyle}>
            <ParcelMap
              ref={mapRef}
              filter={selectedRegion}
              data={filteredData}
              selectedId={null}
              onSelectFromMap={() => {}}
              onMapViewReady={(view) => console.log("Map ready", view)}
            />
          </Card>
        </Box>

        <Box
          flex={{ xs: "100%", md: "1" }}
          display="flex"
          flexDirection={{ xs: "row", sm: "row", md: "column" }}
          gap={{ xs: 1, sm: 1.5 }}
          sx={{ width: "100%", minHeight: 0, overflow: "hidden" }}
        >
          <Box
            flex={{ xs: 1, md: "auto" }}
            sx={{ width: { xs: "50%", md: "100%" } }}
          >
            <Card sx={cardStyle}>
              <CardContent sx={{ p: { xs: 0.5, sm: 1 } }}>
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  mb={1}
                  textAlign={i18n.language === "ar" ? "right" : "left"}
                  sx={{ fontSize: { xs: "0.8rem", sm: "1rem" } }}
                >
                  {t("quickStats")}
                </Typography>

                {loading ? (
                  <Box
                    display="flex"
                    justifyContent="flex-start"
                    py={{ xs: 1, sm: 2 }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Box
                    display="flex"
                    flexDirection="column"
                    gap={{ xs: 0.5, sm: 1 }}
                  >
                    <Box
                      display="flex"
                      alignItems="flex-start"
                      gap={{ xs: 0.5, sm: 1 }}
                    >
                      <LocationOnIcon color="primary" fontSize="small" />
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                        >
                          {t("totalLocations")}
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                        >
                          {totalLocations}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      display="flex"
                      alignItems="flex-start"
                      gap={{ xs: 0.5, sm: 1 }}
                    >
                      <PeopleIcon color="success" fontSize="small" />
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                        >
                          {t("activeUsers")}
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                        >
                          {totalPopulation.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      display="flex"
                      alignItems="flex-start"
                      gap={{ xs: 0.5, sm: 1 }}
                    >
                      <TrendingUpIcon color="error" fontSize="small" />
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                        >
                          {t("growthRate")}
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          color="success.main"
                          sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                        >
                          +12.5%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          <Box
            flex={{ xs: 1, md: "auto" }}
            sx={{ width: { xs: "50%", md: "100%" } }}
          >
            <Card sx={cardStyle}>
              <CardContent sx={{ p: { xs: 0.5, sm: 1 } }}>
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  mb={1}
                  sx={{
                    textAlign: i18n.language === "ar" ? "right" : "left",
                    fontSize: { xs: "0.8rem", sm: "1rem" },
                  }}
                >
                  {t("mapControls")}
                </Typography>

                <Box
                  display="flex"
                  flexDirection="column"
                  gap={1}
                  sx={{
                    alignItems:
                      i18n.language === "ar" ? "flex-start" : "flex-start",
                    direction:
                      i18n.language === "ar"
                        ? "rtl !important"
                        : "ltr !important",
                  }}
                >
                  <Button
                    variant="outlined"
                    fullWidth
                    {...(i18n.language === "ar"
                      ? { startIcon: <FilterAltIcon fontSize="small" /> }
                      : { startIcon: <FilterAltIcon fontSize="small" /> })}
                    sx={{
                      ...buttonStyle,
                      backgroundColor: "#e0f2f1",
                      borderColor: "#50a89f",
                      color: "#26a69a",
                    }}
                    onClick={handleFilterClick}
                  >
                    {t("filterByRegion")}{" "}
                    {selectedRegion && `: ${selectedRegion}`}
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    PaperProps={{
                      sx: {
                        direction:
                          i18n.language === "ar"
                            ? "rtl !important"
                            : "ltr !important",
                        textAlign:
                          i18n.language === "ar"
                            ? "right !important"
                            : "left !important",
                        minWidth: { xs: "120px", sm: "150px" },
                      },
                    }}
                  >
                    {regions.map((region, index) => (
                      <MenuItem
                        key={`${region}-${index}`}
                        onClick={() => handleRegionSelect(region)}
                        sx={{
                          direction:
                            i18n.language === "ar"
                              ? "rtl !important"
                              : "ltr !important",
                          textAlign:
                            i18n.language === "ar"
                              ? "right !important"
                              : "left !important",
                          justifyContent:
                            i18n.language === "ar" ? "flex-end" : "flex-start",
                          fontSize: { xs: "0.7rem", sm: "0.875rem" },
                        }}
                      >
                        {region}
                      </MenuItem>
                    ))}
                  </Menu>

                  <Button
                    variant="outlined"
                    fullWidth
                    {...(i18n.language === "ar"
                      ? { startIcon: <FileDownloadIcon fontSize="small" /> }
                      : { startIcon: <FileDownloadIcon fontSize="small" /> })}
                    sx={buttonStyle}
                    onClick={handleExportData}
                  >
                    {t("exportData")}
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    {...(i18n.language === "ar"
                      ? { startIcon: <ShareLocationIcon fontSize="small" /> }
                      : { startIcon: <ShareLocationIcon fontSize="small" /> })}
                    sx={buttonStyle}
                    onClick={handleShareMap}
                  >
                    {t("shareMap")}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        sx={{
          direction:
            i18n.language === "ar" ? "rtl !important" : "ltr !important",
        }}
      >
        <DialogTitle
          sx={{
            textAlign:
              i18n.language === "ar" ? "right !important" : "left !important",
          }}
        >
          {t("shareMap")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              textAlign:
                i18n.language === "ar" ? "right !important" : "left !important",
            }}
          >
            {t("copyLinkDescription")}
          </DialogContentText>
          <TextField
            fullWidth
            value={shareLink}
            variant="outlined"
            InputProps={{ readOnly: true }}
            sx={{
              mt: 1,
              direction:
                i18n.language === "ar" ? "rtl !important" : "ltr !important",
            }}
          />
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent:
              i18n.language === "ar"
                ? "flex-start !important"
                : "flex-end !important",
          }}
        >
          <Button onClick={() => setShareDialogOpen(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleCopyLink} variant="contained">
            {t("copyLink")}
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        mt={{ xs: 1, md: 2 }}
        sx={{ width: "100%", overflow: "auto", flex: "0 0 auto" }}
      >
        <ParcelDataGrid
          data={locationData}
          filter={selectedRegion || undefined}
          onDataChange={handleDataChange}
        />
      </Box>
    </Box>
  );
};

export default Dashboard;