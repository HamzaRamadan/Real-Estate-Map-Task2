import {type SxProps,type Theme } from "@mui/material";

interface StylesProps {
  isMidRange: boolean;
}
// @ts-ignore
export const getResponsiveStyles = ({ isMidRange }: StylesProps): Record<string, SxProps<Theme>> => ({
  container: {
    width: "100%",
    mt: 2,
    backgroundColor: "#fff",
     padding: {
      xs: "20px 0", // For small screens (mobile)
      sm: "20px 0", // For small screens (mobile)
      md: "20px 20px", // For medium and larger screens
    },
    borderRadius: "10px",
    maxWidth: { md: "80%" },
    margin: "0 auto",
  } as SxProps<Theme>,
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    mb: 2,
    flexWrap: "wrap",
    gap: 1,
    flexDirection: { xs: "column", sm: "row" },
    alignItems: { xs: "center", sm: "center" }, // بس الـ responsive واحدة
    px: { xs: 1, sm: 0 },
  } as SxProps<Theme>,
  title: {
    fontSize: { xs: "1rem", sm: "1.2rem", md: "1.5rem" },
    mb: { xs: 1, sm: 0 },
    color: "#000",
    textAlign: { xs: "center", sm: "left" },
    width: { xs: "100%", sm: "auto" },
    fontWeight: "bold",
  } as SxProps<Theme>,
  buttonContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 1,
    width: { xs: "100%", sm: "auto" },
  } as SxProps<Theme>,
  searchField: {
    flex: { xs: 1, sm: "0 0 200px" },
    minWidth: { xs: "120px", sm: "200px" },
    "& .MuiInputBase-root": {
      fontSize: { xs: "0.8rem", sm: "0.875rem" },
    },
  } as SxProps<Theme>,
  addButton: {
    padding: { xs: "4px 8px", sm: "6px 12px" },
    fontSize: { xs: "0.7rem", sm: "0.875rem" },
    minWidth: { xs: "120px", sm: "120px" },
    height: { xs: "32px", sm: "36px" },
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    textTransform: "none",
  } as SxProps<Theme>,
  deleteSelectedButton: {
    padding: { xs: "4px 8px", sm: "6px 12px" },
    fontSize: { xs: "0.7rem", sm: "0.875rem" },
    minWidth: { xs: "120px", sm: "120px" },
    height: { xs: "32px", sm: "36px" },
    borderRadius: "6px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    textTransform: "none",
  } as SxProps<Theme>,
  dataGrid: {
    borderRadius: 0,
    backgroundColor: "#ffffff",
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
    maxHeight: { xs: "400px", sm: "500px", md: "600px" },
    overflow: "auto",
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
    "& .MuiDataGrid-footerContainer": {
      display: "none",
    },
    "& .MuiDataGrid-virtualScroller": {
      overflowX: "auto",
    },
    "@media (max-width: 768px)": {
      "& .MuiDataGrid-virtualScroller::-webkit-scrollbar": {
        height: "4px",
      },
      "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track": {
        backgroundColor: "#f1f1f1",
      },
      "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb": {
        backgroundColor: "#c1c1c1",
        borderRadius: "2px",
      },
    },
  } as SxProps<Theme>,
  paginationContainer: {
    p: { xs: 0.5, sm: 1 },
    display: "flex",
    flexDirection: { xs: "column", sm: "row" },
    justifyContent: { xs: "center", sm: "space-between" },
    alignItems: "center",
    gap: { xs: 1, sm: 0 },
    border: "none",
  } as SxProps<Theme>,
  paginationText: {
    color: "#000",
    fontSize: { xs: "0.65rem", sm: "0.75rem" },
    textAlign: { xs: "center", sm: "left" },
  } as SxProps<Theme>,
  paginationButtonContainer: {
    display: "flex",
    alignItems: "center",
    gap: { xs: 0.5, sm: 1 },
    flexWrap: "wrap",
    justifyContent: "center",
    border: "none",
  } as SxProps<Theme>,
  paginationPrevNextButton: {
    textTransform: "none",
    fontSize: { xs: "0.6rem", sm: "0.7rem", md: "0.75rem" },
    padding: { xs: "2px 4px", sm: "4px 8px", md: "6px 12px" },
    border: "none",
    color: "#000",
    minWidth: { xs: "50px", sm: "60px", md: "80px" },
    borderRadius: "4px",
    backgroundColor: "#1976D2",
  } as SxProps<Theme>,
  paginationPageButton: {
    mx: { xs: 0.1, sm: 0.3, md: 0.5 },
    textTransform: "none",
    fontSize: { xs: "0.6rem", sm: "0.7rem", md: "0.75rem" },
    padding: { xs: "2px 4px", sm: "4px 6px", md: "6px 8px" },
    minWidth: { xs: "30px", sm: "35px", md: "40px" },
    borderRadius: "4px",
    border: "none",
  } as SxProps<Theme>,
  statusBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  } as SxProps<Theme>,
  snackbar: {
    width: { xs: "80%", sm: "auto" },
    maxWidth: { xs: "350px", sm: "600px" },
    margin: "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    "& .MuiSnackbarContent-root": {
      fontSize: { xs: "0.75rem", sm: "0.875rem" },
      padding: { xs: "8px 16px", sm: "12px 24px" },
    },
  } as SxProps<Theme>,
  alert: {
    width: "90%",
    fontSize: { xs: "0.75rem", sm: "0.875rem" },
    display: "flex",
    justifyContent: "center",
    textAlign: "center",
  } as SxProps<Theme>,
  dialog: {
    "& .MuiDialog-paper": {
      margin: { xs: "16px", sm: "32px" },
      width: { xs: "calc(100% - 32px)", sm: "auto" },
    },
  } as SxProps<Theme>,
  dialogTitle: {
    fontSize: { xs: "1rem", sm: "1.25rem" },
  } as SxProps<Theme>,
  dialogContentText: {
    fontSize: { xs: "0.8rem", sm: "0.875rem" },
  } as SxProps<Theme>,
  dialogActions: {
    padding: { xs: "8px 16px", sm: "16px 24px" },
  } as SxProps<Theme>,
  dialogButton: {
    fontSize: { xs: "0.75rem", sm: "0.875rem" },
  } as SxProps<Theme>,
  viewDetailsText: {
    mb: 1,
    fontSize: { xs: "0.8rem", sm: "0.875rem" },
    fontWeight: "bold",
  } as SxProps<Theme>,
  dialogContentBox: {
    mt: 2,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  } as SxProps<Theme>,
  textField: {
    "& .MuiInputLabel-root": {
      fontSize: { xs: "0.8rem", sm: "0.875rem" },
    },
    "& .MuiInputBase-input": {
      fontSize: { xs: "0.8rem", sm: "0.875rem" },
    },
  } as SxProps<Theme>,
});