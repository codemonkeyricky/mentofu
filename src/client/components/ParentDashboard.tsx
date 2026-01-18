import React, { useState, useEffect } from 'react';
import { ParentDashboardUser } from '../types';

const ParentDashboard: React.FC = () => {
  const [users, setUsers] = useState<ParentDashboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        // Fetch real user data from the API
        const response = await fetch('/parent/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login page if unauthorized
            window.location.href = '/login';
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // The API returns snake_case fields, but our component expects them
        // We'll transform the data to match our TypeScript interface
        const transformedUsers: ParentDashboardUser[] = data.map((user: any) => ({
          id: user.id,
          username: user.username,
          earned_credits: user.earned_credits || 0,
          claimed_credits: user.claimed_credits || 0,
          multipliers: user.multipliers || {}
        }));

        setUsers(transformedUsers);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load user data');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <div className="loading">Loading user data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="parent-dashboard-container">
      <h1>Parent Dashboard</h1>
      <p>Welcome to the Parent Dashboard. Here you can manage user accounts, view credit information, and adjust multipliers.</p>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{users.length}</p>
        </div>
        <div className="stat-card">
          <h3>Total Credits Earned</h3>
          <p>{users.reduce((sum, user) => sum + (user.earned_credits || 0), 0)}</p>
        </div>
        <div className="stat-card">
          <h3>Total Credits Claimed</h3>
          <p>{users.reduce((sum, user) => sum + (user.claimed_credits || 0), 0)}</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Users</h2>
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Earned Credits</th>
                <th>Claimed Credits</th>
                <th>Multipliers</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.earned_credits || 0}</td>
                  <td>{user.claimed_credits || 0}</td>
                  <td>
                    <div className="multiplier-list">
                      {user.multipliers && Object.entries(user.multipliers).map(([quizType, multiplier]) => (
                        <span key={quizType}>{quizType}: {multiplier}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-actions">
        <h2>Management Tools</h2>
        <div className="action-buttons">
          <button className="btn btn-primary">Manage Users</button>
          <button className="btn btn-outline">View Reports</button>
          <button className="btn btn-outline">Adjust Multipliers</button>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;