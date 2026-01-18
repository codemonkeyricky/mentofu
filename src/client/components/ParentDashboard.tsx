import React, { useState, useEffect } from 'react';

const ParentDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real implementation, this would fetch user data from the API
    const fetchUsers = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        // For demo purposes, we'll show a sample structure
        // In a real implementation, this would be an API call:
        // const response = await fetch('/parent/users', {
        //   headers: {
        //     'Authorization': `Bearer ${token}`
        //   }
        // });
        // const data = await response.json();

        // Mock data for demonstration
        const mockUsers = [
          { id: 'user1', username: 'student1', earnedCredits: 150, claimedCredits: 75, multipliers: { 'simple-math': 2, 'simple-words': 1 } },
          { id: 'user2', username: 'student2', earnedCredits: 200, claimedCredits: 100, multipliers: { 'simple-math': 1, 'simple-words': 2 } },
          { id: 'user3', username: 'student3', earnedCredits: 75, claimedCredits: 25, multipliers: { 'simple-math': 3, 'simple-words': 1 } }
        ];

        setUsers(mockUsers);
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
          <p>{users.reduce((sum, user) => sum + user.earnedCredits, 0)}</p>
        </div>
        <div className="stat-card">
          <h3>Total Credits Claimed</h3>
          <p>{users.reduce((sum, user) => sum + user.claimedCredits, 0)}</p>
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
                  <td>{user.earnedCredits}</td>
                  <td>{user.claimedCredits}</td>
                  <td>
                    <div className="multiplier-list">
                      <span>M: {user.multipliers['simple-math']}</span>
                      <span>W: {user.multipliers['simple-words']}</span>
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