import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
    const { login, register } = useContext(AuthContext);
    
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    
    // Közös mezők
    const [identifier, setIdentifier] = useState(''); // Login Név
    const [jelszo, setJelszo] = useState('');
    
    // Regisztráció exkluzív mezők
    const [email, setEmail] = useState('');
    const [pozicio, setPozicio] = useState('');
    
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (isRegisterMode) {
            const sikeres = await register(identifier, jelszo, pozicio, email);
            if (!sikeres) {
                setError('Hiba a regisztráció során! Ellenőrizd az adatokat.');
            }
        } else {
            const sikeres = await login(identifier, jelszo);
            if (!sikeres) {
                setError('Hibás bejelentkezési adatok! (Ha csak frissítetted a rendszert, regisztrálj egy új fiókot)');
            }
        }
    };

    return (
        <div className="login-container">
            <div className="login-card glass-panel">
                <h2>{isRegisterMode ? 'Új Fiók Regisztrációja' : 'Belépés a rendszerbe'}</h2>
                <p>Műszak Tervező Portál</p>
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>{isRegisterMode ? 'Teljes Név' : 'Dolgozó Neve (vagy ID)'}</label>
                        <input 
                            type="text" 
                            value={identifier} 
                            onChange={(e) => setIdentifier(e.target.value)} 
                            placeholder="Pl: Gipsz Jakab"
                            required
                        />
                    </div>
                    
                    {isRegisterMode && (
                        <>
                            <div className="form-group">
                                <label>Email cím</label>
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    placeholder="pelda@ceg.hu"
                                />
                            </div>
                            <div className="form-group">
                                <label>Pozíció</label>
                                <input 
                                    type="text" 
                                    value={pozicio} 
                                    onChange={(e) => setPozicio(e.target.value)} 
                                    placeholder="Pl: Eladó"
                                />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label>Jelszó</label>
                        <input 
                            type="password" 
                            value={jelszo} 
                            onChange={(e) => setJelszo(e.target.value)} 
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary">
                        {isRegisterMode ? 'Regisztráció' : 'Bejelentkezés'}
                    </button>
                </form>
                
                <div className="login-hint" style={{ marginTop: '1rem', textAlign: 'center', cursor: 'pointer', color: '#6366f1' }} onClick={() => { setIsRegisterMode(!isRegisterMode); setError(''); }}>
                    <small>
                        {isRegisterMode 
                            ? 'Már van fiókod? Kattints ide a belépéshez.' 
                            : 'Nincs még fiókod? Kattints ide a regisztrációhoz.'}
                    </small>
                </div>
            </div>
        </div>
    );
};

export default Login;
