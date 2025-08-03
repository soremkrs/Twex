import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuthContext";
import axiosInstance from "../utils/axiosConfig";

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

  return <div>Logging you in via Google...</div>;
}

export default GoogleRedirectHandler;
