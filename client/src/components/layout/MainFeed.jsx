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
import { useNavigate } from "react-router-dom";

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
  backgroundColor: "#000",
  borderRadius: "100px",
  border: "1px solid #333",
}));

const StyledToggleButton = styled(ToggleButton)(() => ({
  flex: 1,
  color: "white",
  textTransform: "none",
  fontWeight: "bold",
  "&.Mui-selected": {
    backgroundColor: "#1d1d1d",
    borderRadius: "100px",
    color: "#4A99E9",
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

function MainFeed({ currentUserId, onEditPost, onReplyPost }) {
  const [posts, setPosts] = useState([]);
  const [feedType, setFeedType] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();

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
      setLoading(true);
      const res = await axiosInstance.get(
        `/posts?type=${feedType}&page=${page}`
      );
      const newPosts = res.data.posts || [];
      setPosts((prev) => (page === 1 ? newPosts : [...prev, ...newPosts]));
      setHasMore(newPosts.length > 0);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
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
          onDelete={handleDelete}
          onEdit={onEditPost}
          refreshPosts={fetchPosts}
          onReply={onReplyPost}
          viewReply={handleViewReplies}
        />
      ))}

      {hasMore && !loading && <Box ref={lastPostRef} sx={{ height: 1 }} />}
      {loading && <LoadingModal />}

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
