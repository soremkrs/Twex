import { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axiosConfig";
import { useNavigate } from "react-router-dom";

// Always define the context first
const AuthContext = createContext(undefined);

// Custom hook MUST be declared *outside* the component
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance
      .get("/auth/check")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await axiosInstance.post("/auth/logout");
    setUser(null);
    navigate("/");
  };

  const value = { user, setUser, loading, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthProvider, useAuth };