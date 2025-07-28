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

function PostCard({
  post,
  currentUserId,
  onDelete,
  onEdit,
  refreshPosts,
  onReply,
  viewReply,
  variant = "default", // "default" | "reply"
  hideActions = false,
  onUnbookmark,
  passUsername,
  hideViewRepliesButton = false,
}) {
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
    parent,
  } = post;

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [liked, setLiked] = React.useState(liked_by_current_user);
  const [bookmarked, setBookmarked] = React.useState(
    post.bookmarked_by_current_user
  );

  const open = Boolean(anchorEl);
  const isMyPost = user_id === currentUserId;

  React.useEffect(() => {
    if (!user_id || isMyPost || variant === "reply") return;

    axiosInstance
      .get(`/following/${user_id}`)
      .then((res) => {
        setIsFollowing(res.data.isFollowing);
      })
      .catch((err) => console.error("Follow check error", err));
  }, [user_id, isMyPost, variant]);

  React.useEffect(() => {
    setLiked(liked_by_current_user);
  }, [liked_by_current_user]);

  React.useEffect(() => {
    setBookmarked(post.bookmarked_by_current_user);
  }, [post.bookmarked_by_current_user]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleEdit = () => {
    handleMenuClose();
    onEdit(id);
  };
  const handleDeletePost = async () => {
    handleMenuClose();
    try {
      await axiosInstance.delete(`/delete/post/${id}`);
      onDelete?.(id);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleFollowToggle = () => {
    const endpoint = isFollowing
      ? `/unfollow/${user_id}`
      : `/follow/${user_id}`;
    const method = isFollowing ? "delete" : "post";

    axiosInstance[method](endpoint)
      .then(() => setIsFollowing(!isFollowing))
      .catch((err) => console.error("Follow toggle error", err));
    refreshPosts?.();
  };

  const handleLikeToggle = () => {
    const method = liked ? "delete" : "post";
    const url = liked ? `/unlike/${id}` : `/like/${id}`;

    axiosInstance[method](url)
      .then(() => {
        setLiked(!liked);
        refreshPosts?.(id);
      })
      .catch((err) => {
        console.error("Error toggling like", err);
      });
  };

  const handleDeleteReply = () => {
    handleMenuClose();

    axiosInstance
      .delete(`/reply/${id}`) // id is the reply's ID
      .then(() => {
        refreshPosts?.(id); // Re-fetch the parent post and its replies
      })
      .catch((err) => {
        console.error("Error deleting reply", err);
      });
  };

  const handleBookmarkToggle = async () => {
    try {
      if (bookmarked) {
        await axiosInstance.delete(`/unbookmark/${id}`);
        setBookmarked(false);
        if (onUnbookmark) onUnbookmark(id);
        refreshPosts?.(id);
      } else {
        await axiosInstance.post(`/bookmark/${id}`); // <-- URL param, no body
        setBookmarked(true);
        refreshPosts?.(id);
      }
    } catch (err) {
      console.error("Bookmark toggle error:", err);
    }
  };

  const goToProfile = ({ clickedUser, parentUser }) => {
    passUsername({ clickedUser, parentUser });
    refreshPosts?.(id);
  };

  return (
    <>
      {/* This post (either default or reply) */}
      <StyledCard sx={variant === "reply" ? { ml: 4, mt: 1 } : {}}>
        <CardHeader
          avatar={
            <Avatar
              src={avatar_url}
              sx={{ cursor: "pointer" }}
              onClick={() => goToProfile({ clickedUser: username })}
            />
          }
          action={
            (variant !== "reply" || isMyPost) && (
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
                      boxShadow: "0 0 10px 5px rgba(255, 255, 255, 0.2)",
                      minWidth: 220,
                    },
                  }}
                >
                  {variant === "reply" ? (
                    isMyPost && (
                      <MenuItem
                        key="delete"
                        onClick={handleDeleteReply}
                        sx={{
                          "&:hover": {
                            backgroundColor: "#111",
                          },
                        }}
                      >
                        Delete
                      </MenuItem>
                    )
                  ) : isMyPost ? (
                    [
                      <MenuItem
                        key="edit"
                        onClick={handleEdit}
                        sx={{
                          "&:hover": {
                            backgroundColor: "#111",
                          },
                        }}
                      >
                        Edit
                      </MenuItem>,
                      <MenuItem
                        key="delete"
                        onClick={handleDeletePost}
                        sx={{
                          "&:hover": {
                            backgroundColor: "#111",
                          },
                        }}
                      >
                        Delete
                      </MenuItem>,
                    ]
                  ) : (
                    <MenuItem
                      key="follow"
                      onClick={() => {
                        handleFollowToggle();
                        handleMenuClose();
                      }}
                      sx={{
                        "&:hover": {
                          backgroundColor: "#111",
                        },
                      }}
                    >
                      {isFollowing
                        ? `Unfollow @${username}`
                        : `Follow @${username}`}
                    </MenuItem>
                  )}

                  {variant !== "reply" && total_replies > 0 && !hideViewRepliesButton &&(
                    <MenuItem
                      key="viewReplies"
                      onClick={() => {
                        viewReply(id);
                        handleMenuClose();
                      }}
                      sx={{
                        "&:hover": {
                          backgroundColor: "#111",
                        },
                      }}
                    >
                      View replies ({total_replies})
                    </MenuItem>
                  )}
                </Menu>
              </>
            )
          }
          title={
            <Box
              onClick={() => goToProfile({ clickedUser: username })}
              sx={{ cursor: "pointer" }}
            >
              <Typography fontWeight="bold" color="#fff">
                {real_name}
              </Typography>
            </Box>
          }
          subheader={
            <Box
              onClick={() => goToProfile({ clickedUser: username })}
              sx={{ cursor: "pointer" }}
            >
              <Typography variant="body2" color="#ccc">
                @{username} · {date}
              </Typography>
            </Box>
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
        {/* Parent post preview (only in reply variant) */}
        {variant === "reply" && parent && (
          <StyledCard
            sx={{ backgroundColor: "#111", border: "1px solid #2f2f2f" }}
          >
            <CardHeader
              avatar={
                <Avatar
                  src={parent.avatar_url}
                  sx={{ cursor: "pointer" }}
                  onClick={() =>
                    goToProfile({
                      clickedUser: parent.username,
                      parentUser: username,
                    })
                  }
                />
              }
              title={
                <Box
                  onClick={() =>
                    goToProfile({
                      clickedUser: parent.username,
                      parentUser: username,
                    })
                  }
                  sx={{ cursor: "pointer" }}
                >
                  <Typography fontWeight="bold" color="#fff">
                    {parent.real_name}
                  </Typography>
                </Box>
              }
              subheader={
                <Box
                  onClick={() =>
                    goToProfile({
                      clickedUser: parent.username,
                      parentUser: username,
                    })
                  }
                  sx={{ cursor: "pointer" }}
                >
                  <Typography variant="body2" color="#ccc">
                    @{parent.username} · {parent.date}
                  </Typography>
                </Box>
              }
            />
            <CardContent>
              <Typography variant="body1" color="#ccc" whiteSpace="pre-wrap">
                {parent.content}
              </Typography>
              {parent.image_url && (
                <CardMedia
                  component="img"
                  image={parent.image_url}
                  alt="Parent image"
                  sx={{ borderRadius: 4, marginTop: 2 }}
                />
              )}
            </CardContent>
          </StyledCard>
        )}
        {/* Actions only shown on default (not reply) */}
        {variant !== "reply" && !hideActions && (
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

            <IconButton onClick={() => onReply(id)}>
              <ChatBubbleOutlineIcon sx={{ color: "#888" }} />
            </IconButton>
            <Typography variant="body2" color="#ccc">
              {total_replies}
            </Typography>

            <IconButton
              onClick={handleBookmarkToggle}
              sx={{ marginLeft: "auto" }}
            >
              <BookmarkBorderIcon
                sx={{ color: bookmarked ? "#FFD700" : "#888" }}
              />
            </IconButton>
          </CardActions>
        )}
      </StyledCard>
    </>
  );
}

export default PostCard;
