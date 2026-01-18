import { useEffect, useState } from 'react';
import ParentDashboard from '../components/ParentDashboard';
import { User } from '../types';

// Parent dashboard component with admin authentication
export default function ParentDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated and is an admin
    const checkAuth = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token') || document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, "$1");

        if (!token) {
          // Redirect to login page
          window.location.href = '/login';
          return;
        }

        // Verify token with the server (simulated)
        // In a real implementation, this would be an API call to verify the token
        // const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify`, {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${token}`,
        //     'Content-Type': 'application/json',
        //   },
        // });

        // For this demo, we'll simulate that verification passes
        // In real implementation, this would check the actual token validity

        // Mock user data - in real app, this would come from the server
        setUser({
          id: 'parent-user-id',
          username: 'parent',
          isAdmin: true
        } as User);

        setLoading(false);
      } catch (err) {
        console.error('Authentication check failed:', err);
        setError('Authentication failed');
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="parent-dashboard">
      <h1>Parent Dashboard</h1>
      <ParentDashboard />
    </div>
  );
}