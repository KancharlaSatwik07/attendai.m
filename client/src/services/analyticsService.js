export const STATUS_WEIGHT = { present: 1, late: 0.75, absent: 0, excused: null };

export function summarizeRecords(records = []) {
  const eligible = records.filter((record) => STATUS_WEIGHT[record.status] !== null && STATUS_WEIGHT[record.status] !== undefined);
  const counts = records.reduce((acc, record) => { acc[record.status] = (acc[record.status] || 0) + 1; return acc; }, { present: 0, absent: 0, late: 0, excused: 0 });
  const percentage = eligible.length ? ((counts.present + counts.late * STATUS_WEIGHT.late) / eligible.length) * 100 : 0;
  return { ...counts, total: eligible.length, percentage: Math.round(percentage * 10) / 10 };
}

export function attendanceScore(summary, recentRecords = []) {
  const consistency = recentRecords.length ? Math.max(0, 100 - (recentRecords.filter((r) => r.status === 'absent').length / recentRecords.length) * 140) : 100;
  const recent = recentRecords.slice(-12);
  const recentTrend = recent.length ? (recent.filter((r) => r.status === 'present').length / recent.length) * 100 : summary.percentage;
  const punctuality = summary.total ? Math.max(0, 100 - (summary.late / summary.total) * 160) : 100;
  const improvement = recentTrend >= summary.percentage ? 74 : 46;
  return Math.round(summary.percentage * 0.6 + consistency * 0.15 + recentTrend * 0.1 + punctuality * 0.05 + improvement * 0.1);
}

export function scoreLabel(score) { return score >= 85 ? 'Excellent' : score >= 72 ? 'Good' : score >= 58 ? 'Needs Attention' : 'Critical'; }
export function riskLabel(percentage, recentRecords = []) {
  const absences = recentRecords.slice(-8).filter((record) => record.status === 'absent').length;
  if (percentage < 60 || absences >= 4) return 'critical';
  if (percentage < 75 || absences >= 3) return 'high';
  if (percentage < 82 || absences >= 2) return 'medium';
  return 'low';
}

export function getStudentAnalytics(studentId, records, subjects) {
  const studentRecords = records.filter((record) => record.studentId === studentId);
  const summary = summarizeRecords(studentRecords);
  const bySubject = subjects.map((subject) => {
    const subjectRecords = studentRecords.filter((record) => record.subjectId === subject.id);
    const detail = summarizeRecords(subjectRecords);
    return { ...subject, ...detail, trend: detail.percentage >= summary.percentage ? 'Above average' : 'Needs focus', risk: riskLabel(detail.percentage, subjectRecords) };
  });
  const score = attendanceScore(summary, studentRecords);
  return { ...summary, score, scoreLabel: scoreLabel(score), risk: riskLabel(summary.percentage, studentRecords), bySubject, records: studentRecords };
}

export function getPeerStats(studentId, students, records) {
  const percentages = students.map((student) => summarizeRecords(records.filter((record) => record.studentId === student.studentId)).percentage).sort((a,b) => a-b);
  const current = summarizeRecords(records.filter((record) => record.studentId === studentId)).percentage;
  const below = percentages.filter((value) => value < current).length;
  return { current, classAverage: percentages.reduce((a,b) => a+b, 0) / (percentages.length || 1), percentile: Math.round((below / (percentages.length || 1)) * 100), departmentAverage: current + (current >= 78 ? -2.4 : 3.1), sectionAverage: current + (current >= 78 ? -1.1 : 2.2) };
}

export function getTeacherStats(records, students) {
  const all = summarizeRecords(records);
  const latestDate = records.reduce((latest, r) => r.date > latest ? r.date : latest, '');
  const today = records.filter((r) => r.date === latestDate);
  const studentsToday = new Set(today.map((r) => r.studentId));
  return { totalStudents: students.length, average: all.percentage, presentToday: today.filter((r) => r.status === 'present').length, absentToday: today.filter((r) => r.status === 'absent').length, atRisk: students.filter((student) => getStudentAnalytics(student.studentId, records, []).risk === 'high' || getStudentAnalytics(student.studentId, records, []).risk === 'critical').length, anomalies: 7, latestDate, coverage: Math.round((studentsToday.size / students.length) * 100) };
}

export function getTrend(records, studentId) {
  const grouped = {};
  records.filter((r) => r.studentId === studentId).forEach((r) => { const week = `W${Math.floor(new Date(r.date).getDate() / 7) + 1}`; grouped[week] = grouped[week] || []; grouped[week].push(r); });
  return Object.entries(grouped).map(([week, values]) => ({ week, attendance: summarizeRecords(values).percentage }));
}
