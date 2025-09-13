import { useState, useEffect } from "react";
import "./CssFiles/LoginPage.css";
import Navbar from "../ui/Navbar";
import useAuth from "../hooks/useAuth";
import LogoTracker from "../LogoTracker.png";
import { useNavigate } from "react-router-dom";
import { useGoogleReCaptcha, GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

const LoginPage = () => {
  const { login, isAuthenticated, authChecked, error: authError, loading: authLoading,user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaError, setCaptchaError] = useState(null);

  useEffect(() => {
    if (authChecked && isAuthenticated && user) {
      if (user) {
      if (user.role === 'admin') navigate('/admin-dashboard');
      else if (user.role === 'intern') navigate('/intern-board');
      else if (user.role === 'supervisor') navigate('/supervisor-board');
      else navigate('/'); // route par défaut ou page d’accueil
    }
    }
    }, [authChecked, isAuthenticated,user, navigate]);

  // Fonction pour exécuter reCAPTCHA
  const executeCaptcha = async () => {
    if (!executeRecaptcha) {
      setCaptchaError("reCAPTCHA n'est pas encore chargé");
      return null;
    }

    try {
      setCaptchaLoading(true);
      setCaptchaError(null);
      const token = await executeRecaptcha("login");
      if (!token) {
        throw new Error("Impossible d'obtenir le token reCAPTCHA");
      }
      setCaptchaToken(token);
      setIsCaptchaVerified(true);
      return token;
    } catch (err) {
      setCaptchaError(err.message || "Erreur reCAPTCHA");
      return null;
    } finally {
      setCaptchaLoading(false);
    }
  };

  // Gestionnaire de soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isCaptchaVerified) {
      // Si reCAPTCHA n'est pas encore vérifié, on l'exécute manuellement
      const token = await executeCaptcha();
      if (token) {
        // Utiliser le token pour la connexion
        await login(email, password, token);
      }
    } else {
      // Si reCAPTCHA est déjà vérifié, on utilise le token existant
      await login(email, password, captchaToken);
    }
  };

  return (
    <div className="login-admin-container">
      <Navbar />
      <div className="login-background"></div>
      <form className="login-admin-form glassmorphism-card" onSubmit={handleSubmit}>
        <div className="login-header">
          <div className="login-icon">
            <img src={LogoTracker} alt="Logo" />
          </div>
          <h2>Espace Administrateur</h2>
          <p>Accédez au tableau de bord de gestion</p>
        </div>

        <div className="form-group">
          <label>
            <span className="input-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
              </svg>
            </span>
            Adresse email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@entreprise.com"
            className="glassmorphism-input"
          />
        </div>

        <div className="form-group">
          <label>
            <span className="input-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            Mot de passe
          </label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Votre mot de passe"
              className="glassmorphism-input"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                  <path
                    fillRule="evenodd"
                    d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z"
                    clipRule="evenodd"
                  />
                  <path d="M10.748 13.93l2.523 2.523a10.023 10.023 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Indicateur de reCAPTCHA */}
        <div className="captcha-status">
          {captchaLoading && <span>Vérification de sécurité en cours...</span>}
          {captchaError && <span className="error-message">{captchaError}</span>}
          {isCaptchaVerified && !captchaLoading && (
            <span className="success-message">✓ Vérification de sécurité réussie</span>
          )}
        </div>

        <button
          type="submit"
          className={`login-admin-btn ${authLoading || captchaLoading ? "loading" : ""}`}
          disabled={authLoading || captchaLoading}
        >
          {authLoading || captchaLoading ? (
            <>
              <span className="spinner"></span>
              Connexion en cours...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z"
                  clipRule="evenodd"
                />
              </svg>
              Se connecter
            </>
          )}
        </button>

        {authError && (
          <p className="error-message" style={{ color: "red", textAlign: "center", marginTop: "10px" }}>
            {authError}
          </p>
        )}

        <div className="login-footer">
          <a href="#forgot" className="forgot-password">
            Mot de passe oublié ?
          </a>
        </div>
      </form>
    </div>
  );
};

// Wrapper pour fournir le contexte reCAPTCHA
const LoginPageWithRecaptcha = () => {
  return (
    <GoogleReCaptchaProvider
            reCaptchaKey="6LeGVr4rAAAAAEGEx5NbzKSIFrAZ6f4O4e5XsrKx"
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'body',
        nonce: undefined,
      }}
      container={{
        parameters: {
          badge: 'bottomright', // ou 'inline'
          theme: 'light',
        }
      }}
    >
      <LoginPage />
    </GoogleReCaptchaProvider>
  );
};

export default LoginPageWithRecaptcha;