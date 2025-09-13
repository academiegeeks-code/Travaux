import React, { useState } from 'react';
import './FormField.css';

const FormField = ({ label, type = 'text', value, onChange, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`form-field ${isFocused || value ? 'active' : ''}`}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        required
      />
      <label>{label}</label>
      <span className="underline"></span>
    </div>
  );
};

export default FormField;