/**
 * Database utility functions for common operations.
 * Provides shared utilities for UUID generation and PostgreSQL result handling.
 */

/**
 * Generates a random UUID v4 string.
 * @returns A random UUID string in the format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * @example
 * const uuid = generateUUID(); // "3e4f6a2b-5c7d-4e8f-9a1b-2c3d4e5f6a7b"
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Handles PostgreSQL query results by extracting the first row or returning null.
 * @param result - The PostgreSQL query result object
 * @returns The first row as type T, or null if no rows exist
 * @template T - The type of the row data
 * @example
 * const user = handlePostgresResult<User>(result); // Returns User | null
 */
export function handlePostgresResult<T>(result: any): T {
  return result.rows && result.rows.length > 0 ? (result.rows[0] as T) : (null as T);
}
