import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosConfig";
import TXLogo from "../../assets/TXLogo.svg";
import LoadingModal from "./LoadingModal";
import { useAuth } from "../../contexts/useAuthContext";

const availableAvatars = [
  "/avatars/default_avatar.svg",
  "/avatars/1.png",
  "/avatars/2.png",
  "/avatars/3.png",
  "/avatars/4.png",
  "/avatars/5.png",
  "/avatars/6.png",
  "/avatars/7.png",
  "/avatars/8.png",
  "/avatars/9.png",
  "/avatars/10.png",
];

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: "20px",
    backgroundColor: "#000",
    color: "#fff",
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2),
    width: "800px",
    height: "800px",
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
  width: "500px",
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
    "& .MuiSelect-icon": {
      color: "#fff",
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
  width: "450px",
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

function CreateProfileModal() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    realName: "",
    avatar: availableAvatars[0],
    dateOfBirth: "",
    bio: "",
  });

  const [loading, setLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(availableAvatars[0]);
  const [signupError, setSignupError] = useState("");

  const [hide, setHide] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleSubmit = async () => {
    setSignupError("");
    if (!user?.id) {
      setSignupError("Missing user info");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post(`/profile/${user.id}`, {
        real_name: formData.realName,
        avatar_url: formData.avatar,
        date_of_birth: formData.dateOfBirth,
        bio: formData.bio,
      });

      setHide(true);
      navigate("/home");
    } catch (err) {
      setSignupError("Failed to save profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.realName &&
    formData.dateOfBirth &&
    formData.bio &&
    formData.realName.length <= 20;

  if (loading) {
    return <LoadingModal Open={loading} Message="Saving your profile..." />;
  }

  return (
    <StyledDialog open={!hide} onClose={handleClose}>
      <Header>
        <IconButton
          onClick={handleClose}
          sx={{ color: "#fff", padding: "0" }}
        >
          <CloseIcon />
        </IconButton>
      </Header>
      <Logo>
        <img src={TXLogo} alt="Tx Logo" height={40} />
      </Logo>

      {/* Avatar Preview */}
      <Box display="flex" justifyContent="center" mt={1} mb={2}>
        <Box
          component="img"
          src={selectedAvatar}
          alt="Selected Avatar"
          sx={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            border: "2px solid #1d9bf0",
            objectFit: "cover",
          }}
        />
      </Box>

      <StyledDialogContent>
        <Typography variant="h6" fontWeight={700} marginBottom={2}>
          Complete your profile
        </Typography>

        <StyledTextField
          label="Name"
          name="realName"
          id="realName"
          autoComplete="given-name"
          value={formData.realName}
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
                  {formData.realName.length}/20
                </Typography>
              </Box>
            ),
          }}
        />

        <StyledTextField
          select
          label="Avatar"
          name="avatar"
          id="avatar"
          autoComplete="off"
          value={formData.avatar}
          onChange={(e) => {
            const avatarUrl = e.target.value;
            setFormData((prev) => ({ ...prev, avatar: avatarUrl }));
            setSelectedAvatar(avatarUrl); // update preview
          }}
          slotProps={{
            input: { id: "avatar-select-one" },
            inputLabel: { htmlFor: "avatar-select-one" },
          }}
          fullWidth
        >
          {availableAvatars.map((url, index) => (
            <MenuItem key={index} value={url}>
              <Box display="flex" alignItems="center" gap={2}>
                <img
                  src={url}
                  alt="avatar"
                  height={30}
                  style={{ borderRadius: "50%" }}
                />
                <div>{url.split("/").pop().replace(".png", "")}</div>
              </Box>
            </MenuItem>
          ))}
        </StyledTextField>

        <StyledTextField
          label="Date of Birth"
          name="dateOfBirth"
          id="dateOfBirth"
          autoComplete="off"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={formData.dateOfBirth}
          onChange={handleChange}
          fullWidth
        />

        <StyledTextField
          label="Bio"
          name="bio"
          id="bio"
          autoComplete="off"
          multiline
          rows={7}
          inputProps={{ maxLength: 250 }}
          value={formData.bio}
          onChange={handleChange}
          fullWidth
          InputProps={{
            endAdornment: (
              <Box
                sx={{
                  display: "flex",
                  color: "#888",
                  ml: 1,
                }}
              >
                <Typography variant="caption">
                  {formData.bio.length}/250
                </Typography>
              </Box>
            ),
          }}
        />
      </StyledDialogContent>
      {signupError && (
        <Typography
          variant="subtitle1"
          sx={{ color: "red", textAlign: "center", mt: 1 }}
        >
          {signupError}
        </Typography>
      )}
      <StyledDialogActions>
        <NextButton onClick={handleSubmit} disabled={!isFormValid}>
          Finish
        </NextButton>
      </StyledDialogActions>
    </StyledDialog>
  );
}

export default CreateProfileModal;
