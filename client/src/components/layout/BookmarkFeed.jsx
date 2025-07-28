import React, { useEffect, useState, useRef, useCallback } from "react";
import { Box, Typography, Fab } from "@mui/material";
import { styled } from "@mui/material/styles";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import PostCard from "../cards/PostCard";
import axiosInstance from "../../utils/axiosConfig";
import LoadingModal from "../modals/LoadingModal";
import { useNavigate, useLocation } from "react-router-dom";

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

function BookmarkFeed({
  currentUserId,
  onEditPost,
  onReplyPost,
  onBackToHome,
  passHomeUsername,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookmarks, setBookmarks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/bookmarks?page=${page}`);
      const newBookmarks = res.data.bookmarks || [];
      setBookmarks((prev) =>
        page === 1 ? newBookmarks : [...prev, ...newBookmarks]
      );
      setHasMore(newBookmarks.length > 0);
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setBookmarks([]);
    setPage(1);
    setHasMore(true);
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [page]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (location.state?.refresh) {
      // Reset post feed to page 1 and refresh
      setPage(1);
      setBookmarks([]);
      setHasMore(true);
      // Clear the refresh state to avoid repeated fetches
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location]);

  useEffect(() => {
    const postId = location.state?.editPostId;
    if (postId) {
      refreshSingleBookmarkById(postId);
      // Clear it so it doesn't trigger again
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location]);

  useEffect(() => {
    const postId = location.state?.repliedToPostId;
    if (postId) {
      refreshSingleBookmarkById(postId);
      // Clear it so it doesn't trigger again
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location]);

  const handleDelete = async (id) => {
    setBookmarks((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUnbookmark = (postId) => {
    setBookmarks((prev) => prev.filter((post) => post.id !== postId));
  };

  const handleViewReplies = (postId) => {
    navigate(`/posts/${postId}/replies`);
  };

  const refreshSingleBookmarkById = async (postId) => {
    try {
      const res = await axiosInstance.get(`/post/${postId}`);
      const updatedPost = res.data.post;

      setBookmarks((prev) =>
        prev.map((p) => (p.id === Number(postId) ? updatedPost : p))
      );
    } catch (err) {
      console.error("Error refreshing single bookmark:", err);
    }
  };

  const passUsername = (username) => {
    passHomeUsername(username);
  };

  return (
    <FeedContainer>
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

      {bookmarks.map((post, i) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onDelete={handleDelete}
          onEdit={onEditPost}
          refreshPosts={refreshSingleBookmarkById}
          onReply={onReplyPost}
          variant="default"
          onUnbookmark={handleUnbookmark}
          viewReply={handleViewReplies}
          passUsername={passUsername}
        />
      ))}

      {hasMore && !loading && <Box ref={lastPostRef} sx={{ height: 1 }} />}
      {loading && <LoadingModal Open={loading} Message={"Loading..."} />}

      {!hasMore && !loading && (
        <Typography align="center" color="gray" py={2}>
          No more bookmarks
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

export default BookmarkFeed;
