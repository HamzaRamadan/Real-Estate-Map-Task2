// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { SnackbarProvider, useSnackbar } from "notistack";
import { setSnackbarRef } from "./pages/notifier.ts";
import "./i18n"; 

// عنصر وسيط داخل الـ SnackbarProvider لتسجيل المرجع
const SnackbarInitializer = ({ children }: { children: React.ReactNode }) => {
  const { enqueueSnackbar } = useSnackbar();
  React.useEffect(() => {
    setSnackbarRef(enqueueSnackbar);
  }, [enqueueSnackbar]);

  return <>{children}</>;
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      autoHideDuration={3000}
    >
      <SnackbarInitializer>
        <App />
      </SnackbarInitializer>
    </SnackbarProvider>
  </React.StrictMode>
);
