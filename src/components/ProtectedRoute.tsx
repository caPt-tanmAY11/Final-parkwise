import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { LoadingState } from "@/components/shared/LoadingState";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

/**
 * ProtectedRoute component that guards routes based on authentication and role
 * 
 * @param children - The components to render if authorized
 * @param requiredRole - Optional role required to access the route ('admin' | 'staff' | 'user')
 * @param redirectTo - Where to redirect if unauthorized (default: '/auth')
 */
export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = "/auth" 
}: ProtectedRouteProps) {
  const { isAuthenticated, hasRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      // If not authenticated, redirect to auth page
      if (!isAuthenticated) {
        navigate(redirectTo, { replace: true });
        return;
      }

      // If a specific role is required and user doesn't have it, redirect to dashboard
      if (requiredRole && !hasRole(requiredRole)) {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, loading, requiredRole, hasRole, navigate, redirectTo]);

  // Show loading state while checking authentication
  if (loading) {
    return <LoadingState message="Loading..." />;
  }

  // If not authenticated, don't render anything (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // If role is required but user doesn't have it, don't render
  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  // User is authenticated and authorized, render children
  return <>{children}</>;
}
