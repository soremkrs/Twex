import React from "react";
import { BrowserRouter } from 'react-router-dom';
import PagesRoutes from "./components/PagesRoutes";
import "./styles/App.css"

function App() {
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
			<PagesRoutes />
		</BrowserRouter>
    );
}

export default App;