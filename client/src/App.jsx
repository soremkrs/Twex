import React from "react";
import { BrowserRouter } from "react-router-dom";
import PagesRoutes from "./components/PagesRoutes";
import { AuthProvider } from "./contexts/useAuthContext";
import "./styles/App.css";

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <PagesRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
