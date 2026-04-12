import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import OrbitalLoader from "@/components/OrbitalLoader";
import { toast } from "sonner";
import { Copy, Plus, Gift, LogOut, CreditCard, BarChart3, QrCode, Shield } from "lucide-react";
import logoSrc from "@/assets/logo.png";

const Dashboard: React.FC = () => {
  const { user, userData, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) return <OrbitalLoader />;
  if (!userData) return <OrbitalLoader text="Loading profile..." />;

  const inviteLink = `https://x87.lovable.app/auth?ref=${userData.inviteCode || ""}`;

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied!");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoSrc} alt="SecretGPV" className="w-8 h-8" />
          <span className="font-bold">Secret<span className="text-green-500">GPV</span></span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/60 hidden sm:block">{userData.email}</span>
          <button onClick={logout} className="text-white/40 hover:text-white transition">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Welcome, {userData.displayName || "User"}!</h1>
          <p className="text-white/50 text-sm mt-1">{userData.planName} Plan</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <CreditCard className="w-5 h-5 text-green-500" />, label: "Credits", value: userData.credits },
            { icon: <QrCode className="w-5 h-5 text-green-500" />, label: "Vaults", value: userData.vaultsCreated },
            { icon: <BarChart3 className="w-5 h-5 text-green-500" />, label: "Total Views", value: userData.totalViews },
            { icon: <Gift className="w-5 h-5 text-green-500" />, label: "Referrals", value: userData.referrals },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-white/50">{s.label}</span></div>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <button onClick={() => navigate("/create-vault")} className="flex items-center gap-3 p-5 rounded-2xl bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition text-left">
            <Plus className="w-6 h-6 text-green-500" />
            <div>
              <p className="font-semibold">Create Vault</p>
              <p className="text-xs text-white/50">Upload photos & generate QR (1 credit)</p>
            </div>
          </button>
          <button onClick={() => navigate("/my-vaults")} className="flex items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-left">
            <Shield className="w-6 h-6 text-green-500" />
            <div>
              <p className="font-semibold">My Vaults</p>
              <p className="text-xs text-white/50">View and manage your vaults</p>
            </div>
          </button>
        </div>

        {/* Invite */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-8">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Gift className="w-5 h-5 text-green-500" /> Referral Link</h3>
          <div className="flex gap-2">
            <input readOnly value={inviteLink} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 outline-none" />
            <button onClick={copyInvite} className="px-4 py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-white/40 mt-2">Code: {userData.inviteCode}</p>
        </div>

        {/* Upgrade */}
        <button
          onClick={() => navigate("/pricing")}
          className="w-full py-4 rounded-2xl font-bold text-white text-center transition hover:scale-[1.01]"
          style={{ background: "linear-gradient(135deg, #2563eb, #9333ea)", boxShadow: "0 10px 30px rgba(99,102,241,0.3)" }}
        >
          ⚡ Upgrade Plan
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
