import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MapIcon from "@mui/icons-material/Map";
import LanguageIcon from "@mui/icons-material/Language";
import { useTranslation } from "react-i18next";

const Navbar = () => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(newLang).then(() => {
      console.log(`Language changed to: ${newLang}`);
      document.body.dir = newLang === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = newLang;
    });
  };

  return (
    <Box
      sx={{
        width: "100%",
        position: "relative",
        left: "50%",
        transform: "translateX(-50%)",
      }}
    >
      <AppBar
        position="static"
        color="inherit"
        elevation={1}
        sx={{ width: "100%", px: { xs: 1, sm: 2 }, mb: { xs: 1, sm: 2 } }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", p: { xs: 0.5, sm: 1 } }}>
          {/* Left: Logo & Title */}
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 }, fontSize: { xs: "1rem", sm: "1.25rem" } }}
          >
            <MapIcon color="primary" fontSize={i18n.language === "ar" ? "medium" : "medium"} />
            {t("mapViewDashboard")}
          </Typography>

          {/* Right: Icons */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
            <IconButton
              onClick={toggleLanguage}
              title={t("toggleLanguage")}
              sx={{
                display: "flex",
                alignItems: "center",
                padding: { xs: "4px", sm: "8px" },
                borderRadius: "12px",
                backgroundColor: "background.paper",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "grey.100",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  transform: "scale(1.05)",
                },
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              <LanguageIcon fontSize={i18n.language === "ar" ? "small" : "small"} />
              <Typography variant="caption" sx={{ ml: { xs: 0.25, sm: 0.5 } }}>
                {i18n.language === "ar" ? "EN" : "AR"}
              </Typography>
            </IconButton>
            <IconButton sx={{ padding: { xs: "4px", sm: "8px" } }}>
              <NotificationsIcon fontSize={i18n.language === "ar" ? "small" : "small"} />
            </IconButton>
            <Avatar alt="Hamza" src="/myPic.png" sx={{ width: { xs: 24, sm: 32 }, height: { xs: 24, sm: 32 } }} />
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar;