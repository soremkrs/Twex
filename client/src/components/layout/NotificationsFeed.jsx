import React, { useEffect, useState, useRef, useCallback } from "react";
import { Box, Typography, Fab } from "@mui/material";
import { styled } from "@mui/material/styles";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import axiosInstance from "../../utils/axiosConfig";
import LoadingModal from "../modals/LoadingModal";
import { useNavigate } from "react-router-dom";
import SecondUserCard from "../cards/SecondUserCard";

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

function NotificationFeed({
  currentUserId,
  onEditPost,
  onReplyPost,
  onBackToHome,
  passHomeUsername,
}) {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [feedType, setFeedType] = useState("following");

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

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/posts?type=${feedType}&page=${page}`
      );
      const newPosts = res.data.posts || [];
      setPosts((prev) => (page === 1 ? newPosts : [...prev, ...newPosts]));
      setHasMore(newPosts.length > 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleViewReplies = (postId) => {
    navigate(`/posts/${postId}/replies`);
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

      {posts.map((post, index) => (
        <SecondUserCard
          key={index}
          user={post}
          passUsername={passUsername}
          notifications={true}
        />
      ))}

      {hasMore && !loading && <Box ref={lastPostRef} sx={{ height: 1 }} />}
      {loading && <LoadingModal />}

      {!hasMore && !loading && (
        <Typography align="center" color="gray" py={2}>
          You're all caught up
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

export default NotificationFeed;
