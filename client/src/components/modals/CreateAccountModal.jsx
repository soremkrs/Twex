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
import LoadingModal from "./LoadingModal";

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
  position: "absolute",
});

const Logo = styled("div")({
  flex: 1,
  display: "flex",
  justifyContent: "center",
  marginBottom: "20px",
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
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  // Handle form input
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:3000/api/auth/signup", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // Optional: Save token or user info from response
      // localStorage.setItem("token", response.data.token);
      console.log("Signup success:", response.data);

      const user = response.data.user;

      navigate("/create-profile", {
        state: { user },
      });
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message || "Signup failed");
      } else {
        alert("Network error");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.username &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword &&
    formData.username.length <= 20;

  return (
    <StyledDialog open onClose={handleClose}>
      <Header>
        <IconButton onClick={handleClose} sx={{ color: "#fff", padding: "0" }}>
          <CloseIcon />
        </IconButton>
      </Header>
      <Logo>
        <img src={TXLogo} alt="Tx Logo" height={40} />
      </Logo>

      <StyledDialogContent>
        <Typography variant="h6" fontWeight={700} marginBottom={3}>
          Create your account
        </Typography>

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
                  {formData.username.length}/20
                </Typography>
              </Box>
            ),
          }}
        />
        <StyledTextField
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
        />
        <StyledTextField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
        />
        <StyledTextField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          fullWidth
        />
      </StyledDialogContent>
      {formData.confirmPassword && formData.confirmPassword !== formData.password && (
        <Typography variant="subtitle1" sx={{ marginTop: 3, color: "red", textAlign: "center" }}> Password doesn't match! </Typography>
      )}
      <StyledDialogActions>
        <NextButton onClick={handleSubmit} disabled={!isFormValid}>
          Next
        </NextButton>
      </StyledDialogActions>
      <LoadingModal Open={loading} Message="Creating your account..."/>
    </StyledDialog> 
  );
}

export default CreateAccountModal;
