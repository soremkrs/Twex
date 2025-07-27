import React from "react";
import { Dialog, DialogContent, Box, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: "20px",
    backgroundColor: "#000",
    color: "#fff",
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2),
    width: "500px",
    height: "600px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  "& .MuiBackdrop-root": {
    backgroundColor: "rgba(71, 71, 71, 0.75)",
  },
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
}));

function LoadingModal({ Open, Message }) {
  return (
    <StyledDialog open={Open}>
      <StyledDialogContent>
        <CircularProgress size={40} color="primary" />
        <Typography
          variant="subtitle1"
          sx={{ marginTop: 3, color: "#ccc", textAlign: "center" }}
        >
          {Message}
        </Typography>
      </StyledDialogContent>
    </StyledDialog>
  );
}

export default LoadingModal;