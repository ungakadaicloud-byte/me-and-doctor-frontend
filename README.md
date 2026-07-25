# Me & Doctor — Frontend (Phase 1 MVP)

React/Vite frontend for the Me & Doctor (Clinic OS) product — a true clinic operating system for solo doctors and small clinics with one assistant.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL to the Railway backend URL
npm run dev
```

Deploy to **Vercel**, same pattern as Me & Coach. Set `VITE_API_BASE_URL` explicitly in the Vercel project's build environment variables — a missing value fails loudly at startup (`src/lib/api.js`) instead of silently returning HTML 404s, the bug hit during Me & Coach's launch.

## Design system

Tokens are drawn directly from the Me & Doctor logo (brass gold + ink navy on warm cream):

- **Colors:** cream `#FAF6EE` background, ink `#16233D` text/nav, brass `#B8935A` accent, sage/clay for status
- **Type:** Fraunces (display, token numbers, clinic name), Inter (UI), Noto Sans Tamil (Tamil labels — this is a Tamil-first product, not an English product with Tamil translations bolted on)
- **Signature element:** every card (`'.chit'` class in `src/index.css`) reads as a clinic paper artifact — a token chit, a prescription slip — with a torn/perforated bottom edge, instead of a generic rounded card.

## Structure

- `src/hooks/useAuth.jsx` — phone+OTP session, token in localStorage
- `src/hooks/useClinicData.js` — one hook per domain: clinic, patients (name/mobile/token search), patient detail (full timeline), visits, prescriptions, queue (15s polling), billing, reports
- `src/pages/Dashboard.jsx` — today's patients, walk-ins, completed visits, pending payments, today's revenue, recent patients, upcoming follow-ups
- `src/pages/Queue.jsx` — waiting → in_consultation → completed, plus cancel
- `src/pages/Patients.jsx` — registration (full profile) + search by name/mobile/token
- `src/pages/PatientDetail.jsx` — the complete patient timeline (visits, prescriptions, bills, follow-ups) + the new-visit workflow (chief complaint → diagnosis → prescription with advice → billing), all on one page since that's the actual daily flow a doctor works through
- `src/pages/Billing.jsx` — itemized fees, payment status, mark-as-paid
- `src/pages/Reports.jsx` — 7-day collection/patient trend, pending payments list
- `src/pages/Settings.jsx` — full clinic settings

## Phase 1 MVP — complete

Every page above reflects the fully approved Phase 1 MVP feature set: complete patient registration, full patient timeline (visits/diagnosis/prescriptions/bills/follow-ups/payments), chief-complaint-driven visit workflow, prescription with advice + print + WhatsApp share (ready, pending Wati template approval), search by mobile/name/token, 4-state queue, itemized billing with invoice numbers, a real stats dashboard, complete clinic settings, and basic reports.

## Deliberately out of scope (explicit decisions, not oversights)

- Staff/Assistant role (single doctor login only)
- Appointment booking (walk-in queue only)
- Offline-first
- Multi-location support

## Production hardening pass (post-audit)

- **`src/pages/Onboarding.jsx`** — new. The previously-missing doctor onboarding screen: phone+OTP verify (same widget as Login) → clinic details form → account created and logged in.
- **`src/hooks/useMsg91Widget.js`** — new. Extracted the MSG91 widget loading/send/verify logic out of `Login.jsx` into a shared hook, reused by both `Login.jsx` and `Onboarding.jsx`. Fixes two bugs found in the audit: the widget-ready state is now real React state that actually gates the Send OTP button (previously a ref was set but never read), and both send/verify now check MSG91's `response.type` instead of only reacting to thrown exceptions.
- **`src/pages/Queue.jsx`** — each token now has an "Open Consultation" link straight into that patient's visit form in `PatientDetail.jsx`. Previously the queue and the visit workflow were disconnected — a doctor had to separately search Patients to do anything.
- **`src/pages/PatientDetail.jsx`** — added the Lab/Test Recommendations field, and payment-history entries now link directly to their invoice PDF.
- **`src/hooks/useAuth.jsx`** — removed the dead `sendOtp`/`verifyOtp` functions (nothing called them since the Widget flow replaced them), added `onboard()`.

## Android app (Capacitor)

This web app is also packaged as a native Android app via Capacitor, for Play Store distribution — same codebase, no forked architecture. See **[CAPACITOR_SETUP.md](./CAPACITOR_SETUP.md)** for the full setup, build, signing, and Play Store submission guide. Quick reference:

- `npm run cap:add:android` — one-time, generates the `android/` project (run locally, needs the Android SDK)
- `npm run build:android` — rebuilds the web app and syncs it into the native project (run this after any frontend change, before testing in Android Studio)
- `npm run cap:open:android` — opens the project in Android Studio
