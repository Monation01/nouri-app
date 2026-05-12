# 🥗 Nouri — AI Food & Wellness App

Nigerian-first AI food coach. Meal planning, nutrition tracking, budget-smart eating.

## DEPLOY IN 5 STEPS

### 1 — Firebase Setup
- Go to console.firebase.google.com → Add project → "nouri-app"
- Authentication → Enable Email/Password + Google
- Firestore → Create database (test mode, europe-west1 region)
- Storage → Get started
- Project Settings → Your apps → Web app → copy firebaseConfig

### 2 — Add credentials
- Copy .env.example → .env → fill in Firebase values
- Open src/firebase/config.js → replace placeholder values

### 3 — Firestore Security Rules
- Firebase Console → Firestore → Rules
- Paste contents of firestore.rules → Publish

### 4 — Deploy to Vercel
  git init && git add . && git commit -m "Initial commit"
  # Push to GitHub, then import at vercel.com
  # Add .env values as Environment Variables in Vercel
  # Click Deploy — done!

### 5 — Connect domain (optional)
- Vercel → Settings → Domains → add nouri.ng

## HOW USERS INSTALL ON iPHONE
1. Open link in Safari
2. Share button → Add to Home Screen
3. App icon appears — works like a real app

## LOCAL DEV
  npm install
  npm run dev      # localhost:5173
  npm run build    # production build

## PROJECT STRUCTURE
  src/
    firebase/config.js      ← your Firebase credentials
    firebase/services.js    ← all database functions
    context/AuthContext.jsx ← global auth state
    screens/AuthScreen.jsx  ← login/signup
    NouriApp.jsx            ← main app (all screens)
    App.jsx                 ← router
  firestore.rules           ← security rules
  vercel.json               ← deployment config
  .env.example              ← credentials template

## COSTS (first 1,000 users = ~$0/month)
  Vercel:    free (100GB/month)
  Firebase:  free (50K reads/day)
  Claude API: ~$3 per 1M tokens
