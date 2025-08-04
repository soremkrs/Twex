import React, { useState } from "react";
import { Box, Typography, Avatar, Menu, MenuItem } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useAuth } from "../../contexts/useAuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import LoadingModal from "../modals/LoadingModal";
import axiosInstance from "../../utils/axiosConfig";
import { useMediaQuery, useTheme } from "@mui/material";

function UserCard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // Responsive layout check

  const { user, loading, logout } = useAuth(); // Auth context values
  const navigate = useNavigate();
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState(null); // Controls menu open/close state
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
      state: { backgroundLocation: location },
    });
  };

  if (loading) {
    return <LoadingModal Open={loading} Message="Editing profile..." />;
  } else if (!user) {
    return null; // Avoid rendering if user isn't loaded
  } else {
    return (
      <>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
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
          {/* Show name/username only on non-mobile screens */}
          {!isMobile && (
            <>
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
            </>
          )}
        </Box>

        {/* Account menu with Edit Profile & Logout */}
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
              // Custom arrow styling
              ...(isMobile
                ? {} // No arrows on mobile
                : {
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
                  }),
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
