import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getAuth as getSecondaryAuth, createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../lib/firebase";
import { deleteEvaluationsByInterviewer } from "../lib/store";

const AuthContext = createContext(null);

const LS_USERS_KEY = "sahityika_auth_users_v2";
const LS_CURRENT_USER_KEY = "sahityika_current_user_v2";

const ENV_ADMIN_NAME = import.meta.env.VITE_ADMIN_NAME || "Sahityika";
const ENV_ADMIN_USERNAME = (import.meta.env.VITE_ADMIN_USERNAME || "sahityika2021").trim().toLowerCase();
const ENV_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "qwerty/sahityika";

const DEFAULT_ADMIN = {
  id: "admin-default",
  name: ENV_ADMIN_NAME,
  username: ENV_ADMIN_USERNAME,
  password: ENV_ADMIN_PASSWORD,
  role: "admin",
  createdAt: new Date().toISOString(),
};

const DEFAULT_INTERVIEWER = {
  id: "interviewer-default",
  name: "Demo Interviewer",
  username: "interviewer",
  password: "interviewer123",
  role: "interviewer",
  createdAt: new Date().toISOString(),
};

function formatEmail(username) {
  if (username.includes("@")) return username.trim().toLowerCase();
  return `${username.trim().toLowerCase()}@sahityika.internal`;
}

