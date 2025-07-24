import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  Avatar,
  Typography,
  Box,
  Button,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import axiosInstance from "../../utils/axiosConfig";

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: "#000",
  color: "#fff",
  borderBottom: "1px solid #2f2f2f",
  borderRadius: 0,
  padding: theme.spacing(1),
}));

function SecondUserCard({
  user,
  currentUserId,
  passUsername,
  refreshPosts,
  notifications,
  sideBar,
}) {
  const { id, username, real_name, avatar_url, bio, date } = user;
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (currentUserId !== id) {
      axiosInstance
        .get(`/following/${id}`)
        .then((res) => {
          setIsFollowing(res.data.isFollowing);
        })
        .catch((err) => console.error("Follow check error", err));
    }
  }, [id, currentUserId]);

  const handleFollowToggle = async () => {
    const endpoint = isFollowing ? `/unfollow/${id}` : `/follow/${id}`;
    const method = isFollowing ? "delete" : "post";

    axiosInstance[method](endpoint)
      .then(() => setIsFollowing(!isFollowing))
      .catch((err) => console.error("Follow toggle error", err));
    if (refreshPosts?.fetchTabItems) await refreshPosts.fetchTabItems();
    if (refreshPosts?.fetchProfileUser) await refreshPosts.fetchProfileUser();
  };

  const goToProfile = ({ clickedUser, parentUser }) => {
    passUsername({ clickedUser, parentUser });
  };

  return (
    <StyledCard>
      <CardHeader
        avatar={
          <Avatar
            src={avatar_url}
            alt={real_name}
            sx={{ cursor: "pointer" }}
            onClick={() => goToProfile({ clickedUser: username })}
          />
        }
        title={
          <Box
            onClick={() => goToProfile({ clickedUser: username })}
            sx={{ cursor: "pointer" }}
          >
            <Typography
              fontWeight="bold"
              color="#fff"
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: sideBar ? 50 : 100, // Adjust as needed
              }}
            >
              {real_name}
            </Typography>
            <Typography
              variant="body2"
              color="#aaa"
              sx={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: sideBar ? 50 : 100, // Adjust as needed
              }}
            >
              @{username}
            </Typography>
          </Box>
        }
        action={
          currentUserId !== id && !notifications ? (
            <Box>
              <Button
                size="small"
                onClick={handleFollowToggle}
                variant="outlined"
                sx={{
                  color: isFollowing ? "#fff" : "white",
                  backgroundColor: isFollowing ? "#4A99E9" : "transparent",
                  borderRadius: "100px",
                  border: "2px solid #333",
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: isFollowing ? "#3a7cc7" : "#111",
                  },
                }}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            </Box>
          ) : (
            notifications && (
              <Box px={2} mt={2}>
                <Typography variant="body2" color="#ccc">
                  {real_name || "Noname user"} posted a new update · {date}
                </Typography>
              </Box>
            )
          )
        }
      />
      {bio && !sideBar &&(
        <Box px={2} pb={1}>
          <Typography
            variant="body2"
            color="#ccc"
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%", // or a fixed width if needed
              display: "block",
            }}
          >
            {bio}
          </Typography>
        </Box>
      )}
    </StyledCard>
  );
}

export default SecondUserCard;
