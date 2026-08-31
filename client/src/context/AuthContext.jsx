import { createContext, useContext, useMemo, useState } from 'react';
import { demoData } from '../data/generateDemoData';
import { demoAccounts, getSession, login as loginService, logout as logoutService } from '../services/authService';

const AuthContext = createContext(null);
const users = [...demoData.students.map((user) => ({ ...user, role: 'student' })), ...demoData.teachers.map((user) => ({ ...user, role: 'teacher' }))];

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getSession);
  const login = (email, role) => { const next = loginService(email, role, users); setSession(next); return next; };
  const logout = () => { logoutService(); setSession(null); };
  const value = useMemo(() => ({ session, login, logout, demoAccounts, users }), [session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
