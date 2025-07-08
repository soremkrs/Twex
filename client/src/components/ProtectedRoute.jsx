import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuthContext";

const ProtectedRoute = ({ children, condition = true, redirectTo = "/" }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (!condition) return <Navigate to={redirectTo} replace state={{ from: location }} />;

  return children;
};

export default ProtectedRoute;
