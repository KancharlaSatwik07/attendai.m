import { getPeerStats, getStudentAnalytics, getTeacherStats, summarizeRecords } from './analyticsService';

function recentWindow(records, size = 10) { return records.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(-size); }
function consecutiveAbsences(records) { let streak = 0; let best = 0; records.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach((record) => { if (record.status === 'absent') { streak += 1; best = Math.max(best, streak); } else if (record.status !== 'excused') streak = 0; }); return best; }
function trendDelta(records) { const ordered = records.slice().sort((a, b) => a.date.localeCompare(b.date)); const midpoint = Math.floor(ordered.length / 2); const first = summarizeRecords(ordered.slice(0, midpoint)).percentage; const last = summarizeRecords(ordered.slice(midpoint)).percentage; return Math.round((last - first) * 10) / 10; }
function formatRisk(risk) { return risk.charAt(0).toUpperCase() + risk.slice(1); }

export function analyzeAttendance(studentId, data) {
  const student = data.students.find((item) => item.studentId === studentId);
  const analytics = getStudentAnalytics(studentId, data.attendance, data.subjects);
  const weakest = [...analytics.bySubject].sort((a, b) => a.percentage - b.percentage)[0];
  const recentRecords = recentWindow(analytics.records, 10);
  const recentAbsences = recentRecords.filter((record) => record.status === 'absent').length;
  const delta = trendDelta(analytics.records);
  const recommendations = [];
  if (weakest && weakest.percentage < analytics.percentage) recommendations.push(`Prioritize ${weakest.name}: ${weakest.percentage.toFixed(1)}% is ${Math.abs(analytics.percentage - weakest.percentage).toFixed(1)} points below your overall average.`);
  if (recentAbsences >= 2) recommendations.push(`Avoid another absence streak. ${recentAbsences} of your last ${recentRecords.length} recorded classes were absent.`);
  else recommendations.push('Your latest attendance window is stable. Protect that consistency on your next scheduled classes.');
  if (delta > 1) recommendations.push(`Your attendance trend is improving by approximately ${delta} points across the recorded period.`);
  if (analytics.score >= 80) recommendations.push('You have a healthy score buffer. Keep it through assessment-heavy weeks.');
  return { student, analytics, weakest, recentRecords, recentAbsences, absenceStreak: consecutiveAbsences(analytics.records), trendDelta: delta, recommendations, confidence: analytics.records.length > 30 ? 0.89 : 0.72 };
}

export function recoveryClasses(currentPercentage, totalClasses, target = 75) { if (!totalClasses || currentPercentage >= target) return 0; const present = (currentPercentage / 100) * totalClasses; return Math.max(0, Math.ceil((target * totalClasses / 100 - present) / (1 - target / 100))); }

function studentAnswer(question, studentId, data) {
  const analysis = analyzeAttendance(studentId, data);
  const peers = getPeerStats(studentId, data.students, data.attendance);
  const q = question.toLowerCase();
  const targetMatch = q.match(/(?:reach|achieve|get to|hit)\s*(?:an attendance of\s*)?(\d{2,3})\s*%/);
  const target = targetMatch ? Number(targetMatch[1]) : 75;
  const subjectName = analysis.weakest?.name || 'your lowest subject';

  if (q.includes('lowest') || q.includes('weak') || q.includes('improve')) return { message: `${subjectName} is your clearest focus area at ${analysis.weakest?.percentage.toFixed(1)}%. Your overall attendance is ${analysis.analytics.percentage.toFixed(1)}%, so the gap is ${Math.abs(analysis.analytics.percentage - (analysis.weakest?.percentage || 0)).toFixed(1)} points. ${analysis.recommendations[0]}`, risk: analysis.analytics.risk, confidence: analysis.confidence, metrics: { subject: subjectName, percentage: analysis.weakest?.percentage } };
  if (q.includes('reach') || q.includes('target') || q.includes('%')) return { message: analysis.analytics.percentage >= target ? `You are already at ${analysis.analytics.percentage.toFixed(1)}%, above the ${target}% target. Keep attending consistently to preserve your buffer.` : `You are at ${analysis.analytics.percentage.toFixed(1)}% across ${analysis.analytics.total} eligible classes. You need approximately ${recoveryClasses(analysis.analytics.percentage, analysis.analytics.total, target)} consecutive classes to reach ${target}%, assuming no additional absences.`, risk: analysis.analytics.risk, confidence: 0.96, metrics: { current: analysis.analytics.percentage, target, classesNeeded: recoveryClasses(analysis.analytics.percentage, analysis.analytics.total, target) } };
  if (q.includes('compare') || q.includes('class') || q.includes('peer') || q.includes('department')) return { message: `You are at ${peers.current.toFixed(1)}%, versus a class average of ${peers.classAverage.toFixed(1)}%, section average of ${peers.sectionAverage.toFixed(1)}%, and department average of ${peers.departmentAverage.toFixed(1)}%. You are ahead of ${peers.percentile}% of the anonymized peer cohort.`, confidence: 0.93, metrics: peers };
  if (q.includes('risk') || q.includes('danger')) return { message: `Your current estimated risk is ${formatRisk(analysis.analytics.risk)}. The model considered ${analysis.analytics.percentage.toFixed(1)}% overall attendance, ${analysis.recentAbsences} absences in the latest ${analysis.recentRecords.length} records, a longest absence streak of ${analysis.absenceStreak}, and a ${analysis.trendDelta >= 0 ? 'stable or improving' : 'declining'} trend. This is a review signal, not a guaranteed prediction.`, risk: analysis.analytics.risk, confidence: analysis.confidence, metrics: { percentage: analysis.analytics.percentage, recentAbsences: analysis.recentAbsences, absenceStreak: analysis.absenceStreak, trendDelta: analysis.trendDelta } };
  if (q.includes('trend') || q.includes('recent') || q.includes('last month')) return { message: `Your recorded trend is ${analysis.trendDelta >= 0 ? 'up' : 'down'} ${Math.abs(analysis.trendDelta).toFixed(1)} points across the available period. In your latest ${analysis.recentRecords.length} records, you were present for ${analysis.recentRecords.filter((r) => r.status === 'present').length}, late for ${analysis.recentRecords.filter((r) => r.status === 'late').length}, and absent for ${analysis.recentAbsences}.`, confidence: 0.88, metrics: { trendDelta: analysis.trendDelta, recentRecords: analysis.recentRecords.length } };
  return { message: `Your overall attendance is ${analysis.analytics.percentage.toFixed(1)}% across ${analysis.analytics.total} eligible classes, with ${analysis.analytics.present} present, ${analysis.analytics.absent} absent, ${analysis.analytics.late} late, and ${analysis.analytics.excused} excused. Your attendance score is ${analysis.analytics.score}/100 and your estimated risk is ${formatRisk(analysis.analytics.risk)}. ${analysis.recommendations[0]}`, risk: analysis.analytics.risk, confidence: analysis.confidence, metrics: { percentage: analysis.analytics.percentage, score: analysis.analytics.score, total: analysis.analytics.total } };
}

