import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, doc, updateDoc, setDoc, serverTimestamp, onSnapshot, getDoc, addDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import OrbitalLoader from "@/components/OrbitalLoader";
import { toast } from "sonner";
import { Users, Shield, BarChart3, Clock, Megaphone, MessageSquare, Search, Send, Inbox } from "lucide-react";

interface RedeemCodeData { id: string; plan: string; usageLimit: number; usedCount: number; disabled: boolean; expiry?: any; lastUsedBy?: string; }
interface UserEntry { uid: string; email: string; displayName: string; credits: number; planName: string; inviteCode: string; isAdmin: boolean; createdAt: any; numericUid?: string; }
interface VaultEntry { id: string; ownerId: string; status: string; viewCount: number; }
interface CustomApp { id: string; uid: string; fullName: string; companyName: string; creditsRequired: number; gmail: string; description: string; joinDate: any; }

const Admin: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"stats" | "codes" | "users" | "announce" | "custom" | "features" | "inbox">("stats");
  const [codes, setCodes] = useState<RedeemCodeData[]>([]);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [vaults, setVaults] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<CustomApp[]>([]);

  const [newCode, setNewCode] = useState("");
  const [newPlan, setNewPlan] = useState("Pro");
  const [newLimit, setNewLimit] = useState(1);
  const [creating, setCreating] = useState(false);

  const [annEnabled, setAnnEnabled] = useState(false);
  const [annText, setAnnText] = useState("");
  const [annUrl, setAnnUrl] = useState("");
  const [annSaving, setAnnSaving] = useState(false);

  const [cpStep, setCpStep] = useState(1);
  const [cpUid, setCpUid] = useState("");
  const [cpUser, setCpUser] = useState<UserEntry | null>(null);
  const [cpCredits, setCpCredits] = useState("");
  const [cpMessage, setCpMessage] = useState("");
  const [cpVerify, setCpVerify] = useState(false);
  const [cpSending, setCpSending] = useState(false);

  const [secretMsgEnabled, setSecretMsgEnabled] = useState(true);
  const [featureSaving, setFeatureSaving] = useState(false);

  useEffect(() => {
    if (!userData?.isAdmin) { navigate("/dashboard"); return; }
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => { setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserEntry))); });
    const unsubVaults = onSnapshot(collection(db, "vaults"), (snap) => { setVaults(snap.docs.map((d) => ({ id: d.id, ...d.data() } as VaultEntry))); });
    const unsubApps = onSnapshot(collection(db, "custom_plan_applications"), (snap) => {
      setApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CustomApp)));
    });
    getDocs(collection(db, "redeem_codes")).then((snap) => { setCodes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RedeemCodeData))); });
    getDoc(doc(db, "settings", "announcement")).then((snap) => { if (snap.exists()) { const d = snap.data(); setAnnEnabled(d.enabled || false); setAnnText(d.text || ""); setAnnUrl(d.url || ""); } });
    getDoc(doc(db, "settings", "features")).then((snap) => { if (snap.exists()) { setSecretMsgEnabled(snap.data().secretMessageEnabled !== false); } });
    setLoading(false);
    return () => { unsubUsers(); unsubVaults(); unsubApps(); };
  }, [userData]);

  const loadCodes = async () => { const snap = await getDocs(collection(db, "redeem_codes")); setCodes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RedeemCodeData))); };
  const toggleCode = async (code: RedeemCodeData) => { try { await updateDoc(doc(db, "redeem_codes", code.id), { disabled: !code.disabled }); toast.success(`Code ${code.disabled ? "enabled" : "disabled"}`); loadCodes(); } catch { toast.error("Failed"); } };
  const createCode = async () => {
    if (!newCode.trim()) return toast.error("Enter a code");
    setCreating(true);
    try { await setDoc(doc(db, "redeem_codes", newCode.trim().toUpperCase()), { plan: newPlan, usageLimit: newLimit, usedCount: 0, disabled: false, createdAt: serverTimestamp() }); toast.success("Code created!"); setNewCode(""); loadCodes(); } catch { toast.error("Failed"); }
    setCreating(false);
  };
  const saveAnnouncement = async () => { setAnnSaving(true); try { await setDoc(doc(db, "settings", "announcement"), { enabled: annEnabled, text: annText, url: annUrl || null, updatedAt: serverTimestamp() }); toast.success("Saved!"); } catch { toast.error("Failed"); } setAnnSaving(false); };
  const saveFeatures = async () => { setFeatureSaving(true); try { await setDoc(doc(db, "settings", "features"), { secretMessageEnabled: secretMsgEnabled }, { merge: true }); toast.success("Saved!"); } catch { toast.error("Failed"); } setFeatureSaving(false); };

  const lookupUser = () => { const found = users.find((u) => u.numericUid === cpUid.trim()); if (!found) { toast.error("User not found"); return; } setCpUser(found); setCpStep(2); };
  const sendCustomMessage = async () => {
    if (!cpMessage.trim()) return toast.error("Message required");
    if (!cpUser) return;
    setCpSending(true);
    try {
      await addDoc(collection(db, "admin_messages"), { user_uid: cpUser.numericUid, message: cpMessage.trim(), is_seen: false, verify_enabled: cpVerify, credits: cpVerify ? Number(cpCredits) || 0 : 0, timestamp: serverTimestamp() });
      toast.success("Message sent!"); setCpStep(1); setCpUid(""); setCpUser(null); setCpCredits(""); setCpMessage(""); setCpVerify(false);
    } catch (e: any) { toast.error(e.message || "Failed"); }
    setCpSending(false);
  };

  if (loading) return <OrbitalLoader />;

  const totalUsers = users.length;
  const freeUsers = users.filter((u) => u.planName === "Free Trial" || u.planName === "No Trial" || u.planName === "Free").length;
  const paidUsers = totalUsers - freeUsers;
  const totalVaults = vaults.length;
  const now = Date.now();
  const last24h = users.filter((u) => { const created = u.createdAt?.toDate?.() || (u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000) : null); return created && now - created.getTime() < 86400000; }).length;

  const tabs = ["stats", "codes", "users", "announce", "custom", "features", "inbox"] as const;
  const tabLabels: Record<string, string> = { stats: "Stats", codes: "Codes", users: "Users", announce: "Announce", custom: "Custom Plan", features: "Features", inbox: "Inbox" };

  const formatDate = (ts: any) => {
    if (!ts) return "-";
    const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : null;
    return d ? d.toLocaleDateString() : "-";
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 rounded-xl text-xs font-medium transition ${tab === t ? "bg-green-500 text-white" : "bg-white/5 text-white/60"}`}>{tabLabels[t]}</button>
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
                  <option value="Elite">Elite (3500)</option>
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
                  <button onClick={() => toggleCode(c)} className={`px-3 py-1 rounded-lg text-xs font-medium ${c.disabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{c.disabled ? "Enable" : "Disable"}</button>
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
                  <th className="py-3 px-2">UID</th><th className="py-3 px-2">Name</th><th className="py-3 px-2">Email</th><th className="py-3 px-2">Plan</th><th className="py-3 px-2">Credits</th><th className="py-3 px-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.uid} className="border-b border-white/5">
                    <td className="py-3 px-2 font-mono text-xs text-white/40">{u.numericUid || "-"}</td>
                    <td className="py-3 px-2 text-white/70">{u.displayName || "-"}</td>
                    <td className="py-3 px-2 text-white/70">{u.email}</td>
                    <td className="py-3 px-2"><span className={`text-xs px-2 py-0.5 rounded-full ${u.planName === "Free Trial" || u.planName === "No Trial" || u.planName === "Free" ? "bg-white/10 text-white/50" : u.planName === "Elite" ? "bg-yellow-500/20 text-yellow-400" : u.planName === "Custom" ? "bg-purple-500/20 text-purple-400" : "bg-green-500/20 text-green-400"}`}>{u.planName}</span></td>
                    <td className="py-3 px-2">{u.credits}</td>
                    <td className="py-3 px-2 text-xs text-white/40">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "announce" && (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 max-w-lg">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-green-500" /> Global Announcement</h3>
            <div className="flex items-center gap-3 mb-4 bg-white/5 p-3 rounded-xl">
              <input type="checkbox" checked={annEnabled} onChange={(e) => setAnnEnabled(e.target.checked)} className="accent-green-500 w-4 h-4" />
              <label className="text-sm text-white/70">Enable announcement</label>
            </div>
            <div className="mb-3">
              <label className="text-xs text-white/50 mb-1 block">Message Text</label>
              <textarea value={annText} onChange={(e) => setAnnText(e.target.value)} placeholder="Announcement message..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none resize-none" />
            </div>
            <div className="mb-4">
              <label className="text-xs text-white/50 mb-1 block">Link URL (optional)</label>
              <input type="url" value={annUrl} onChange={(e) => setAnnUrl(e.target.value)} placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <button onClick={saveAnnouncement} disabled={annSaving} className="px-6 py-2 rounded-xl font-semibold text-white" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>{annSaving ? "Saving..." : "Save"}</button>
          </div>
        )}

        {tab === "custom" && (
          <div className="max-w-lg">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-purple-400" /> Custom Plan Management</h3>
            {cpStep === 1 && (
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <label className="text-sm font-medium mb-2 block">Enter User UID (8-digit)</label>
                <div className="flex gap-2">
                  <input value={cpUid} onChange={(e) => setCpUid(e.target.value)} placeholder="e.g. 12345678" maxLength={8} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none font-mono" />
                  <button onClick={lookupUser} className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition flex items-center gap-2"><Search className="w-4 h-4" /> Find</button>
                </div>
              </div>
            )}
            {cpStep === 2 && cpUser && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-sm text-white/70 mb-1">Email: <span className="text-white">{cpUser.email}</span></p>
                  <p className="text-sm text-white/70">Joined: <span className="text-white">{formatDate(cpUser.createdAt)}</span></p>
                  <p className="text-sm text-white/70">Current Plan: <span className="text-white">{cpUser.planName}</span></p>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <div><label className="text-xs text-white/50 mb-1 block">Credit Amount</label><input type="number" value={cpCredits} onChange={(e) => setCpCredits(e.target.value)} placeholder="e.g. 5000" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none" /></div>
                  <div><label className="text-xs text-white/50 mb-1 block">Custom Message *</label><textarea value={cpMessage} onChange={(e) => setCpMessage(e.target.value)} placeholder="Message to user..." rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none resize-none" /></div>
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
                    <input type="checkbox" checked={cpVerify} onChange={(e) => setCpVerify(e.target.checked)} className="accent-green-500 w-4 h-4" />
                    <label className="text-sm text-white/70">Enable Verify (allows plan activation)</label>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setCpStep(1); setCpUser(null); }} className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-sm">Back</button>
                    <button onClick={sendCustomMessage} disabled={cpSending} className="flex-1 py-2 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                      <Send className="w-4 h-4" /> {cpSending ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "features" && (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 max-w-lg">
            <h3 className="font-semibold mb-4">Feature Toggles</h3>
            <div className="flex items-center gap-3 mb-4 bg-white/5 p-3 rounded-xl">
              <input type="checkbox" checked={secretMsgEnabled} onChange={(e) => setSecretMsgEnabled(e.target.checked)} className="accent-green-500 w-4 h-4" />
              <label className="text-sm text-white/70">Secret Message System (ON/OFF)</label>
            </div>
            <button onClick={saveFeatures} disabled={featureSaving} className="px-6 py-2 rounded-xl font-semibold text-white" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>{featureSaving ? "Saving..." : "Save"}</button>
          </div>
        )}

        {tab === "inbox" && (
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Inbox className="w-5 h-5 text-blue-400" /> Custom Plan Applications</h3>
            {applications.length === 0 && <p className="text-white/40 text-sm">No applications yet.</p>}
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-white/40">UID:</span> <span className="font-mono">{app.uid}</span></div>
                    <div><span className="text-white/40">Name:</span> {app.fullName}</div>
                    <div><span className="text-white/40">Gmail:</span> {app.gmail}</div>
                    <div><span className="text-white/40">Company:</span> {app.companyName || "-"}</div>
                    <div><span className="text-white/40">Credits:</span> {app.creditsRequired}</div>
                    <div><span className="text-white/40">Date:</span> {formatDate(app.joinDate)}</div>
                  </div>
                  {app.description && <p className="text-xs text-white/50 mt-2 border-t border-white/5 pt-2">{app.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
