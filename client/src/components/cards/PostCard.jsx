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
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { styled } from "@mui/material/styles";
import axiosInstance from "../../utils/axiosConfig";

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: "#000",
  color: "#fff",
  borderBottom: "1px solid #2f2f2f",
  borderRadius: 0,
}));

function PostCard({ post, currentUserId, onDelete, onEdit, refreshPosts }) {
  const {
    id,
    content,
    image_url,
    date,
    username,
    real_name,
    avatar_url,
    total_likes,
    total_replies,
    liked_by_current_user,
    user_id,
  } = post;

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [liked, setLiked] = React.useState(liked_by_current_user);
  const [totalLikes, setTotalLikes] = React.useState(total_likes);

  const open = Boolean(anchorEl);
  const isMyPost = user_id === currentUserId;

  // Check if current user follows the post's author
  React.useEffect(() => {
    if (!isMyPost) {
      axiosInstance
        .get(`/following/${user_id}`)
        .then((res) => {
          setIsFollowing(res.data.isFollowing);
        })
        .catch((err) => {
          console.error("Error checking follow status", err);
        });
    }
  }, [user_id, isMyPost]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleEdit = () => {
    handleMenuClose();
    onEdit(id);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete(id);
  };

  const handleFollowToggle = () => {
    const endpoint = isFollowing
      ? `/unfollow/${user_id}`
      : `/follow/${user_id}`;
    const method = isFollowing ? "delete" : "post";

    axiosInstance[method](endpoint)
      .then(() => setIsFollowing(!isFollowing))
      .catch((err) => console.error("Follow toggle error", err));
  };

  const handleLikeToggle = () => {
    const method = liked ? "delete" : "post";
    const url = liked ? `/unlike/${id}` : `/like/${id}`;

    axiosInstance[method](url)
      .then(() => {
        setLiked(!liked);
        refreshPosts?.();
      })
      .catch((err) => {
        console.error("Error toggling like", err);
      });
  };

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
                [
                  <MenuItem
                    key="edit"
                    onClick={handleEdit}
                    sx={{
                      fontWeight: 500,
                      "&:hover": { backgroundColor: "#111" },
                    }}
                  >
                    Edit
                  </MenuItem>,
                  <MenuItem
                    key="delete"
                    onClick={handleDelete}
                    sx={{
                      fontWeight: 500,
                      "&:hover": { backgroundColor: "#111" },
                    }}
                  >
                    Delete
                  </MenuItem>,
                ]
              ) : (
                <MenuItem
                  onClick={() => {
                    handleFollowToggle();
                    handleMenuClose();
                  }}
                  sx={{
                    fontWeight: 500,
                    "&:hover": { backgroundColor: "#111" },
                  }}
                >
                  {isFollowing
                    ? `Unfollow @${username}`
                    : `Follow @${username}`}
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
        <IconButton onClick={handleLikeToggle}>
          {liked ? (
            <FavoriteIcon sx={{ color: "#e0245e" }} />
          ) : (
            <FavoriteBorderIcon sx={{ color: "#888" }} />
          )}
        </IconButton>
        <Typography variant="body2" color="#ccc">
          {total_likes}
        </Typography>

        <IconButton>
          <ChatBubbleOutlineIcon sx={{ color: "#888" }} />
        </IconButton>
        <Typography variant="body2" color="#ccc">
          {total_replies}
        </Typography>

        <IconButton sx={{ marginLeft: "auto" }}>
          <BookmarkBorderIcon sx={{ color: "#888" }} />
        </IconButton>
      </CardActions>
    </StyledCard>
  );
}

export default PostCard;
