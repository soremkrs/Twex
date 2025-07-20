import React from "react";
import { Box, Button, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import UserCard from "../cards/UserCard";
import TXLogo from "../../assets/TXLogo.svg";
import PostButton from "../buttons/PostButton";

// MUI Icons
import HomeIcon from "@mui/icons-material/Home";
import ExploreIcon from "@mui/icons-material/TravelExplore";
import NotificationsIcon from "@mui/icons-material/Notifications";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import PersonIcon from "@mui/icons-material/Person";

const Logo = styled("div")({
  marginLeft: "15px",
  marginBottom: "20px",
});

const NavButton = styled(Button)(({ theme }) => ({
  justifyContent: "flex-start",
  textTransform: "none",
  fontSize: "1.2rem",
  padding: "10px auto",
  borderRadius: "100px",
  color: "#fff",
  backgroundColor: "transparent",
  transition: "background-color 0.2s ease",

  "&:hover": {
    backgroundColor: "#111",
  },
}));

function LeftSidebar({ onClickHome, onClickExplore, onClickNotifications, onClickBookmarks, onClickProfile, onClickPost, hasNewNotification }) {
  const navItems = [
    {
      label: "Home",
      icon: <HomeIcon sx={{ fontSize: 30 }} />,
      onClick: onClickHome,
    },
    {
      label: "Explore",
      icon: <ExploreIcon sx={{ fontSize: 30 }} />,
      onClick: onClickExplore,
    },
    {
      label: "Notifications",
      icon: (
        <Box position="relative">
          <NotificationsIcon sx={{ fontSize: 30 }} />
          {hasNewNotification && (
            <Box
              position="absolute"
              top={0}
              right={0}
              width={10}
              height={10}
              bgcolor="#1DA1F2"
              borderRadius="50%"
            />
          )}
        </Box>
      ),
      onClick: onClickNotifications,
    },
    {
      label: "Bookmarks",
      icon: <BookmarkIcon sx={{ fontSize: 30 }} />,
      onClick: onClickBookmarks,
    },
    {
      label: "Profile",
      icon: <PersonIcon sx={{ fontSize: 30 }} />,
      onClick: onClickProfile,
    },
  ];


  return (
    <Box
      width="240px"
      p={2}
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      height="100vh"
      sx={{
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
      }}
    >
      <Box>
        <Logo>
          <img src={TXLogo} alt="Tx Logo" height={50} />
        </Logo>
        <Stack spacing={2}>
          {navItems.map(({ label, icon, onClick }) => (
            <NavButton key={label} fullWidth onClick={onClick}>
              <Box display="flex" justifyContent="center">
                <Box mr={2} display="flex" justifyContent="center">
                  {icon}
                </Box>
                {label}
              </Box>
            </NavButton>
          ))}
        </Stack>
      </Box>
      <Box display="flex" flexDirection="column" gap={5}>
        <PostButton onClick={onClickPost} />
        <UserCard />
      </Box>
    </Box>
  );
}

export default LeftSidebar;
