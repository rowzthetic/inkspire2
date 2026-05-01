import { createContext, useState, useEffect, useContext, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // 1. Lazy Initialization: Grab data immediately on start
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        try {
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            return null;
        }
    });

    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 2. Verification on Mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('access');
            const storedUser = localStorage.getItem('user');

            // If we have both, verify the token with the backend
            if (storedUser && token) {
                try {
                    const response = await fetch('http://localhost:8000/api/token/verify/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token })
                    });

                    if (!response.ok) {
                        throw new Error('Token verification failed');
                    }
                    // Token is valid, state is already set by lazy init
                } catch (error) {
                    console.warn('Session invalid. Clearing session.', error);
                    handleClearSession();
                }
            } else if (storedUser || token) {
                // Cleanup inconsistent state
                handleClearSession();
            }

            setLoading(false);
        };

        checkAuth();
    }, []);

    // Helper to clear storage and state consistently
    const handleClearSession = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        setUser(null);
    };

    // 3. Token Refresh Function
    const refreshToken = useCallback(async () => {
        const refresh = localStorage.getItem('refresh');
        if (!refresh) return null;

        try {
            setIsRefreshing(true);
            const response = await fetch('http://localhost:8000/api/token/refresh/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh })
            });

            if (!response.ok) throw new Error('Refresh failed');

            const data = await response.json();
            localStorage.setItem('access', data.access);
            return data.access;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return null;
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    // 4. Authenticated Fetch Wrapper
    const authFetch = useCallback(async (url, options = {}) => {
        let accessToken = localStorage.getItem('access');
        
        const isFormData = options.body instanceof FormData;
        
        const headers = {
            ...options.headers
        };  

        if (!isFormData && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        // If explicitly undefined, delete so browser can handle it (e.g. for FormData)
        if (headers['Content-Type'] === undefined) {
            delete headers['Content-Type'];
        }

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        let response = await fetch(url, { ...options, headers });

        // If 401, try to refresh
        if (response.status === 401) {
            const newToken = await refreshToken();
            if (newToken) {
                headers['Authorization'] = `Bearer ${newToken}`;
                response = await fetch(url, { ...options, headers });
            } else {
                logOut();
                throw new Error('Session expired. Please login again.');
            }
        }
        return response;
    }, [refreshToken]);

    // 5. Global Login Function
    const loginAction = (data) => {
        const userData = {
            username: data.username,
            is_artist: data.is_artist,
            profile_image: data.profile_picture
        };

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);

        setUser(userData);
    };

    // 6. Global Logout Function
    const logOut = useCallback(() => {
        handleClearSession();
        window.location.href = '/login';
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            loginAction,
            logOut,
            loading,
            authFetch,
            isRefreshing
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);