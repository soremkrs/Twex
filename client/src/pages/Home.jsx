import React from "react";
import LogOutButton from "../components/buttons/LogOutButton";
import axiosInstance from "../utils/axiosConfig";
import { useAuth } from "../contexts/useAuthContext"; // To access logout logic

function Home() {
  const { logout } = useAuth(); // Clears local user state and redirects

  const handleLogOut = async () => {
    try {
      await axiosInstance.post("/auth/logout");
      logout(); // Local logout (from context)
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div>
      <h1>Hello</h1>
      <LogOutButton onClick={handleLogOut} />
    </div>
  );
}

export default Home;
