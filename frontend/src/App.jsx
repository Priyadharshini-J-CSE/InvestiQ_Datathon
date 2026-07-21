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
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />

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
              <Route path="/profile/:id" element={<PageWrapper><CriminalProfile /></PageWrapper>} />
              <Route path="/criminals" element={<PageWrapper><CriminalProfile /></PageWrapper>} />
              <Route path="/fir" element={<PageWrapper><Dashboard /></PageWrapper>} />
              <Route path="/investigations" element={<PageWrapper><Dashboard /></PageWrapper>} />
              <Route path="/evidence" element={<PageWrapper><Dashboard /></PageWrapper>} />
              <Route path="/court" element={<PageWrapper><Dashboard /></PageWrapper>} />
              <Route path="/heatmap" element={<PageWrapper><Analytics /></PageWrapper>} />
              <Route path="/reports" element={<PageWrapper><Dashboard /></PageWrapper>} />
              <Route path="/settings" element={<PageWrapper><Dashboard /></PageWrapper>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </AuthProvider>
  )
}
