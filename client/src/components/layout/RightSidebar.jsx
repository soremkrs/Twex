import React from "react";
import { Box, TextField, Typography } from "@mui/material";

function RightSidebar() {
  return (
    <Box width="300px" p={2}>
      <TextField fullWidth placeholder="Search…" variant="outlined" size="small" />
      <Box mt={2}>
        <Typography variant="subtitle1">What's happening</Typography>
        {/* Trending or suggested content here */}
      </Box>
    </Box>
  );
}

export default RightSidebar;
