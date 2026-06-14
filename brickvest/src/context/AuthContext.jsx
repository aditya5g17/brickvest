import { AuthContext } from "./authContextValue";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const defaultOnboardingFields = {
  onboardingComplete: false,
  onboardingStep: 0,
  accountStatus: "pending",
  kycStatus: "pending",
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUserProfile = useCallback(async () => {
    if (!auth.currentUser) return null;

    const profileRef = doc(db, "users", auth.currentUser.uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      const profile = { id: profileSnap.id, ...profileSnap.data() };
      setUserProfile(profile);
      return profile;
    }

    return null;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const profileRef = doc(db, "users", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          setUserProfile({ id: profileSnap.id, ...profileSnap.data() });
        } else {
          const profile = {
            name: user.displayName || "",
            email: user.email,
            role: "user",
            ...defaultOnboardingFields,
            createdAt: serverTimestamp(),
          };

          await setDoc(profileRef, profile);
          setUserProfile({ id: user.uid, ...profile });
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async ({ name, email, password }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    if (name) {
      await updateProfile(credential.user, { displayName: name });
      setCurrentUser({ ...credential.user, displayName: name });
    }

    const profile = {
      name,
      email,
      role: "user",
      ...defaultOnboardingFields,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, "users", credential.user.uid), profile);
    setUserProfile({ id: credential.user.uid, ...profile });

    return credential.user;
  };

  const login = ({ email, password }) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const isAdmin = userProfile?.role === "admin";
  const isOnboardingComplete =
    isAdmin || userProfile?.onboardingComplete === true;

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      loading,
      isAuthenticated: Boolean(currentUser),
      isAdmin,
      isOnboardingComplete,
      login,
      register,
      logout,
      resetPassword,
      refreshUserProfile,
    }),
    [currentUser, loading, userProfile, isAdmin, isOnboardingComplete, refreshUserProfile]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
