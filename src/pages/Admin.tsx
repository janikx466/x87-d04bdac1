import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, doc, updateDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import { toast } from "sonner";
import { Users, Shield, BarChart3, Clock } from "lucide-react";

interface RedeemCodeData {
  id: string;
  plan: string;
  usageLimit: number;
  usedCount: number;
  disabled: boolean;
  expiry?: any;
  lastUsedBy?: string;
}

interface UserEntry {
  uid: string;
  email: string;
  displayName: string;
  credits: number;
  planName: string;
  inviteCode: string;
  isAdmin: boolean;
  createdAt: any;
}

interface VaultEntry {
  id: string;
  ownerId: string;
  status: string;
  viewCount: number;
}

const Admin: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"stats" | "codes" | "users">("stats");
  const [codes, setCodes] = useState<RedeemCodeData[]>([]);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [vaults, setVaults] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCode, setNewCode] = useState("");
  const [newPlan, setNewPlan] = useState("Pro");
  const [newLimit, setNewLimit] = useState(1);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!userData?.isAdmin) {
      navigate("/dashboard");
      return;
    }

    // Real-time listeners
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserEntry)));
    });
    const unsubVaults = onSnapshot(collection(db, "vaults"), (snap) => {
      setVaults(snap.docs.map((d) => ({ id: d.id, ...d.data() } as VaultEntry)));
    });

    getDocs(collection(db, "redeem_codes")).then((snap) => {
      setCodes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RedeemCodeData)));
    });

    setLoading(false);
    return () => { unsubUsers(); unsubVaults(); };
  }, [userData]);

  const loadCodes = async () => {
    const snap = await getDocs(collection(db, "redeem_codes"));
    setCodes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RedeemCodeData)));
  };

  const toggleCode = async (code: RedeemCodeData) => {
    try {
      await updateDoc(doc(db, "redeem_codes", code.id), { disabled: !code.disabled });
      toast.success(`Code ${code.disabled ? "enabled" : "disabled"}`);
      loadCodes();
    } catch { toast.error("Failed to update code"); }
  };

  const createCode = async () => {
    if (!newCode.trim()) return toast.error("Enter a code");
    setCreating(true);
    try {
      await setDoc(doc(db, "redeem_codes", newCode.trim().toUpperCase()), {
        plan: newPlan,
        usageLimit: newLimit,
        usedCount: 0,
        disabled: false,
        createdAt: serverTimestamp(),
      });
      toast.success("Code created!");
      setNewCode("");
      loadCodes();
    } catch { toast.error("Failed to create code"); }
    setCreating(false);
  };

  if (loading) return <OrbitalLoader />;

  // Stats
  const totalUsers = users.length;
  const freeUsers = users.filter((u) => u.planName === "Free Trial" || u.planName === "No Trial").length;
  const paidUsers = totalUsers - freeUsers;
  const totalVaults = vaults.length;
  const now = Date.now();
  const last24h = users.filter((u) => {
    const created = u.createdAt?.toDate?.() || (u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000) : null);
    return created && now - created.getTime() < 86400000;
  }).length;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["stats", "codes", "users"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t ? "bg-green-500 text-white" : "bg-white/5 text-white/60"}`}>
              {t === "stats" ? "Stats" : t === "codes" ? "Redeem Codes" : "Users"}
            </button>
          ))}
        </div>

        {tab === "stats" && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: <Users className="w-5 h-5 text-green-500" />, label: "Total Users", value: totalUsers },
              { icon: <Shield className="w-5 h-5 text-blue-400" />, label: "Free Users", value: freeUsers },
              { icon: <BarChart3 className="w-5 h-5 text-purple-400" />, label: "Paid Users", value: paidUsers },
              { icon: <Shield className="w-5 h-5 text-yellow-400" />, label: "Total Vaults", value: totalVaults },
              { icon: <Clock className="w-5 h-5 text-cyan-400" />, label: "New (24h)", value: last24h },
            ].map((s, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-white/50">{s.label}</span></div>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "codes" && (
          <>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-6">
              <h3 className="font-semibold mb-3">Create Code</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="Code" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" />
                <select value={newPlan} onChange={(e) => setNewPlan(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-white">
                  <option value="Pro">Pro (500)</option>
                  <option value="Premium">Premium (1200)</option>
                </select>
                <input type="number" value={newLimit} onChange={(e) => setNewLimit(Number(e.target.value))} min={1} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" />
                <button onClick={createCode} disabled={creating} className="px-4 py-2 rounded-xl font-semibold text-white" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>Create</button>
              </div>
            </div>
            <div className="space-y-3">
              {codes.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <span className="font-mono text-sm">{c.id}</span>
                    <span className="text-xs text-white/40 ml-3">{c.plan} | {c.usedCount}/{c.usageLimit}</span>
                  </div>
                  <button onClick={() => toggleCode(c)} className={`px-3 py-1 rounded-lg text-xs font-medium ${c.disabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {c.disabled ? "Enable" : "Disable"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "users" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-left border-b border-white/10">
                  <th className="py-3 px-2">Name</th>
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Plan</th>
                  <th className="py-3 px-2">Credits</th>
                  <th className="py-3 px-2">Invite</th>
                  <th className="py-3 px-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const joined = u.createdAt?.toDate?.() || (u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000) : null);
                  return (
                    <tr key={u.uid} className="border-b border-white/5">
                      <td className="py-3 px-2 text-white/70">{u.displayName || "-"}</td>
                      <td className="py-3 px-2 text-white/70">{u.email}</td>
                      <td className="py-3 px-2"><span className={`text-xs px-2 py-0.5 rounded-full ${u.planName === "Free Trial" || u.planName === "No Trial" ? "bg-white/10 text-white/50" : "bg-green-500/20 text-green-400"}`}>{u.planName}</span></td>
                      <td className="py-3 px-2">{u.credits}</td>
                      <td className="py-3 px-2 font-mono text-xs text-white/40">{u.inviteCode}</td>
                      <td className="py-3 px-2 text-xs text-white/40">{joined ? joined.toLocaleDateString() : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
