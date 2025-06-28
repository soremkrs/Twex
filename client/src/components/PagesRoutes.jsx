import { Routes, Route, useLocation } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import CreateAccountModal from "./modals/CreateAccountModal";

function PagesRoutes() {
  const location = useLocation();
  const state = location.state;

  const backgroundLocation = state?.backgroundLocation || null;

  return (
    <>
      {/* Main routes */}
      <Routes location={backgroundLocation}>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
      

        {/* Fallback: render modal full-page when no backgroundLocation */}
        {!backgroundLocation && (
          <Route path="/create-account" element={<CreateAccountModal />} />
        )}
      </Routes>

      {/* Modal route if backgroundLocation is set */}
      {state?.backgroundLocation && (
        <Routes>
          <Route path="/create-account" element={<CreateAccountModal />} />
        </Routes>
      )}
    </>
  );
}

export default PagesRoutes;