import React from 'react';
import { ParentDashboardUser } from '../types/index';

const ParentDashboard: React.FC = () => {
  const [users, setUsers] = React.useState<ParentDashboardUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingMultiplier, setEditingMultiplier] = React.useState<{userId: string, quizType: string, value: number} | null>(null);
  const [updateLoading, setUpdateLoading] = React.useState(false);
  const [editingCredits, setEditingCredits] = React.useState<{userId: string, field: 'earned' | 'claimed', amount: number} | null>(null);
  const [creditAmount, setCreditAmount] = React.useState<string>('0');

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const response = await fetch('/parent/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = '/login';
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const transformedUsers: ParentDashboardUser[] = data.users.map((user: any) => ({
          id: user.id,
          username: user.username,
          earned_credits: user.earnedCredits || 0,
          claimed_credits: user.claimedCredits || 0,
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

  const updateMultiplier = async (userId: string, quizType: string, multiplier: number) => {
    try {
      setUpdateLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please log in again.');
        return;
      }

      setUsers((prevUsers: ParentDashboardUser[]) =>
        prevUsers.map((user: ParentDashboardUser) => {
          if (user.id === userId) {
            return {
              ...user,
              multipliers: {
                ...user.multipliers,
                [quizType]: multiplier
              }
            };
          }
          return user;
        })
      );

      const response = await fetch(`/parent/users/${userId}/multiplier`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quizType, multiplier })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      setEditingMultiplier(null);
    } catch (err: any) {
      console.error('Error updating multiplier:', err);
      setUsers((prevUsers: ParentDashboardUser[]) =>
        prevUsers.map((user: ParentDashboardUser) => {
          if (user.id === userId) {
            return {
              ...user,
              multipliers: {
                ...user.multipliers,
                [quizType]: editingMultiplier?.value || 0
              }
            };
          }
          return user;
        })
      );
      alert(`Failed to update multiplier: ${err.message}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  const updateCredits = async (userId: string, field: 'earned' | 'claimed', amount: number) => {
    try {
      setUpdateLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please log in again.');
        return;
      }

      if (amount < 0 || !Number.isInteger(amount)) {
        alert('Please enter a non-negative integer value');
        return;
      }

      const response = await fetch(`/parent/users/${userId}/credits`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ field, amount })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      await fetchUsers();
      setEditingCredits(null);
      setCreditAmount('0');
    } catch (err: any) {
      console.error('Error updating credits:', err);
      alert(`Failed to update credits: ${err.message}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  const quizTypeNames: Record<string, string> = {
    'simple-math': 'Multiplication',
    'simple-math-2': 'Division',
    'simple-math-3': 'Fraction Comparison',
    'simple-math-4': 'BODMAS',
    'simple-math-5': 'Factors',
    'simple-math-6': 'LCM',
    'simple-remainder': 'Remainder'
  };

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
                      {user.multipliers && Object.entries(user.multipliers).map(([quizType, multiplier]) => {
                        const quizName = quizTypeNames[quizType] || quizType;
                        const isEditing = editingMultiplier?.userId === user.id && editingMultiplier?.quizType === quizType;

                        return (
                          <div key={quizType} className="multiplier-item">
                            {isEditing ? (
                              <div className="multiplier-edit">
                                <span className="quiz-type-label">{quizName}: </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={editingMultiplier.value}
                                  onChange={(e) => setEditingMultiplier({
                                    ...editingMultiplier,
                                    value: parseInt(e.target.value) || 0
                                  })}
                                  disabled={updateLoading}
                                  className="multiplier-input"
                                />
                                <div className="multiplier-actions">
                                  <button
                                    onClick={() => updateMultiplier(user.id, quizType, editingMultiplier.value)}
                                    disabled={updateLoading}
                                    className="btn btn-sm btn-success"
                                  >
                                    {updateLoading ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => setEditingMultiplier(null)}
                                    disabled={updateLoading}
                                    className="btn btn-sm btn-outline"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="multiplier-display">
                                <span className="quiz-type-label">{quizName}: </span>
                                <span className="multiplier-value">{multiplier}</span>
                                <button
                                  onClick={() => setEditingMultiplier({ userId: user.id, quizType, value: multiplier })}
                                  className="btn btn-sm btn-outline edit-btn"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    {editingCredits?.userId === user.id && (editingCredits?.field === 'earned' || editingCredits?.field === 'claimed') ? (
                      <div className="credit-edit">
                        <div className="credit-edit-row">
                          <span className="credit-label">Set {editingCredits?.field === 'earned' ? 'Earned' : 'Claimed'} Credits:</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                            disabled={updateLoading}
                            className="credit-amount-input"
                          />
                          <button
                            onClick={() => updateCredits(user.id, editingCredits!.field, Number(creditAmount) || 0)}
                            disabled={updateLoading || Number(creditAmount) < 0}
                            className="btn btn-sm btn-success"
                          >
                            {updateLoading ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingCredits(null);
                              setCreditAmount('0');
                            }}
                            disabled={updateLoading}
                            className="btn btn-sm btn-outline"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="user-actions">
                        <button
                          onClick={() => {
                            setEditingCredits({ userId: user.id, field: 'earned', amount: 0 });
                            setCreditAmount('0');
                          }}
                          className="btn btn-sm btn-outline"
                          title="Set Earned Credits"
                        >
                          Earned Credits
                        </button>
                        <button
                          onClick={() => {
                            setEditingCredits({ userId: user.id, field: 'claimed', amount: 0 });
                            setCreditAmount('0');
                          }}
                          className="btn btn-sm btn-outline"
                          title="Set Claimed Credits"
                        >
                          Claimed Credits
                        </button>
                      </div>
                    )}
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