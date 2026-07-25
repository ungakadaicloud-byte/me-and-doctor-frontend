# Me & Doctor — Capacitor / Android / Play Store Setup

This wraps the existing Me & Doctor web app (unchanged) as a native Android app. No backend, architecture, or feature changes — this is packaging only.

**App ID:** `com.ungakadai.medoctor`
**App Name:** Me & Doctor

---

## 1. Prerequisites (install these locally — not needed in this repo)

- **Node.js** 18+ (you already have this, for the existing web build)
- **Android Studio** (latest stable) — https://developer.android.com/studio
- **JDK 17** — Android Studio bundles a compatible JDK; use its bundled one unless you already have JDK 17 set up
- An Android device (USB debugging on) or an Android Studio emulator, for testing

You do **not** need any of this to keep developing/deploying the web app on Vercel as before — this is purely additive.

---

## 2. One-time setup (run these locally, in order)

```bash
# 1. Install the new Capacitor dependencies (already added to package.json)
npm install

# 2. Build the web app once — Capacitor wraps the built output (dist/),
#    not the source files directly
npm run build

# 3. Generate the native Android project.
#    THIS STEP NEEDS TO BE RUN ON YOUR MACHINE — it requires network
#    access and the Android SDK, neither of which are available in
#    the environment that generated this zip, so the android/ folder
#    is NOT included yet. This command creates it.
npm run cap:add:android

# 4. Generate all Android icon/splash sizes from the prepared source
#    images (resources/icon.png, resources/splash.png — already
#    included in this zip, derived from your existing logo).
npm run cap:assets

# 5. Sync the built web app + icons into the native project
npm run cap:sync
```

After this, you'll have a full `android/` folder — a real Android Studio project.

---

## 3. Opening and running the app

```bash
npm run cap:open:android
```

This opens the `android/` folder in Android Studio. From there:
- Click **Run** (▶) with a device/emulator selected to install and launch the app
- The app loads your Vite build and talks to your deployed Railway backend over HTTPS exactly like the web version — there's no local dev server involved

**Whenever you change frontend code**, rebuild and re-sync before testing in Android Studio again:
```bash
npm run build:android
```
(This is `vite build && cap sync android` in one step — already in package.json.)

---

## 4. Project-specific configuration to check before building

- **`.env`** — make sure `VITE_API_BASE_URL` points at your production Railway backend before running `npm run build` for anything you intend to actually install on a device. Capacitor bundles whatever was built; there's no way to change this at runtime like a website's env can be.
- **Backend CORS** — your backend's `FRONTEND_URL` env var (Railway) currently allowlists your Vercel domain. The Android app serves itself from `https://localhost` (set via `androidScheme: 'https'` in `capacitor.config.ts`). Add it to the allowlist:
  ```
  FRONTEND_URL=https://me-and-doctor-frontend.vercel.app,https://localhost
  ```
- **MSG91 OTP Widget** — no changes needed. It loads over HTTPS via a `<script>` tag same as the web version, and Android's default network security config allows this without extra configuration since everything here is already HTTPS (no cleartext HTTP anywhere in this app).
- **Internet permission** — Capacitor's Android template includes the `INTERNET` permission by default, required for every API call this app makes. Nothing to add manually.

---

## 5. Building a release APK/AAB for the Play Store

### 5a. Generate a signing key (once, keep this safe forever)
```bash
keytool -genkey -v -keystore me-and-doctor-release.keystore -alias medoctor -keyalg RSA -keysize 2048 -validity 10000
```
Store the resulting `.keystore` file and its passwords somewhere secure (password manager, not committed to git — already excluded via `.gitignore`). **If you lose this, you can never update the app again under the same listing** — Google Play requires the same signing key for every update.

### 5b. Configure signing in Android Studio
In `android/app/build.gradle`, add a `signingConfigs` block referencing your keystore (Android Studio's Build → Generate Signed Bundle/APK wizard can do this for you interactively the first time, and will write the config for you).

### 5c. Build the release bundle
Play Store requires an **AAB** (Android App Bundle), not a raw APK:
- Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**
- Or via CLI: `cd android && ./gradlew bundleRelease`

The output `.aab` file is what you upload to Play Console.

(An APK is still useful for direct device testing/sideloading: **Build → Generate Signed Bundle / APK → APK**.)

---

## 6. Play Store submission checklist

- [ ] Google Play Developer account (one-time $25 registration fee)
- [ ] App icon — already generated from `resources/icon.png` in step 2
- [ ] Feature graphic (1024×500) — not auto-generated, design this separately for the Play Store listing page
- [ ] Screenshots of the app (phone-size, at least 2) — capture these from Android Studio's emulator running the built app
- [ ] Short description (≤80 chars) and full description for the listing
- [ ] Privacy Policy URL — **required** by Play Store even for a clinic-internal tool, since the app handles patient data. Host a simple policy page (can be a plain page on your own domain) before submitting
- [ ] Data safety form (Play Console) — declare what data the app collects (patient records, phone numbers for OTP) and confirm it's stored securely (Supabase + RLS, already true of this backend)
- [ ] Content rating questionnaire (Play Console)
- [ ] Target API level — Capacitor 6's Android template targets a current API level by default; Play Store rejects apps targeting outdated levels, so keep Android Studio/SDK tools updated before your first submission

---

## 7. Troubleshooting

- **White screen on launch** — almost always `VITE_API_BASE_URL` wasn't set correctly at build time, or the build wasn't re-synced after a code change. Re-run `npm run build:android`.
- **Network requests failing only on Android, not on web** — check the CORS `FRONTEND_URL` note in section 4; `https://localhost` must be in the allowlist.
- **OTP widget not loading** — check that the device/emulator actually has internet access; the widget script loads externally same as on web.
- **`cap add android` fails** — usually a missing/misconfigured Android SDK path. Open Android Studio once first (lets it finish its own first-run SDK setup), then retry.
