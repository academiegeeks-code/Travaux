import "./api/interceptors";
import { ThemeProvider } from './pages/contexts/ThemeContext';
import { CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminDashBoard from "./pages/AdminDashBoard";
import LazyRecaptcha from "./services/recaptcha"
import Utilisateurs from "./pages/AdminSection/Views/Utilisateurs"

import "./App.css";

function App() {
  return (

    <Router>
      <ThemeProvider>
        <CssBaseline />
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login"
              element={
                <LazyRecaptcha>
                  <LoginPage />
                </LazyRecaptcha>
              }
            />
            <Route path="/admin-dashboard" element={<AdminDashBoard />} />
            <Route path="/users-view" element={<Utilisateurs />} />
          </Routes>
        </div>
      </ThemeProvider>
    </Router>

  );
}

export default App;
