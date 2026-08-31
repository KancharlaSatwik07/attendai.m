const SESSION_KEY = 'attendai:v1:session';
export function getSession() { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } }
export function login(email, role, users) { const user = users.find((entry) => entry.email === email && entry.role === role); if (!user) throw new Error('Use one of the demo accounts to continue.'); const session = { ...user, loggedInAt: new Date().toISOString() }; localStorage.setItem(SESSION_KEY, JSON.stringify(session)); return session; }
export function logout() { localStorage.removeItem(SESSION_KEY); }
export const demoAccounts = { student: 'student001@demo.attendai', teacher: 'teacher001@demo.attendai' };
