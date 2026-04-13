import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import QRCodeCard from "@/components/QRCodeCard";
import { toast } from "sonner";
import { Eye, Clock, QrCode, EyeOff, Pause, Play, Timer, Trash2, Edit, Share2, X } from "lucide-react";

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

function getCreatedDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return null;
}

function useCountdown(target: Date | null) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!target) { setRemaining("Never"); return; }
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

const VaultCard: React.FC<{ vault: Vault; onDelete: (id: string) => void; onEdit: (vault: Vault) => void }> = ({ vault, onDelete, onEdit }) => {
  const [showPin, setShowPin] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const expiryDate = getExpiryDate(vault.expiry);
  const countdown = useCountdown(expiryDate);
  const expired = countdown === "Expired";
  const stopped = vault.status === "stopped";
  const deleted = vault.status === "deleted";
  const destructed = vault.selfDestruct && vault.viewCount >= vault.viewLimit;

  const toggleStatus = async () => {
    const newStatus = vault.status === "stopped" ? "active" : "stopped";
    await updateDoc(doc(db, "vaults", vault.id), { status: newStatus });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this vault permanently?")) return;
    await updateDoc(doc(db, "vaults", vault.id), { status: "deleted" });
    onDelete(vault.id);
    toast.success("Vault deleted");
  };

  const handleShare = async () => {
    const url = `https://x87.lovable.app/v/${vault.id}`;
    const text = "Someone sent you a private vault… it may disappear after you view it 🔒";
    if (navigator.share) {
      try { await navigator.share({ title: "SecretGPV Vault", text, url }); } catch {}
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Link copied!");
    }
  };

  if (deleted) return null;

  const statusLabel = destructed ? "Destructed" : expired ? "Expired" : stopped ? "Stopped" : "Active";
  const statusColor = destructed || expired ? "bg-red-500/20 text-red-400" : stopped ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400";

  return (
    <>
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-white/70">{vault.id}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-white/40">PIN:</span>
          <span className="font-mono text-sm">{showPin ? vault.pin : "••••"}</span>
          <button onClick={() => setShowPin(!showPin)} className="text-white/40 hover:text-white">
            {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{vault.viewCount}/{vault.viewLimit}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{vault.fileKeys?.length || 0} photos</span>
          {vault.selfDestruct && <span className="text-red-400">💣</span>}
          {!vault.downloadAllowed && <span className="text-yellow-400">🔒</span>}
        </div>

        {countdown && !destructed && (
          <div className="flex items-center gap-1 mt-1.5 text-[10px]">
            <Timer className="w-3 h-3 text-blue-400" />
            <span className={expired ? "text-red-400" : "text-blue-400"}>{countdown}</span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button onClick={() => setShowQR(true)} className="inline-flex items-center gap-1 text-[10px] text-green-400 hover:text-green-300 bg-green-500/10 px-2 py-1 rounded-lg">
            <QrCode className="w-3 h-3" /> QR
          </button>
          <button onClick={handleShare} className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded-lg">
            <Share2 className="w-3 h-3" /> Share
          </button>
          {!destructed && !expired && (
            <>
              <button onClick={toggleStatus} className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white bg-white/5 px-2 py-1 rounded-lg">
                {stopped ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                {stopped ? "Resume" : "Stop"}
              </button>
              <button onClick={() => onEdit(vault)} className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white bg-white/5 px-2 py-1 rounded-lg">
                <Edit className="w-3 h-3" /> Edit
              </button>
            </>
          )}
          <button onClick={handleDelete} className="inline-flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded-lg">
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div onClick={(e) => e.stopPropagation()} className="relative">
            <button onClick={() => setShowQR(false)} className="absolute -top-3 -right-3 z-50 bg-white/10 rounded-full p-1">
              <X className="w-5 h-5 text-white" />
            </button>
            <QRCodeCard vaultId={vault.id} reminderText={vault.reminderText} />
          </div>
        </div>
      )}
    </>
  );
};

// Edit Modal
const EditVaultModal: React.FC<{ vault: Vault; onClose: () => void }> = ({ vault, onClose }) => {
  const [pin, setPin] = useState(vault.pin);
  const [viewLimit, setViewLimit] = useState(vault.viewLimit);
  const [reminderText, setReminderText] = useState(vault.reminderText || "");
  const [downloadAllowed, setDownloadAllowed] = useState(vault.downloadAllowed);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "vaults", vault.id), {
        pin: String(pin),
        viewLimit,
        reminderText,
        downloadAllowed,
      });
      toast.success("Vault updated!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md p-6 rounded-2xl bg-[#1e293b] border border-white/10 text-white">
        <h3 className="text-lg font-bold mb-4">Edit Vault: {vault.id}</h3>
        <div className="mb-3">
          <label className="text-xs text-white/50 mb-1 block">PIN</label>
          <input type="text" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" />
        </div>
        <div className="mb-3">
          <label className="text-xs text-white/50 mb-1 block">View Limit: {viewLimit}</label>
          <input type="range" min={1} max={50} value={viewLimit} onChange={(e) => setViewLimit(Number(e.target.value))} className="w-full accent-green-500" />
        </div>
        <div className="mb-3">
          <label className="text-xs text-white/50 mb-1 block">Reminder Text</label>
          <input type="text" value={reminderText} onChange={(e) => setReminderText(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" maxLength={100} />
        </div>
        <div className="flex items-center gap-3 mb-4 bg-white/5 p-3 rounded-xl">
          <input type="checkbox" checked={downloadAllowed} onChange={(e) => setDownloadAllowed(e.target.checked)} className="accent-green-500 w-4 h-4" />
          <label className="text-sm text-white/70">Allow downloads</label>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-xl font-semibold text-white text-sm" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

const MyVaults: React.FC = () => {
  const { userData } = useAuth();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"recent" | "all">("recent");
  const [editVault, setEditVault] = useState<Vault | null>(null);

  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(collection(db, "vaults"), where("ownerId", "==", userData.uid));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Vault))
        .filter((v) => v.status !== "deleted");
      setVaults(all);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [userData?.uid]);

  if (loading) return <OrbitalLoader />;

  // Sort by createdAt desc
  const sorted = [...vaults].sort((a, b) => {
    const aDate = getCreatedDate(a.createdAt)?.getTime() || 0;
    const bDate = getCreatedDate(b.createdAt)?.getTime() || 0;
    return bDate - aDate;
  });

  const recentVaults = sorted.slice(0, 1);
  const displayVaults = tab === "recent" ? recentVaults : sorted;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/dashboard" className="text-white/50 hover:text-white text-sm">← Dashboard</Link>
        <h1 className="text-2xl font-bold mt-4 mb-4">My Vaults</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab("recent")} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === "recent" ? "bg-green-500 text-white" : "bg-white/5 text-white/60"}`}>
            Recent
          </button>
          <button onClick={() => setTab("all")} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === "all" ? "bg-green-500 text-white" : "bg-white/5 text-white/60"}`}>
            All Vaults ({vaults.length})
          </button>
        </div>

        {displayVaults.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/50">No vaults yet.</p>
            <Link to="/create-vault" className="text-green-400 text-sm mt-2 inline-block">Create your first vault →</Link>
          </div>
        )}

        <div className="space-y-4">
          {displayVaults.map((v) => (
            <VaultCard key={v.id} vault={v} onDelete={() => {}} onEdit={setEditVault} />
          ))}
        </div>

        {editVault && <EditVaultModal vault={editVault} onClose={() => setEditVault(null)} />}
      </div>
    </div>
  );
};

export default MyVaults;
