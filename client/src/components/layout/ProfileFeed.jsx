import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Fab,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import axiosInstance from "../../utils/axiosConfig";
import LoadingModal from "../modals/LoadingModal";
import PostCard from "../cards/PostCard";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuthContext";
import SecondUserCard from "../cards/SecondUserCard";

const ProfileContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  maxWidth: "600px",
  paddingBottom: theme.spacing(10),
  minHeight: "100vh",
  borderLeft: "1px solid #333",
  borderRight: "1px solid #333",
  color: "white",
  position: "relative",
}));

const CustomToggleButtonGroup = styled(ToggleButtonGroup)(() => ({
  width: "100%",
  border: "1px solid #555",
  borderRadius: "100px",
  backgroundColor: "transparent",
}));

const CustomToggleButton = styled(ToggleButton)(() => ({
  color: "white",
  textTransform: "none",
  fontWeight: 600,
  flex: 1,
  borderRadius: "100px",
  border: "none",
  "&.Mui-selected": {
    backgroundColor: "#1d1d1d",
    color: "#4A99E9",
    fontWeight: 700,
    "&:hover": {
      backgroundColor: "#1d1d1d",
    },
  },
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
}));

const ScrollTopButton = styled(Fab)(({ theme }) => ({
  position: "fixed",
  bottom: theme.spacing(4),
  right: theme.spacing(4),
  backgroundColor: "#1d1d1d",
  color: "#fff",
  "&:hover": {
    backgroundColor: "#333",
  },
}));

