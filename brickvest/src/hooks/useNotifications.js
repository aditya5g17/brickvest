import { useCallback, useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { markAllNotificationsRead, markNotificationRead } from "../utils/notifications";
import { toJsDate } from "../utils/calculations";

export function useNotifications() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((notificationDoc) => ({
          id: notificationDoc.id,
          ...notificationDoc.data(),
        }));
        list.sort(
          (a, b) => toJsDate(b.createdAt).getTime() - toJsDate(a.createdAt).getTime()
        );
        setItems(list);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  const unreadCount = items.filter((item) => !item.read).length;

  const markRead = useCallback(async (notificationId) => {
    await markNotificationRead(notificationId);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!currentUser) return;
    await markAllNotificationsRead(currentUser.uid);
  }, [currentUser]);

  return {
    items,
    loading,
    unreadCount,
    markRead,
    markAllRead,
  };
}
