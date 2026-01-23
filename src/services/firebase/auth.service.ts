import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { User } from '../../types';

export class AuthService {
  // Sign up new user
  static async signUp(email: string, password: string, displayName: string): Promise<User> {
    try {
      // Create authentication account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update display name
      await updateProfile(firebaseUser, { displayName });

      // Create user profile in Firestore
      const newUser: User = {
        id: firebaseUser.uid,
        email: email,
        displayName: displayName,
        createdAt: new Date(),
        preferences: {
          units: 'metric',
          notifications: true,
          weatherAlerts: true,
          theme: 'light',
        },
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...newUser,
        createdAt: newUser.createdAt.toISOString(),
      });

      return newUser;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
  }

  // Sign in existing user
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      return {
        ...userData,
        createdAt: new Date(userData.createdAt),
      } as User;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  // Get current user
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  // Get user profile from Firestore
  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data();
      return {
        ...userData,
        createdAt: new Date(userData.createdAt),
      } as User;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  static async resetUserPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error('Failed to send password reset to email');
    }
  }
}