function ProfileFeed({
  currentUserId,
  onEditPost,
  onReplyPost,
  onBackToHome,
  passHomeUsername,
}) {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("posts");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [items, setItems] = useState([]);

  const observer = useRef();

  const lastItemRef = useCallback(
    (node) => {
      if (loading || !hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => setPage((prev) => prev + 1), 300);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const isCurrentUser = profileUser && currentUserId === profileUser.id;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/${username}/profile`);
        setProfileUser(res.data);
      } catch (err) {
        console.error("Profile error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, [selectedTab, profileUser?.id]);

  const fetchTabItems = useCallback(async () => {
    if (!profileUser?.id) return;
    setLoading(true);
    try {
      let res;
      if (selectedTab === "posts") {
        res = await axiosInstance.get(
          `/users/${profileUser.id}/posts?page=${page}`
        );
      } else if (selectedTab === "replies") {
        res = await axiosInstance.get(
          `/users/${profileUser.id}/replies?page=${page}`
        );
      } else if (selectedTab === "likes") {
        res = await axiosInstance.get(
          `/users/${profileUser.id}/likes?page=${page}`
        );
      } else if (selectedTab === "following") {
        res = await axiosInstance.get(
          `/users/${profileUser.id}/following?page=${page}`
        );
      }
      const newItems =
        res.data.posts ||
        res.data.replies ||
        res.data.likes ||
        res.data.following ||
        [];
      setItems((prev) => (page === 1 ? newItems : [...prev, ...newItems]));
      setHasMore(newItems.length > 0);
    } catch (err) {
      console.error(`Error fetching ${selectedTab}:`, err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedTab, profileUser?.id]);

  useEffect(() => {
    fetchTabItems();
  }, [fetchTabItems]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleEditProfile = () => {
    navigate("/edit-profile", {
      state: {
        user,
        backgroundLocation: { pathname: `/${username}` },
        fromHome: false,
      },
    });
  };

  const handleTabChange = (_, newTab) => {
    if (newTab) setSelectedTab(newTab);
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/delete/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleViewReplies = (postId) => {
    navigate(`/posts/${postId}/replies`);
  };

  const refreshAllReplies = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/users/${profileUser.id}/replies?page=1`
      );
      setItems(res.data.replies || []);
      setPage(1);
      setHasMore(true);
    } catch (err) {
      console.error("Error refreshing bookmarks:", err);
    } finally {
      setLoading(false);
    }
  };

  const passUsername = (username) => {
    passHomeUsername(username);
  };

  return (
    <ProfileContainer>
      {!currentUserId || (loading && page === 1) ? (
        <LoadingModal />
      ) : !profileUser ? (
        <Typography color="gray">User not found</Typography>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              mb: 2,
            }}
            onClick={onBackToHome}
          >
            <Typography fontSize="1.5rem" mr={1}>
              ←
            </Typography>
            <Typography fontWeight="bold" color="#4A99E9">
              Back to Feed
            </Typography>
          </Box>

          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <Avatar
              src={profileUser.avatar_url}
              sx={{ width: 64, height: 64 }}
            />
            {isCurrentUser && (
              <Button
                variant="outlined"
                sx={{
                  color: "white",
                  borderRadius: "100px",
                  border: "2px solid #333",
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#111" },
                }}
                onClick={handleEditProfile}
              >
                Edit Profile
              </Button>
            )}
          </Box>

          <Typography variant="h6">{profileUser.real_name}</Typography>
          <Typography color="gray">@{profileUser.username}</Typography>

          {profileUser.bio && (
            <Box mt={1}>
              <Typography variant="subtitle2" color="gray">
                About me
              </Typography>
              <Typography>{profileUser.bio}</Typography>
            </Box>
          )}

          <Box mt={2} display="flex" gap={3}>
            <Typography>
              <strong>{profileUser.tweet_count}</strong> Posts
            </Typography>
            <Typography>
              <strong>{profileUser.following_count}</strong> Following
            </Typography>
            <Typography>
              <strong>{profileUser.follower_count}</strong> Followers
            </Typography>
          </Box>

          <Divider sx={{ my: 2, borderColor: "#333" }} />
          <CustomToggleButtonGroup
            value={selectedTab}
            exclusive
            onChange={handleTabChange}
            sx={{ mb: 2 }}
          >
            <CustomToggleButton value="posts">Posts</CustomToggleButton>
            <CustomToggleButton value="replies">Replies</CustomToggleButton>
            <CustomToggleButton value="likes">Likes</CustomToggleButton>
            <CustomToggleButton value="following">Following</CustomToggleButton>
          </CustomToggleButtonGroup>

          <Box>
            {selectedTab === "posts" &&
              items.map((post, index) => (
                <PostCard
                  key={index}
                  post={post}
                  currentUserId={currentUserId}
                  onDelete={handleDelete}
                  onEdit={onEditPost}
                  refreshPosts={fetchTabItems}
                  onReply={onReplyPost}
                  viewReply={handleViewReplies}
                  passUsername={passUsername}
                  variant="default"
                />
              ))}
            {selectedTab === "replies" &&
              items.map((reply, index) => (
                <Box key={index} mb={4}>
                  {" "}
                  {/* Add spacing between each reply block */}
                  <PostCard
                    post={{
                      id: reply.reply_id,
                      content: reply.reply_content,
                      date: reply.reply_date,
                      image_url: reply.reply_image_url,
                      user_id: reply.reply_user_id,
                      username: reply.reply_username,
                      real_name: reply.reply_real_name,
                      avatar_url: reply.reply_avatar_url,
                      parent: {
                        id: reply.tweet_id,
                        content: reply.tweet_content,
                        date: reply.tweet_date,
                        image_url: reply.tweet_image_url,
                        user_id: reply.tweet_user_id,
                        username: reply.tweet_username,
                        real_name: reply.tweet_real_name,
                        avatar_url: reply.tweet_avatar_url,
                      },
                    }}
                    variant="reply"
                    currentUserId={currentUserId}
                    onDelete={handleDelete}
                    onEdit={onEditPost}
                    refreshPosts={refreshAllReplies}
                    onReply={onReplyPost}
                    viewReply={handleViewReplies}
                    passUsername={passUsername}
                  />
                  <Box
                    mt={5}
                    mb={1}
                    sx={{
                      height: "1px",
                      backgroundColor: "#333",
                      width: "100%",
                    }}
                  />
                </Box>
              ))}

            {selectedTab === "likes" &&
              items.map((post, index) => (
                <PostCard
                  key={index}
                  post={post}
                  currentUserId={currentUserId}
                  onDelete={handleDelete}
                  onEdit={onEditPost}
                  refreshPosts={fetchTabItems}
                  onReply={onReplyPost}
                  viewReply={handleViewReplies}
                  passUsername={passUsername}
                  variant="default"
                />
              ))}

            {selectedTab === "following" &&
              items.map((user, index) => (
                <SecondUserCard
                  key={index}
                  user={user}
                  currentUserId={currentUserId}
                  passUsername={passUsername}
                  refreshPosts={fetchTabItems}
                />
              ))}

            {hasMore && !loading && (
              <Box ref={lastItemRef} sx={{ height: 1 }} />
            )}
            {loading && <LoadingModal />}

            {!hasMore && !loading && (
              <Typography align="center" color="gray" py={2}>
                No more {selectedTab}
              </Typography>
            )}
          </Box>

          {showScrollTop && (
            <ScrollTopButton
              size="small"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <KeyboardArrowUpIcon />
            </ScrollTopButton>
          )}
        </>
      )}
    </ProfileContainer>
  );
}

export default ProfileFeed;