function getStoredLocalUsers() {
  const raw = localStorage.getItem(LS_USERS_KEY);
  let users = [];
  if (raw) {
    try {
      users = JSON.parse(raw) || [];
    } catch {
      users = [];
    }
  }

  // Ensure default admin exists
  if (!users.some((u) => u.username === "sahityika2021" || u.username === "admin")) {
    users.unshift(DEFAULT_ADMIN);
  }

  // Ensure default demo interviewer exists
  if (!users.some((u) => u.username === "interviewer")) {
    users.push(DEFAULT_INTERVIEWER);
  }

  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
  return users;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Local demo mode
      const rawCurrent = localStorage.getItem(LS_CURRENT_USER_KEY);
      if (rawCurrent) {
        try {
          setCurrentUser(JSON.parse(rawCurrent));
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
      return;
    }

    // Firebase mode
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setCurrentUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: data.name || firebaseUser.email?.split("@")[0] || "User",
              username: data.username || firebaseUser.email?.split("@")[0] || "user",
              role: data.role || "admin",
            });
          } else {
            // First user created directly in Firebase Console default to admin
            const defaultName = firebaseUser.email?.split("@")[0] || "Sahityika";
            const newRecord = {
              name: defaultName,
              username: defaultName.toLowerCase(),
              email: firebaseUser.email,
              role: "admin",
              createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, "users", firebaseUser.uid), newRecord);
            setCurrentUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              ...newRecord,
            });
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setCurrentUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.email?.split("@")[0] || "Sahityika",
            username: firebaseUser.email?.split("@")[0] || "sahityika2021",
            role: "admin",
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  async function login(usernameOrEmail, password) {
    const cleanUsername = (usernameOrEmail || "").replace(/^@/, "").trim().toLowerCase();
    const rawPass = password || "";
    const cleanPass = rawPass.trim();

    if (!isFirebaseConfigured) {
      const users = getStoredLocalUsers();
      const match = users.find(
        (u) =>
          (u.username?.toLowerCase() === cleanUsername ||
            u.username?.toLowerCase() === `@${cleanUsername}` ||
            u.email?.toLowerCase() === cleanUsername) &&
          (u.password === rawPass || u.password === cleanPass)
      );

      if (!match) {
        throw new Error("Invalid username or password.");
      }

      const session = {
        id: match.id,
        name: match.name,
        username: match.username,
        role: match.role || "interviewer",
      };
      localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(session));
      setCurrentUser(session);
      return session;
    }

    // Firebase Auth
    const email = formatEmail(cleanUsername);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, rawPass);
      return userCredential.user;
    } catch (err) {
      // If logging in with the predefined admin credentials and account hasn't been created yet in Firebase Auth
      const matchesEnvAdmin =
        (cleanUsername === ENV_ADMIN_USERNAME || cleanUsername === "admin") &&
        (rawPass === ENV_ADMIN_PASSWORD || rawPass === "qwerty/sahityika" || rawPass === "admin123");

      if (
        matchesEnvAdmin &&
        (err.code === "auth/user-not-found" ||
          err.code === "auth/invalid-credential" ||
          err.code === "auth/invalid-login-credentials")
      ) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, rawPass);
          const adminProfile = {
            name: ENV_ADMIN_NAME,
            username: cleanUsername,
            email,
            role: "admin",
            createdAt: serverTimestamp(),
          };
          await setDoc(doc(db, "users", cred.user.uid), adminProfile);
          return cred.user;
        } catch (createErr) {
          console.error("Auto-initialization of admin failed:", createErr);
        }
      }
      throw err;
    }
  }

  async function logout() {
    if (!isFirebaseConfigured) {
      localStorage.removeItem(LS_CURRENT_USER_KEY);
      setCurrentUser(null);
      return;
    }
    await firebaseSignOut(auth);
    setCurrentUser(null);
  }

  async function createInterviewer({ name, username, password }) {
    const cleanUsername = (username || "").replace(/^@/, "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();
    if (!cleanUsername || !cleanPassword || !name.trim()) {
      throw new Error("Name, username, and password are all required.");
    }

    if (!isFirebaseConfigured) {
      const users = getStoredLocalUsers();
      if (users.some((u) => u.username?.toLowerCase() === cleanUsername)) {
        throw new Error(`Username "${cleanUsername}" is already taken.`);
      }

      const newUser = {
        id: `interviewer-${Date.now()}`,
        name: name.trim(),
        username: cleanUsername,
        password,
        role: "interviewer",
        createdAt: new Date().toISOString(),
      };

      const updated = [...users, newUser];
      localStorage.setItem(LS_USERS_KEY, JSON.stringify(updated));
      return newUser;
    }

    // Firebase mode: Use secondary app instance to avoid logging out the admin
    const email = formatEmail(cleanUsername);
    const secondaryAppName = `SecondaryAuth_${Date.now()}`;
    const secondaryApp = initializeApp(
      {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      },
      secondaryAppName
    );

    try {
      const secondaryAuth = getSecondaryAuth(secondaryApp);
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const uid = cred.user.uid;

      const profile = {
        name: name.trim(),
        username: cleanUsername,
        email,
        role: "interviewer",
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", uid), profile);
      await deleteApp(secondaryApp);
      return { id: uid, ...profile };
    } catch (err) {
      try {
        await deleteApp(secondaryApp);
      } catch {}
      if (err.code === "auth/email-already-in-use") {
        throw new Error(`Username "${cleanUsername}" is already in use.`);
      }
      if (err.code === "auth/weak-password") {
        throw new Error("Password should be at least 6 characters.");
      }
      throw err;
    }
  }

  async function getInterviewers() {
    if (!isFirebaseConfigured) {
      const users = getStoredLocalUsers();
      return users.filter((u) => u.role === "interviewer");
    }

    const snap = await getDocs(collection(db, "users"));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((u) => u.role === "interviewer");
  }

  async function deleteInterviewer(id) {
    try {
      await deleteEvaluationsByInterviewer(id);
    } catch (e) {
      console.warn("Could not clean up interviewer evaluations:", e);
    }

    if (!isFirebaseConfigured) {
      const users = getStoredLocalUsers();
      const updated = users.filter((u) => u.id !== id);
      localStorage.setItem(LS_USERS_KEY, JSON.stringify(updated));
      return;
    }

    await deleteDoc(doc(db, "users", id));
  }

  async function updateInterviewerPassword(id, newPassword) {
    const cleanPassword = (newPassword || "").trim();
    if (!cleanPassword) {
      throw new Error("New password cannot be blank.");
    }

    if (!isFirebaseConfigured) {
      const users = getStoredLocalUsers();
      const idx = users.findIndex((u) => u.id === id);
      if (idx === -1) throw new Error("Interviewer not found.");
      users[idx].password = cleanPassword;
      localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
      return;
    }

    // In Firebase mode, update in users collection
    await setDoc(doc(db, "users", id), { password: cleanPassword }, { merge: true });
  }

  async function verifyAdminPassword(password) {
    const cleanPass = (password || "").trim();
    if (!cleanPass) return false;

    if (!isFirebaseConfigured) {
      const users = getStoredLocalUsers();
      const adminUser = users.find(
        (u) =>
          u.role === "admin" &&
          (u.username === currentUser?.username || u.username === "admin")
      );
      if (!adminUser) return false;
      return adminUser.password === cleanPass || adminUser.password === password;
    }

    // In Firebase mode, verify credentials against auth
    try {
      const email = currentUser?.email || formatEmail(currentUser?.username || "admin");
      await signInWithEmailAndPassword(auth, email, cleanPass);
      return true;
    } catch {
      return false;
    }
  }

  const value = {
    currentUser,
    loading,
    isAdmin: currentUser?.role === "admin",
    isInterviewer: currentUser?.role === "interviewer" || currentUser?.role === "admin",
    login,
    logout,
    createInterviewer,
    getInterviewers,
    deleteInterviewer,
    updateInterviewerPassword,
    verifyAdminPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
