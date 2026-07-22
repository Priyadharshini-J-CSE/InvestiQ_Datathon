// Mock data for InvestiQ platform

export const stats = {
  totalFIRs: 12847,
  activeCases: 3241,
  pendingCases: 1876,
  closedCases: 7730,
  wantedCriminals: 847,
  todayFIRs: 43,
  evidence: 9234,
  hearings: 128,
  policeStations: 340,
  aiAccuracy: 94.7,
}

export const districts = [
  'Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Mangaluru', 'Hubballi-Dharwad',
  'Belagavi', 'Kalaburagi', 'Ballari', 'Shivamogga', 'Tumakuru',
  'Vijayapura', 'Raichur', 'Bidar', 'Yadgir', 'Koppal',
  'Gadag', 'Dharwad', 'Uttara Kannada', 'Haveri', 'Davanagere',
  'Chitradurga', 'Chikkamagaluru', 'Hassan', 'Kodagu', 'Mandya',
  'Chamarajanagar', 'Ramanagara', 'Chikkaballapura', 'Kolar', 'Bagalkot'
]

export const crimeCategories = [
  'Theft', 'Assault', 'Fraud', 'Murder', 'Robbery', 'Cybercrime',
  'Drug Trafficking', 'Kidnapping', 'Domestic Violence', 'Burglary'
]

export const monthlyData = [
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
]

export const crimeCategoryData = [
  { name: 'Theft', value: 28, color: '#FF2D2D' },
  { name: 'Assault', value: 18, color: '#E53935' },
  { name: 'Fraud', value: 15, color: '#FF6B6B' },
  { name: 'Cybercrime', value: 12, color: '#FF8A80' },
  { name: 'Robbery', value: 10, color: '#00D26A' },
  { name: 'Others', value: 17, color: '#444' },
]

export const districtData = [
  { district: 'Bengaluru Urban', cases: 3240, solved: 2100 },
  { district: 'Mysuru', cases: 1120, solved: 890 },
  { district: 'Mangaluru', cases: 980, solved: 760 },
  { district: 'Hubballi', cases: 870, solved: 640 },
  { district: 'Belagavi', cases: 760, solved: 580 },
  { district: 'Kalaburagi', cases: 690, solved: 490 },
]

export const firs = Array.from({ length: 50 }, (_, i) => ({
  id: `FIR-2024-${String(i + 1001).padStart(5, '0')}`,
  title: [
    'Chain Snatching Near MG Road',
    'Cyber Fraud – UPI Scam',
    'Vehicle Theft – Bike Missing',
    'Assault at Local Bar',
    'Burglary at Residential Complex',
    'Drug Trafficking Bust',
    'Domestic Violence Complaint',
    'Murder at Industrial Area',
    'Kidnapping – Minor Victim',
    'Bank Robbery Attempt'
  ][i % 10],
  status: ['Active', 'Pending', 'Closed', 'Under Investigation'][i % 4],
  accused: [`Ravi Kumar ${i}`, `Mohammed Salim ${i}`, `Priya Sharma ${i}`][i % 3],
  district: districts[i % districts.length],
  filedDate: new Date(2024, i % 12, (i % 28) + 1).toLocaleDateString('en-IN'),
  ipcSections: ['IPC 379', 'IPC 420', 'IPC 302', 'IPC 307', 'IPC 376'][i % 5],
  aiSummary: 'AI analysis indicates high probability of repeat offender involvement. Similar pattern detected in 3 prior cases within 2km radius.',
  matchScore: Math.floor(Math.random() * 30) + 70,
  officer: `SI ${['Ramesh', 'Suresh', 'Mahesh', 'Ganesh'][i % 4]} Kumar`,
}))

export const criminals = Array.from({ length: 30 }, (_, i) => ({
  id: `CRM-${String(i + 1).padStart(4, '0')}`,
  name: [
    'Ravi Kumar Sharma', 'Mohammed Irfan', 'Suresh Gowda', 'Pradeep Nair',
    'Vikram Singh', 'Arjun Reddy', 'Sanjay Patil', 'Deepak Verma',
    'Rajesh Hegde', 'Anil Kumar'
  ][i % 10],
  alias: ['The Ghost', 'Knife King', 'Digital Don', 'Shadow', 'Iron Fist'][i % 5],
  age: 25 + (i % 30),
  category: crimeCategories[i % crimeCategories.length],
  riskScore: Math.floor(Math.random() * 40) + 60,
  arrests: Math.floor(Math.random() * 8) + 1,
  district: districts[i % districts.length],
  status: ['Wanted', 'Arrested', 'Released on Bail', 'Absconding'][i % 4],
  lastKnown: districts[(i + 5) % districts.length],
  courtStatus: ['Trial Pending', 'Convicted', 'Acquitted', 'Under Investigation'][i % 4],
  photo: `https://i.pravatar.cc/150?img=${i + 10}`,
}))

