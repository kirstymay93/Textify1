export function useAuth() {
  return {
    user: {
      id: 1,
      email: 'demo@example.com',
      name: 'Demo User',
    },
    isAuthenticated: true,
    loading: false,
  };
}
