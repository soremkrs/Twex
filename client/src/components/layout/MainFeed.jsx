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

const StyledToggleGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  backgroundColor: "#000",
  borderRadius: "100px",
  border: "1px solid #333",
  overflow: "hidden",
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  flex: 1,
  color: "white",
  textTransform: "none",
  fontWeight: "bold",
  "&.Mui-selected": {
    backgroundColor: "#1d1d1d",
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

function MainFeed({ currentUserId, onEditPost }) {
  const [posts, setPosts] = useState([]);
  const [feedType, setFeedType] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const observer = useRef();

  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting && hasMore && !loading) {
            // Add slight delay to allow layout stabilization
            setTimeout(() => {
              setPage((prevPage) => prevPage + 1);
            }, 300); // try 300ms delay
          }
        },
        {
          root: null,
          rootMargin: "200px", // give some pre-load room
          threshold: 0.5, // trigger when 50% visible
        }
      );

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

const fetchPosts = async () => {
  setLoading(true);
  try {
    const res = await axiosInstance.get(`/posts?type=${feedType}&page=1`); // ✅ reset to page 1
    const newPosts = res.data.posts || [];
    setPosts(newPosts); // ✅ overwrite instead of appending
    setHasMore(newPosts.length > 0);
  } catch (err) {
    console.error("Failed to fetch posts:", err);
  } finally {
    setLoading(false);
  }
};

  // Reset when feedType changes
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
  }, [feedType]);

  // Fetch posts when page or feedType changes
  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, feedType]);

  // Scroll-to-top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFeedTypeChange = (event, newType) => {
    if (newType !== null) {
      setFeedType(newType);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/delete/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const handleEdit = (id) => {
    onEditPost(id);
  };

  return (
    <FeedContainer>
      {/* Toggle Buttons */}
      <StyledToggleGroup
        value={feedType}
        exclusive
        onChange={handleFeedTypeChange}
        fullWidth
      >
        <StyledToggleButton value="all">All</StyledToggleButton>
        <StyledToggleButton value="following">Following</StyledToggleButton>
      </StyledToggleGroup>

      {/* Post List */}
      {posts.map((post, index) => (
        <PostCard
          key={index}
          post={post}
          currentUserId={currentUserId}
          onDelete={handleDelete}
          onEdit={handleEdit}
          refreshPosts={fetchPosts}
        />
      ))}

      {/* Trigger infinite scroll here */}
      {hasMore && !loading && <Box ref={lastPostRef} sx={{ height: "1px" }} />}

      {/* Loading */}
      {loading && <LoadingModal />}

      {/* No more posts */}
      {!hasMore && !loading && (
        <Typography variant="body2" color="gray" align="center" py={2}>
          No more posts
        </Typography>
      )}

      {/* Scroll to Top */}
      {showScrollTop && (
        <ScrollTopButton size="small" onClick={scrollToTop}>
          <KeyboardArrowUpIcon />
        </ScrollTopButton>
      )}
    </FeedContainer>
  );
}

export default MainFeed;
