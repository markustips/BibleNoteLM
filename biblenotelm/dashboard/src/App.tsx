import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WebDashboard from './components/WebDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import LoginPage from './components/LoginPage';
import UnauthorizedPage from './components/UnauthorizedPage';
import ProtectedRoute from './components/ProtectedRoute';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { useUserStore } from './stores/useUserStore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

const App: React.FC = () => {
  useEffect(() => {
    console.log('BibleNoteLM Church Dashboard initialized');
    console.log('Firebase Project:', firebaseConfig.projectId);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Unauthorized Route */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Super Admin Dashboard - Only for super_admin role */}
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute requiredRole="super_admin">
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Dashboard - For all authenticated users (guests can access limited features) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['guest', 'member', 'subscriber', 'pastor', 'admin']}>
              <WebDashboard />
            </ProtectedRoute>
          }
        />

        {/* Default Route - Redirect based on authentication and role */}
        <Route
          path="/"
          element={<RootRedirect />}
        />

        {/* Catch all - redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

// Component to handle root redirect based on user role
const RootRedirect: React.FC = () => {
  const { isAuthenticated, role } = useUserStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  if (role === 'super_admin') {
    return <Navigate to="/super-admin" replace />;
  } else {
    // All authenticated users (guest, member, subscriber, pastor, admin) go to dashboard
    // Dashboard will show different content based on role and permissions
    return <Navigate to="/dashboard" replace />;
  }
};

export default App;
