import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import { Eye, Clock, QrCode, EyeOff, Pause, Play, Timer } from "lucide-react";

interface Vault {
  id: string;
  pin: string;
  viewCount: number;
  viewLimit: number;
  selfDestruct: boolean;
  downloadAllowed: boolean;
  status: string;
  expiry: any;
  createdAt: any;
  fileKeys: string[];
  reminderText: string;
}

function getExpiryDate(expiry: any): Date | null {
  if (!expiry) return null;
  if (expiry.toDate) return expiry.toDate();
  if (expiry.seconds) return new Date(expiry.seconds * 1000);
  if (typeof expiry === "string") return new Date(expiry);
  return null;
}

function useCountdown(target: Date | null) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!target) { setRemaining(""); return; }
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);
  return remaining;
}

const VaultCard: React.FC<{ vault: Vault }> = ({ vault }) => {
  const [showPin, setShowPin] = useState(false);
  const expiryDate = getExpiryDate(vault.expiry);
  const countdown = useCountdown(expiryDate);
  const expired = countdown === "Expired";
  const stopped = vault.status === "stopped";
  const destructed = vault.selfDestruct && vault.viewCount >= vault.viewLimit;

  const toggleStatus = async () => {
    const newStatus = vault.status === "stopped" ? "active" : "stopped";
    await updateDoc(doc(db, "vaults", vault.id), { status: newStatus });
  };

  const statusLabel = destructed ? "Destructed" : expired ? "Expired" : stopped ? "Stopped" : "Active";
  const statusColor = destructed ? "bg-red-500/20 text-red-400" : expired ? "bg-red-500/20 text-red-400" : stopped ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400";

  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-sm text-white/70">{vault.id}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
      </div>

      {/* PIN with toggle */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-white/40">PIN:</span>
        <span className="font-mono text-sm">{showPin ? vault.pin : "••••"}</span>
        <button onClick={() => setShowPin(!showPin)} className="text-white/40 hover:text-white">
          {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm text-white/50 flex-wrap">
        <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{vault.viewCount}/{vault.viewLimit}</span>
        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{vault.fileKeys?.length || 0} photos</span>
        {vault.selfDestruct && <span className="text-red-400 text-xs">💣 Self-destruct</span>}
        {!vault.downloadAllowed && <span className="text-yellow-400 text-xs">🔒 No download</span>}
      </div>

      {/* Countdown timer */}
      {countdown && !destructed && (
        <div className="flex items-center gap-1 mt-2 text-xs">
          <Timer className="w-3.5 h-3.5 text-blue-400" />
          <span className={expired ? "text-red-400" : "text-blue-400"}>{countdown}</span>
        </div>
      )}

      <div className="flex items-center gap-3 mt-3">
        <Link to={`/v/${vault.id}`} className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300">
          <QrCode className="w-3 h-3" /> View vault link
        </Link>
        {!destructed && !expired && (
          <button onClick={toggleStatus} className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white">
            {stopped ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {stopped ? "Resume" : "Stop"}
          </button>
        )}
      </div>
    </div>
  );
};

const MyVaults: React.FC = () => {
  const { userData } = useAuth();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(collection(db, "vaults"), where("ownerId", "==", userData.uid));
    const unsub = onSnapshot(q, (snap) => {
      setVaults(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vault)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [userData?.uid]);

  if (loading) return <OrbitalLoader />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/dashboard" className="text-white/50 hover:text-white text-sm">← Dashboard</Link>
        <h1 className="text-2xl font-bold mt-4 mb-6">My Vaults</h1>

        {vaults.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/50">No vaults yet.</p>
            <Link to="/create-vault" className="text-green-400 text-sm mt-2 inline-block">Create your first vault →</Link>
          </div>
        )}

        <div className="space-y-4">
          {vaults.map((v) => <VaultCard key={v.id} vault={v} />)}
        </div>
      </div>
    </div>
  );
};

export default MyVaults;
