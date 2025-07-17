import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import LeftSidebar from "../components/layout/LeftSidebar";
import MainFeed from "../components/layout/MainFeed";
import RightSidebar from "../components/layout/RightSidebar";
import { useAuth } from "../contexts/useAuthContext";
import BookmarkFeed from "../components/layout/BookmarkFeed";
import ReplyFeed from "../components/layout/ReplyFeed";
import ProfileFeed from "../components/layout/ProfileFeed";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const path = location.pathname;

  const openHomePage = () => {
    navigate("/home");
  };

  const openExplorePage = () => {
    navigate("/explore");
  };

  const openNotificationPage = () => {
    navigate("/notifications");
  };

  const openBookmarksPage = () => {
    navigate("/bookmarks");
  };

  const openProfilePage = () => {
    navigate(`/${user.username}`);
  };

  const openPostModal = () => {
    navigate("/create-post", {
      state: { backgroundLocation: location, fromHome: true },
    });
  };

  const openEditPostModal = (postId) => {
    navigate(`/edit-post/${postId}`, {
      state: { backgroundLocation: location, fromHome: true },
    });
  };

  const openReplyModal = (postId) => {
    navigate(`/reply-post/${postId}`, {
      state: { backgroundLocation: location, fromHome: true },
    });
  };

  const isBookmarkView = path === "/bookmarks";
  const isReplies = path.startsWith("/posts/") && path.endsWith("/replies");
  const isProfileView = path === `/${user?.username}`;

  return (
    <Box display="flex" justifyContent="center" maxWidth="1200px" mx="auto">
      <LeftSidebar
        onClickHome={openHomePage}
        onClickExplore={openExplorePage}
        onClickNotifications={openNotificationPage}
        onClickBookmarks={openBookmarksPage}
        onClickProfile={openProfilePage}
        onClickPost={openPostModal}
      />
      {/* FEED AREA */}
      {isBookmarkView ? (
        <BookmarkFeed
          currentUserId={user?.id}
          onEditPost={openEditPostModal}
          onReplyPost={openReplyModal}
          onBackToHome={openHomePage}
        />
      ) : isReplies ? (
        <ReplyFeed
          currentUserId={user?.id}
          onEditPost={openEditPostModal}
          onReplyPost={openReplyModal}
          onBackToHome={openHomePage}
        />
      ) : isProfileView ? (
        <ProfileFeed
          currentUserId={user?.id}
          onEditPost={openEditPostModal}
          onReplyPost={openReplyModal}
          onBackToHome={openHomePage}
        />
      ) : (
        <MainFeed
          currentUserId={user?.id}
          onEditPost={openEditPostModal}
          onReplyPost={openReplyModal}
        />
      )}

      <RightSidebar />
    </Box>
  );
}

export default Home;
