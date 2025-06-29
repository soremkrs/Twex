import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogActions,
  IconButton, TextField, Button, Box, Typography,
  MenuItem
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import TXLogo from "../../assets/TXLogo.svg";
import LoadingModal from "./LoadingModal";

// Replace with your real avatar paths
const availableAvatars = [
  "../../assets/avatars/1.png",
  "../../assets/avatars/2.png",
  "../../assets/avatars/3.png",
  "../../assets/avatars/4.png",
  "../../assets/avatars/5.png",
  "../../assets/avatars/6.png",
  "../../assets/avatars/7.png",
  "../../assets/avatars/8.png",
  "../../assets/avatars/9.png",
  "../../assets/avatars/10.png",
];

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
}));

function CreateProfileModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = location.state || {}; // Get user data from previous step

  const [formData, setFormData] = useState({
    realName: "",
    avatar: availableAvatars[0],
    dateOfBirth: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      alert("Missing user info");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`http://localhost:3000/api/profile/${user.id}`, {
        real_name: formData.realName,
        avatar_url: formData.avatar,
        date_of_birth: formData.dateOfBirth,
        bio: formData.bio,
      });

      navigate("/home");
    } catch (err) {
      alert("Failed to save profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledDialog open>
      <Header>
        <IconButton onClick={() => navigate(-1)} sx={{ color: "#fff", padding: "0" }}>
          <CloseIcon />
        </IconButton>
        <Logo>
          <img src={TXLogo} alt="Tx Logo" height={40} />
        </Logo>
        <Box width={40} />
      </Header>

      <StyledDialogContent>
        <Typography variant="h6" fontWeight={700} marginBottom={3}>
          Complete your profile
        </Typography>

        <StyledTextField
          label="Name"
          name="realName"
          value={formData.realName}
          onChange={handleChange}
          inputProps={{ maxLength: 20 }}
          fullWidth
          InputProps={{
            endAdornment: (
              <Typography variant="caption" sx={{ color: "#888", ml: 1 }}>
                {formData.realName.length} / 20
              </Typography>
            ),
          }}
        />

        <StyledTextField
          select
          label="Avatar"
          name="avatar"
          value={formData.avatar}
          onChange={handleChange}
          fullWidth
        >
          {availableAvatars.map((url) => (
            <MenuItem key={url} value={url}>
              <Box display="flex" alignItems="center" gap={2}>
                <img src={url} alt="avatar" height={30} style={{ borderRadius: "50%" }} />
                <span>{url.split("/").pop()}</span>
              </Box>
            </MenuItem>
          ))}
        </StyledTextField>

        <StyledTextField
          label="Date of Birth"
          name="dateOfBirth"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={formData.dateOfBirth}
          onChange={handleChange}
          fullWidth
        />

        <StyledTextField
          label="Bio"
          name="bio"
          multiline
          rows={3}
          inputProps={{ maxLength: 250 }}
          value={formData.bio}
          onChange={handleChange}
          fullWidth
          InputProps={{
            endAdornment: (
              <Typography variant="caption" sx={{ color: "#888", ml: 1 }}>
                {formData.bio.length} / 250
              </Typography>
            ),
          }}
        />
      </StyledDialogContent>

      <StyledDialogActions>
        <NextButton onClick={handleSubmit} disabled={!formData.realName}>
          Finish
        </NextButton>
      </StyledDialogActions>

      <LoadingModal Open={loading} Message="Saving your profile..." />
    </StyledDialog>
  );
}

export default CreateProfileModal;