import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToR2, deleteFromR2 } from "@/lib/worker";
import OrbitalLoader from "@/components/OrbitalLoader";
import QRCodeCard from "@/components/QRCodeCard";
import { toast } from "sonner";
import { Eye, Clock, QrCode, EyeOff, Pause, Play, Timer, Trash2, Edit, Share2, X, Search, Copy, RefreshCw, ArrowLeft, ImagePlus, Loader2 } from "lucide-react";

const WORKER_URL = "https://secretgpv.janikamo465.workers.dev";
const FALLBACK_IMAGE = "/fallback.png";

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
  ownerId: string;
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

const VaultCard: React.FC<any> = ({ vault, onEdit, onImageEdit }) => {
  const [showPin, setShowPin] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const expiryDate = getExpiryDate(vault.expiry);
  const countdown = useCountdown(expiryDate);

  const handleDelete = async () => {
    if (!confirm("Delete this vault permanently?")) return;
    await updateDoc(doc(db, "vaults", vault.id), { status: "deleted" });
    toast.success("Vault deleted");
  };

  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex justify-between mb-2">
        <span className="text-xs text-white/40">{vault.id}</span>
        <span className="text-xs text-green-400">{countdown}</span>
      </div>

      <div className="flex gap-2 text-xs text-white/50">
        <span>{vault.viewCount}/{vault.viewLimit}</span>
        <span>{vault.fileKeys?.length || 0} photos</span>
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={() => setShowQR(true)} className="text-green-400 text-xs">QR</button>
        <button onClick={() => onEdit(vault)} className="text-white text-xs">Edit</button>
        <button onClick={() => onImageEdit(vault)} className="text-purple-400 text-xs">Images</button>
        <button onClick={handleDelete} className="text-red-400 text-xs">Delete</button>
      </div>

      {showQR && <QRCodeCard vaultId={vault.id} />}
    </div>
  );
};

const ImageEditMode: React.FC<any> = ({ vault, onClose }) => {
  const [fileKeys, setFileKeys] = useState<string[]>(vault.fileKeys || []);
  const [fullscreenIdx, setFullscreenIdx] = useState<number | null>(null);

  const getImageUrl = (key: string) => `${WORKER_URL}?file=${encodeURIComponent(key)}`;

  return (
    <div className="fixed inset-0 bg-black z-50 p-4 overflow-auto">
      <button onClick={onClose} className="text-white mb-4">Back</button>

      <div className="grid grid-cols-2 gap-3">
        {fileKeys.map((key, idx) => (
          <img
            key={idx}
            src={getImageUrl(key)}
            className="w-full h-40 object-cover"
            onClick={() => setFullscreenIdx(idx)}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />
        ))}
      </div>

      {fullscreenIdx !== null && (
        <div className="fixed inset-0 bg-black flex items-center justify-center">
          <img
            src={getImageUrl(fileKeys[fullscreenIdx])}
            className="max-w-full max-h-full"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />
        </div>
      )}
    </div>
  );
};

const MyVaults: React.FC = () => {
  const { userData } = useAuth();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [editVault, setEditVault] = useState<any>(null);
  const [imageEditVault, setImageEditVault] = useState<any>(null);

  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(collection(db, "vaults"), where("ownerId", "==", userData.uid));
    const unsub = onSnapshot(q, (snap) => {
      setVaults(snap.docs.map(d => ({ id: d.id, ...d.data() } as Vault)));
      setLoading(false);
    });
    return () => unsub();
  }, [userData?.uid]);

  if (loading) return <OrbitalLoader />;

  return (
    <div className="p-4 text-white">
      <h1 className="text-xl mb-4">My Vaults</h1>

      <div className="space-y-4">
        {vaults.map(v => (
          <VaultCard
            key={v.id}
            vault={v}
            onEdit={setEditVault}
            onImageEdit={setImageEditVault}
          />
        ))}
      </div>

      {imageEditVault && (
        <ImageEditMode
          vault={imageEditVault}
          onClose={() => setImageEditVault(null)}
        />
      )}
    </div>
  );
};

export default MyVaults;
