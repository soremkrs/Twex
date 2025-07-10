import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box } from "@mui/material";
import LeftSidebar from "../components/layout/LeftSidebar";
import MainFeed from "../components/layout/MainFeed";
import RightSidebar from "../components/layout/RightSidebar";
import { useAuth } from "../contexts/useAuthContext";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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
            state: { backgroundLocation: location },
        });
  };

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
      <MainFeed />
      <RightSidebar />
    </Box>
  );
}

export default Home;
