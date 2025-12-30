import fs from 'fs';

/**
 * Utility for managing test database cleanup
 */
export class TestDatabaseUtil {
  /**
   * Clean up a test database file
   */
  public static cleanupTestDatabase(dbPath: string): void {
    try {
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
    } catch (error) {
      // Silently ignore cleanup errors
      console.warn(`Failed to clean up test database: ${dbPath}`);
    }
  }

  /**
   * Create a new test database path
   */
  public static createTestDatabasePath(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000);
    return `./test-quiz-${timestamp}-${randomSuffix}.db`;
  }
}