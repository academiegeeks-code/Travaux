// components/LazyRecaptcha.jsx
import { useState, useEffect } from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

const LazyRecaptcha = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Charger reCAPTCHA seulement après le montage du composant
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return <div>{children}</div>;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey="6LeGVr4rAAAAAEGEx5NbzKSIFrAZ6f4O4e5XsrKx"
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'body',
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
};

export default LazyRecaptcha;