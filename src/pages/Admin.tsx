import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import { toast } from "sonner";

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
  credits: number;
  planName: string;
  inviteCode: string;
  isAdmin: boolean;
}

const Admin: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"codes" | "users">("codes");
  const [codes, setCodes] = useState<RedeemCodeData[]>([]);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // New code form
  const [newCode, setNewCode] = useState("");
  const [newPlan, setNewPlan] = useState("Pro");
  const [newLimit, setNewLimit] = useState(1);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!userData?.isAdmin) {
      navigate("/dashboard");
      return;
    }
    loadData();
  }, [userData]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [codesSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, "redeem_codes")),
        getDocs(collection(db, "users")),
      ]);
      setCodes(codesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as RedeemCodeData)));
      setUsers(usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserEntry)));
    } catch {
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  const toggleCode = async (code: RedeemCodeData) => {
    try {
      await updateDoc(doc(db, "redeem_codes", code.id), { disabled: !code.disabled });
      toast.success(`Code ${code.disabled ? "enabled" : "disabled"}`);
      loadData();
    } catch {
      toast.error("Failed to update code");
    }
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
      loadData();
    } catch {
      toast.error("Failed to create code");
    }
    setCreating(false);
  };

  if (loading) return <OrbitalLoader />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["codes", "users"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t ? "bg-green-500 text-white" : "bg-white/5 text-white/60"}`}
            >
              {t === "codes" ? "Redeem Codes" : "Users"}
            </button>
          ))}
        </div>

        {tab === "codes" && (
          <>
            {/* Create */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-6">
              <h3 className="font-semibold mb-3">Create Code</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="Code" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" />
                <select value={newPlan} onChange={(e) => setNewPlan(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none text-white">
                  <option value="Pro">Pro (500)</option>
                  <option value="Premium">Premium (1200)</option>
                </select>
                <input type="number" value={newLimit} onChange={(e) => setNewLimit(Number(e.target.value))} min={1} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" />
                <button onClick={createCode} disabled={creating} className="px-4 py-2 rounded-xl font-semibold text-white" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                  Create
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              {codes.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <span className="font-mono text-sm">{c.id}</span>
                    <span className="text-xs text-white/40 ml-3">{c.plan} | {c.usedCount}/{c.usageLimit}</span>
                  </div>
                  <button
                    onClick={() => toggleCode(c)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${c.disabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                  >
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
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Credits</th>
                  <th className="py-3 px-2">Plan</th>
                  <th className="py-3 px-2">Invite</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.uid} className="border-b border-white/5">
                    <td className="py-3 px-2 text-white/70">{u.email}</td>
                    <td className="py-3 px-2">{u.credits}</td>
                    <td className="py-3 px-2 text-white/50">{u.planName}</td>
                    <td className="py-3 px-2 font-mono text-xs text-white/40">{u.inviteCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