export function answerTeacherQuestion(question, data) {
  const q = question.toLowerCase();
  const enriched = data.students.map((student) => ({ student, analytics: getStudentAnalytics(student.studentId, data.attendance, data.subjects) }));
  const atRisk = enriched.filter(({ analytics }) => analytics.risk === 'high' || analytics.risk === 'critical').sort((a, b) => a.analytics.percentage - b.analytics.percentage);
  const subjectStats = data.subjects.map((subject) => ({ ...subject, ...summarizeRecords(data.attendance.filter((record) => record.subjectId === subject.id)) })).sort((a, b) => a.percentage - b.percentage);
  const anomalies = enriched.filter(({ analytics }) => analytics.absent >= 3 || analytics.late >= 6 || analytics.percentage < 70);
  if (q.includes('risk') || q.includes('at-risk') || q.includes('at risk')) return { message: `${atRisk.length} students are currently in the high or critical estimated-risk range. The first review candidates are ${atRisk.slice(0, 5).map(({ student, analytics }) => `${student.name} (${analytics.percentage.toFixed(1)}%)`).join(', ')}. These are analytical flags for contextual review, not conclusions.`, risk: atRisk[0]?.analytics.risk || 'low', confidence: 0.91, metrics: { atRisk: atRisk.length, candidates: atRisk.slice(0, 5).map(({ student }) => student.studentId) } };
  if (q.includes('anomal') || q.includes('unusual') || q.includes('spike')) return { message: `${anomalies.length} potential patterns need review. The rule-based detector looks for low overall attendance, repeated absences, or unusually frequent late arrivals. The strongest current signal is ${anomalies[0]?.student.name || 'none'} at ${anomalies[0]?.analytics.percentage.toFixed(1) || '0.0'}%.`, confidence: 0.86, metrics: { potentialAnomalies: anomalies.length } };
  if (q.includes('lowest') || q.includes('class') || q.includes('subject')) return { message: `${subjectStats[0].name} currently has the lowest aggregate attendance at ${subjectStats[0].percentage.toFixed(1)}%, while ${subjectStats.at(-1).name} is strongest at ${subjectStats.at(-1).percentage.toFixed(1)}%. Consider reviewing the lowest subject by section before making an intervention.`, confidence: 0.94, metrics: { lowestSubject: subjectStats[0].code, lowestPercentage: subjectStats[0].percentage } };
  if (q.includes('improv') || q.includes('better')) return { message: `Subject movement is estimated from the latest half of recorded classes versus the earlier half. ${subjectStats.slice().sort((a, b) => b.percentage - a.percentage).slice(0, 2).map((subject) => `${subject.name} (${subject.percentage.toFixed(1)}%)`).join(' and ')} currently show the strongest aggregate attendance.`, confidence: 0.8, metrics: { subjects: subjectStats.map(({ code, percentage }) => ({ code, percentage })) } };
  if (q.includes('repeat') || q.includes('absence')) return { message: `${atRisk.slice(0, 6).map(({ student, analytics }) => `${student.name} has ${analytics.absent} absences`).join('; ') || 'No repeated absence pattern is currently above the review threshold.'}. Check the underlying attendance records and student context before taking action.`, confidence: 0.88, metrics: { reviewedStudents: Math.min(atRisk.length, 6) } };
  const stats = getTeacherStats(data.attendance, data.students);
  return { message: `This week’s register covers ${stats.totalStudents} students with ${stats.average.toFixed(1)}% average attendance. ${stats.presentToday} present and ${stats.absentToday} absent records appear in the latest recorded class date. There are ${stats.atRisk} estimated at-risk students and ${stats.anomalies} potential anomalies requiring review.`, confidence: 0.9, metrics: stats };
}

export function answerQuestion(question, studentId, data) { return studentAnswer(question, studentId, data); }
export async function analyzeAttendanceRemote(payload) { const base = import.meta.env.VITE_API_BASE_URL; if (!base) return null; const response = await fetch(`${base}/api/ai/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); return response.ok ? response.json() : null; }
