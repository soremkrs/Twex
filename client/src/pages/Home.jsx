import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Box } from "@mui/material";
import LeftSidebar from "../components/layout/LeftSidebar";
import MainFeed from "../components/layout/MainFeed";
import RightSidebar from "../components/layout/RightSidebar";
import { useAuth } from "../contexts/useAuthContext";
import BookmarkFeed from "../components/layout/BookmarkFeed";
import ReplyFeed from "../components/layout/ReplyFeed";
import ProfileFeed from "../components/layout/ProfileFeed";
import NotificationFeed from "../components/layout/NotificationsFeed";
import axiosInstance from "../utils/axiosConfig";
import SearchFeed from "../components/layout/SearchFeed";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { username } = useParams();
  const [hasNewNotification, setHasNewNotification] = useState(false);

  const path = location.pathname;

  useEffect(() => {
    const lastSeen =
      localStorage.getItem("lastNotificationCheck") ||
      new Date(0).toISOString();

    axiosInstance
      .get("/notifications/check", {
        params: { lastSeen },
      })
      .then((res) => {
        setHasNewNotification(res.data.hasNew);
      })
      .catch((err) => console.error(err));
  }, []);

  const openHomePage = () => {
    navigate("/home");
  };

  const openExplorePage = () => {
    navigate("/explore");
  };

  const openNotificationPage = () => {
    localStorage.setItem("lastNotificationCheck", new Date().toISOString());
    setHasNewNotification(false);
    navigate("/notifications");
  };

  const openBookmarksPage = () => {
    navigate("/bookmarks");
  };

  const openProfilePage = () => {
    if (user?.username) {
      navigate(`/${user.username}`);
    }
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

  const handleOpenUserProfile = ({ clickedUser, parentUser = null }) => {
    navigate(`/${clickedUser}`);
  };

  const isBookmarkView = path === "/bookmarks";
  const isReplies = path.startsWith("/posts/") && path.endsWith("/replies");
  const isProfileView =
    !!username && path === `/${username}` && !isReplies && !isBookmarkView;
  const isNotificationView = path === "/notifications";
  const isSearchView = path === "/explore";

  return (
    <Box display="flex" justifyContent="center" maxWidth="1200px" mx="auto">
      <LeftSidebar
        onClickHome={openHomePage}
        onClickExplore={openExplorePage}
        onClickNotifications={openNotificationPage}
        onClickBookmarks={openBookmarksPage}
        onClickProfile={openProfilePage}
        onClickPost={openPostModal}
        hasNewNotification={hasNewNotification}
      />
      {/* FEED AREA */}
      {isSearchView ? (
        <SearchFeed
          currentUserId={user?.id}
          onBackToHome={openHomePage}
          passHomeUsername={handleOpenUserProfile}
        />
      ) : isBookmarkView ? (
        <BookmarkFeed
          currentUserId={user?.id}
          onEditPost={openEditPostModal}
          onReplyPost={openReplyModal}
          onBackToHome={openHomePage}
          passHomeUsername={handleOpenUserProfile}
        />
      ) : isReplies ? (
        <ReplyFeed
          currentUserId={user?.id}
          onEditPost={openEditPostModal}
          onReplyPost={openReplyModal}
          onBackToHome={openHomePage}
          passHomeUsername={handleOpenUserProfile}
        />
      ) : isProfileView ? (
        <ProfileFeed
          currentUserId={user?.id}
          onEditPost={openEditPostModal}
          onReplyPost={openReplyModal}
          onBackToHome={openHomePage}
          passHomeUsername={handleOpenUserProfile}
        />
      ) : isNotificationView ? (
        <NotificationFeed
          currentUserId={user?.id}
          onBackToHome={openHomePage}
          passHomeUsername={handleOpenUserProfile}
        />
      ) : (
        <MainFeed
          currentUserId={user?.id}
          onEditPost={openEditPostModal}
          onReplyPost={openReplyModal}
          passHomeUsername={handleOpenUserProfile}
        />
      )}

      <RightSidebar />
    </Box>
  );
}

export default Home;
