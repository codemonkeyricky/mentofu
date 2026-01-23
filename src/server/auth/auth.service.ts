import { User, DecodedToken } from './auth.types';
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { generateUUID } from '../utils/uuid';
import { DatabaseService } from '../database/interface/database.service';

class AuthService {
  private db: DatabaseService;
  private readonly JWT_SECRET: string = process.env.JWT_SECRET || 'quiz-app-secret-key';
  private readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';
  private tokenExpiry = 0;

  constructor(databaseService?: DatabaseService) {
    // Log warning if using default JWT secret (for security awareness)
    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET environment variable not set. Using default secret. This is insecure for production.');
    }
    // Initialize database service
    this.db = databaseService || new DatabaseService();
  }

  public setDatabaseService(databaseService: DatabaseService): void {
    this.db = databaseService;
  }

  public async register(username: string, password: string, isParent: boolean = false): Promise<User> {
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
      passwordHash,
      isParent
    };

    // Save to database
    const savedUser = await this.db.createUser(newUser);
    return savedUser;
  }

  public async login(username: string, password: string): Promise<{ token: string; user: { id: string; username: string; isParent?: boolean } }> {
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
        username: foundUser.username,
        isParent: foundUser.isParent
      }
    };
  }

  public verifyToken(token: string): DecodedToken | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as DecodedToken;
      this.tokenExpiry = decoded.exp * 1000;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  public getTokenExpiry(): number {
    return this.tokenExpiry;
  }

  public isTokenExpiringSoon(): boolean {
    const now = Date.now();
    const timeUntilExpiry = this.tokenExpiry - now;
    return timeUntilExpiry < (30 * 60 * 1000);
  }

  public async renewToken(userId: string): Promise<string> {
    // Look up user to get their actual username and parent status
    const user = await this.db.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const newToken = jwt.sign(
      { userId: userId, username: user.username, isParent: user.isParent || false },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN } as jwt.SignOptions
    );
    return newToken;
  }

  public getUserById(userId: string): Promise<User | null> {
    return this.db.findUserById(userId);
  }
}

export const authService = new AuthService();