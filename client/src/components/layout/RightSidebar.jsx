import React, { useEffect, useState } from "react";
import { Box, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import axiosInstance from "../../utils/axiosConfig";
import SecondUserCard from "../cards/SecondUserCard";
import Footer from "../footer/Footer"

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: "300px",
  padding: theme.spacing(2),
  color: "white",
  position: "sticky",
  top: 0,
  height: "100vh",
}));

const StyledBox = styled(Box)(({ theme }) => ({
  borderRadius: "16px",
  border: "1px solid #333",
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
}));

function RightSidebar({passHomeUsername, passSearch}) {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
  const fetchSuggestions = async () => {
    try {
      const res = await axiosInstance.get("/users/suggestions?limit=5");
      setSuggestedUsers(res.data.users);
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    }
  };
  fetchSuggestions();
}, []);


   const passUsername = (username) => {
    passHomeUsername(username);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault(); // prevent page reload
    if (searchQuery.trim()) {
      passSearch(searchQuery.trim());
      setSearchQuery("");
    }
  };

  return (
    <SidebarContainer>
      <form onSubmit={handleSearchSubmit}>
        <TextField
          fullWidth
          placeholder="Search…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          size="small"
          sx={{
            input: { color: "white" },
            "& .MuiOutlinedInput-root": {
              backgroundColor: "transparent",
              borderRadius: "100px",
              "& fieldset": {
                borderColor: "#333",
              },
              "&:hover fieldset": {
                borderColor: "#555",
              },
            },
          }}
        />
      </form>

      <StyledBox>
        <Typography variant="subtitle1" fontWeight={600} mb={1}>
          Who to follow
        </Typography>
        {suggestedUsers.map((user) => (
          <SecondUserCard
            key={user.id}
            user={user}
            passUsername={passUsername}
            notifications={false}
            sideBar={true}
          />
        ))}
      </StyledBox>

      {/* Footer can go here */}
      <Box mt={4} color="gray" fontSize="12px" textAlign="left">
        <Footer />
      </Box>
    </SidebarContainer>
  );
}

export default RightSidebar;
