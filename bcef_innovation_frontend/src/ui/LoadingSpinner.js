import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner">
        <div className="ellipse ellipse-1"></div>
        <div className="ellipse ellipse-2"></div>
        <div className="ellipse ellipse-3"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;