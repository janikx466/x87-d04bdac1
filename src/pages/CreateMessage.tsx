import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { doc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import QRCodeCard from "@/components/QRCodeCard";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

const CreateMessage: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [pin, setPin] = useState("");
  const [viewLimit, setViewLimit] = useState(1);
  const [selfDestruct, setSelfDestruct] = useState(true);
  const [copyAllowed, setCopyAllowed] = useState(false);
  const [neverExpire, setNeverExpire] = useState(false);
  const [expiryValue, setExpiryValue] = useState(24);
  const [expiryUnit, setExpiryUnit] = useState<"minutes" | "hours" | "days">("hours");
  const [reminderText, setReminderText] = useState("This message will disappear after you read it 🔒");
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createdReminder, setCreatedReminder] = useState("");

  if (!userData) return <OrbitalLoader />;

  if (createdId) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold text-white mb-2">Secret Message Created! 🔒</h2>
        <p className="text-white/50 text-sm mb-4">Share the QR code or link</p>
        <QRCodeCard vaultId={createdId} reminderText={createdReminder} type="message" />
        <button onClick={() => navigate("/dashboard")} className="mt-6 px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const getExpiryMs = () => {
    switch (expiryUnit) {
      case "minutes": return expiryValue * 60 * 1000;
      case "hours": return expiryValue * 60 * 60 * 1000;
      case "days": return expiryValue * 24 * 60 * 60 * 1000;
    }
  };

  const handleCreate = async () => {
    if (!pin || pin.length < 4) return toast.error("PIN must be at least 4 digits");
    if (!message.trim()) return toast.error("Enter a message");
    if ((userData.credits || 0) < 1) return toast.error("Not enough credits");

    setCreating(true);
    try {
      const messageId = crypto.randomUUID().slice(0, 12);
      const expiry = neverExpire ? null : new Date(Date.now() + getExpiryMs());

      await setDoc(doc(db, "messages", messageId), {
        ownerId: userData.uid,
        message: message.trim(),
        pin: String(pin),
        viewLimit,
        viewCount: 0,
        selfDestruct,
        copyAllowed,
        reminderText: reminderText.trim(),
        status: "active",
        expiry,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", userData.uid), {
        credits: increment(-1),
      });

      setCreatedReminder(reminderText.trim());
      setCreatedId(messageId);
      toast.success("Secret message created!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create message");
    } finally {
      setCreating(false);
    }
  };

  if (creating) return <OrbitalLoader text="Creating secret message..." />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-8">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate("/dashboard")} className="text-white/50 hover:text-white text-sm mb-6">← Back to Dashboard</button>
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-green-500" /> Create Secret Message
        </h1>

        {/* Message */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Secret Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your secret message..."
            rows={5}
            maxLength={2000}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none resize-none"
          />
          <p className="text-xs text-white/30 mt-1">{message.length}/2000</p>
        </div>

        {/* PIN */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Message PIN</label>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter 4+ digit PIN" maxLength={8} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none" />
        </div>

        {/* View Limit */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">View Limit: {viewLimit}</label>
          <input type="range" min={1} max={50} value={viewLimit} onChange={(e) => setViewLimit(Number(e.target.value))} className="w-full accent-green-500" />
        </div>

        {/* Never Expire */}
        <div className="flex items-center gap-3 mb-4 bg-white/5 p-4 rounded-xl">
          <input type="checkbox" checked={neverExpire} onChange={(e) => setNeverExpire(e.target.checked)} className="accent-green-500 w-4 h-4" />
          <label className="text-sm text-white/70">Never expire</label>
        </div>

        {/* Expiry */}
        {!neverExpire && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Expiry: {expiryValue} {expiryUnit}</label>
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

        {/* Reminder Text */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">QR Reminder Text</label>
          <input type="text" value={reminderText} onChange={(e) => setReminderText(e.target.value)} placeholder="Custom reminder" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none text-sm" maxLength={100} />
        </div>

        {/* Self Destruct */}
        <div className="flex items-center gap-3 mb-4 bg-white/5 p-4 rounded-xl">
          <input type="checkbox" checked={selfDestruct} onChange={(e) => setSelfDestruct(e.target.checked)} className="accent-green-500 w-4 h-4" />
          <label className="text-sm text-white/70">Self-destruct after view limit</label>
        </div>

        {/* Copy Toggle */}
        <div className="flex items-center gap-3 mb-8 bg-white/5 p-4 rounded-xl">
          <input type="checkbox" checked={copyAllowed} onChange={(e) => setCopyAllowed(e.target.checked)} className="accent-green-500 w-4 h-4" />
          <label className="text-sm text-white/70">Allow text copying</label>
        </div>

        <button onClick={handleCreate} className="w-full py-3.5 rounded-xl font-bold text-white transition hover:scale-[1.01]" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 10px 30px rgba(22,163,74,0.3)" }}>
          Create Secret Message (1 Credit)
        </button>
        <p className="text-center text-xs text-white/30 mt-3">Available: {userData.credits} credits</p>
      </div>
    </div>
  );
};

export default CreateMessage;
