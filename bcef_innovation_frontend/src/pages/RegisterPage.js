// src/pages/RegisterPage.js
import React, { useState } from 'react';
import axios from 'axios'; // Assure-toi que tu as importé axios
import './RegisterPage.css';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas !');
        return;
    }
    try {
        const response = await axios.post('http://127.0.0.1:8000/api/users/register/', {
            // The following line is crucial. It adds the missing field.
            confirm_password: confirmPassword, 
            email,
            password,
            first_name: firstName,
            last_name: lastName,
        });
        console.log('Inscription réussie :', response.data);
        alert('Inscription réussie !');
    } catch (error) {
        console.error('Erreur d\'inscription:', error.response.data);
        alert('Erreur d\'inscription: ' + JSON.stringify(error.response.data));
    }
};

    return (
        <div className="register-container">
            <form className="register-form" onSubmit={handleRegister}>
                <h2>Inscription</h2>
                <div className="form-group">
                    <label>Prénom</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Nom</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Mot de passe</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Confirmer le mot de passe</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <button type="submit">S'inscrire</button>
            </form>
        </div>
    );
};

export default RegisterPage;