import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import Overview from './pages/Overview'
import Dashboard from './pages/Dashboard'
import Assistant from './pages/Assistant'
import SmartSearch from './pages/SmartSearch'
import Analytics from './pages/Analytics'
import Features from './pages/Features'
import CriminalProfile from './pages/CriminalProfile'
import Login from './pages/Login'
import Register from './pages/Register'
import FIRManagement from './pages/FIRManagement'
import PersonManagement from './pages/PersonManagement'
import CriminalRecords from './pages/CriminalRecords'
import WantedCriminals from './pages/WantedCriminals'
import CaseManagement from './pages/CaseManagement'
import Charges from './pages/Charges'
import Arrests from './pages/Arrests'
import Convictions from './pages/Convictions'
import Evidence from './pages/Evidence'
import Officers from './pages/Officers'
import Users from './pages/Users'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Admin from './pages/Admin'
import Heatmap from './pages/Heatmap'
import CriminalNetwork from './pages/CriminalNetwork'
import PredictiveAnalytics from './pages/PredictiveAnalytics'
import BehavioralProfiling from './pages/BehavioralProfiling'
import AIReports from './pages/AIReports'
import Complainants from './pages/Complainants'
import Victims from './pages/Victims'
import Accused from './pages/Accused'
import Chargesheets from './pages/Chargesheets'
import PoliceUnits from './pages/PoliceUnits'
import Courts from './pages/Courts'
import MasterData from './pages/MasterData'
import FIRDetails from './pages/FIRDetails'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } }
}

function PageWrapper({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
            <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />

            {/* Public pages with Navbar + Footer */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<PageWrapper><Overview /></PageWrapper>} />
              <Route path="/features" element={<PageWrapper><Features /></PageWrapper>} />
            </Route>

            {/* Protected dashboard pages with Sidebar */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
              <Route path="/assistant" element={<PageWrapper><Assistant /></PageWrapper>} />
              <Route path="/search" element={<PageWrapper><SmartSearch /></PageWrapper>} />
              <Route path="/analytics" element={<PageWrapper><Analytics /></PageWrapper>} />
              <Route path="/heatmap" element={<PageWrapper><Heatmap /></PageWrapper>} />
              <Route path="/network" element={<PageWrapper><CriminalNetwork /></PageWrapper>} />
              <Route path="/predict" element={<PageWrapper><PredictiveAnalytics /></PageWrapper>} />
              <Route path="/behavioral" element={<PageWrapper><BehavioralProfiling /></PageWrapper>} />
              <Route path="/ai-reports" element={<PageWrapper><AIReports /></PageWrapper>} />
              <Route path="/fir" element={<PageWrapper><FIRManagement /></PageWrapper>} />
              <Route path="/persons" element={<PageWrapper><PersonManagement /></PageWrapper>} />
              <Route path="/criminals" element={<PageWrapper><CriminalRecords /></PageWrapper>} />
              <Route path="/profile/:id" element={<PageWrapper><CriminalProfile /></PageWrapper>} />
              <Route path="/wanted" element={<PageWrapper><WantedCriminals /></PageWrapper>} />
              <Route path="/cases" element={<PageWrapper><CaseManagement /></PageWrapper>} />
              <Route path="/charges" element={<PageWrapper><Charges /></PageWrapper>} />
              <Route path="/arrests" element={<PageWrapper><Arrests /></PageWrapper>} />
              <Route path="/convictions" element={<PageWrapper><Convictions /></PageWrapper>} />
              <Route path="/evidence" element={<PageWrapper><Evidence /></PageWrapper>} />
              <Route path="/officers" element={<PageWrapper><Officers /></PageWrapper>} />
              <Route path="/users" element={<PageWrapper><Users /></PageWrapper>} />
              <Route path="/reports" element={<PageWrapper><Reports /></PageWrapper>} />
              <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
              <Route path="/admin" element={<PageWrapper><Admin /></PageWrapper>} />
              {/* New routes */}
              <Route path="/complainants" element={<PageWrapper><Complainants /></PageWrapper>} />
              <Route path="/victims" element={<PageWrapper><Victims /></PageWrapper>} />
              <Route path="/accused" element={<PageWrapper><Accused /></PageWrapper>} />
              <Route path="/chargesheets" element={<PageWrapper><Chargesheets /></PageWrapper>} />
              <Route path="/police-units" element={<PageWrapper><PoliceUnits /></PageWrapper>} />
              <Route path="/courts" element={<PageWrapper><Courts /></PageWrapper>} />
              <Route path="/master-data" element={<PageWrapper><MasterData /></PageWrapper>} />
              <Route path="/fir/:id/detail" element={<PageWrapper><FIRDetails /></PageWrapper>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </AuthProvider>
  )
}
