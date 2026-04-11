import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { verifyVault } from "@/lib/worker";
import OrbitalLoader from "@/components/OrbitalLoader";
import { toast } from "sonner";
import { Lock } from "lucide-react";

const ViewVault: React.FC = () => {
  const { vaultId } = useParams<{ vaultId: string }>();
  const [pin, setPin] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [unlocked, setUnlocked] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!pin || !vaultId) return toast.error("Enter a valid PIN");
    setVerifying(true);
    try {
      const res = await verifyVault(vaultId, pin);
      setImages(res.images || []);
      setUnlocked(true);
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) return <OrbitalLoader text="Verifying PIN..." />;

  if (unlocked) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">🔓 Vault Unlocked</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map((src, i) => (
              <img key={i} src={src} alt={`Vault photo ${i + 1}`} className="w-full rounded-2xl shadow-lg" crossOrigin="anonymous" />
            ))}
          </div>
          {images.length === 0 && (
            <p className="text-center text-white/50 mt-8">No photos found in this vault.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div
        className="w-full max-w-sm p-8 rounded-3xl text-center text-white"
        style={{
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <Lock className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Private Vault</h1>
        <p className="text-white/50 text-sm mb-6">Enter PIN to unlock photos</p>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter PIN"
          maxLength={8}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-center text-lg tracking-[0.3em] outline-none mb-4"
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
        />
        <button
          onClick={handleVerify}
          className="w-full py-3 rounded-xl font-bold text-white transition"
          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
        >
          Unlock Vault
        </button>
      </div>
    </div>
  );
};

export default ViewVault;
