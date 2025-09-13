import React from 'react';
import './AlertMessage.css';

const AlertMessage = ({ type = 'info', message, onClose }) => {
  return (
    <div className={`alert ${type}`}>
      <span className="message">{message}</span>
      {onClose && (
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>
      )}
    </div>
  );
};

export default AlertMessage;