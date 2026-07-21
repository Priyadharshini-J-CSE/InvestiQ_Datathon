const mockData = {
  stats: {
    totalFIRs: 12847, activeCases: 3241, pendingCases: 1876,
    closedCases: 7730, wantedCriminals: 847, todayFIRs: 43,
    evidence: 9234, hearings: 128, policeStations: 340, aiAccuracy: 94.7
  },
  monthlyData: [
    { month: 'Jan', cases: 1120, solved: 780, pending: 340 },
    { month: 'Feb', cases: 980, solved: 720, pending: 260 },
    { month: 'Mar', cases: 1240, solved: 890, pending: 350 },
    { month: 'Apr', cases: 1050, solved: 810, pending: 240 },
    { month: 'May', cases: 1380, solved: 950, pending: 430 },
    { month: 'Jun', cases: 1190, solved: 870, pending: 320 },
    { month: 'Jul', cases: 1320, solved: 920, pending: 400 },
    { month: 'Aug', cases: 1450, solved: 1010, pending: 440 },
    { month: 'Sep', cases: 1280, solved: 940, pending: 340 },
    { month: 'Oct', cases: 1100, solved: 830, pending: 270 },
    { month: 'Nov', cases: 1060, solved: 790, pending: 270 },
    { month: 'Dec', cases: 1230, solved: 900, pending: 330 },
  ],
  firs: Array.from({ length: 50 }, (_, i) => ({
    id: `FIR-2024-${String(i + 1001).padStart(5, '0')}`,
    title: ['Chain Snatching', 'Cyber Fraud', 'Vehicle Theft', 'Assault', 'Burglary'][i % 5],
    status: ['Active', 'Pending', 'Closed', 'Under Investigation'][i % 4],
    accused: `Accused ${i + 1}`,
    district: ['Bengaluru Urban', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi'][i % 5],
    filedDate: new Date(2024, i % 12, (i % 28) + 1).toISOString(),
    ipcSections: ['IPC 379', 'IPC 420', 'IPC 302', 'IPC 307'][i % 4],
    officer: `SI Officer ${i + 1}`,
  })),
  criminals: Array.from({ length: 30 }, (_, i) => ({
    id: `CRM-${String(i + 1).padStart(4, '0')}`,
    name: `Criminal ${i + 1}`,
    category: ['Theft', 'Assault', 'Fraud', 'Murder', 'Robbery'][i % 5],
    riskScore: Math.floor(Math.random() * 40) + 60,
    arrests: Math.floor(Math.random() * 8) + 1,
    district: ['Bengaluru Urban', 'Mysuru', 'Mangaluru'][i % 3],
    status: ['Wanted', 'Arrested', 'Released on Bail', 'Absconding'][i % 4],
  }))
}

module.exports = mockData
