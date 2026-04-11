import React, { createContext, useContext, useEffect, useState } from "react";
import { User, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { getDeviceId } from "@/lib/fingerprint";
import { registerUser } from "@/lib/worker";

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  credits: number;
  planName: string;
  inviteCode: string;
  termsAccepted: boolean;
  termsAcceptedAt: any;
  isAdmin: boolean;
  vaultsCreated: number;
  totalViews: number;
  referrals: number;
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: (termsAccepted: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "SGPV-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserData(null);
        setLoading(false);
        return;
      }
      // Listen for realtime user data
      const userRef = doc(db, "users", firebaseUser.uid);
      const unsubSnap = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setUserData({ uid: firebaseUser.uid, ...snap.data() } as UserData);
        }
        setLoading(false);
      }, () => setLoading(false));

      return () => unsubSnap();
    });
    return () => unsubAuth();
  }, []);

  const signInWithGoogle = async (termsAccepted: boolean) => {
    const result = await signInWithPopup(auth, googleProvider);
    const u = result.user;

    const userRef = doc(db, "users", u.uid);
    const existing = await getDoc(userRef);

    if (!existing.exists()) {
      // First signup
      const inviteCode = generateInviteCode();
      const searchParams = new URLSearchParams(window.location.search);
      const refCode = searchParams.get("ref") || "";

      let deviceId = "";
      try { deviceId = await getDeviceId(); } catch { /* ignore */ }

      let credits = 5;
      let planName = "Free Trial";

      try {
        const res = await registerUser({
          deviceId,
          uid: u.uid,
          inviteCode: refCode || undefined,
          userAgent: navigator.userAgent,
        });
        credits = res.credits ?? 5;
        planName = res.planName ?? "Free Trial";
      } catch { /* worker might be down, default credits */ }

      await setDoc(userRef, {
        email: u.email || "",
        displayName: u.displayName || "",
        photoURL: u.photoURL || "",
        credits,
        planName,
        inviteCode,
        termsAccepted,
        termsAcceptedAt: serverTimestamp(),
        isAdmin: false,
        vaultsCreated: 0,
        totalViews: 0,
        referrals: 0,
        createdAt: serverTimestamp(),
      });
    } else {
      // Existing user – update terms if needed
      if (termsAccepted) {
        await setDoc(userRef, { termsAccepted: true, termsAcceptedAt: serverTimestamp() }, { merge: true });
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
