import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import OrbitalLoader from "@/components/OrbitalLoader";
import { toast } from "sonner";
import logoSrc from "@/assets/logo.png";

const Auth: React.FC = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const navigate = useNavigate();

  if (loading) return <OrbitalLoader />;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleLogin = async () => {
    if (!agreed) {
      toast.error("You must agree to Terms & Conditions to continue.");
      return;
    }
    setSigningIn(true);
    try {
      await signInWithGoogle(true);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Sign in failed");
    } finally {
      setSigningIn(false);
    }
  };

  if (signingIn) return <OrbitalLoader text="Signing in..." />;

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div
        className="w-full max-w-md p-8 rounded-3xl text-center text-white"
        style={{
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <img src={logoSrc} alt="SecretGPV" className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-1">
          Welcome to Secret<span className="text-green-500">GPV</span>
        </h1>
        <p className="text-white/50 text-sm mb-8">Sign in to access your private vaults</p>

        {/* Consent Gate */}
        <div className="flex items-start gap-3 mb-6 text-left bg-white/5 p-4 rounded-xl">
          <Checkbox
            checked={agreed}
            onCheckedChange={(c) => setAgreed(c === true)}
            className="mt-0.5 border-green-500 data-[state=checked]:bg-green-500"
          />
          <label className="text-sm text-white/70 cursor-pointer" onClick={() => setAgreed(!agreed)}>
            I agree to the{" "}
            <a href="/terms" className="text-green-400 underline">Terms & Conditions</a>
            {" "}and{" "}
            <a href="/privacy" className="text-green-400 underline">Privacy Policy</a>
          </label>
        </div>

        <button
          onClick={handleLogin}
          disabled={!agreed}
          className="w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02]"
          style={{
            background: agreed ? "linear-gradient(135deg, #22c55e, #16a34a)" : "#374151",
            boxShadow: agreed ? "0 10px 30px rgba(22,163,74,0.3)" : "none",
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </span>
        </button>

        <p className="mt-6 text-xs text-white/30">
          Your data is encrypted and protected by SecretGPV
        </p>
      </div>
    </div>
  );
};

export default Auth;
