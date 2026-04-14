import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, increment as fbIncrement, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import adminLogoSrc from "@/assets/admin-logo.png";

interface AdminMessage {
  id: string;
  message: string;
  is_seen: boolean;
  verify_enabled: boolean;
  credits: number;
  timestamp: any;
  verified?: boolean;
  cancelled?: boolean;
}

const AdminMessageInbox: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { userData } = useAuth();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<AdminMessage | null>(null);
  const [activating, setActivating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!userData?.numericUid) return;
    const q = query(collection(db, "admin_messages"), where("user_uid", "==", userData.numericUid));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as AdminMessage))
        .sort((a, b) => {
          const aT = a.timestamp?.seconds || 0;
          const bT = b.timestamp?.seconds || 0;
          return bT - aT;
        });
      setMessages(msgs);
    });
    return () => unsub();
  }, [userData?.numericUid]);

  const markSeen = async (msg: AdminMessage) => {
    if (!msg.is_seen) {
      await updateDoc(doc(db, "admin_messages", msg.id), { is_seen: true });
    }
    setSelectedMsg(msg);
  };

  const handleVerify = async () => {
    if (!selectedMsg || !userData) return;
    setActivating(true);
    try {
      // Activate custom plan
      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, {
        planName: "Custom",
        credits: fbIncrement(selectedMsg.credits || 0),
      });
      await updateDoc(doc(db, "admin_messages", selectedMsg.id), { verified: true });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedMsg(null);
      }, 3000);
    } catch (err: any) {
      toast.error(err.message || "Activation failed");
    } finally {
      setActivating(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedMsg) return;
    await updateDoc(doc(db, "admin_messages", selectedMsg.id), { cancelled: true });
    setSelectedMsg(null);
  };

  const unreadCount = messages.filter((m) => !m.is_seen).length;

  const formatDate = (ts: any) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { day: "numeric", month: "short" });
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-2">Congratulations!</h1>
          <p className="text-green-400 text-lg">Custom Plan Activated</p>
          <p className="text-white/40 text-sm mt-2">+{selectedMsg?.credits} credits added</p>
        </div>
      </div>
    );
  }

  if (selectedMsg) {
    return (
      <div className="fixed inset-0 z-[9998] bg-[#0a0a0a] flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <button onClick={() => setSelectedMsg(null)} className="text-white/50 hover:text-white">
            ←
          </button>
          <div className="flex items-center gap-2">
            <img src={adminLogoSrc} alt="" className="w-8 h-8 rounded-full" />
            <div>
              <span className="text-white font-semibold text-sm">SecretGPV Official</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" className="w-3.5 h-3.5 inline ml-1">
                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="max-w-lg mx-auto">
            <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap break-all">{selectedMsg.message}</p>

            {selectedMsg.credits > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-green-400 text-sm font-medium">💎 Credits: {selectedMsg.credits}</p>
              </div>
            )}

            {selectedMsg.verify_enabled && !selectedMsg.verified && !selectedMsg.cancelled && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleVerify}
                  disabled={activating}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                >
                  <CheckCircle2 className="w-5 h-5" /> {activating ? "Activating..." : "Verify"}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20"
                >
                  <XCircle className="w-5 h-5" /> Cancel
                </button>
              </div>
            )}

            {selectedMsg.verified && (
              <p className="text-green-400 text-sm mt-4 font-medium">✅ Custom Plan Activated</p>
            )}
            {selectedMsg.cancelled && (
              <p className="text-white/40 text-sm mt-4">Cancelled</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9998] bg-[#0a0a0a] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-white font-bold text-lg">Inbox {unreadCount > 0 && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full ml-2">{unreadCount}</span>}</h2>
        <button onClick={onClose} className="text-white/40 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/30 text-sm">No messages yet</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            onClick={() => markSeen(msg)}
            className={`flex items-center px-4 py-3 hover:bg-[#1f1f1f] cursor-pointer transition-colors border-b border-white/5 ${!msg.is_seen ? "bg-white/[0.03]" : ""}`}
          >
            <div className="flex-shrink-0 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center">
              <img src={adminLogoSrc} alt="" className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0 ml-3">
              <div className="flex items-center">
                <span className={`text-[15px] truncate mr-1 ${!msg.is_seen ? "text-white font-bold" : "text-white/70 font-medium"}`}>
                  SecretGPV Official
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" className="w-4 h-4 flex-shrink-0">
                  <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
              </div>

              <div className={`text-[13px] truncate mt-0.5 ${!msg.is_seen ? "text-white/90 font-semibold" : "text-white/50"}`}>
                {msg.message.slice(0, 80)}{msg.message.length > 80 ? "..." : ""}
              </div>
            </div>

            <div className="flex flex-col items-end ml-3">
              <span className="text-xs text-white/30">{formatDate(msg.timestamp)}</span>
              {!msg.is_seen && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMessageInbox;