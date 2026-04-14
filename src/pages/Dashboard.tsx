import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import AdminMessageInbox from "@/components/AdminMessageInbox";
import { toast } from "sonner";
import { Copy, Plus, Gift, LogOut, CreditCard, BarChart3, QrCode, Shield, MessageSquare, Zap, MoreVertical, User, Mail, FileText, Phone, Info } from "lucide-react";
import logoSrc from "@/assets/logo.png";

const Dashboard: React.FC = () => {
  const { user, userData, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [secretMsgEnabled, setSecretMsgEnabled] = useState(true);

  // Listen for unread admin messages
  useEffect(() => {
    if (!userData?.numericUid) return;
    const q = query(collection(db, "admin_messages"), where("user_uid", "==", userData.numericUid), where("is_seen", "==", false));
    const unsub = onSnapshot(q, (snap) => setUnreadCount(snap.size));
    return () => unsub();
  }, [userData?.numericUid]);

  // Listen for secret message toggle
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "features"), (snap) => {
      if (snap.exists()) {
        setSecretMsgEnabled(snap.data().secretMessageEnabled !== false);
      }
    });
    return () => unsub();
  }, []);

  if (loading) return <OrbitalLoader />;
  if (!userData) return <OrbitalLoader text="Loading profile..." />;

  const inviteLink = `https://x87.lovable.app/auth?ref=${userData.inviteCode || ""}`;

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied!");
  };

  const copyUid = () => {
    navigator.clipboard.writeText(userData.numericUid || "");
    toast.success("UID copied!");
  };

  const joinDate = userData.createdAt?.toDate?.()
    ? userData.createdAt.toDate().toLocaleDateString()
    : userData.createdAt?.seconds
      ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString()
      : "N/A";

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-white/10 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoSrc} alt="SecretGPV" className="w-8 h-8" />
          <span className="font-bold text-sm">Secret<span className="text-green-500">GPV</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/pricing")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition hover:scale-105"
            style={{ background: "linear-gradient(135deg, #2563eb, #9333ea)" }}
          >
            ⚡ Upgrade
          </button>
          <button onClick={() => { setShowProfile(!showProfile); setShowMenu(false); }} className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20">
            {userData.photoURL ? (
              <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-full h-full p-1 text-white/50" />
            )}
          </button>
          <div className="relative">
            <button onClick={() => { setShowMenu(!showMenu); setShowProfile(false); }} className="text-white/40 hover:text-white p-1">
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 w-44 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                <button onClick={() => { navigate("/my-vaults"); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition">My Vaults</button>
                {secretMsgEnabled && (
                  <button onClick={() => { navigate("/my-messages"); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition">My Messages</button>
                )}
                <button onClick={() => { navigate("/pricing"); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition">Plans</button>
                <div className="border-t border-white/10" />
                <button onClick={() => { navigate("/privacy"); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> Privacy
                </button>
                <button onClick={() => { navigate("/terms"); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Terms
                </button>
                <a href="mailto:secretgpv@gmail.com" className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition flex items-center gap-2 text-white">
                  <Phone className="w-3.5 h-3.5" /> Contract
                </a>
                <button onClick={() => { navigate("/about"); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" /> About
                </button>
                <div className="border-t border-white/10" />
                <button onClick={logout} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition">Logout</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Profile Panel */}
      {showProfile && (
        <div className="max-w-5xl mx-auto px-4 mt-4">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-green-500/30 flex-shrink-0">
              {userData.photoURL ? (
                <img src={userData.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full p-2 text-white/50" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{userData.displayName || "User"}</p>
              <p className="text-xs text-white/50 truncate">{userData.email}</p>
              <p className="text-xs text-white/30 mt-0.5">Joined: {joinDate}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate(-1)} className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/50 hover:bg-white/10 transition">Back</button>
              <button onClick={logout} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-xs text-red-400 hover:bg-red-500/20 transition flex items-center gap-1">
                <LogOut className="w-3 h-3" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement */}
      <div className="max-w-5xl mx-auto">
        <AnnouncementBanner />
      </div>

      {/* Message Inbox Button */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <button
          onClick={() => setShowInbox(true)}
          className="w-full p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="font-semibold text-sm">Messages</p>
            <p className="text-[11px] text-white/40">From SecretGPV Official</p>
          </div>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold">Welcome, {userData.displayName || "User"}!</h1>
          <p className="text-white/50 text-xs mt-1">{userData.planName} Plan</p>
          {/* UID */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-white/30">UID:</span>
            <span className="font-mono text-xs text-white/60">{userData.numericUid || "..."}</span>
            <button onClick={copyUid} className="text-white/30 hover:text-white transition">
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: <CreditCard className="w-4 h-4 text-green-500" />, label: "Credits", value: userData.credits },
            { icon: <QrCode className="w-4 h-4 text-green-500" />, label: "Vaults", value: userData.vaultsCreated },
            { icon: <BarChart3 className="w-4 h-4 text-green-500" />, label: "Total Views", value: userData.totalViews },
            { icon: <Gift className="w-4 h-4 text-green-500" />, label: "Referrals", value: userData.referrals },
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1">{s.icon}<span className="text-[10px] text-white/50">{s.label}</span></div>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className={`grid ${secretMsgEnabled ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"} gap-3 mb-6`}>
          <button onClick={() => navigate("/create-vault")} className="flex items-center gap-2 p-4 rounded-2xl bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition text-left">
            <Plus className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-semibold text-sm">Create Vault</p>
              <p className="text-[10px] text-white/50">Upload photos & QR</p>
            </div>
          </button>
          {secretMsgEnabled && (
            <button onClick={() => navigate("/create-message")} className="flex items-center gap-2 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition text-left">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <div>
                <p className="font-semibold text-sm">Secret Message</p>
                <p className="text-[10px] text-white/50">Send encrypted text</p>
              </div>
            </button>
          )}
          <button onClick={() => navigate("/my-vaults")} className="flex items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-left">
            <Shield className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-semibold text-sm">My Vaults</p>
              <p className="text-[10px] text-white/50">Manage vaults</p>
            </div>
          </button>
          {secretMsgEnabled && (
            <button onClick={() => navigate("/my-messages")} className="flex items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-left">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <div>
                <p className="font-semibold text-sm">My Messages</p>
                <p className="text-[10px] text-white/50">View sent messages</p>
              </div>
            </button>
          )}
        </div>

        {/* Invite */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Gift className="w-4 h-4 text-green-500" /> Referral Link</h3>
          <div className="flex gap-2">
            <input readOnly value={inviteLink} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/70 outline-none" />
            <button onClick={copyInvite} className="px-3 py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-white/40 mt-1.5">Code: {userData.inviteCode}</p>
        </div>

        {/* Upgrade */}
        <button
          onClick={() => navigate("/pricing")}
          className="w-full py-3.5 rounded-2xl font-bold text-white text-center transition hover:scale-[1.01]"
          style={{ background: "linear-gradient(135deg, #2563eb, #9333ea)", boxShadow: "0 10px 30px rgba(99,102,241,0.3)" }}
        >
          ⚡ Upgrade Plan
        </button>
      </div>

      {/* Inbox Modal */}
      {showInbox && <AdminMessageInbox onClose={() => setShowInbox(false)} />}
    </div>
  );
};

export default Dashboard;