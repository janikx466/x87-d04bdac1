import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import { Eye, Clock, QrCode } from "lucide-react";

interface Vault {
  id: string;
  viewCount: number;
  viewLimit: number;
  selfDestruct: boolean;
  expiry: any;
  createdAt: any;
  fileKeys: string[];
}

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
          {vaults.map((v) => {
            const expired = v.expiry?.toDate ? new Date(v.expiry.toDate()) < new Date() : v.expiry?.seconds ? new Date(v.expiry.seconds * 1000) < new Date() : false;
            return (
              <div key={v.id} className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm text-white/70">{v.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${expired ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                    {expired ? "Expired" : "Active"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/50">
                  <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{v.viewCount}/{v.viewLimit}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{v.fileKeys?.length || 0} photos</span>
                  {v.selfDestruct && <span className="text-red-400 text-xs">💣 Self-destruct</span>}
                </div>
                <Link
                  to={`/v/${v.id}`}
                  className="inline-flex items-center gap-1 mt-3 text-xs text-green-400 hover:text-green-300"
                >
                  <QrCode className="w-3 h-3" /> View vault link
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MyVaults;
