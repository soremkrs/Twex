import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuthContext";
import axiosInstance from "../utils/axiosConfig";
import { Box } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";

function GoogleRedirectHandler() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    axiosInstance
      .get("/auth/check")
      .then((res) => {
        if (res.data.user) {
          setUser(res.data.user);
          navigate("/home");
        } else {
          navigate("/");
        }
      })
      .catch(() => {
        navigate("/");
      });
  }, []);

  return (
    <Box display="flex" justifyContent="center" py={3}>
      <CircularProgress size={28} sx={{ color: "#1d9bf0" }} />
    </Box>
  );
}

export default GoogleRedirectHandler;
