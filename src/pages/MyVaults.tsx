import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import QRCodeCard from "@/components/QRCodeCard";
import { toast } from "sonner";
import { Eye, Clock, QrCode, EyeOff, Pause, Play, Timer, Trash2, Edit, Share2, X, Search, Copy } from "lucide-react";

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
  shortCode?: string;
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

const VaultCard: React.FC<{ vault: Vault; onEdit: (vault: Vault) => void }> = ({ vault, onEdit }) => {
  const [showPin, setShowPin] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const expiryDate = getExpiryDate(vault.expiry);
  const countdown = useCountdown(expiryDate);
  const expired = countdown === "Expired";
  const stopped = vault.status === "stopped";
  const destructed = vault.selfDestruct && vault.viewCount >= vault.viewLimit;

  const toggleStatus = async () => {
    const newStatus = vault.status === "stopped" ? "active" : "stopped";
    await updateDoc(doc(db, "vaults", vault.id), { status: newStatus });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this vault permanently?")) return;
    await updateDoc(doc(db, "vaults", vault.id), { status: "deleted" });
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

  const statusLabel = destructed ? "Destructed" : expired ? "Expired" : stopped ? "Stopped" : "Active";
  const statusColor = destructed || expired ? "bg-red-500/20 text-red-400" : stopped ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400";

  return (
    <>
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {vault.shortCode && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-400 flex items-center gap-1">
                {vault.shortCode}
                <button
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(vault.shortCode!); toast.success("Short code copied!"); }}
                  className="hover:text-blue-300"
                >
                  <Copy className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            <span className="font-mono text-xs text-white/40">{vault.id}</span>
          </div>
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

      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div onClick={(e) => e.stopPropagation()} className="relative">
            <button onClick={() => setShowQR(false)} className="absolute -top-3 -right-3 z-50 bg-white/10 rounded-full p-1">
              <X className="w-5 h-5 text-white" />
            </button>
            <QRCodeCard vaultId={vault.id} reminderText={vault.reminderText} shortCode={vault.shortCode} />
          </div>
        </div>
      )}
    </>
  );
};

// Edit Modal with expiry editing
const EditVaultModal: React.FC<{ vault: Vault; onClose: () => void }> = ({ vault, onClose }) => {
  const [pin, setPin] = useState(vault.pin);
  const [viewLimit, setViewLimit] = useState(vault.viewLimit);
  const [reminderText, setReminderText] = useState(vault.reminderText || "");
  const [downloadAllowed, setDownloadAllowed] = useState(vault.downloadAllowed);
  const [neverExpire, setNeverExpire] = useState(!vault.expiry);
  const [expiryValue, setExpiryValue] = useState(24);
  const [expiryUnit, setExpiryUnit] = useState<"minutes" | "hours" | "days">("hours");
  const [saving, setSaving] = useState(false);

  const getExpiryMs = () => {
    switch (expiryUnit) {
      case "minutes": return expiryValue * 60 * 1000;
      case "hours": return expiryValue * 60 * 60 * 1000;
      case "days": return expiryValue * 24 * 60 * 60 * 1000;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = {
        pin: String(pin),
        viewLimit,
        reminderText,
        downloadAllowed,
      };

      if (neverExpire) {
        updates.expiry = null;
      } else {
        updates.expiry = new Date(Date.now() + getExpiryMs());
      }

      await updateDoc(doc(db, "vaults", vault.id), updates);
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
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md p-6 rounded-2xl bg-[#1e293b] border border-white/10 text-white max-h-[90vh] overflow-y-auto">
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
        <div className="flex items-center gap-3 mb-3 bg-white/5 p-3 rounded-xl">
          <input type="checkbox" checked={downloadAllowed} onChange={(e) => setDownloadAllowed(e.target.checked)} className="accent-green-500 w-4 h-4" />
          <label className="text-sm text-white/70">Allow downloads</label>
        </div>

        {/* Expiry editing */}
        <div className="flex items-center gap-3 mb-3 bg-white/5 p-3 rounded-xl">
          <input type="checkbox" checked={neverExpire} onChange={(e) => setNeverExpire(e.target.checked)} className="accent-green-500 w-4 h-4" />
          <label className="text-sm text-white/70">Never expire</label>
        </div>

        {!neverExpire && (
          <div className="mb-4">
            <label className="text-xs text-white/50 mb-1 block">New Expiry (from now): {expiryValue} {expiryUnit}</label>
            <div className="flex gap-2">
              <input type="range" min={1} max={expiryUnit === "minutes" ? 60 : expiryUnit === "hours" ? 168 : 30} value={expiryValue} onChange={(e) => setExpiryValue(Number(e.target.value))} className="flex-1 accent-green-500" />
              <select value={expiryUnit} onChange={(e) => setExpiryUnit(e.target.value as any)} className="bg-white/5 border border-white/10 rounded-xl px-2 py-1 text-sm text-white outline-none">
                <option value="minutes">Min</option>
                <option value="hours">Hrs</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>
        )}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const sorted = useMemo(() =>
    [...vaults].sort((a, b) => {
      const aDate = getCreatedDate(a.createdAt)?.getTime() || 0;
      const bDate = getCreatedDate(b.createdAt)?.getTime() || 0;
      return bDate - aDate;
    }), [vaults]);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return sorted;
    const q = debouncedSearch.toUpperCase();
    return sorted.filter((v) => v.shortCode?.toUpperCase().includes(`SG-${q}`) || v.shortCode?.toUpperCase().includes(q) || v.id.includes(debouncedSearch));
  }, [sorted, debouncedSearch]);

  const recentVaults = filtered.slice(0, 1);
  const displayVaults = tab === "recent" ? recentVaults : filtered;

  if (loading) return <OrbitalLoader />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/dashboard" className="text-white/50 hover:text-white text-sm">← Dashboard</Link>
        <h1 className="text-2xl font-bold mt-4 mb-4">My Vaults</h1>

        {/* Search */}
        <div className="mb-4">
          <p className="text-[10px] text-white/30 mb-1">Find Vault Instantly using Short Code</p>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-white/30" />
            <span className="text-sm text-white/50 font-mono">SG-</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. 7K2X"
              className="flex-1 bg-transparent text-white text-sm outline-none font-mono"
              maxLength={4}
            />
          </div>
        </div>

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
            <p className="text-white/50">{debouncedSearch ? "No vault found for this code" : "No vaults yet."}</p>
            {!debouncedSearch && <Link to="/create-vault" className="text-green-400 text-sm mt-2 inline-block">Create your first vault →</Link>}
          </div>
        )}

        <div className="space-y-4">
          {displayVaults.map((v) => (
            <VaultCard key={v.id} vault={v} onEdit={setEditVault} />
          ))}
        </div>

        {editVault && <EditVaultModal vault={editVault} onClose={() => setEditVault(null)} />}
      </div>
    </div>
  );
};

export default MyVaults;