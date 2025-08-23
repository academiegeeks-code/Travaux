// src/App.js
import React from 'react';
import "./api/interceptors";

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
//import RegisterPage from './pages/RegisterPage';
import './App.css';
function App() {
  return (
    <Router>
    <div className="App">
     <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              
      </Routes>
    </div>
    </Router>
  );
}

export default App;