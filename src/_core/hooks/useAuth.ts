import { useState, useEffect } from 'react';

export interface User {
  id: number;
  email: string;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking authentication status
    const checkAuth = async () => {
      try {
        // In a real app, this would check with your auth provider
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Verify token and get user info
          setIsAuthenticated(true);
          // Mock user data
          setUser({
            id: 1,
            email: 'user@example.com',
            name: 'User',
          });
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // In a real app, this would call your auth API
      localStorage.setItem('auth_token', 'mock_token_' + Date.now());
      setUser({
        id: 1,
        email,
        name: email.split('@')[0],
      });
      setIsAuthenticated(true);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };
}
