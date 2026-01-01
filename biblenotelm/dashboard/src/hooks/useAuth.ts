import { useEffect, useState } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../App';
import { useUserStore } from '../stores/useUserStore';
import { UserRole } from '../types';

export const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateUser, logout: storeLogout } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserData(firebaseUser);
      } else {
        storeLogout();
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (firebaseUser: FirebaseUser) => {
    try {
      setError(null);

      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Update user store with Firebase data
        updateUser({
          id: firebaseUser.uid,
          name: userData.name || firebaseUser.displayName || 'User',
          email: userData.email || firebaseUser.email || '',
          avatar: userData.photoURL || firebaseUser.photoURL || '',
          role: userData.role as UserRole || 'guest',
          subscriptionTier: userData.subscriptionTier || 'free',
          churchId: userData.churchId || null,
          churchCode: userData.churchCode || null,
          churchName: userData.churchName || null,
          isAuthenticated: true,
        });
      } else {
        // User document doesn't exist in Firestore - new user
        updateUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || '',
          role: 'guest',
          subscriptionTier: 'free',
          churchId: null,
          churchCode: null,
          churchName: null,
          isAuthenticated: true,
        });
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // User data will be loaded by onAuthStateChanged
      return result.user;
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      storeLogout();
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err.message || 'Failed to sign out');
      throw err;
    }
  };

  return {
    loading,
    error,
    signInWithGoogle,
    signOut,
  };
};
