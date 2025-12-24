import "./api/interceptors";
import { ThemeProvider } from './pages/contexts/ThemeContext';
import { CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminDashBoard from "./pages/AdminDashBoard";
import LazyRecaptcha from "./services/recaptcha"
import Utilisateurs from "./pages/AdminSection/Views/Utilisateurs"
import Projects from "./pages/AdminSection/Views/Projects.jsx"
import Communications from "./pages/AdminSection/Views/Communications.jsx"
import Archives from "./pages/AdminSection/Views/Archives.jsx"
import Journal from "./pages/AdminSection/Views/Journal.jsx"
import AccountActivation from "./pages/AccountActivation.jsx";
import InternDashBoard from "./pages/InternDashBoard.jsx";
import Userprofile from "./pages/InternSection/views/Userprofile.jsx";
import WorksPage from "./pages/InternSection/views/Workspage.jsx";
import Faq from "./pages/InternSection/views/Faq.jsx";

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
            <Route path="/intern-board" element={<InternDashBoard />} /> 
            <Route path="/user-profile" element={<Userprofile />} /> 
            <Route path="/works" element={<WorksPage />} />
            <Route path="/Faq" element={<Faq />} />
            <Route path="/activate-account" element={<AccountActivation />} />
            <Route path="/admin-dashboard" element={<AdminDashBoard />} />
            <Route path="/users-view" element={<Utilisateurs />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/activity" element={<Communications />} />
            <Route path="/archiving" element={<Archives />} />
            <Route path="/journal" element={<Journal />} />
          </Routes>
        </div>
      </ThemeProvider>
    </Router>

  );
}

export default App;
