import React from 'react';
import { ParentUser } from './types';

// Use global React if available (for module consistency in browser)
const ReactInstance = window.React && window.React.useState ? window.React : React;
console.log('ParentUserDetail: ReactInstance version:', ReactInstance.version);

interface ParentUserDetailProps {
  user: ParentUser;
  onBack: () => void;
}

export const ParentUserDetail: React.FC<ParentUserDetailProps> = ({ user, onBack }) => {
  // Safety check for React hooks
  if (typeof ReactInstance.useState !== 'function') {
    throw new Error('ReactInstance.useState is not a function. React may not be loaded correctly.');
  }

  const [userData, setUserData] = ReactInstance.useState<any>(null);
  const [loading, setLoading] = ReactInstance.useState<boolean>(true);
  const [error, setError] = ReactInstance.useState<string | null>(null);

  ReactInstance.useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/parent/users/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUserData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [user.id]);

  if (loading) {
    return (
      <div className="parent-user-detail">
        <header className="parent-user-detail-header">
          <button className="back-button" onClick={onBack}>
            ← Back to Users
          </button>
          <h2>Loading User Details...</h2>
        </header>
        <main className="parent-user-detail-main">
          <div className="loading-state">
            <p>Fetching user information...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="parent-user-detail">
        <header className="parent-user-detail-header">
          <button className="back-button" onClick={onBack}>
            ← Back to Users
          </button>
          <h2>User Details</h2>
        </header>
        <main className="parent-user-detail-main">
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="parent-user-detail">
      <header className="parent-user-detail-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Users
        </button>
        <h2>User Details</h2>
      </header>

      <main className="parent-user-detail-main">
        <div className="user-profile">
          <h3>{user.name}</h3>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Children:</strong> {user.children.length}</p>
        </div>

        {userData && (
          <div className="user-details">
            <h3>Credits and Multipliers</h3>
            <div className="credits-info">
              <div className="credit-item">
                <span className="credit-label">Earned Credits:</span>
                <span className="credit-value">{userData.earned_credits || 0}</span>
              </div>
              <div className="credit-item">
                <span className="credit-label">Claimed Credits:</span>
                <span className="credit-value">{userData.claimed_credits || 0}</span>
              </div>
              <div className="credit-item">
                <span className="credit-label">Available Credits:</span>
                <span className="credit-value">{userData.available_credits || 0}</span>
              </div>
            </div>

            <div className="multipliers-info">
              <h4>Multipliers</h4>
              {userData.multipliers && userData.multipliers.length > 0 ? (
                <div className="multiplier-list">
                  {userData.multipliers.map((multiplier: any, index: number) => (
                    <div key={index} className="multiplier-item">
                      <span className="multiplier-label">{multiplier.name}:</span>
                      <span className="multiplier-value">{multiplier.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No multipliers found</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};