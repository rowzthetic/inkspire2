import { createContext, useState, useEffect, useContext, useCallback } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // 1. Check if user is already logged in when app loads, and VERIFY token
    useEffect(() => {
        const checkAuth = async () => {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('access');
            
            if (storedUser && token) {
                try {
                    const response = await fetch('http://localhost:8000/api/token/verify/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token })
                    });

                    if (response.ok) {
                        setUser(JSON.parse(storedUser));
                    } else {
                        throw new Error('Token verification failed');
                    }
                } catch (error) {
                    console.warn('Session invalid on load. Clearing session.', error);
                    localStorage.removeItem('user');
                    localStorage.removeItem('access');
                    localStorage.removeItem('refresh');
                    setUser(null);
                    
                    // Redirect to login if they are on a protected route
                    const path = window.location.pathname;
                    const isPublicRoute = ['/', '/login', '/signup', '/gallery', '/artists', '/explore', '/shop', '/about', '/forgot-password'].includes(path) || path.startsWith('/artists/');
                    
                    if (!isPublicRoute) {
                        window.location.href = '/login';
                    }
                }
            } else if (storedUser || token) {
                // Handle inconsistent state where one is present but not the other
                console.warn('Inconsistent auth state. Clearing session.');
                localStorage.removeItem('user');
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
                setUser(null);
            }
            setLoading(false);
        };
        
        checkAuth();
    }, []);

    // 2. Token Refresh Function
    const refreshToken = useCallback(async () => {
        const refresh = localStorage.getItem('refresh');
        
        if (!refresh) {
            return null;
        }

        try {
            setIsRefreshing(true);
            const response = await fetch('http://localhost:8000/api/token/refresh/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh })
            });

            if (!response.ok) {
                // Refresh token is invalid or expired
                throw new Error('Refresh failed');
            }

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

    // 3. Authenticated Fetch Wrapper with Automatic Token Refresh
    const authFetch = useCallback(async (url, options = {}) => {
        let accessToken = localStorage.getItem('access');

        // Prepare headers with auth token
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        // First attempt
        let response = await fetch(url, {
            ...options,
            headers
        });

        // If we get a 401, try to refresh the token
        if (response.status === 401) {
            const newToken = await refreshToken();

            if (newToken) {
                // Retry the original request with new token
                headers['Authorization'] = `Bearer ${newToken}`;
                response = await fetch(url, {
                    ...options,
                    headers
                });
            } else {
                // Refresh failed, logout the user
                logOut();
                throw new Error('Session expired. Please login again.');
            }
        }

        return response;
    }, [refreshToken]);

    // 4. Global Login Function (PURE DATA ONLY)
    const loginAction = async (data) => {
        // Save to local storage
        localStorage.setItem('user', JSON.stringify({
            username: data.username,
            is_artist: data.is_artist,
            profile_image: data.profile_picture
        }));
        
        localStorage.setItem('access', data.access); 
        localStorage.setItem('refresh', data.refresh);
        
        // Update State
        setUser({
            username: data.username,
            is_artist: data.is_artist,
            profile_image: data.profile_picture
        });
    };

    // 5. Global Logout Function
    const logOut = useCallback(() => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        
        // Hard redirect is safer for logout to clear memory
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

export const useAuth = () => {
    return useContext(AuthContext);
};
