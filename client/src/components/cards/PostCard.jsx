import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  Avatar,
  CardActions,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { styled } from "@mui/material/styles";

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: "#000",
  color: "#fff",
  borderBottom: "1px solid #2f2f2f",
  borderRadius: 0,
}));

function PostCard({ post, currentUserId, onDelete }) {
  const {
    id,
    content,
    image_url,
    date,
    username,
    real_name,
    avatar_url,
    total_likes,
    total_comments,
    liked_by_current_user,
    user_id,
  } = post;

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleDelete = () => {
    handleMenuClose();
    onDelete(id);
  };

  const isMyPost = user_id === currentUserId;

  return (
    <StyledCard>
      <CardHeader
        avatar={<Avatar src={avatar_url} />}
        action={
          <>
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon sx={{ color: "#fff" }} />
            </IconButton>
            <Menu
              open={open}
              anchorEl={anchorEl}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              PaperProps={{
                sx: {
                  mt: -1,
                  backgroundColor: "#000",
                  borderRadius: 2,
                  color: "#fff",
                  boxShadow: "0 0 10px 5px rgba(255, 255, 255, 0.39)",
                  minWidth: 220,
                  overflow: "visible",
                  position: "absolute",
                },
              }}
            >
              {isMyPost ? (
                <>
                  <MenuItem
                    onClick={handleMenuClose}
                    sx={{
                      fontWeight: 500,
                      "&:hover": {
                        backgroundColor: "#111",
                      },
                    }}
                  >
                    Edit
                  </MenuItem>
                  <MenuItem
                    onClick={handleDelete}
                    sx={{
                      fontWeight: 500,
                      "&:hover": {
                        backgroundColor: "#111",
                      },
                    }}
                  >
                    Delete
                  </MenuItem>
                </>
              ) : (
                <MenuItem
                  onClick={handleMenuClose}
                  sx={{
                    fontWeight: 500,
                    "&:hover": {
                      backgroundColor: "#111",
                    },
                  }}
                >
                  Follow @{username}
                </MenuItem>
              )}
            </Menu>
          </>
        }
        title={
          <Typography fontWeight="bold" color="#fff">
            {real_name}
          </Typography>
        }
        subheader={
          <Typography variant="body2" color="#ccc">
            @{username} · {date}
          </Typography>
        }
      />

      <CardContent>
        <Typography variant="body1" color="#fff" whiteSpace="pre-wrap">
          {content}
        </Typography>
        {image_url && (
          <CardMedia
            component="img"
            image={image_url}
            alt="Post image"
            sx={{ borderRadius: 4, marginTop: 2 }}
          />
        )}
      </CardContent>

      <CardActions disableSpacing>
        <IconButton>
          <FavoriteIcon
            sx={{ color: liked_by_current_user ? "#e0245e" : "#888" }}
          />
        </IconButton>
        <Typography variant="body2" color="#ccc">
          {total_likes}
        </Typography>

        <IconButton>
          <ChatBubbleOutlineIcon sx={{ color: "#888" }} />
        </IconButton>
        <Typography variant="body2" color="#ccc">
          {total_comments}
        </Typography>

        <IconButton sx={{ marginLeft: "auto" }}>
          <BookmarkBorderIcon sx={{ color: "#888" }} />
        </IconButton>
      </CardActions>
    </StyledCard>
  );
}

export default PostCard;
