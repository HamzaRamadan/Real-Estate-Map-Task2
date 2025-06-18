import {type SxProps,type Theme } from "@mui/material";

interface StylesProps {
  isMidRange: boolean;
}

export const getResponsiveStyles = ({ isMidRange }: StylesProps): Record<string, SxProps<Theme>> => ({
  container: {
    backgroundColor: "#fdfdfd",
    display: "flex",
    flexDirection: "column",
    gap: 0,
    width: "100%",
    maxWidth: "100vw",
    minWidth: 0,
    height: "100%",
    border: "1px solid #e0e0e0",
    borderRadius: 4,
    margin: 0,
    padding: 0,
  } as SxProps<Theme>,
  mapHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    p: 1,
    borderBottom: "none",
  } as SxProps<Theme>,
  mapTitle: {
    fontSize: { xs: "1rem", sm: "1.2rem" },
    fontWeight: "bold",
    color: "#2c3e50",
  } as SxProps<Theme>,
  buttonContainer: {
    display: "flex",
    alignItems: "center",
    gap: isMidRange ? 1 : 2,
  } as SxProps<Theme>,
  button: {
    backgroundColor: "#f5f5f5",
    color: "#000",
    border: "1px solid #f5f5f5",
    borderRadius: 3,
    padding: isMidRange ? "3px 8px" : "4px 12px",
    cursor: "pointer",
    fontSize: isMidRange ? "0.75rem" : "0.875rem",
    fontWeight: 600,
    textTransform: "none",
    display: "flex",
    alignItems: "center",
    "&:hover": {
      backgroundColor: "#bcc7ce",
      border: "1px solid #bcc7ce",
    },
  } as SxProps<Theme>,
  drawDeleteButton: {
    display: { xs: "none", sm: "flex" },
  } as SxProps<Theme>,
  mapDiv: {
    height: { xs: "100%", sm: "100%" },
    width: "100%",
    maxWidth: "100%",
    position: "relative",
    minHeight: "300px",
    mt: 0,
  } as SxProps<Theme>,
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: (theme: Theme) => theme.zIndex.drawer + 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  } as SxProps<Theme>,
  backdropTypography: {
    color: "#fff",
    mt: 2,
    fontSize: { xs: "1rem", sm: "1.2rem" },
    textAlign: "center",
  } as SxProps<Theme>,
  dialog: {
    "& .MuiDialog-paper": {
      maxWidth: "sm",
      width: "100%",
    },
  } as SxProps<Theme>,
  dialogTitle: {
    backgroundColor: "#f5f5f5",
    color: "#d32f2f",
  } as SxProps<Theme>,
  dialogContent: {
    p: 3,
    backgroundColor: "#f5f5f5",
  } as SxProps<Theme>,
  dialogContentText: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "20px",
  } as SxProps<Theme>,
  dialogActions: {
    p: 2,
    backgroundColor: "#f5f5f5",
  } as SxProps<Theme>,
  snackbar: {
    width: "100%",
  } as SxProps<Theme>,
  alert: {
    width: "100%",
  } as SxProps<Theme>,
});