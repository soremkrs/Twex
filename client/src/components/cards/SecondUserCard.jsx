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

function SecondUserCard({ user, currentUserId, passUsername, refreshPosts }) {
  const { id, username, real_name, avatar_url, bio } = user;
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

  const handleFollowToggle = () => {
    const endpoint = isFollowing ? `/unfollow/${id}` : `/follow/${id}`;
    const method = isFollowing ? "delete" : "post";

    axiosInstance[method](endpoint)
      .then(() => setIsFollowing(!isFollowing))
      .catch((err) => console.error("Follow toggle error", err));
  };

  const goToProfile = ({ clickedUser, parentUser }) => {
    passUsername({ clickedUser, parentUser });
    refreshPosts?.();
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
          <Box onClick={() => goToProfile({ clickedUser: username })} sx={{ cursor: "pointer" }}>
            <Typography fontWeight="bold" color="#fff">
              {real_name}
            </Typography>
            <Typography variant="body2" color="#aaa">
              @{username}
            </Typography>
          </Box>
        }
        action={
          currentUserId !== id && (
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
          )
        }
      />
      {bio && (
        <Box px={2} pb={1}>
          <Typography variant="body2" color="#ccc">
            {bio}
          </Typography>
        </Box>
      )}
    </StyledCard>
  );
}

export default SecondUserCard;
