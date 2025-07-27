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
import EditPostModal from "./modals/EditPostModal";
import ReplyModal from "./modals/ReplyModal";

function PagesRoutes() {
  const location = useLocation();
  const state = location.state;

  const backgroundLocation = state?.backgroundLocation || null;

  const modalRoutes = [
    { path: "/create-account", element: <CreateAccountModal /> },
    { path: "/sign-in", element: <SignInModal /> },
    { path: "/google-sign-in", element: <OAuthModal /> },
    {
      path: "/create-profile",
      element: (
        <ProtectedRoute condition={state?.fromSignUp === true} redirectTo="/">
          <CreateProfileModal />
        </ProtectedRoute>
      ),
    },
    {
      path: "/create-post",
      element: (
        <ProtectedRoute condition={state?.fromHome === true} redirectTo="/">
          <CreatePostModal />
        </ProtectedRoute>
      ),
    },
    {
      path: "/edit-post/:id",
      element: (
        <ProtectedRoute condition={state?.fromHome === true} redirectTo="/">
          <EditPostModal />
        </ProtectedRoute>
      ),
    },
    {
      path: "/reply-post/:id",
      element: (
        <ProtectedRoute condition={state?.fromHome === true} redirectTo="/">
          <ReplyModal />
        </ProtectedRoute>
      ),
    },
    {
      path: "/edit-profile",
      element: (
        <ProtectedRoute condition={state?.fromHome === true} redirectTo="/">
          <EditProfileModal />
        </ProtectedRoute>
      ),
    },
  ];

  return (
    <>
      {/* Main routes */}
      <Routes location={backgroundLocation || location}>
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
          path="/posts/:id/replies"
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
        {!backgroundLocation &&
          modalRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
      </Routes>
      {state?.backgroundLocation && (
        <Routes>
          {modalRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Routes>
      )}
    </>
  );
}

export default PagesRoutes;
