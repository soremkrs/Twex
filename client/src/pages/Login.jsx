import React from "react";
import OAuthButton from "../components/buttons/OAuthButton";
import DividerCenter from "../components/divider/DividerCenter";
import CreateAccountButton from "../components/buttons/CreateAccountButton";
import SignInButton from "../components/buttons/SignInButton";
import TwexLogo from "../assets/TwexLogo.svg";
import Footer from "../components/footer/Footer"
import "../styles/Login.css";

function Login() {
    return (
        <div className="page">
            <main className="container">
                <div className="login-container">
                    <div className="login-left">
                        <img src={TwexLogo} alt="Twex Logo" />
                    </div>
                    <div className="login-right">
                        <h3>Create an account</h3>
                        <OAuthButton />
                        <DividerCenter />
                        <CreateAccountButton />
                        <h4>Already have an account?</h4>
                        <SignInButton />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default Login;