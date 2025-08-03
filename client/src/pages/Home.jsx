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
import LoadingModal from "../components/modals/LoadingModal";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { username } = useParams();
  const [hasNewNotification, setHasNewNotification] = useState(false);

  const path = location.pathname;

  useEffect(() => {
    if (!user) return;

    // Check if user has new notifications
    axiosInstance
      .get("/notifications/check")
      .then((res) => {
        setHasNewNotification(res.data.hasNew);
      })
      .catch(console.error);
  }, [user]);

  const openHomePage = () => {
    navigate("/home");
  };

  const openExplorePage = (passSearched) => {
    const query = typeof passSearched === "string" ? passSearched.trim() : "";

    if (query) {
      navigate(`/explore?q=${encodeURIComponent(query)}`);
    } else {
      navigate("/explore");
    }
  };

  const openNotificationPage = () => {
    axiosInstance
      .post("/notifications/mark-seen")
      .then(() => {
        setHasNewNotification(false);
        navigate("/notifications");
      })
      .catch(console.error);
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
      state: { backgroundLocation: location },
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
    !!username && path === `/${encodeURIComponent(username)}` && !isReplies && !isBookmarkView;
  const isNotificationView = path === "/notifications";
  const isSearchView = path === "/explore";

  if (loading || !user) {
    return (
     <LoadingModal Open={loading} Message={"Loading..."} />
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      maxWidth="auto"
      mx="auto"
    >
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

      <RightSidebar
        passHomeUsername={handleOpenUserProfile}
        passSearch={openExplorePage}
      />
    </Box>
  );
}

export default Home;
