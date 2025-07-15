import React, { useEffect, useState } from "react";
import { Box, Typography, Fab } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useParams, useNavigate } from "react-router-dom";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import axiosInstance from "../../utils/axiosConfig";
import PostCard from "../cards/PostCard";
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

function ReplyFeed({ currentUserId, onEditPost, onReplyPost }) {
  const { id: postId } = useParams();
  const navigate = useNavigate();

  const [parentPost, setParentPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const fetchReplies = async () => {
    try {
      setLoading(true);
      const parentRes = await axiosInstance.get(`/posts/${postId}`);
      const repliesRes = await axiosInstance.get(`/posts/${postId}/replies`);
      setParentPost(parentRes.data.post);
      setReplies(repliesRes.data.replies || []);
    } catch (err) {
      console.error("Error fetching reply feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplies();
  }, [postId]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/delete/posts/${id}`);
      if (id === parentPost?.id) {
        navigate("/");
      } else {
        setReplies((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
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
        onClick={() => navigate("/")}
      >
        <Typography fontSize="1.5rem" mr={1}>
          ←
        </Typography>
        <Typography fontWeight="bold" color="#4A99E9">
          Back to Feed
        </Typography>
      </Box>

      {parentPost && (
        <PostCard
          post={parentPost}
          currentUserId={currentUserId}
          onDelete={handleDelete}
          onEdit={onEditPost}
          refreshPosts={fetchReplies}
          onReply={onReplyPost}
          variant="default"
          hideActions
        />
      )}

      {replies.map((reply) => (
        <PostCard
          key={reply.id}
          post={reply}
          currentUserId={currentUserId}
          onDelete={handleDelete}
          onEdit={onEditPost}
          refreshPosts={fetchReplies}
          onReply={onReplyPost}
          variant="reply"
        />
      ))}

      {loading && <LoadingModal />}

      {!loading && replies.length === 0 && (
        <Typography align="center" color="gray" py={2}>
          No replies yet.
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

export default ReplyFeed;
