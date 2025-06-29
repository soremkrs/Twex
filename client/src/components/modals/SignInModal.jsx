import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Button,
  Box,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import { styled } from "@mui/material/styles";
import TXLogo from "../../assets/TXLogo.svg";
import OAuthButton from "../buttons/OAuthButton";
import DividerCenter from "../divider/DividerCenter";

// Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: "20px",
    backgroundColor: "#000",
    color: "#fff",
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2),
    width: "500px",
    height: "600px",
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

const StyledTextField = styled((props) => <TextField {...props} />)(
  ({ theme }) => ({
    "& .MuiInputBase-root": {
      backgroundColor: "#000",
      color: "#fff",
      border: "1px solid #333",
      borderRadius: 6,
      paddingLeft: 10,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#333",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#444",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#1d9bf0",
    },
    "& .MuiInputLabel-root": {
      color: "#888",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#1d9bf0",
    },
  })
);

const StyledDialogActions = styled(DialogActions)({
  padding: "16px",
  justifyContent: "center",
});

const NextButton = styled(Button)(({ theme }) => ({
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
  "&.Mui-disabled": {
    backgroundColor: "#EEEEEE", 
    color: "black",           
    cursor: "not-allowed",   
    opacity: 0.6,            
  },
}));

function CreateAccountModal() {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // Handle form input
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post("/api/auth/signin", {
        username: formData.username,
        password: formData.password,
      });

      // Optional: Save token or user info from response
      // localStorage.setItem("token", response.data.token);

      navigate("/home", {
        state: { backgroundLocation: location },
      });
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message || "Sign in failed");
      } else {
        alert("Network error");
        console.error(error);
      }
    }
  };

  const handleGoogleAuth = () => {
    // Initiate the real Google OAuth flow
    window.location.href = "/api/auth/google"; // Change this to your actual endpoint
  };

  const isFormValid =
    formData.username &&
    formData.password &&
    formData.username.length <= 20;

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
          Sign in to TweX
        </Typography>
        <OAuthButton text="Sign in with Google" onClick={handleGoogleAuth} />
        <DividerCenter />
        <StyledTextField
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          inputProps={{ maxLength: 20 }}
          fullWidth
          InputProps={{
            endAdornment: (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: "#888",
                  ml: 1,
                }}
              >
                <Typography variant="caption">
                  {formData.username.length}
                </Typography>
                <Typography variant="caption">&nbsp;/&nbsp;20</Typography>
              </Box>
            ),
          }}
        />
        <StyledTextField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
        />
      </StyledDialogContent>

      <StyledDialogActions>
        <NextButton onClick={handleSubmit} disabled={!isFormValid}>
          Next
        </NextButton>
      </StyledDialogActions>
    </StyledDialog>
  );
}

export default CreateAccountModal;
