import { User } from './auth.types';
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { generateUUID } from '../utils/uuid';
import { DatabaseService } from '../database/database.service';

class AuthService {
  private db: DatabaseService;
  private readonly JWT_SECRET: string = process.env.JWT_SECRET || 'quiz-app-secret-key';
  private readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';

  constructor(databasePath?: string) {
    // Initialize database service - using default path or provided path
    this.db = new DatabaseService(databasePath);
  }

  public async register(username: string, password: string): Promise<User> {
    // Check if user already exists by querying the database
    const existingUser = await this.db.findUserByUsername(username);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const userId = generateUUID();
    const newUser: Omit<User, 'createdAt'> = {
      id: userId,
      username,
      passwordHash
    };

    // Save to database
    const savedUser = await this.db.createUser(newUser);
    return savedUser;
  }

  public async login(username: string, password: string): Promise<{ token: string; user: { id: string; username: string } }> {
    // Find user by username in database
    const foundUser = await this.db.findUserByUsername(username);

    if (!foundUser) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, foundUser.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: foundUser.id, username: foundUser.username },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    return {
      token,
      user: {
        id: foundUser.id,
        username: foundUser.username
      }
    };
  }

  public verifyToken(token: string): { userId: string; username: string } | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string; username: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  public getUserById(userId: string): Promise<User | null> {
    return this.db.findUserById(userId);
  }
}

export const authService = new AuthService();