import { Routes, Route, useLocation } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import CreateAccountModal from "./modals/CreateAccountModal";
import CreateProfileModal from "./modals/CreateProfileModal";
import SignInModal from "./modals/SignInModal";
import OAuthModal from "./modals/OAuthModal";

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
        <Route path="/create-profile" element={<CreateProfileModal />} />
        <Route path="/google-sign-in" element={<OAuthModal />} />
      

        {/* Fallback: render modal full-page when no backgroundLocation */}
        {!backgroundLocation && (
          <Route path="/create-account" element={<CreateAccountModal />} />
        )}
        {!backgroundLocation && (
          <Route path="/sign-in" element={<SignInModal />} />
        )}
        {!backgroundLocation && (
          <Route path="/google-sign-in" element={<OAuthModal />} /> 
        )}
      </Routes>

      {/* Modal route if backgroundLocation is set */}
      {state?.backgroundLocation && (
        <Routes>
          <Route path="/create-account" element={<CreateAccountModal />} />
          <Route path="/create-profile" element={<CreateProfileModal />} />
          <Route path="/sign-in" element={<SignInModal />} />
          <Route path="/google-sign-in" element={<OAuthModal />} />
        </Routes>
      )}
    </>
  );
}

export default PagesRoutes;