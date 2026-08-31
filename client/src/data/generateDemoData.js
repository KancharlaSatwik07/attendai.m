const studentNames = [
  'Aarav Mehta','Ananya Iyer','Vihaan Sharma','Aditi Nair','Arjun Reddy','Diya Kapoor','Kabir Singh','Ishita Joshi','Rohan Menon','Myra Shah','Advik Rao','Sara Khan','Atharv Patel','Kiara Das','Reyansh Gupta','Navya Bhat','Vivaan Malhotra','Zoya Verma','Kian Sethi','Meera Kulkarni','Ritvik Bose','Tara Pillai','Ayaan Chawla','Saanvi Jain','Krish Agarwal','Anvi Mishra','Devansh Roy','Riya Venkatesh','Shaurya Naidu','Aarohi Deshmukh','Yash Thakur','Mahi Srinivas','Dhruv Bansal','Ira Fernandes','Aadi Prakash','Nitya Hegde','Rudra Dutta','Mira Bedi','Parth Sood','Veda Narang','Neil Thomas','Ayesha Siddiqui','Samarth Jha','Lavanya Ramesh','Abeer Khanna','Tanvi Ghosh','Omkar Patil','Sia Chatterjee','Manav Saxena','Ishaan Bansal','Anika Roy','Kartik Iqbal','Prisha Shetty','Veer Tandon','Esha Arora','Raghav Suri','Avni Menon','Athiya Bose','Nakul Jain','Rhea Banerjee'
];

export const subjects = [
  { id: 'sub-1', code: 'CS301', name: 'Data Structures', short: 'Data Structures', color: '#4f46e5', teacherId: 'teacher001', department: 'Computer Science' },
  { id: 'sub-2', code: 'AI205', name: 'Machine Learning', short: 'Machine Learning', color: '#0f766e', teacherId: 'teacher001', department: 'Artificial Intelligence & Data Science' },
  { id: 'sub-3', code: 'EC202', name: 'Digital Electronics', short: 'Digital Electronics', color: '#d97706', teacherId: 'teacher002', department: 'Electronics & Communication' },
  { id: 'sub-4', code: 'CS307', name: 'Database Systems', short: 'Database Systems', color: '#be185d', teacherId: 'teacher003', department: 'Computer Science' },
  { id: 'sub-5', code: 'MA201', name: 'Probability & Stats', short: 'Probability & Stats', color: '#0891b2', teacherId: 'teacher004', department: 'Computer Science' },
  { id: 'sub-6', code: 'HS210', name: 'Design Thinking', short: 'Design Thinking', color: '#7c3aed', teacherId: 'teacher005', department: 'Artificial Intelligence & Data Science' }
];

export const teachers = [
  { id: 't-1', teacherId: 'teacher001', name: 'Dr. Meera Krishnan', email: 'teacher001@demo.attendai', department: 'Computer Science', subjects: ['sub-1','sub-2'] },
  { id: 't-2', teacherId: 'teacher002', name: 'Prof. Vivek Menon', email: 'teacher002@demo.attendai', department: 'Electronics & Communication', subjects: ['sub-3'] },
  { id: 't-3', teacherId: 'teacher003', name: 'Dr. Kavya Nair', email: 'teacher003@demo.attendai', department: 'Computer Science', subjects: ['sub-4'] },
  { id: 't-4', teacherId: 'teacher004', name: 'Prof. Aditya Rao', email: 'teacher004@demo.attendai', department: 'Mathematics', subjects: ['sub-5'] },
  { id: 't-5', teacherId: 'teacher005', name: 'Dr. Ritu Malhotra', email: 'teacher005@demo.attendai', department: 'Artificial Intelligence & Data Science', subjects: ['sub-6'] }
];

const attendanceStatuses = ['present', 'present', 'present', 'present', 'late', 'absent', 'present', 'present', 'present', 'excused'];
const seed = (n) => (Math.sin(n * 999) + 1) / 2;

export const students = studentNames.map((name, index) => {
  const id = `STU${String(index + 1).padStart(3, '0')}`;
  const department = index % 3 === 0 ? 'Computer Science' : index % 3 === 1 ? 'Artificial Intelligence & Data Science' : 'Electronics & Communication';
  return { id: `student-${index + 1}`, studentId: id, name, email: `student${String(index + 1).padStart(3, '0')}@demo.attendai`, department, year: index % 2 ? 2 : 3, semester: index % 2 ? 4 : 6, section: ['A','B','C'][index % 3], avatar: name.split(' ').map((part) => part[0]).join('').slice(0,2), subjects: subjects.map((subject) => subject.id) };
});

export function generateAttendance() {
  const records = [];
  const start = new Date('2026-07-20T09:00:00');
  for (let s = 0; s < students.length; s += 1) {
    for (let d = 0; d < 30; d += 1) {
      for (let subjectIndex = 0; subjectIndex < subjects.length; subjectIndex += 1) {
        const date = new Date(start); date.setDate(start.getDate() + d);
        if (date.getDay() === 0 || date.getDay() === 6 || (d + subjectIndex) % 4 === 0) continue;
        const personalBias = (s % 10) * 0.022 - 0.11;
        const recentBias = d > 20 && s % 7 === 0 ? -0.23 : d > 20 && s % 9 === 0 ? 0.12 : 0;
        const subjectBias = subjectIndex === s % 6 ? -0.06 : 0.02;
        const roll = seed(s * 91 + d * 17 + subjectIndex * 31);
        let status = roll < 0.72 + personalBias + recentBias + subjectBias ? 'present' : roll < 0.84 + personalBias + subjectBias ? 'late' : roll < 0.985 ? 'absent' : 'excused';
        if (s % 17 === 0 && d > 23) status = d % 3 === 0 ? 'absent' : 'late';
        records.push({ id: `att-${s}-${d}-${subjectIndex}`, studentId: students[s].studentId, subjectId: subjects[subjectIndex].id, teacherId: subjects[subjectIndex].teacherId, classId: `class-${subjectIndex + 1}`, date: date.toISOString().slice(0,10), period: `${9 + (subjectIndex % 4)}:00`, status, timestamp: date.toISOString() });
      }
    }
  }
  return records;
}

export const attendance = generateAttendance();

export const classes = subjects.map((subject, index) => ({ id: `class-${index + 1}`, name: `${subject.code} · Section ${index % 2 ? 'B' : 'A'}`, subjectId: subject.id, teacherId: subject.teacherId, schedule: index % 2 ? 'Tue · Thu · 11:00' : 'Mon · Wed · 09:00', room: `Block ${String.fromCharCode(65 + index)} · ${201 + index}` }));

export const notifications = [
  { id: 1, title: 'Attendance pulse ready', body: 'Your weekly intelligence summary is ready to review.', time: '12 min ago', tone: 'info' },
  { id: 2, title: 'Risk signal changed', body: 'Data Structures moved into the watch range.', time: 'Yesterday', tone: 'warning' },
  { id: 3, title: 'Class record updated', body: 'Machine Learning attendance was marked for today.', time: '2 days ago', tone: 'success' }
];

export const demoData = { students, teachers, subjects, attendance, classes, notifications };
