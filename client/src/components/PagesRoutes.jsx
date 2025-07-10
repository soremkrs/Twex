import { Routes, Route, useLocation } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import CreateAccountModal from "./modals/CreateAccountModal";
import CreateProfileModal from "./modals/CreateProfileModal";
import SignInModal from "./modals/SignInModal";
import OAuthModal from "./modals/OAuthModal";
import ProtectedRoute from "./ProtectedRoute";
import EditProfileModal from "./modals/EditProfileModal";
import CreatePostModal from "./modals/CreatePostModal";

function PagesRoutes() {
  const location = useLocation();
  const state = location.state;

  const backgroundLocation = state?.backgroundLocation || null;

  return (
    <>
      {/* Main routes */}
      <Routes location={backgroundLocation}>
        <Route path="/" element={<Login />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookmarks"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/:username"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-profile"
          element={
            <ProtectedRoute
              condition={state?.fromSignUp === true}
              redirectTo="/"
            >
              <CreateProfileModal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-post"
          element={
            <ProtectedRoute
              condition={state?.fromSignUp === true}
              redirectTo="/"
            >
              <CreatePostModal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute condition={state?.fromHome === true} redirectTo="/">
              <EditProfileModal />
            </ProtectedRoute>
          }
        />

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
        {!backgroundLocation && (
          <Route
            path="/create-profile"
            element={
              <ProtectedRoute
                condition={state?.fromSignUp === true} // Allow only if we came from signup
                redirectTo="/"
              >
                <CreateProfileModal />
              </ProtectedRoute>
            }
          />
        )}
        {!backgroundLocation && (
          <Route
            path="/create-post"
            element={
              <ProtectedRoute
                condition={state?.fromSignUp === true} // Allow only if we came from signup
                redirectTo="/"
              >
                <CreatePostModal />
              </ProtectedRoute>
            }
          />
        )}
        {!backgroundLocation && (
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute
                condition={state?.fromHome === true} // Allow only if we came from home page
                redirectTo="/"
              >
                <EditProfileModal />
              </ProtectedRoute>
            }
          />
        )}
      </Routes>

      {/* Modal route if backgroundLocation is set */}
      {state?.backgroundLocation && (
        <Routes>
          <Route path="/create-account" element={<CreateAccountModal />} />
          <Route path="/create-profile" element={<CreateProfileModal />} />
          <Route path="/create-post" element={<CreatePostModal />} />
          <Route path="/edit-profile" element={<EditProfileModal />} />
          <Route path="/sign-in" element={<SignInModal />} />
          <Route path="/google-sign-in" element={<OAuthModal />} />
        </Routes>
      )}
    </>
  );
}

export default PagesRoutes;
