const WORKER_URL = "https://secretgpv.janikamo465.workers.dev";

async function workerFetch(path: string, options: RequestInit = {}) {
  try {
    const res = await fetch(`${WORKER_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || "Request failed");
    }

    return data;

  } catch (err: any) {
    console.error("Worker API Error:", err);
    throw new Error(err.message || "Network error");
  }
}

// ================= API FUNCTIONS =================

export async function registerUser(data: {
  deviceId: string;
  uid: string;
  inviteCode?: string;
  userAgent?: string;
}) {
  return workerFetch("/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function verifyVault(vaultId: string, pin: string) {
  return workerFetch("/verify-vault", {
    method: "POST",
    body: JSON.stringify({ vaultId, pin }),
  });
}

export async function redeemCode(code: string, uid: string) {
  return workerFetch("/redeem", {
    method: "POST",
    body: JSON.stringify({ code, uid }),
  });
}

export async function uploadToR2(file: File, fileName: string) {
  try {
    const res = await fetch(`${WORKER_URL}?file=${encodeURIComponent(fileName)}`, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: await file.arrayBuffer(),
    });

    if (!res.ok) throw new Error("Upload failed");

    return true;

  } catch (err: any) {
    console.error("Upload Error:", err);
    throw new Error("Upload failed");
  }
        }
