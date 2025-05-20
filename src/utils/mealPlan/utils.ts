
/**
 * A simple string hashing function that works in browsers
 * Not cryptographically secure, but adequate for our content comparison needs
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex string and ensure it's positive
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Other utility functions for meal planning can be added here
 */
