import { createContext, useContext, useMemo, useState } from 'react';
import { demoData } from '../data/generateDemoData';
import { getAttendance, resetAttendance, saveAttendance } from '../services/appServices';

const AppContext = createContext(null);
export function AppProvider({ children }) {
  const [attendance, setAttendance] = useState(getAttendance);
  const [toast, setToast] = useState(null);
  const notify = (message, tone = 'success') => { setToast({ message, tone }); window.setTimeout(() => setToast(null), 3200); };
  const updateAttendance = (next) => { setAttendance(next); saveAttendance(next); };
  const resetDemo = () => { const seed = resetAttendance(); setAttendance(seed); notify('Demo data restored', 'info'); };
  const value = useMemo(() => ({ ...demoData, attendance, updateAttendance, resetDemo, toast, notify }), [attendance, toast]);
  return <AppContext.Provider value={value}>{children}{toast && <div className={`toast toast-${toast.tone}`} role="status"><span className="toast-dot" />{toast.message}</div>}</AppContext.Provider>;
}
export const useApp = () => useContext(AppContext);
