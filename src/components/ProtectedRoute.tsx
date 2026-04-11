import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import OrbitalLoader from "@/components/OrbitalLoader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, userData, loading } = useAuth();

  if (loading) return <OrbitalLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && !userData?.isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
