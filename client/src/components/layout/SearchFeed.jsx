import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import SecondUserCard from "../cards/SecondUserCard";
import axiosInstance from "../../utils/axiosConfig";
import { debounce } from "lodash";
import { useSearchParams } from "react-router-dom";
import CustomSnackbar from "../ui/CustomSnackbar";

// Styled container
const FeedContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  maxWidth: "600px",
  paddingBottom: theme.spacing(10),
  minHeight: "100vh",
  borderLeft: "1px solid #333",
  borderRight: "1px solid #333",
  color: "white",
  position: "relative",
}));

function SearchFeed({ onBackToHome, passHomeUsername, currentUserId }) {
  // Read the query string (?q=something) from the URL
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const showSnackbar = (message) => {
    setSnackbar({ open: true, message });
  };

  // Sync input state with the URL's `q` parameter
  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  // Debounced search function: waits for 500ms after typing stops
  const debouncedSearch = debounce(async (query) => {
    if (!query.trim()) return setUsers([]); // Don't search empty string
    setLoading(true);

    try {
      const res = await axiosInstance.get(`/search/users`, {
        params: { q: query },
      });
      setUsers(res.data || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, 500);

  // Run search whenever `searchQuery` changes
  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();  // Cleanup debounce on unmount/change
  }, [searchQuery]);

  return (
    <FeedContainer>
      {/* Back Button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          mb: 2,
        }}
        onClick={onBackToHome}
      >
        <Typography fontSize="1.5rem" mr={1}>
          ←
        </Typography>
        <Typography fontWeight="bold" color="#4A99E9">
          Back to Feed
        </Typography>
      </Box>

      {/* Search Input */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          sx: {
            color: "white",
            borderColor: "#444",
            backgroundColor: "#1d1d1d",
          },
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "#888" }} />
            </InputAdornment>
          ),
        }}
        sx={{
          input: { color: "white" },
          mb: 3,
          "& .MuiOutlinedInput-root": {
            backgroundColor: "transparent",
            borderRadius: "100px",
            "& fieldset": { borderColor: "#444" },
            "&:hover fieldset": { borderColor: "#666" },
            "&.Mui-focused fieldset": { borderColor: "#4A99E9" },
          },
        }}
      />

      {/* Results */}
      {loading && (
        <Box textAlign="center" mt={4}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!loading && users.length === 0 && searchQuery.trim() && (
        <Typography align="center" color="gray" mt={4}>
          No users found
        </Typography>
      )}

      {!loading &&
        users.map((user) => (
          <SecondUserCard
            key={user.id}
            user={user}
            passUsername={passHomeUsername}
            notifications={false}
            currentUserId={currentUserId}
            showSnackbar={showSnackbar}
          />
        ))}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </FeedContainer>
  );
}

export default SearchFeed;
