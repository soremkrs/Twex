import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Button,
  Box,
  Menu,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import ImageIcon from "@mui/icons-material/Image";
import { useAuth } from "../../contexts/useAuthContext";
import LoadingModal from "./LoadingModal";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import axiosInstance from "../../utils/axiosConfig";

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: "20px",
    backgroundColor: "#000",
    color: "#fff",
    padding: theme.spacing(2),
    width: "600px",
  },
  "& .MuiBackdrop-root": {
    backgroundColor: "rgba(71, 71, 71, 0.75)",
  },
}));

const StyledDialogContent = styled(DialogContent)({
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  paddingTop: 0,
});

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiInputBase-root": {
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    fontSize: "18px",
    paddingLeft: 0,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
}));

const PostButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#1d9bf0",
  color: "#fff",
  fontWeight: 600,
  textTransform: "none",
  borderRadius: 30,
  width: "auto",
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

function CreatePostModal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const emojiPickerOpen = Boolean(emojiAnchorEl);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setContent((prev) => prev + emoji.native);
  };

  const handlePost = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("content", content);
      if (image) {
        formData.append("image", image);
      }

      const res = await axiosInstance.post("/create/post", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (err) {
      alert("Failed to post");
      console.error(err);
    } finally {
      setLoading(false);
      navigate(-1);
    }
  };

  return (
    <StyledDialog open onClose={() => navigate(-1)}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={1}
      >
        <IconButton onClick={() => navigate(-1)} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <StyledDialogContent>
        <Box display="flex" gap={2} alignItems="flex-start">
          <Box
            component="img"
            src={user?.avatar_url}
            alt="Avatar"
            sx={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #1d9bf0",
              mt: 0.5,
            }}
          />
          <Box flexGrow={1}>
            <StyledTextField
              placeholder="What’s happening?"
              multiline
              fullWidth
              minRows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {image && (
              <Box mt={1} borderRadius={3} overflow="hidden">
                <img
                  src={URL.createObjectURL(image)}
                  alt="preview"
                  style={{
                    width: "100%",
                    maxHeight: "400px",
                    objectFit: "cover",
                    borderRadius: "16px",
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
        {/* Divider line */}
        <Box
          mt={2}
          mb={1}
          sx={{
            height: "1px",
            backgroundColor: "#333",
            width: "100%",
          }}
        />

        {/* Action bar: icons + post button */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          px={1}
        >
          <Box display="flex" gap={1} alignItems="center">
            <IconButton component="label">
              <ImageIcon sx={{ color: "#1d9bf0" }} />
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </IconButton>
            <IconButton onClick={(e) => setEmojiAnchorEl(e.currentTarget)}>
              <EmojiEmotionsIcon sx={{ color: "#f4c542" }} />
            </IconButton>
          </Box>
          <PostButton onClick={handlePost} disabled={!content.trim()}>
            Post
          </PostButton>
          <Menu
            anchorEl={emojiAnchorEl}
            open={emojiPickerOpen}
            onClose={() => setEmojiAnchorEl(null)}
            PaperProps={{
              style: {
                backgroundColor: "#1a1a1a",
                borderRadius: 12,
                overflow: "visible",
              },
            }}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
          >
            <Picker
              data={data}
              onEmojiSelect={(emoji) => {
                setContent((prev) => prev + emoji.native);
                // setEmojiAnchorEl(null); // auto-close after selection
              }}
              theme="dark"
            />
          </Menu>
        </Box>
      </StyledDialogContent>
      <LoadingModal Open={loading} Message="Posting..." />
    </StyledDialog>
  );
}

export default CreatePostModal;
