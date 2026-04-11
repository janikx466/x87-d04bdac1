
# SecretGPV — Full SaaS Platform Build Plan

## Overview
Build a complete React frontend for a private photo sharing SaaS platform. The app calls your existing Cloudflare Worker for backend logic (registration, vault verification, redemption, R2 uploads). Firebase handles auth and Firestore for real-time data.

## Tech Stack
- **React + TypeScript + Tailwind** (frontend)
- **Firebase Auth** (Google sign-in) + **Firestore** (real-time data)
- **Cloudflare Worker** (existing backend at `https://secretgpv.janikamo465.workers.dev/`)
- **Cloudflare R2** (image storage via worker)
- **FingerprintJS** (device fingerprinting for abuse prevention)
- **qr-code-styling** (custom QR codes with logo)
- **html2canvas** (QR export)
- **canvas-confetti** (celebration effects)

## Pages & Features

### 1. Landing Page
- Dark theme, green accents (#22c55e), premium typography
- Uploaded logo + "SecretGPV" branding in navbar
- Navigation: Features, Pricing, Privacy Policy, Terms, About Us, Contact
- Hero section: privacy-focused headline, security subtext, blinking "Get Started" CTA
- Features section, trust indicators, footer with contact (secretgpv.@gmail.com)

### 2. Authentication Page
- Firebase Google Authentication with premium styled UI
- **Pre-auth consent gate**: checkbox for Terms & Conditions — blocks login until accepted
- On consent, stores `termsAccepted: true` + `termsAcceptedAt` in Firestore
- On first signup: calls worker `/register` endpoint with deviceId (FingerprintJS), inviteCode, uid
- Worker returns credits (5 for legit, 0 for suspicious) and planName

### 3. Dashboard
- Real-time credit display using Firestore `onSnapshot`
- User stats: vaults created, views, plan info
- Referral section with unique invite link (`SGPV-XXXX` code)
- Copy invite link button (never empty — generated on signup)
- Upgrade button → navigates to pricing page
- Quick actions: Create Vault, Redeem Code

### 4. Vault System
- **Create Vault**: Upload photos (via worker PUT to R2), set PIN, set expiry, set view limit, self-destruct option
- **My Vaults**: List user's vaults with status, view count, expiry
- **View Vault** (`/v/:vaultId`): Public page — enter PIN → calls worker `/verify-vault` → shows images
- Strict view count tracking (no duplication), self-destruct enforcement
- Deducts 1 credit per vault creation

### 5. QR Code System
- After vault creation, show QR code card (exact UI from your HTML)
- QR data URL: `https://x87.lovable.app/v/${vaultId}`
- Logo in center of QR (uploaded logo file)
- Styled dots with gradient (blue → purple → green)
- Download button exports full `#qrExportBox` container (QR + reminder text + branding) using html2canvas with scale:3, useCORS:true, white background
- Confetti animation on QR display

### 6. Redeem System
- Input field for redeem code
- Calls worker `/redeem` with code + uid
- Validates: exists, not expired, not disabled, usage limit
- On success: adds credits, updates plan, shows confirmation

### 7. Admin Panel (`/sxt-tahir`)
- Google Auth only, checks `isAdmin === true` from Firestore user doc
- Redirect fix: non-admins redirected to dashboard
- Manage redeem codes: create, disable, view usage
- View users, credits, referral stats

### 8. Pricing Page
- Free Trial (5 credits), Pro, Premium tiers
- Feature comparison table
- CTA buttons linking to redeem or upgrade flow

### 9. Legal Pages
- Privacy Policy, Terms & Conditions, About Us, Contact page
- Proper routing, no broken links

### 10. Referral System
- Each user gets unique `SGPV-XXXX` invite code on signup
- Referral link: `https://x87.lovable.app/auth?ref=SGPV-XXXX`
- Self-referral prevention (backend validates via worker)
- Device-based duplicate prevention via FingerprintJS

## Global Features

### Orbital Loader
- Exact loader from your HTML (3 rotating rings + pulsing text)
- Used everywhere: API calls, image uploads, page loads, vault operations, QR generation

### Security
- Firestore rules provided for: users (own data only), vaults (owner only), redeem_codes (blocked public), redeem_logs (blocked public), devices (blocked public)
- All sensitive operations go through Cloudflare Worker
- No client-side admin checks beyond Firestore `isAdmin` field

### Error Handling
- Toast notifications for all errors
- Graceful handling of missing data (no crashes on undefined)
- No broken links across the app

## Firebase Config
Embedded directly in codebase (public key).

## Firestore Security Rules
Complete rules provided covering all collections.

## File Structure
- `src/lib/firebase.ts` — Firebase config + init
- `src/lib/worker.ts` — Cloudflare Worker API client
- `src/lib/fingerprint.ts` — FingerprintJS setup
- `src/components/OrbitalLoader.tsx` — Global loader
- `src/components/QRCodeCard.tsx` — QR display + export
- `src/contexts/AuthContext.tsx` — Auth state + Firestore user data
- `src/pages/` — Landing, Auth, Dashboard, CreateVault, ViewVault, MyVaults, Redeem, Admin, Pricing, Privacy, Terms, About, Contact
