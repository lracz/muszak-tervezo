import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || null);

    const logout = useCallback(() => {
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }, []);

    const refreshAuthToken = useCallback(async () => {
        if (!refreshToken || !user) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, refreshToken: refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                setToken(data.token);
                setRefreshToken(data.refreshToken);
                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                console.log("Token sikeresen frissítve!");
            } else {
                console.warn("Refresh token lejárt vagy érvénytelen, kiléptetés...");
                logout();
            }
        } catch (error) {
            console.error("Refresh hiba:", error);
        }
    }, [refreshToken, user, logout]);

    // Token frissítése minden 14 percben (mivel 15 perces az élettartama)
    useEffect(() => {
        if (token && refreshToken) {
            const interval = setInterval(() => {
                refreshAuthToken();
            }, 14 * 60 * 1000); // 14 perc

            return () => clearInterval(interval);
        }
    }, [token, refreshToken, refreshAuthToken]);

    useEffect(() => {
        if (token) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }
    }, [token]);

    const login = async (identifier, jelszo) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, jelszo })
            });

            if (response.ok) {
                const data = await response.json();
                setToken(data.token);
                setRefreshToken(data.refreshToken);
                setUser(data.dolgozo);
                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('user', JSON.stringify(data.dolgozo));
                return true;
            } else {
                const errorData = await response.json();
                alert(errorData.message || "Hibás bejelentkezés");
                return false;
            }
        } catch (error) {
            console.error("Login hiba:", error);
            return false;
        }
    };

    const register = async (nev, jelszo, szerepkor, pozicio, email) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nev, jelszo, szerepkor, pozicio, email })
            });

            if (response.ok) {
                const data = await response.json();
                setToken(data.token);
                setRefreshToken(data.refreshToken);
                setUser(data.dolgozo);
                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('user', JSON.stringify(data.dolgozo));
                return true;
            } else {
                const errorData = await response.json();
                alert(errorData.message || "Regisztrációs hiba");
                return false;
            }
        } catch (error) {
            console.error("Regisztrációs hiba:", error);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isHR: user?.szerepkor === 'HR' }}>
            {children}
        </AuthContext.Provider>
    );
};
