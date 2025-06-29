import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import TXLogo from "../../assets/TXLogo.svg";
import OAuthButton from "../buttons/OAuthButton";

// Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: "20px",
    backgroundColor: "#000",
    color: "#fff",
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2),
    width: "500px",
    height: "500px",
  },
  "& .MuiBackdrop-root": {
    backgroundColor: "rgba(71, 71, 71, 0.75)",
  },
}));

const Header = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "6px 16px 0",
  marginBottom: "30px",
});

const Logo = styled("div")({
  flex: 1,
  display: "flex",
  justifyContent: "center",
});

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  paddingTop: 0,
  width: "350px",
  margin: "auto",
}));

const StyledDialogActions = styled(DialogActions)({
  padding: "16px",
  justifyContent: "center",
});

const CancelButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#1d9bf0",
  color: "#fff",
  fontWeight: 600,
  textTransform: "none",
  borderRadius: 30,
  width: "300px",
  padding: "5px 0px",
  "&:hover": {
    backgroundColor: "#1a8cd8",
  },
}));

function OAuthModal() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1);
  };

  const handleGoogleAuth = () => {
    // Initiate the real Google OAuth flow
    window.location.href = "/api/auth/google"; // Change this to your actual endpoint
  };

  return (
    <StyledDialog open onClose={handleClose}>
      <Header>
        <IconButton onClick={handleClose} sx={{ color: "#fff", padding: "0" }}>
          <CloseIcon />
        </IconButton>
        <Logo>
          <img src={TXLogo} alt="Tx Logo" height={40} />
        </Logo>
        <Box width={40} /> {/* Spacer for symmetry */}
      </Header>

      <StyledDialogContent>
        <Typography variant="h6" fontWeight={700} marginBottom={3}>
          Continue with Google
        </Typography>
        <OAuthButton text="Sign in with Google" onClick={handleGoogleAuth} />
        <Typography
          variant="body2"
          textAlign="center"
          color="#999"
          mt={2}
        >
          You’ll be redirected to Google to complete sign-in.
        </Typography>
      </StyledDialogContent>

      <StyledDialogActions>
        <CancelButton onClick={handleClose}>
          Cancel
        </CancelButton>
      </StyledDialogActions>
    </StyledDialog>
  );
}

export default OAuthModal;