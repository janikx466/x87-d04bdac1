import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { uploadToR2 } from "@/lib/worker";
import { doc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import QRCodeCard from "@/components/QRCodeCard";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

const CreateVault: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [pin, setPin] = useState("");
  const [viewLimit, setViewLimit] = useState(5);
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [expiryHours, setExpiryHours] = useState(24);
  const [creating, setCreating] = useState(false);
  const [createdVaultId, setCreatedVaultId] = useState<string | null>(null);

  if (!userData) return <OrbitalLoader />;

  if (createdVaultId) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold text-white mb-2">Vault Created! 🎉</h2>
        <p className="text-white/50 text-sm mb-4">Share the QR code to give access</p>
        <QRCodeCard vaultId={createdVaultId} />
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!pin || pin.length < 4) return toast.error("PIN must be at least 4 digits");
    if (files.length === 0) return toast.error("Upload at least one photo");
    if ((userData.credits || 0) < 1) return toast.error("Not enough credits");

    setCreating(true);
    try {
      const vaultId = crypto.randomUUID().slice(0, 12);
      const fileKeys: string[] = [];

      for (const file of files) {
        const key = `vaults/${vaultId}/${Date.now()}-${file.name}`;
        await uploadToR2(file, key);
        fileKeys.push(key);
      }

      const expiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

      await setDoc(doc(db, "vaults", vaultId), {
        ownerId: userData.uid,
        pin: String(pin),
        fileKeys,
        viewLimit,
        viewCount: 0,
        selfDestruct,
        expiry,
        createdAt: serverTimestamp(),
      });

      // Deduct credit
      await updateDoc(doc(db, "users", userData.uid), {
        credits: increment(-1),
        vaultsCreated: increment(1),
      });

      setCreatedVaultId(vaultId);
      toast.success("Vault created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create vault");
    } finally {
      setCreating(false);
    }
  };

  if (creating) return <OrbitalLoader text="Creating vault..." />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-8">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate("/dashboard")} className="text-white/50 hover:text-white text-sm mb-6">
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold mb-6">Create New Vault</h1>

        {/* Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Photos</label>
          <label className="flex flex-col items-center gap-2 p-8 rounded-2xl border-2 border-dashed border-white/20 hover:border-green-500/50 cursor-pointer transition">
            <Upload className="w-8 h-8 text-white/40" />
            <span className="text-sm text-white/50">Click to upload photos</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </label>
          {files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <span key={i} className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-lg text-xs">
                  {f.name.slice(0, 20)}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFiles(files.filter((_, j) => j !== i))} />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* PIN */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Vault PIN</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter 4+ digit PIN"
            maxLength={8}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none"
          />
        </div>

        {/* View Limit */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">View Limit: {viewLimit}</label>
          <input
            type="range"
            min={1}
            max={50}
            value={viewLimit}
            onChange={(e) => setViewLimit(Number(e.target.value))}
            className="w-full accent-green-500"
          />
        </div>

        {/* Expiry */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Expiry (hours): {expiryHours}</label>
          <input
            type="range"
            min={1}
            max={168}
            value={expiryHours}
            onChange={(e) => setExpiryHours(Number(e.target.value))}
            className="w-full accent-green-500"
          />
        </div>

        {/* Self Destruct */}
        <div className="flex items-center gap-3 mb-8 bg-white/5 p-4 rounded-xl">
          <input
            type="checkbox"
            checked={selfDestruct}
            onChange={(e) => setSelfDestruct(e.target.checked)}
            className="accent-green-500 w-4 h-4"
          />
          <label className="text-sm text-white/70">Self-destruct after view limit reached</label>
        </div>

        <button
          onClick={handleCreate}
          className="w-full py-3.5 rounded-xl font-bold text-white transition hover:scale-[1.01]"
          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 10px 30px rgba(22,163,74,0.3)" }}
        >
          Create Vault (1 Credit)
        </button>
        <p className="text-center text-xs text-white/30 mt-3">Available: {userData.credits} credits</p>
      </div>
    </div>
  );
};

export default CreateVault;
