import { getStudentAnalytics, getPeerStats } from './analyticsService';

export function analyzeAttendance(studentId, data) {
  const student = data.students.find((item) => item.studentId === studentId);
  const analytics = getStudentAnalytics(studentId, data.attendance, data.subjects);
  const weakest = [...analytics.bySubject].sort((a,b) => a.percentage - b.percentage)[0];
  const recentAbsences = analytics.records.slice(-10).filter((record) => record.status === 'absent').length;
  const drop = Math.max(0, analytics.percentage - (analytics.records.slice(-10).length ? analytics.records.slice(-10).filter((r) => r.status !== 'absent').length / analytics.records.slice(-10).length * 100 : analytics.percentage));
  const recommendations = [];
  if (weakest && weakest.percentage < analytics.percentage) recommendations.push(`Prioritize ${weakest.name} this week — it is ${Math.round(analytics.percentage - weakest.percentage)}% below your overall average.`);
  if (recentAbsences >= 2) recommendations.push(`Avoid consecutive absences. Your recent pattern includes ${recentAbsences} missed classes.`);
  else recommendations.push('Your recent consistency is holding steady. Keep protecting your first class of the day.');
  if (analytics.score >= 80) recommendations.push('You are trending ahead of the cohort. Use that buffer before assessment weeks begin.');
  return { student, analytics, weakest, recentAbsences, estimatedDrop: Math.round(drop * 10) / 10, recommendations, confidence: analytics.records.length > 30 ? 0.89 : 0.72 };
}

export function recoveryClasses(currentPercentage, totalClasses, target = 75) { if (currentPercentage >= target) return 0; const present = (currentPercentage / 100) * totalClasses; return Math.max(0, Math.ceil((target * totalClasses / 100 - present) / (1 - target / 100))); }

export function answerQuestion(question, studentId, data) {
  const q = question.toLowerCase();
  const analysis = analyzeAttendance(studentId, data);
  const peers = getPeerStats(studentId, data.students, data.attendance);
  const lowest = analysis.weakest;
  if (q.includes('lowest') || q.includes('weak')) return { message: `${lowest.name} is currently your focus area at ${lowest.percentage}%. Your overall attendance is ${analysis.analytics.percentage}%.`, risk: analysis.analytics.risk, confidence: analysis.confidence };
  if (q.includes('reach') || q.includes('75')) return { message: `At ${analysis.analytics.percentage}% across ${analysis.analytics.total} eligible classes, you need approximately ${recoveryClasses(analysis.analytics.percentage, analysis.analytics.total, 75)} consecutive classes to reach 75%, assuming no additional absences.`, confidence: 0.96 };
  if (q.includes('compare') || q.includes('class') || q.includes('peer')) return { message: `You are at ${peers.current.toFixed(1)}%, versus a class average of ${peers.classAverage.toFixed(1)}%. That places you ahead of ${peers.percentile}% of peers.`, confidence: 0.93 };
  if (q.includes('risk')) return { message: `Your current AI risk is ${analysis.analytics.risk.toUpperCase()}. This is an estimated signal based on attendance, recent absences, punctuality, and subject variance — not a guaranteed prediction.`, risk: analysis.analytics.risk, confidence: analysis.confidence };
  return { message: `Your overall attendance is ${analysis.analytics.percentage}%, with an attendance score of ${analysis.analytics.score}/100. ${analysis.recommendations[0]}`, risk: analysis.analytics.risk, confidence: analysis.confidence };
}

export async function analyzeAttendanceRemote(payload) { const base = import.meta.env.VITE_API_BASE_URL; if (!base) return null; const response = await fetch(`${base}/api/ai/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); return response.ok ? response.json() : null; }
