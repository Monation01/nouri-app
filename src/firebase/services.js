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
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await createUserProfile(cred.user.uid, { name, email });
    return cred.user;
  } catch (err) {
    console.error("signUpWithEmail:", err);
    throw err;
  }
};

// Sign in with email + password
export const signInWithEmail = async (email, password) => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err) {
    console.error("signInWithEmail:", err);
    throw err;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const isNew = cred._tokenResponse?.isNewUser;
    if (isNew) {
      await createUserProfile(cred.user.uid, {
        name: cred.user.displayName,
        email: cred.user.email,
      });
    }
    return cred.user;
  } catch (err) {
    console.error("signInWithGoogle:", err);
    throw err;
  }
};

// Sign out
export const logOut = () => signOut(auth);

// Listen to auth state changes
export const listenToAuth = (callback) => onAuthStateChanged(auth, callback);

/* ─── USER PROFILE ───────────────────────────────────────────── */

// Create user profile in Firestore on first sign up
export const createUserProfile = async (uid, data) => {
  try {
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
  } catch (err) {
    console.error("createUserProfile:", err);
    throw err;
  }
};

// Get user profile
export const getUserProfile = async (uid) => {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("getUserProfile:", err);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (uid, data) => {
  try {
    await updateDoc(doc(db, "users", uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("updateUserProfile:", err);
    throw err;
  }
};

// Save onboarding answers
export const saveOnboarding = async (uid, answers, name) => {
  try {
    await updateDoc(doc(db, "users", uid), {
      name,
      preferences: answers,
      onboarded: true,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("saveOnboarding:", err);
    throw err;
  }
};

/* ─── MEAL LOGS ──────────────────────────────────────────────── */

// Log a meal
export const logMeal = async (uid, meal) => {
  try {
    await addDoc(collection(db, "users", uid, "mealLogs"), {
      ...meal,
      loggedAt: serverTimestamp(),
      date: new Date().toISOString().split("T")[0],
    });
  } catch (err) {
    console.error("logMeal:", err);
    throw err;
  }
};

// Get today's meal logs
export const getTodayLogs = async (uid) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const q = query(
      collection(db, "users", uid, "mealLogs"),
      where("date", "==", today),
      orderBy("loggedAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("getTodayLogs:", err);
    return [];
  }
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
  try {
    const date = new Date().toISOString().split("T")[0];
    await setDoc(doc(db, "users", uid, "weightLogs", date), {
      weight,
      date,
      loggedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("logWeight:", err);
    throw err;
  }
};

// Get weight history (last 30 days)
export const getWeightHistory = async (uid) => {
  try {
    const q = query(
      collection(db, "users", uid, "weightLogs"),
      orderBy("date", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data()).slice(0, 30);
  } catch (err) {
    console.error("getWeightHistory:", err);
    return [];
  }
};

/* ─── MEAL PLANS ─────────────────────────────────────────────── */

// Save generated meal plan
export const saveMealPlan = async (uid, plan, weekStart) => {
  try {
    await setDoc(doc(db, "users", uid, "mealPlans", weekStart), {
      plan,
      weekStart,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("saveMealPlan:", err);
    throw err;
  }
};

// Get current week meal plan
export const getCurrentMealPlan = async (uid) => {
  try {
    const monday = getMonday(new Date()).toISOString().split("T")[0];
    const snap = await getDoc(doc(db, "users", uid, "mealPlans", monday));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("getCurrentMealPlan:", err);
    return null;
  }
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
  try {
    await updateDoc(doc(db, "users", uid), { weeklyBudget: amount });
  } catch (err) {
    console.error("saveBudget:", err);
    throw err;
  }
};

// Log a spend
export const logSpend = async (uid, amount, category, description) => {
  try {
    const week = getMonday(new Date()).toISOString().split("T")[0];
    await addDoc(collection(db, "users", uid, "spendLogs"), {
      amount,
      category,
      description,
      week,
      date: new Date().toISOString().split("T")[0],
      loggedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("logSpend:", err);
    throw err;
  }
};

// Get week's spend
export const getWeekSpend = async (uid) => {
  try {
    const week = getMonday(new Date()).toISOString().split("T")[0];
    const q = query(
      collection(db, "users", uid, "spendLogs"),
      where("week", "==", week)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  } catch (err) {
    console.error("getWeekSpend:", err);
    return [];
  }
};

/* ─── COMMUNITY POSTS ────────────────────────────────────────── */

// Create a post
export const createPost = async (uid, userName, text, imageUrl = null) => {
  try {
    await addDoc(collection(db, "posts"), {
      uid,
      userName,
      text,
      imageUrl,
      likes: [],
      comments: 0,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("createPost:", err);
    throw err;
  }
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
  try {
    const postRef = doc(db, "posts", postId);
    const snap = await getDoc(postRef);
    const likes = snap.data()?.likes || [];
    const newLikes = likes.includes(uid)
      ? likes.filter(id => id !== uid)
      : [...likes, uid];
    await updateDoc(postRef, { likes: newLikes });
  } catch (err) {
    console.error("toggleLike:", err);
    throw err;
  }
};

/* ─── PANTRY (image upload) ──────────────────────────────────── */

// Upload pantry scan image to Firebase Storage
export const uploadPantryImage = async (uid, file) => {
  try {
    const path = `pantry/${uid}/${Date.now()}.jpg`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  } catch (err) {
    console.error("uploadPantryImage:", err);
    throw err;
  }
};

/* ─── GROCERY ORDERS ─────────────────────────────────────────── */

// Save a grocery order
export const saveOrder = async (uid, order) => {
  try {
    await addDoc(collection(db, "users", uid, "orders"), {
      ...order,
      status: "placed",
      placedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("saveOrder:", err);
    throw err;
  }
};

// Get order history
export const getOrders = async (uid) => {
  try {
    const q = query(
      collection(db, "users", uid, "orders"),
      orderBy("placedAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("getOrders:", err);
    return [];
  }
};

/* ─── NOTIFICATIONS ──────────────────────────────────────────── */

// Save a notification
export const saveNotification = async (uid, notification) => {
  try {
    await addDoc(collection(db, "users", uid, "notifications"), {
      ...notification,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("saveNotification:", err);
    throw err;
  }
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
  try {
    await updateDoc(doc(db, "users", uid, "notifications", notifId), {
      read: true,
    });
  } catch (err) {
    console.error("markNotificationRead:", err);
    throw err;
  }
};
