import React, { useEffect, useState } from "react";
import { Box, Typography, Fab } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import axiosInstance from "../../utils/axiosConfig";
import PostCard from "../cards/PostCard";
import LoadingModal from "../modals/LoadingModal";
import CustomSnackbar from "../ui/CustomSnackbar";

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

function ReplyFeed({
  currentUserId,
  onEditPost,
  onReplyPost,
  onBackToHome,
  passHomeUsername,
}) {
  const navigate = useNavigate();
  const { id: postId } = useParams();
  const location = useLocation();
  const [parentPost, setParentPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const showSnackbar = (message) => {
    setSnackbar({ open: true, message });
  };

  const fetchReplies = async () => {
    setLoading(true);

    try {
      const parentRes = await axiosInstance.get(`/post/${postId}`);
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

  useEffect(() => {
    if (location.state?.refresh) {
      showSnackbar("Your post was sent!");
      // Clear the refresh state to avoid repeated fetches
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location]);

  useEffect(() => {
    const postId = location.state?.editPostId;
    if (postId) {
      fetchReplies();
      showSnackbar("Your post was edit!");
      // Clear it so it doesn't trigger again
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location]);

  const passUsername = (username) => {
    passHomeUsername(username);
  };

  const handleDelete = async () => {
    navigate(-1);
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

      {parentPost && (
        <PostCard
          post={parentPost}
          currentUserId={currentUserId}
          onEdit={onEditPost}
          refreshPosts={fetchReplies}
          onReply={onReplyPost}
          onDelete={handleDelete}
          passUsername={passUsername}
          showSnackbar={showSnackbar}
          variant="default"
          hideViewRepliesButton={true}
          hideActions
        />
      )}

      {replies.map((reply) => (
        <PostCard
          key={reply.id}
          post={reply}
          currentUserId={currentUserId}
          onEdit={onEditPost}
          refreshPosts={fetchReplies}
          onReply={onReplyPost}
          passUsername={passUsername}
          showSnackbar={showSnackbar}
          variant="reply"
        />
      ))}

      {loading && <LoadingModal Open={loading} Message={"Loading..."} />}

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
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </FeedContainer>
  );
}

export default ReplyFeed;
