import React, { useState } from "react";
import { Box, Typography, Avatar, Menu, MenuItem } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useAuth } from "../../contexts/useAuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import LoadingModal from "../modals/LoadingModal";
import axiosInstance from "../../utils/axiosConfig";

function UserCard() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogOut = async () => {
    try {
      await axiosInstance.post("/auth/logout");
      logout(); // Local logout (from context)
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleEditProfile = () => {
    handleMenuClose();
    navigate("/edit-profile", {
      state: {
        user,
        backgroundLocation: location,
        fromHome: true,
      },
    });
  };

  if (loading) {
    return <LoadingModal Open={loading} Message="Editing profile..." />;
  } else if (!user) {
    return null;
  } else {
    return (
      <>
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          p={2}
          onClick={handleMenuOpen}
          sx={{
            backgroundColor: "#000",
            color: "#fff",
            borderRadius: 20,
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "#111",
            },
            width: "100%",
          }}
        >
          <Avatar
            src={user.avatar_url || "/avatars/default_avatar.svg"}
            alt={user.real_name || user.username}
            sx={{ width: 48, height: 48 }}
          />
          <Box>
            <Typography fontWeight={700} fontSize="0.95rem">
              {user.real_name || user.username}
            </Typography>
            <Typography variant="body2" color="gray">
              @{user.username}
            </Typography>
          </Box>
          <Box ml="auto">
            <MoreHorizIcon />
          </Box>
        </Box>

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          transformOrigin={{ vertical: "bottom", horizontal: "center" }}
          PaperProps={{
            sx: {
              mt: -1,
              backgroundColor: "#000",
              borderRadius: 2,
              color: "#fff",
              boxShadow: "0 0 10px 5px rgba(255, 255, 255, 0.39)",
              minWidth: 220,
              overflow: "visible",
              position: "absolute",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: "calc(50% - 6px)",
                width: 12,
                height: 12,
                backgroundColor: "#000",
                transform: "translateY(675%) rotate(45deg)",
                zIndex: 0,
                boxShadow: "0 0 10px 5px rgba(255, 255, 255, 0.39)",
              },
              "&::after": {
                content: '""',
                position: "absolute",
                top: 0,
                left: "calc(50% - 20px)",
                width: "40px",
                height: "15px",
                backgroundColor: "#000",
                transform: "translateY(480%) rotate(180deg)",
                zIndex: 1,
              },
            },
          }}
        >
          <MenuItem
            onClick={handleEditProfile}
            sx={{
              fontWeight: 500,
              "&:hover": {
                backgroundColor: "#111",
              },
            }}
          >
            Edit Profile
          </MenuItem>
          <MenuItem
            onClick={handleLogOut}
            sx={{
              fontWeight: 500,
              "&:hover": {
                backgroundColor: "#111",
              },
            }}
          >
            Log out @{user.username}
          </MenuItem>
        </Menu>
      </>
    );
  }
}

export default UserCard;
