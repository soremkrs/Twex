import React from "react";
import { Snackbar, Box } from "@mui/material";

function CustomSnackbar({ open, message, onClose }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Box
        sx={{
          backgroundColor: "#4A99E9",
          color: "#fff",
          px: 3,
          py: 1.5,
          borderRadius: "100px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          fontSize: "1rem",
        }}
      >
        {message}
      </Box>
    </Snackbar>
  );
}

export default CustomSnackbar;
