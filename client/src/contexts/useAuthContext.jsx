import { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axiosConfig";
import { useNavigate } from "react-router-dom";

// 1. Create the context with undefined as default to catch usage errors early.
const AuthContext = createContext(undefined);

// 2. Custom hook to access the auth context safely.
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// 3. AuthProvider component to wrap around your app or parts of your app that require auth state.
function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // User data or null if not logged in
  const [loading, setLoading] = useState(true); // Loading state for async auth check
  const navigate = useNavigate();

  // 4. On mount, check if user is authenticated
  useEffect(() => {
    axiosInstance
      .get("/auth/check")
      .then((res) => setUser(res.data.user))  // Set user data from server
      .catch((err) => {
        console.error("Auth check failed:", err);
        setUser(null);  // Reset user on error or not authenticated
      })
      .finally(() => setLoading(false));  // Mark loading as done
  }, []);

  // 5. Logout function: calls backend, clears user, and redirects to home
  const logout = async () => {
    await axiosInstance.post("/auth/logout");
    setUser(null);
    navigate("/");
  };

  // 6. Provide context value including user info, setter, loading status, and logout function
  const value = { user, setUser, loading, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthProvider, useAuth };
