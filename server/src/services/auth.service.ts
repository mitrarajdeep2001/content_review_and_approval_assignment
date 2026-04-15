import { db } from '../db/index.js';
import { users, type User } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export class AuthService {
  /**
   * Validates a user's credentials.
   * Returns the user object if valid, otherwise null.
   */
  async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return null;
      }

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error in AuthService.validateUser:', error);
      throw new Error('Database error during user validation');
    }
  }

  /**
   * Retrieves a user by their ID.
   */
  async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

      if (!user) {
        return null;
      }

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error in AuthService.getUserById:', error);
      throw new Error('Database error during user retrieval');
    }
  }
}

export const authService = new AuthService();
