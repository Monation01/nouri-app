// ─── NOURI FIREBASE SERVICES ─────────────────────────────────
// All database read/write operations in one place.

import {
  doc, setDoc, getDoc, updateDoc, collection,
  addDoc, query, where, orderBy, getDocs,
  onSnapshot, serverTimestamp, deleteDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, googleProvider, storage } from "./config";

/* ─── AUTH ───────────────────────────────────────────────────── */

// Sign up with email + password
export const signUpWithEmail = async (email, password, name) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await createUserProfile(cred.user.uid, { name, email });
  return cred.user;
};

// Sign in with email + password
export const signInWithEmail = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

// Sign in with Google
export const signInWithGoogle = async () => {
  const cred = await signInWithPopup(auth, googleProvider);
  const isNew = cred._tokenResponse?.isNewUser;
  if (isNew) {
    await createUserProfile(cred.user.uid, {
      name: cred.user.displayName,
      email: cred.user.email,
    });
  }
  return cred.user;
};

// Sign out
export const logOut = () => signOut(auth);

// Listen to auth state changes
export const listenToAuth = (callback) => onAuthStateChanged(auth, callback);

/* ─── USER PROFILE ───────────────────────────────────────────── */

// Create user profile in Firestore on first sign up
export const createUserProfile = async (uid, data) => {
  await setDoc(doc(db, "users", uid), {
    ...data,
    createdAt: serverTimestamp(),
    streak: 0,
    weeklyBudget: 15000,
    goals: { calories: 1650, protein: 105, water: 8 },
    preferences: {
      goal: "Lose weight",
      diet: ["No restrictions"],
      cuisine: ["Nigerian"],
      activity: "Moderately active",
      budget: "₦10k – ₦20k",
    },
    onboarded: false,
  });
};

// Get user profile
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};

// Update user profile
export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Save onboarding answers
export const saveOnboarding = async (uid, answers, name) => {
  await updateDoc(doc(db, "users", uid), {
    name,
    preferences: answers,
    onboarded: true,
    updatedAt: serverTimestamp(),
  });
};

/* ─── MEAL LOGS ──────────────────────────────────────────────── */

// Log a meal
export const logMeal = async (uid, meal) => {
  await addDoc(collection(db, "users", uid, "mealLogs"), {
    ...meal,
    loggedAt: serverTimestamp(),
    date: new Date().toISOString().split("T")[0],
  });
};

// Get today's meal logs
export const getTodayLogs = async (uid) => {
  const today = new Date().toISOString().split("T")[0];
  const q = query(
    collection(db, "users", uid, "mealLogs"),
    where("date", "==", today),
    orderBy("loggedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Listen to today's logs in real time
export const listenToTodayLogs = (uid, callback) => {
  const today = new Date().toISOString().split("T")[0];
  const q = query(
    collection(db, "users", uid, "mealLogs"),
    where("date", "==", today)
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

/* ─── WEIGHT LOGS ────────────────────────────────────────────── */

// Log weight
export const logWeight = async (uid, weight) => {
  const date = new Date().toISOString().split("T")[0];
  await setDoc(doc(db, "users", uid, "weightLogs", date), {
    weight,
    date,
    loggedAt: serverTimestamp(),
  });
};

// Get weight history (last 30 days)
export const getWeightHistory = async (uid) => {
  const q = query(
    collection(db, "users", uid, "weightLogs"),
    orderBy("date", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data()).slice(0, 30);
};

/* ─── MEAL PLANS ─────────────────────────────────────────────── */

// Save generated meal plan
export const saveMealPlan = async (uid, plan, weekStart) => {
  await setDoc(doc(db, "users", uid, "mealPlans", weekStart), {
    plan,
    weekStart,
    createdAt: serverTimestamp(),
  });
};

// Get current week meal plan
export const getCurrentMealPlan = async (uid) => {
  const monday = getMonday(new Date()).toISOString().split("T")[0];
  const snap = await getDoc(doc(db, "users", uid, "mealPlans", monday));
  return snap.exists() ? snap.data() : null;
};

// Helper: get Monday of current week
const getMonday = (d) => {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

/* ─── BUDGET ─────────────────────────────────────────────────── */

// Save weekly budget
export const saveBudget = async (uid, amount) => {
  await updateDoc(doc(db, "users", uid), { weeklyBudget: amount });
};

// Log a spend
export const logSpend = async (uid, amount, category, description) => {
  const week = getMonday(new Date()).toISOString().split("T")[0];
  await addDoc(collection(db, "users", uid, "spendLogs"), {
    amount,
    category,
    description,
    week,
    date: new Date().toISOString().split("T")[0],
    loggedAt: serverTimestamp(),
  });
};

// Get week's spend
export const getWeekSpend = async (uid) => {
  const week = getMonday(new Date()).toISOString().split("T")[0];
  const q = query(
    collection(db, "users", uid, "spendLogs"),
    where("week", "==", week)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
};

/* ─── COMMUNITY POSTS ────────────────────────────────────────── */

// Create a post
export const createPost = async (uid, userName, text, imageUrl = null) => {
  await addDoc(collection(db, "posts"), {
    uid,
    userName,
    text,
    imageUrl,
    likes: [],
    comments: 0,
    createdAt: serverTimestamp(),
  });
};

// Listen to community feed
export const listenToFeed = (callback) => {
  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// Toggle like on a post
export const toggleLike = async (postId, uid) => {
  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);
  const likes = snap.data()?.likes || [];
  const newLikes = likes.includes(uid)
    ? likes.filter(id => id !== uid)
    : [...likes, uid];
  await updateDoc(ref, { likes: newLikes });
};

/* ─── PANTRY (image upload) ──────────────────────────────────── */

// Upload pantry scan image to Firebase Storage
export const uploadPantryImage = async (uid, file) => {
  const path = `pantry/${uid}/${Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

/* ─── GROCERY ORDERS ─────────────────────────────────────────── */

// Save a grocery order
export const saveOrder = async (uid, order) => {
  await addDoc(collection(db, "users", uid, "orders"), {
    ...order,
    status: "placed",
    placedAt: serverTimestamp(),
  });
};

// Get order history
export const getOrders = async (uid) => {
  const q = query(
    collection(db, "users", uid, "orders"),
    orderBy("placedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/* ─── NOTIFICATIONS ──────────────────────────────────────────── */

// Save a notification
export const saveNotification = async (uid, notification) => {
  await addDoc(collection(db, "users", uid, "notifications"), {
    ...notification,
    read: false,
    createdAt: serverTimestamp(),
  });
};

// Listen to notifications
export const listenToNotifications = (uid, callback) => {
  const q = query(
    collection(db, "users", uid, "notifications"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// Mark notification as read
export const markNotificationRead = async (uid, notifId) => {
  await updateDoc(doc(db, "users", uid, "notifications", notifId), {
    read: true,
  });
};
