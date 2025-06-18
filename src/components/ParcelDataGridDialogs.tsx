import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { type SxProps, type Theme } from "@mui/material";

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

interface DialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  data?: PopulationData | null;
  onChange?: (key: keyof PopulationData, value: string | number) => void;
  styles: Record<string, SxProps<Theme>>;
}

export const DeleteDialog: React.FC<DialogProps> = ({
  open,
  onClose,
  onConfirm,
  styles,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      sx={styles.dialog}
    >
      <DialogTitle sx={styles.dialogTitle}>{t("confirmDelete")}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={styles.dialogContentText}>
          {t("areYouSure")}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <Button onClick={onClose} sx={styles.dialogButton}>
          {t("close")}
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          sx={styles.dialogButton}
        >
          {t("delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const MultiDeleteDialog: React.FC<DialogProps & { count: number }> = ({
  open,
  onClose,
  onConfirm,
  count,
  styles,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      sx={styles.dialog}
    >
      <DialogTitle sx={styles.dialogTitle}>{t("confirmMultiDelete")}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={styles.dialogContentText}>
          {t("areYouSureMultiDelete")} {count}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <Button onClick={onClose} sx={styles.dialogButton}>
          {t("close")}
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          sx={styles.dialogButton}
        >
          {t("delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const ViewDialog: React.FC<DialogProps> = ({
  open,
  onClose,
  data,
  styles,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={styles.dialog}
    >
      <DialogTitle sx={styles.dialogTitle}>{t("LocationDetails")}</DialogTitle>
      <DialogContent>
        {data && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={styles.viewDetailsText}>
              {t("location")}: {data.location}
            </Typography>
            <Typography variant="body2" sx={styles.viewDetailsText}>
              {t("region")}: {data.region}
            </Typography>
            <Typography variant="body2" sx={styles.viewDetailsText}>
              {t("coordinates")}: {data.coordinates}
            </Typography>
            <Typography variant="body2" sx={styles.viewDetailsText}>
              {t("users")}: {data.users.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={styles.viewDetailsText}>
              {t("status")}: {data.status}
            </Typography>
            <Typography variant="body2" sx={styles.viewDetailsText}>
              {t("lastUpdated")}: {data.lastUpdated}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <Button onClick={onClose} sx={styles.dialogButton}>
          {t("close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const EditDialog: React.FC<DialogProps> = ({
  open,
  onClose,
  onConfirm,
  data,
  onChange,
  styles,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={styles.dialog}
    >
      <DialogTitle sx={styles.dialogTitle}>{t("editLocation")}</DialogTitle>
      <DialogContent>
        <Box sx={styles.dialogContentBox}>
          <TextField
            label={t("location")}
            value={data?.location || ""}
            onChange={(e) => onChange?.("location", e.target.value)}
            fullWidth
            size="small"
            sx={styles.textField}
          />
          <TextField
            label={t("region")}
            value={data?.region || ""}
            onChange={(e) => onChange?.("region", e.target.value)}
            fullWidth
            size="small"
            sx={styles.textField}
          />
          <TextField
            label={t("coordinates")}
            value={data?.coordinates || ""}
            onChange={(e) => onChange?.("coordinates", e.target.value)}
            fullWidth
            size="small"
            sx={styles.textField}
          />
          <TextField
            label={t("users")}
            type="number"
            value={data?.users || 0}
            onChange={(e) => onChange?.("users", parseInt(e.target.value) || 0)}
            fullWidth
            size="small"
            sx={styles.textField}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <Button onClick={onClose} sx={styles.dialogButton}>
          {t("cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={styles.dialogButton}
        >
          {t("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const AddDialog: React.FC<DialogProps> = ({
  open,
  onClose,
  onConfirm,
  data,
  onChange,
  styles,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={styles.dialog}
    >
      <DialogTitle sx={styles.dialogTitle}>{t("addLocation")}</DialogTitle>
      <DialogContent>
        <Box sx={styles.dialogContentBox}>
          <TextField
            label={t("location")}
            value={data?.location || ""}
            onChange={(e) => onChange?.("location", e.target.value)}
            fullWidth
            size="small"
            sx={styles.textField}
          />
          <TextField
            label={t("region")}
            value={data?.region || ""}
            onChange={(e) => onChange?.("region", e.target.value)}
            fullWidth
            size="small"
            sx={styles.textField}
          />
          <TextField
            label={t("coordinates")}
            value={data?.coordinates || ""}
            onChange={(e) => onChange?.("coordinates", e.target.value)}
            fullWidth
            size="small"
            sx={styles.textField}
          />
          <TextField
            label={t("users")}
            type="number"
            value={data?.users || 0}
            onChange={(e) => onChange?.("users", parseInt(e.target.value) || 0)}
            fullWidth
            size="small"
            sx={styles.textField}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <Button onClick={onClose} sx={styles.dialogButton}>
          {t("cancel")}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={styles.dialogButton}
        >
          {t("add")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};