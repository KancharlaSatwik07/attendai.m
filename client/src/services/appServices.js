import { attendance as seedAttendance } from '../data/generateDemoData';
const DATA_KEY = 'attendai:v1:attendance';
export function getAttendance() { try { const value = JSON.parse(localStorage.getItem(DATA_KEY) || 'null'); return Array.isArray(value) ? value : seedAttendance; } catch { return seedAttendance; } }
export function saveAttendance(records) { localStorage.setItem(DATA_KEY, JSON.stringify(records)); return records; }
export function resetAttendance() { localStorage.removeItem(DATA_KEY); return seedAttendance; }
export function downloadCsv(rows, filename = 'attendai-report.csv') { const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n'); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }
export const serviceMap = { getStudentAttendance: async (studentId) => getAttendance().filter((record) => record.studentId === studentId), getClassAttendance: async (classId) => getAttendance().filter((record) => record.classId === classId), saveAttendance: async (records) => saveAttendance(records) };
