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
  const [notification, setNotification] = React.useState<{type: 'success' | 'error', message: string} | null>(null);

  const fetchUsers = React.useCallback(async () => {
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
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateMultiplier = async (userId: string, quizType: string, multiplier: number) => {
    try {
      setUpdateLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ type: 'error', message: 'No authentication token found. Please log in again.' });
        return;
      }

      const previousValue = editingMultiplier?.value;
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

      setNotification({ type: 'success', message: 'Multiplier updated successfully' });
      setEditingMultiplier(null);

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
    } catch (err: any) {
      console.error('Error updating multiplier:', err);
      setUsers((prevUsers: ParentDashboardUser[]) =>
        prevUsers.map((user: ParentDashboardUser) => {
          if (user.id === userId) {
            return {
              ...user,
              multipliers: {
                ...user.multipliers,
                [quizType]: previousValue || 0
              }
            };
          }
          return user;
        })
      );
      setNotification({ type: 'error', message: `Failed to update multiplier: ${err.message}` });
    } finally {
      setUpdateLoading(false);
    }
  };

  const updateCredits = async (userId: string, field: 'earned' | 'claimed', amount: number) => {
    try {
      setUpdateLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ type: 'error', message: 'No authentication token found. Please log in again.' });
        return;
      }

      if (amount < 0 || !Number.isInteger(amount)) {
        setNotification({ type: 'error', message: 'Please enter a non-negative integer value' });
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
      setNotification({ type: 'success', message: `Credits ${field} updated successfully` });
      setEditingCredits(null);
      setCreditAmount('0');
    } catch (err: any) {
      console.error('Error updating credits:', err);
      setNotification({ type: 'error', message: `Failed to update credits: ${err.message}` });
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

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const handleKeyDownCancel = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Escape') {
      action();
    }
  };

  if (loading) {
    return (
      <div className="parent-dashboard-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="parent-dashboard-container">
        <div className="error">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={fetchUsers} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="parent-dashboard-container">
      <h1>Parent Dashboard</h1>
      <p>Welcome to the Parent Dashboard. Here you can manage user accounts, view credit information, and adjust multipliers.</p>

      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'success' ? '✓' : '✕'}
          </span>
          <span className="notification-message">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="notification-close"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      <div className="dashboard-stats">
        <div className="stat-card" role="stat">
          <h3>Total Users</h3>
          <p>{users.length}</p>
        </div>
        <div className="stat-card" role="stat">
          <h3>Total Credits Earned</h3>
          <p>{users.reduce((sum, user) => sum + (user.earned_credits || 0), 0)}</p>
        </div>
        <div className="stat-card" role="stat">
          <h3>Total Credits Claimed</h3>
          <p>{users.reduce((sum, user) => sum + (user.claimed_credits || 0), 0)}</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Users</h2>
        <div className="users-table">
          <table aria-label="Users table">
            <thead>
              <tr>
                <th scope="col">Username</th>
                <th scope="col">Earned Credits</th>
                <th scope="col">Claimed Credits</th>
                <th scope="col">Multipliers</th>
                <th scope="col">Actions</th>
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
                                <span className="quiz-type-label" aria-label={`${quizName} multiplier value`}>{quizName}: </span>
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
                                  aria-label={`${quizName} multiplier value`}
                                />
                                <div className="multiplier-actions">
                                  <button
                                    onClick={() => updateMultiplier(user.id, quizType, editingMultiplier.value)}
                                    disabled={updateLoading}
                                    className="btn btn-sm btn-success"
                                    aria-label={`Save ${quizName} multiplier`}
                                  >
                                    {updateLoading ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => setEditingMultiplier(null)}
                                    disabled={updateLoading}
                                    className="btn btn-sm btn-outline"
                                    aria-label="Cancel editing"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="multiplier-display">
                                <span className="quiz-type-label">{quizName}: </span>
                                <span className="multiplier-value" aria-label={`${quizName} multiplier value: ${multiplier}`}>
                                  {multiplier}
                                </span>
                                <button
                                  onClick={() => setEditingMultiplier({ userId: user.id, quizType, value: multiplier })}
                                  className="btn btn-sm btn-outline edit-btn"
                                  aria-label={`Edit ${quizName} multiplier`}
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
                          <span className="credit-label" aria-label="Set credits field:">{editingCredits?.field === 'earned' ? 'Earned Credits:' : 'Claimed Credits:'}</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                            disabled={updateLoading}
                            className="credit-amount-input"
                            aria-label={`Set ${editingCredits?.field} credits value`}
                          />
                          <button
                            onClick={() => updateCredits(user.id, editingCredits!.field, Number(creditAmount) || 0)}
                            disabled={updateLoading || Number(creditAmount) < 0}
                            className="btn btn-sm btn-success"
                            aria-label={`Save ${editingCredits?.field} credits`}
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
                            aria-label="Cancel editing credits"
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
                          aria-label="Set user earned credits"
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
                          aria-label="Set user claimed credits"
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