import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import QRCodeCard from "@/components/QRCodeCard";
import { toast } from "sonner";
import { Eye, EyeOff, Clock, Timer, Pause, Play, Trash2, MessageSquare, X } from "lucide-react";

interface Message {
  id: string;
  pin: string;
  message: string;
  viewCount: number;
  viewLimit: number;
  selfDestruct: boolean;
  copyAllowed: boolean;
  status: string;
  expiry: any;
  createdAt: any;
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

const MessageCard: React.FC<{ msg: Message }> = ({ msg }) => {
  const [showPin, setShowPin] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const expiryDate = getExpiryDate(msg.expiry);
  const countdown = useCountdown(expiryDate);
  const expired = countdown === "Expired";
  const stopped = msg.status === "stopped";
  const destructed = msg.selfDestruct && msg.viewCount >= msg.viewLimit;

  const toggleStatus = async () => {
    const newStatus = msg.status === "stopped" ? "active" : "stopped";
    await updateDoc(doc(db, "messages", msg.id), { status: newStatus });
  };

  const handleDelete = async () => {
    if (!confirm("Delete this message permanently?")) return;
    await updateDoc(doc(db, "messages", msg.id), { status: "deleted" });
    toast.success("Message deleted");
  };

  const statusLabel = destructed ? "Destroyed" : expired ? "Expired" : stopped ? "Stopped" : "Active";
  const statusColor = destructed || expired ? "bg-red-500/20 text-red-400" : stopped ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400";

  return (
    <>
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-white/70 flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-purple-400" /> {msg.id}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
        </div>

        <p className="text-sm text-white/60 mb-2 truncate">{msg.message}</p>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-white/40">PIN:</span>
          <span className="font-mono text-sm">{showPin ? msg.pin : "••••"}</span>
          <button onClick={() => setShowPin(!showPin)} className="text-white/40 hover:text-white">
            {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-white/50">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{msg.viewCount}/{msg.viewLimit}</span>
          {msg.selfDestruct && <span className="text-red-400">💣</span>}
          {!msg.copyAllowed && <span className="text-yellow-400">🔒 No copy</span>}
        </div>

        {countdown && !destructed && (
          <div className="flex items-center gap-1 mt-1.5 text-[10px]">
            <Timer className="w-3 h-3 text-blue-400" />
            <span className={expired ? "text-red-400" : "text-blue-400"}>{countdown}</span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button onClick={() => setShowQR(true)} className="text-[10px] text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">QR Code</button>
          {!destructed && !expired && (
            <button onClick={toggleStatus} className="inline-flex items-center gap-1 text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded-lg">
              {stopped ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {stopped ? "Resume" : "Stop"}
            </button>
          )}
          <button onClick={handleDelete} className="inline-flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">
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
            <QRCodeCard vaultId={msg.id} reminderText={msg.reminderText} type="message" />
          </div>
        </div>
      )}
    </>
  );
};

const MyMessages: React.FC = () => {
  const { userData } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) return;
    const q = query(collection(db, "messages"), where("ownerId", "==", userData.uid));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Message))
          .filter((m) => m.status !== "deleted")
      );
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [userData?.uid]);

  if (loading) return <OrbitalLoader />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/dashboard" className="text-white/50 hover:text-white text-sm">← Dashboard</Link>
        <h1 className="text-2xl font-bold mt-4 mb-6">My Messages</h1>

        {messages.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/50">No messages yet.</p>
            <Link to="/create-message" className="text-green-400 text-sm mt-2 inline-block">Create your first secret message →</Link>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((m) => <MessageCard key={m.id} msg={m} />)}
        </div>
      </div>
    </div>
  );
};

export default MyMessages;
