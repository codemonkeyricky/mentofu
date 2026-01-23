import React from 'react';
import { ParentDashboardUser } from '../types/index';

// Use global React if available (for module consistency in browser)
const ReactInstance = window.React && window.React.useState ? window.React : React;
console.log('ParentDashboard: ReactInstance version:', ReactInstance.version);

const ParentDashboard: React.FC = () => {
  // Safety check for React hooks
  if (typeof ReactInstance.useState !== 'function') {
    throw new Error('ReactInstance.useState is not a function. React may not be loaded correctly.');
  }

  const [users, setUsers] = ReactInstance.useState<ParentDashboardUser[]>([]);
  const [loading, setLoading] = ReactInstance.useState(true);
  const [error, setError] = ReactInstance.useState<string | null>(null);
  const [editingMultiplier, setEditingMultiplier] = ReactInstance.useState<{userId: string, quizType: string, value: number} | null>(null);
  const [updateLoading, setUpdateLoading] = ReactInstance.useState(false);
  const [editingCredits, setEditingCredits] = ReactInstance.useState<{userId: string, field: 'earned' | 'claimed', amount: number} | null>(null);
  const [creditAmount, setCreditAmount] = ReactInstance.useState<string>('0');
  const [creditType, setCreditType] = ReactInstance.useState<'add' | 'subtract' | 'set'>('add');

  ReactInstance.useEffect(() => {
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

        // The API returns { users: [...] } with snake_case fields, but our component expects them
        // We'll transform the data to match our TypeScript interface
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

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No authentication token found. Please log in again.');
        return;
      }

      // Update local state optimistically
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

      // Make API request
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

      // Clear editing state
      setEditingMultiplier(null);

    } catch (err: any) {
      console.error('Error updating multiplier:', err);

      // Revert optimistic update on error
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

  const startEditing = (userId: string, quizType: string, currentValue: number) => {
    setEditingMultiplier({ userId, quizType, value: currentValue });
  };

  const cancelEditing = () => {
    setEditingMultiplier(null);
  };

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

  const handleSave = () => {
    if (editingMultiplier) {
      updateMultiplier(editingMultiplier.userId, editingMultiplier.quizType, editingMultiplier.value);
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

      const amountValue = parseInt(creditAmount) || 0;
      if (amountValue <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      const response = await fetch(`/parent/users/${userId}/credits`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          field,
          amount: amountValue,
          type: creditType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      await fetchUsers();

      setEditingCredits(null);
      setCreditAmount('0');
      setCreditType('add');

    } catch (err: any) {
      console.error('Error updating credits:', err);
      alert(`Failed to update credits: ${err.message}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  const startEditingCredits = (userId: string, field: 'earned' | 'claimed') => {
    setEditingCredits({ userId, field, amount: 0 });
    setCreditAmount('0');
    setCreditType('add');
  };

  const cancelEditingCredits = () => {
    setEditingCredits(null);
    setCreditAmount('0');
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
                        const quizName = quizType === 'simple-math' ? 'Multiplication' :
                                         quizType === 'simple-math-2' ? 'Division' :
                                         quizType === 'simple-math-3' ? 'Fraction Comparison' :
                                         quizType === 'simple-math-4' ? 'BODMAS' :
                                         quizType === 'simple-math-5' ? 'Factors' : quizType;
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
                                    onClick={handleSave}
                                    disabled={updateLoading}
                                    className="btn btn-sm btn-success"
                                  >
                                    {updateLoading ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={cancelEditing}
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
                                  onClick={() => startEditing(user.id, quizType, multiplier)}
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
                      {editingCredits?.userId === user.id && editingCredits?.field === 'earned' ? (
                       <div className="credit-edit">
                         <div className="credit-edit-row">
                           <span className="credit-label">Add Earned:</span>
                           <select
                             value={creditType}
                             onChange={(e) => setCreditType(e.target.value as 'add' | 'subtract' | 'set')}
                             className="credit-type-select"
                             disabled={updateLoading}
                           >
                             <option value="add">Add</option>
                             <option value="subtract">Subtract</option>
                             <option value="set">Set</option>
                           </select>
                           <input
                             type="number"
                             min="1"
                             step="1"
                             value={creditAmount}
                             onChange={(e) => setCreditAmount(e.target.value)}
                             disabled={updateLoading}
                             className="credit-amount-input"
                           />
                           <button
                             onClick={() => updateCredits(user.id, 'earned', parseInt(creditAmount) || 0)}
                             disabled={updateLoading || parseInt(creditAmount) <= 0}
                             className="btn btn-sm btn-success"
                           >
                             {updateLoading ? 'Saving...' : 'Save'}
                           </button>
                           <button
                             onClick={cancelEditingCredits}
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
                           onClick={() => startEditingCredits(user.id, 'earned')}
                           className="btn btn-sm btn-outline"
                           title="Add/Remove Earned Credits"
                         >
                           Earned Credits
                         </button>
                         <button
                           onClick={() => startEditingCredits(user.id, 'claimed')}
                           className="btn btn-sm btn-outline"
                           title="Add/Remove Claimed Credits"
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