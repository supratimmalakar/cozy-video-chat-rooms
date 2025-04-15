
/**
 * Utility functions for room-related operations
 */

/**
 * Generate a random room ID
 * @returns A random string that can be used as a room ID
 */
export function createRoomId(): string {
  return Math.random().toString(36).substring(2, 12);
}
