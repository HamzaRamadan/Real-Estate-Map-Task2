import { useMediaQuery, useTheme } from "@mui/material";

export const useResponsiveStyles = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  return {
    // Main Box styles
    boxStyles: {
      height: "100%",
      maxHeight: "100%",
      width: "100%",
      mt: isMobile ? 1 : 2,
      backgroundColor: "#fff",
      padding: isMobile ? "10px 5px" : isTablet ? "15px 8px" : "20px 10px",
      borderRadius: "10px",
      maxWidth: { xs: "100%", sm: "90%", md: "80%", lg: "70%" },
      margin: "0 auto",
      "& .MuiDataGrid-root": {
        borderRadius: 0,
        backgroundColor: "#ffffff",
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
        height: "100%",
        maxHeight: "100%",
        width: "100%",
      },
      "& .MuiDataGrid-columnHeaders": {
        backgroundColor: "#f5f5f5 !important",
        backgroundImage: "none !important",
        background: "#f5f5f5 !important",
        fontSize: isMobile ? "0.7rem" : isTablet ? "0.8rem" : "0.9rem",
      },
      "& .MuiDataGrid-columnHeader": {
        backgroundColor: "#f5f5f5 !important",
      },
      "& .MuiDataGrid-cell": {
        fontSize: isMobile ? "0.7rem" : isTablet ? "0.8rem" : "0.85rem",
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
    },

    // Header Box styles (for Typography and buttons)
    headerBoxStyles: {
      width: "100%",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "flex-start" : "center",
      display: "flex",
      justifyContent: "space-between",
      mb: isMobile ? 1 : 2,
      flexWrap: "wrap",
      gap: isMobile ? 0.5 : 1,
    },

    // Typography styles
    typographyStyles: {
      fontSize: isMobile ? "0.9rem" : isTablet ? "1.1rem" : "1.5rem",
      mb: isMobile ? 0.5 : 0,
      color: "#000",
    },

    // Search TextField styles
    textFieldStyles: {
      width: isMobile ? "100%" : isTablet ? "140px" : "160px",
      maxWidth: isMobile ? "160px" : "none",
      "& .MuiInputBase-root": {
        fontSize: isMobile ? "0.65rem" : isTablet ? "0.7rem" : "0.8rem",
        padding: isMobile ? "4px 8px" : isTablet ? "5px 10px" : "6px 12px",
        height: isMobile ? "28px" : isTablet ? "32px" : "36px",
      },
      "& .MuiInputBase-input": {
        padding: isMobile ? "4px 8px" : isTablet ? "5px 10px" : "6px 12px",
      },
    },

    // Button styles (Add Location and Delete Selected)
    buttonStyles: {
      padding: isMobile ? "4px 8px" : isTablet ? "5px 10px" : "6px 12px",
      fontSize: isMobile ? "0.65rem" : isTablet ? "0.75rem" : "0.875rem",
      minWidth: isMobile ? "90px" : isTablet ? "100px" : "120px",
      height: isMobile ? "28px" : isTablet ? "32px" : "36px",
    },

    // DataGrid styles
    dataGridStyles: {
      "& .MuiDataGrid-root": {
        width: "100%",
      },
      "& .MuiDataGrid-main": {
        width: "100%",
        overflowX: isMobile ? "auto" : "hidden",
      },
      "& .MuiDataGrid-row": {
        maxWidth: "100%",
        boxSizing: "border-box",
      },
      "& .MuiDataGrid-cell": {
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
    },

    // Pagination styles
    paginationBoxStyles: {
      p: 1,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? 0.5 : 0,
    },

    paginationTypographyStyles: {
      color: "#000",
      fontSize: isMobile ? "0.65rem" : isTablet ? "0.7rem" : "0.75rem",
    },

    paginationButtonStyles: {
      textTransform: "none",
      fontSize: isMobile ? "0.65rem" : isTablet ? "0.7rem" : "0.75rem",
      padding: isMobile ? "2px 4px" : isTablet ? "3px 6px" : "4px 8px",
      border: "1px solid #000",
      color: "#000",
      minWidth: isMobile ? "50px" : isTablet ? "60px" : "70px",
    },

    paginationPageButtonStyles: {
      mx: isMobile ? 0.1 : isTablet ? 0.2 : 0.3,
      textTransform: "none",
      fontSize: isMobile ? "0.6rem" : isTablet ? "0.65rem" : "0.7rem",
      padding: isMobile ? "2px 4px" : isTablet ? "3px 5px" : "4px 6px",
      minWidth: isMobile ? "30px" : isTablet ? "35px" : "40px",
    },

    // Status cell styles
    statusCellStyles: (params: any) => ({
      padding: isMobile ? "2px 8px" : "4px 12px",
      minWidth: isMobile ? "20px" : "30px",
      height: isMobile ? "20px" : "30px",
      fontSize: isMobile ? "0.7rem" : "0.85rem",
      backgroundColor:
        params.value === "Active"
          ? "#b1d2c2"
          : params.value === "Maintenance"
          ? "#FFF9C4"
          : "#ffffff",
      color:
        params.value === "Active"
          ? "#000"
          : params.value === "Maintenance"
          ? "#FFCA28"
          : "#000000",
      borderRadius: params.value === "Active" ? "45%" : "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }),

    // Confirm Dialog styles (for Delete and Multi-Delete)
    confirmDialogStyles: {
      "& .MuiDialog-paper": {
        width: isMobile ? "90%" : "100%",
        maxWidth: isMobile ? "90%" : "sm",
        height: isMobile ? "auto" : "auto",
        maxHeight: isMobile ? "70vh" : "none",
        margin: isMobile ? "16px" : "32px",
        borderRadius: isMobile ? "8px" : "12px",
        boxShadow: isMobile ? "0 4px 16px rgba(0,0,0,0.2)" : "none",
      },
    },

    // Dialog title styles
    dialogTitleStyles: {
      fontSize: isMobile ? "0.9rem" : "1.25rem",
      padding: isMobile ? "8px 16px" : "16px 24px",
    },

    // Dialog content styles
    dialogContentStyles: {
      padding: isMobile ? "16px" : "24px", // Smaller padding on mobile
      backgroundColor: "#f5f5f5",
      overflowY: isMobile ? "auto" : "visible",
    },

    // Dialog content text styles
    dialogContentTextStyles: {
      fontSize: isMobile ? "0.8rem" : "1rem",
      color: "#333",
    },

    // Dialog actions styles
    dialogActionsStyles: {
      padding: isMobile ? "4px" : "16px",
      justifyContent: "space-between",
      backgroundColor: "#f5f5f5",
    },

    // Dialog button styles
    dialogButtonStyles: {
      fontSize: isMobile ? "0.65rem" : isTablet ? "0.8rem" : "0.875rem",
      padding: isMobile ? "4px 10px" : "6px 12px",
      minWidth: isMobile ? "80px" : "100px",
    },

    // View Dialog styles
    viewDialogStyles: {
      "& .MuiDialog-paper": {
        borderRadius: isMobile ? 0 : "12px",
        padding: isMobile ? "5px" : "10px",
      },
    },

    viewDialogContentStyles: {
      p: isMobile ? 2 : 3,
      backgroundColor: "#fff",
    },

    viewDialogBoxStyles: {
      display: "flex",
      flexDirection: "column",
      gap: isMobile ? 1 : 2,
      backgroundColor: "#f9f9f9",
      padding: isMobile ? "20px" : "20px",
      borderRadius: "8px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    },

    viewDialogContentTextStyles: {
      fontSize: isMobile ? "0.8rem" : "1rem",
      color: "#333",
    },

    viewDialogButtonStyles: {
      fontSize: isMobile ? "0.7rem" : isTablet ? "0.8rem" : "1rem",
      padding: isMobile ? "6px 12px" : "8px 20px",
    },

    // No rows overlay styles
    noRowsOverlayStyles: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100%",
      fontSize: isMobile ? "1.2rem" : "1.5rem",
      color: "textSecondary",
    },

    // Loading overlay styles
    loadingOverlayStyles: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100%",
      fontSize: isMobile ? "0.8rem" : "1rem",
      color: "textSecondary",
    },

    // Snackbar Alert styles
    snackbarAlertStyles: {
      width: isMobile ? "80%" : "100%", // Smaller width on mobile
      maxWidth: isMobile ? "300px" : "none", // Cap width for better look
      fontSize: isMobile ? "0.7rem" : "0.85rem",
      margin: "0 auto", // Center the alert
    },

    // Column flex and width
    columnFlex: {
      location: isMobile ? 0.8 : 1,
      coordinates: isMobile ? 0.8 : 1,
      users: isMobile ? 0.5 : 1,
      status: isMobile ? 0.5 : 1,
      lastUpdated: isMobile ? 0.8 : 1,
      actions: isMobile ? 100 : 120,
    },

    // Dialog fullScreen
    dialogFullScreen: isMobile,
  };
};
