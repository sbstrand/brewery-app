"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Activity, Batch } from "@/lib/types";

const NotificationContext = createContext<{
  activity: Activity[];
  batches: Batch[];
  setActivity: (a: Activity[]) => void;
  setBatches: (b: Batch[]) => void;
}>({ activity: [], batches: [], setActivity: () => {}, setBatches: () => {} });

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [activity, setActivity] = useState<Activity[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  return (
    <NotificationContext.Provider value={{ activity, batches, setActivity, setBatches }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
