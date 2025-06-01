import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  TextField,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onClose: () => void;
  graphicData: any;
  onSave: (updatedData: { name: string; description: string }) => void;
}

export default function GraphicEditDrawer({
  open,
  onClose,
  graphicData,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    if (graphicData) {
      setName(graphicData.attributes?.name || "");
      setDescription(graphicData.attributes?.description || "");
    }
  }, [graphicData]);

  const handleSave = () => {
    onSave({ name, description });
    onClose();
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box p={3} width={300}>
        <Typography variant="h6" gutterBottom>

         {t("Edit Drawing Data") || "تعديل بيانات الرسم"}
        </Typography>
        <Stack spacing={2}>
          <TextField
            label= {t("Name ") || "الاسم "}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
          <TextField
            label= {t("Description ") || "الوصف "}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
          <Button variant="contained" onClick={handleSave}>
            {t("Save بببببببببببChanges") || "حفظ التعديلات"}
            
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
