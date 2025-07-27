import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import OAuthButton from "../components/buttons/OAuthButton";
import DividerCenter from "../components/divider/DividerCenter";
import CreateAccountButton from "../components/buttons/CreateAccountButton";
import SignInButton from "../components/buttons/SignInButton";
import TwexLogo from "../assets/TwexLogo.svg";
import Footer from "../components/footer/Footer";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateWithBackground = (path) => {
    navigate(path, { state: { backgroundLocation: location } });
  };

  const openCreateAccountModal = () => navigateWithBackground("/create-account");
  const openSignInModal = () => navigateWithBackground("/sign-in");
  const openGoogleAuth = () => navigateWithBackground("/google-sign-in");

  return (
    <div className="page">
      <main className="container">
        <div className="login-container">
          <div className="login-left">
            <img src={TwexLogo} alt="Twex Logo" />
          </div>
          <div className="login-right">
            <h3>Create an account</h3>
            <OAuthButton text="Sign up with Google" onClick={openGoogleAuth} />
            <DividerCenter />
            <CreateAccountButton onClick={openCreateAccountModal} />
            <h4>Already have an account?</h4>
            <SignInButton onClick={openSignInModal} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Login;
