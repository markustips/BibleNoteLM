/**
 * Firebase Authentication Service
 * Handles user authentication with Firebase Auth
 */

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './config';
import { createUser, updateLastLogin } from './services/userService';

// Google Provider
const googleProvider = new GoogleAuthProvider();

// Sign up with email and password
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  displayName: string
): Promise<User> => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update profile with display name
  await updateProfile(user, { displayName });
  
  // Create user document in Firestore
  await createUser(user.uid, {
    email: user.email || email,
    displayName,
    photoURL: user.photoURL || undefined
  });
  
  return user;
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  
  // Update last login
  await updateLastLogin(user.uid);
  
  return user;
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<User> => {
  const { user } = await signInWithPopup(auth, googleProvider);
  
  // Create or update user document
  await createUser(user.uid, {
    email: user.email || undefined,
    displayName: user.displayName || 'User',
    photoURL: user.photoURL || undefined
  });
  
  // Update last login
  await updateLastLogin(user.uid);
  
  return user;
};

// Sign out
export const logOut = async (): Promise<void> => {
  await signOut(auth);
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// Update user profile
export const updateUserProfile = async (
  displayName?: string, 
  photoURL?: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  
  await updateProfile(user, {
    displayName: displayName || user.displayName,
    photoURL: photoURL || user.photoURL
  });
};

// Update user email
export const updateUserEmail = async (
  newEmail: string, 
  currentPassword: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No user logged in');
  
  // Reauthenticate first
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  
  // Update email
  await updateEmail(user, newEmail);
};

// Update user password
export const updateUserPassword = async (
  currentPassword: string, 
  newPassword: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No user logged in');
  
  // Reauthenticate first
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  
  // Update password
  await updatePassword(user, newPassword);
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null;
};
