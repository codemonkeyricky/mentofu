// Client-side JWT utility for token decoding and expiry checking
// Note: This does NOT verify the token signature - that's done server-side

export class AuthUtils {
  /**
   * Decode a JWT token without verification
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  static decodeToken(token) {
    try {
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode base64 URL encoded payload
      const payload = parts[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));

      return {
        userId: decoded.userId,
        username: decoded.username,
        exp: decoded.exp,
        isParent: decoded.isParent || false
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Check if a token is expired or will expire soon
   * @param {string} token - JWT token
   * @param {number} thresholdMs - Threshold in milliseconds before expiry to consider "expiring soon" (default: 30 minutes)
   * @returns {Object} Object with status information
   */
  static checkTokenExpiry(token, thresholdMs = 30 * 60 * 1000) {
    const decoded = this.decodeToken(token);
    if (!decoded) {
      return { isValid: false, isExpiringSoon: false, isExpired: true, reason: 'Invalid token' };
    }

    const now = Date.now() / 1000; // Convert to seconds (JWT exp is in seconds)
    const expiryTime = decoded.exp;
    const timeUntilExpiry = (expiryTime - now) * 1000; // Convert to milliseconds

    const isExpired = now >= expiryTime;
    const isExpiringSoon = !isExpired && timeUntilExpiry < thresholdMs;

    return {
      isValid: !isExpired,
      isExpiringSoon,
      isExpired,
      expiryTime: expiryTime * 1000, // Return in milliseconds
      timeUntilExpiry,
      userId: decoded.userId,
      username: decoded.username,
      isParent: decoded.isParent || false
    };
  }

  /**
   * Simple wrapper for compatibility with existing code
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded token or null
   */
  static verifyToken(token) {
    const result = this.checkTokenExpiry(token);
    return result.isValid ? {
      userId: result.userId,
      username: result.username,
      exp: result.expiryTime / 1000,
      isParent: result.isParent
    } : null;
  }

  /**
   * Check if token is expiring soon (for compatibility with existing code)
   * @param {string} token - JWT token
   * @returns {boolean} True if token is expiring soon
   */
  static isTokenExpiringSoon(token) {
    const result = this.checkTokenExpiry(token);
    return result.isExpiringSoon;
  }
}

// Export as default for easy import
export default AuthUtils;