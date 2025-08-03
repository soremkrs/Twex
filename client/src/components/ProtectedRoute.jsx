import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuthContext";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

// A wrapper component that protects routes from unauthenticated access
const ProtectedRoute = ({ children, condition = true, redirectTo = "/" }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

   // While auth state is loading, show a loading spinner
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }
  // If user is not authenticated or custom condition fails, redirect
  if (!user || !condition) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  // If everything is okay, render the protected content
  return children;
};

export default ProtectedRoute;
