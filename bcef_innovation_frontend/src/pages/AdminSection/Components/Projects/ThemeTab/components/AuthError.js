// components/themes/AuthError.jsx
import React from 'react';
import { AlertCircle, LogIn } from 'lucide-react';

const AuthError = ({ error, onRetry }) => {
  const handleReconnect = () => {
    // Rediriger vers la page de login
    window.location.href = '/login';
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erreur d'authentification</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={handleReconnect}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Se reconnecter
            </button>
            
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Réessayer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthError;