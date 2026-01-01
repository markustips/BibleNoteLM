import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '../stores/useUserStore';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
}) => {
  const { isAuthenticated, role } = useUserStore();
  const { loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (requiredRole && role !== requiredRole) {
    // Redirect based on user's actual role
    if (role === 'super_admin') {
      return <Navigate to="/super-admin" replace />;
    } else if (role === 'admin' || role === 'pastor') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check if user has one of the allowed roles
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect based on user's actual role
    if (role === 'super_admin') {
      return <Navigate to="/super-admin" replace />;
    } else {
      // For roles not in allowedRoles (like guest), show unauthorized
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