export const recentActivity = [
  { id: 1, type: 'fir', text: 'New FIR filed – Chain snatching at Koramangala', time: '2 min ago', severity: 'high' },
  { id: 2, type: 'arrest', text: 'Suspect arrested in FIR-2024-01234 – Bengaluru Urban', time: '15 min ago', severity: 'medium' },
  { id: 3, type: 'evidence', text: 'Digital evidence uploaded for Case #CRM-0045', time: '32 min ago', severity: 'low' },
  { id: 4, type: 'alert', text: 'Wanted criminal Ravi Kumar spotted near Mysuru', time: '1 hr ago', severity: 'high' },
  { id: 5, type: 'court', text: 'Court hearing scheduled for Case #2024-CR-0892', time: '2 hr ago', severity: 'medium' },
  { id: 6, type: 'fir', text: 'FIR closed – Sufficient evidence collected', time: '3 hr ago', severity: 'low' },
  { id: 7, type: 'alert', text: 'Pattern detected: 5 similar thefts in Whitefield area', time: '4 hr ago', severity: 'high' },
]

export const aiChatHistory = [
  {
    id: 1,
    role: 'assistant',
    content: 'Hello! I\'m InvestiQ AI, your crime intelligence assistant. I can help you analyze FIRs, find criminal patterns, search case histories, and generate investigation insights. How can I assist you today?',
    timestamp: new Date().toISOString(),
  }
]

export const suggestedPrompts = [
  'Show me all theft cases in Bengaluru Urban this month',
  'Find similar cases to FIR-2024-01045',
  'What are the crime hotspots in Mysuru district?',
  'Summarize the chargesheet for Case #2024-CR-0892',
  'List all wanted criminals with high risk scores',
  'Analyze crime patterns for the last 6 months',
  'Which IPC sections are most commonly invoked?',
  'Show repeat offenders in Mangaluru district',
]

export const features = [
  {
    icon: 'Search',
    title: 'Semantic Search',
    description: 'Search across 12,000+ FIRs using natural language. Find cases by description, not just keywords.',
    color: '#FF2D2D'
  },
  {
    icon: 'GitBranch',
    title: 'Case Similarity',
    description: 'AI-powered similarity detection identifies related cases and patterns across districts.',
    color: '#E53935'
  },
  {
    icon: 'Network',
    title: 'Criminal Network Analysis',
    description: 'Map criminal networks, identify associates, and track gang activities across Karnataka.',
    color: '#FF6B6B'
  },
  {
    icon: 'Clock',
    title: 'Timeline Generation',
    description: 'Automatically generate case timelines from FIRs, evidence, and witness statements.',
    color: '#00D26A'
  },
  {
    icon: 'Mic',
    title: 'Voice Assistant',
    description: 'Query the system in Kannada, Hindi, or English using natural voice commands.',
    color: '#4FC3F7'
  },
  {
    icon: 'TrendingUp',
    title: 'Predictive Analytics',
    description: 'Predict crime hotspots and peak times using historical data and ML models.',
    color: '#FFB74D'
  },
  {
    icon: 'Scale',
    title: 'Legal Assistant',
    description: 'Instant IPC section lookup, legal precedents, and charge-sheet drafting assistance.',
    color: '#CE93D8'
  },
  {
    icon: 'Globe',
    title: 'Multilingual Support',
    description: 'Full support for Kannada, Hindi, Tamil, Telugu, and English across all features.',
    color: '#80CBC4'
  },
  {
    icon: 'Camera',
    title: 'Evidence Intelligence',
    description: 'AI-powered evidence analysis including image recognition and document parsing.',
    color: '#FFCC02'
  },
  {
    icon: 'FileText',
    title: 'Document Summarization',
    description: 'Instantly summarize lengthy chargesheets, FIRs, and court documents.',
    color: '#FF8A65'
  },
  {
    icon: 'Shield',
    title: 'Secure Access Control',
    description: 'Role-based access for Admin, Officers, and Investigators with full audit trails.',
    color: '#A5D6A7'
  },
  {
    icon: 'MapPin',
    title: 'Crime Heatmap',
    description: 'Real-time geographic visualization of crime density across all 30 districts.',
    color: '#EF9A9A'
  },
]
