import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Fab,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import PostCard from "../cards/PostCard";
import axiosInstance from "../../utils/axiosConfig";
import LoadingModal from "../modals/LoadingModal";
import { useNavigate, useLocation } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";

// Styled Components
const FeedContainer = styled(Box)(({ theme }) => ({
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

const StyledToggleGroup = styled(ToggleButtonGroup)(() => ({
  marginBottom: "16px",
  border: "1px solid #555",
  backgroundColor: "transparent",
  borderRadius: "100px",
}));

const StyledToggleButton = styled(ToggleButton)(() => ({
  color: "white",
  textTransform: "none", // keep text as-is
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

function MainFeed({
  currentUserId,
  onEditPost,
  onReplyPost,
  passHomeUsername,
}) {
  const [posts, setPosts] = useState([]);
  const [feedType, setFeedType] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [initialLoading, setInitialLoading] = useState(true);

  const observer = useRef();

  const lastPostRef = useCallback(
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

  const fetchPosts = async () => {
    try {
      if (page === 1) setInitialLoading(true);
      else setLoading(true);

      const res = await axiosInstance.get(
        `/posts?type=${feedType}&page=${page}`
      );
      const newPosts = res.data.posts || [];
      setPosts((prev) => (page === 1 ? newPosts : [...prev, ...newPosts]));
      setHasMore(newPosts.length > 0);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
  }, [feedType]);

  useEffect(() => {
    fetchPosts();
  }, [page, feedType]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      // Reset post feed to page 1 and refresh
      setPage(1);
      setPosts([]);
      setHasMore(true);
      setFeedType("all"); // optional: force back to All feed
      // Clear the refresh state to avoid repeated fetches
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location]);

  useEffect(() => {
    const postId = location.state?.editPostId;
    if (postId) {
      refreshSinglePostById(postId);
      // Clear it so it doesn't trigger again
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location]);

  useEffect(() => {
    const postId = location.state?.repliedToPostId;
    if (postId) {
      refreshSinglePostById(postId);
      // Clear it so it doesn't trigger again
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location]);

  const handleDelete = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleViewReplies = (postId) => {
    navigate(`/posts/${postId}/replies`);
  };

  const passUsername = (username) => {
    passHomeUsername(username);
  };

  const refreshSinglePostById = async (postId) => {
    try {
      const res = await axiosInstance.get(`/post/${postId}`);
      const updatedPost = res.data.post;
      setPosts((prevPosts) =>
        prevPosts.map((p) => (p.id === Number(postId) ? { ...updatedPost } : p))
      );
    } catch (err) {
      console.error("Error refreshing single post:", err);
    }
  };

  return (
    <FeedContainer>
      <StyledToggleGroup
        value={feedType}
        exclusive
        onChange={(e, val) => val && setFeedType(val)}
        fullWidth
      >
        <StyledToggleButton value="all">All</StyledToggleButton>
        <StyledToggleButton value="following">Following</StyledToggleButton>
      </StyledToggleGroup>

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onEdit={onEditPost}
          onDelete={handleDelete}
          refreshPosts={refreshSinglePostById}
          onReply={onReplyPost}
          viewReply={handleViewReplies}
          passUsername={passUsername}
        />
      ))}

      {hasMore && !loading && <Box ref={lastPostRef} sx={{ height: 1 }} />}
      {initialLoading && page === 1 ? (
        <LoadingModal Open={loading} Message={"Loading..."} />
      ) : loading ? (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress size={28} sx={{ color: "#1d9bf0" }} />
        </Box>
      ) : null}

      {!hasMore && !loading && (
        <Typography align="center" color="gray" py={2}>
          No more posts
        </Typography>
      )}

      {showScrollTop && (
        <ScrollTopButton
          size="small"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <KeyboardArrowUpIcon />
        </ScrollTopButton>
      )}
    </FeedContainer>
  );
}

export default MainFeed;
