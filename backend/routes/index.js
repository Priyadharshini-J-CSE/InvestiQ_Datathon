const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const upload = require('../middleware/upload')

const { login, register } = require('../controllers/authController')
const { getStats, getAnalytics, getHeatmap } = require('../controllers/dashboardController')
const firCtrl = require('../controllers/firController')
const personCtrl = require('../controllers/personController')
const criminalCtrl = require('../controllers/criminalController')
const wantedCtrl = require('../controllers/wantedController')
const caseCtrl = require('../controllers/caseController')
const chargeCtrl = require('../controllers/chargeController')
const arrestCtrl = require('../controllers/arrestController')
const convictionCtrl = require('../controllers/convictionController')
const evidenceCtrl = require('../controllers/evidenceController')
const officerCtrl = require('../controllers/officerController')
const userCtrl = require('../controllers/userController')
const adminCtrl = require('../controllers/adminController')
const { ask } = require('../controllers/assistantController')
const { search } = require('../controllers/searchController')
const reportCtrl = require('../controllers/reportController')
const aiCtrl = require('../controllers/aiController')
// New controllers
const complainantCtrl = require('../controllers/complainantController')
const victimCtrl = require('../controllers/victimController')
const accusedCtrl = require('../controllers/accusedController')
const chargesheetCtrl = require('../controllers/chargesheetController')
const masterCtrl = require('../controllers/masterController')
const firDetailCtrl = require('../controllers/firDetailController')

// Auth
router.post('/login', login)
router.post('/register', register)

// Dashboard
router.get('/dashboard', auth, getStats)
router.get('/analytics', auth, getAnalytics)
router.get('/heatmap', auth, getHeatmap)

// FIRs
router.get('/fir', auth, firCtrl.getAll)
router.get('/fir/:id', auth, firCtrl.getById)
router.post('/fir', auth, firCtrl.create)
router.put('/fir/:id', auth, firCtrl.update)
router.delete('/fir/:id', auth, firCtrl.remove)

// Persons
router.get('/persons', auth, personCtrl.getAll)
router.get('/persons/:id', auth, personCtrl.getById)
router.post('/persons', auth, personCtrl.create)
router.put('/persons/:id', auth, personCtrl.update)
router.delete('/persons/:id', auth, personCtrl.remove)

// Criminals
router.get('/criminals', auth, criminalCtrl.getAll)
router.get('/criminals/:id', auth, criminalCtrl.getById)
router.post('/criminals', auth, criminalCtrl.create)
router.put('/criminals/:id', auth, criminalCtrl.update)
router.delete('/criminals/:id', auth, criminalCtrl.remove)

// Wanted
router.get('/wanted', auth, wantedCtrl.getAll)
router.get('/wanted/:id', auth, wantedCtrl.getById)
router.post('/wanted', auth, wantedCtrl.create)
router.put('/wanted/:id', auth, wantedCtrl.update)
router.delete('/wanted/:id', auth, wantedCtrl.remove)

// Cases
router.get('/cases', auth, caseCtrl.getAll)
router.get('/cases/:id', auth, caseCtrl.getById)
router.post('/cases', auth, caseCtrl.create)
router.put('/cases/:id', auth, caseCtrl.update)
router.delete('/cases/:id', auth, caseCtrl.remove)

// Charges
router.get('/charges', auth, chargeCtrl.getAll)
router.get('/charges/:id', auth, chargeCtrl.getById)
router.post('/charges', auth, chargeCtrl.create)
router.put('/charges/:id', auth, chargeCtrl.update)
router.delete('/charges/:id', auth, chargeCtrl.remove)

// Arrests
router.get('/arrests', auth, arrestCtrl.getAll)
router.get('/arrests/:id', auth, arrestCtrl.getById)
router.post('/arrests', auth, arrestCtrl.create)
router.put('/arrests/:id', auth, arrestCtrl.update)
router.delete('/arrests/:id', auth, arrestCtrl.remove)

// Convictions
router.get('/convictions', auth, convictionCtrl.getAll)
router.get('/convictions/:id', auth, convictionCtrl.getById)
router.post('/convictions', auth, convictionCtrl.create)
router.put('/convictions/:id', auth, convictionCtrl.update)
router.delete('/convictions/:id', auth, convictionCtrl.remove)

// Evidence
router.get('/evidence', auth, evidenceCtrl.getAll)
router.get('/evidence/:id', auth, evidenceCtrl.getById)
router.post('/evidence', auth, evidenceCtrl.create)
router.put('/evidence/:id', auth, evidenceCtrl.update)
router.delete('/evidence/:id', auth, evidenceCtrl.remove)

// Officers
router.get('/officers', auth, officerCtrl.getAll)
router.get('/officers/list', auth, officerCtrl.getList)
router.get('/officers/:id', auth, officerCtrl.getById)
router.post('/officers', auth, officerCtrl.create)
router.put('/officers/:id', auth, officerCtrl.update)
router.delete('/officers/:id', auth, officerCtrl.remove)

// Users
router.get('/users', auth, userCtrl.getAll)
router.get('/users/:id', auth, userCtrl.getById)
router.post('/users', auth, userCtrl.create)
router.put('/users/:id', auth, userCtrl.update)
router.delete('/users/:id', auth, userCtrl.remove)

// Admin
router.get('/admin/audit-logs', auth, adminCtrl.getAuditLogs)
router.get('/admin/activity-logs', auth, adminCtrl.getActivityLogs)
router.get('/admin/stations', auth, adminCtrl.getStations)
router.post('/admin/stations', auth, adminCtrl.createStation)
router.get('/admin/districts', auth, adminCtrl.getDistricts)

// Reports
router.get('/reports/summary', auth, reportCtrl.getSummary)
router.get('/reports/monthly', auth, reportCtrl.getMonthly)

// Search & Assistant
router.post('/search', auth, search)
router.post('/assistant', auth, ask)

// AI Features
router.post('/ai/search', auth, aiCtrl.semanticSearch)
router.post('/ai/summarize', auth, aiCtrl.summarize)
router.post('/ai/predict', auth, aiCtrl.predict)
router.post('/ai/profile', auth, aiCtrl.behavioralProfile)
router.post('/ai/network', auth, aiCtrl.network)
router.get('/ai/chat-history', auth, aiCtrl.chatHistory)
router.post('/ai/chat-history', auth, aiCtrl.saveChatHistory)

// File upload
router.post('/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ success: true, filename: req.file.filename, path: `/uploads/${req.file.filename}` })
})

// ── FIR Detail (full view) ────────────────────────────────────────────────────
router.get('/fir/:id/detail', auth, firDetailCtrl.getFIRDetail)

// ── Complainants ──────────────────────────────────────────────────────────────
router.get('/complainants', auth, complainantCtrl.getAll)
router.get('/complainants/:id', auth, complainantCtrl.getById)
router.post('/complainants', auth, complainantCtrl.create)
router.put('/complainants/:id', auth, complainantCtrl.update)
router.delete('/complainants/:id', auth, complainantCtrl.remove)
router.get('/fir/:firId/complainants', auth, complainantCtrl.getByFIR)

// ── Victims ───────────────────────────────────────────────────────────────────
router.get('/victims', auth, victimCtrl.getAll)
router.get('/victims/:id', auth, victimCtrl.getById)
router.post('/victims', auth, victimCtrl.create)
router.put('/victims/:id', auth, victimCtrl.update)
router.delete('/victims/:id', auth, victimCtrl.remove)
router.get('/fir/:firId/victims', auth, victimCtrl.getByFIR)

// ── Accused ───────────────────────────────────────────────────────────────────
router.get('/accused', auth, accusedCtrl.getAll)
router.get('/accused/:id', auth, accusedCtrl.getById)
router.post('/accused', auth, accusedCtrl.create)
router.put('/accused/:id', auth, accusedCtrl.update)
router.delete('/accused/:id', auth, accusedCtrl.remove)
router.get('/fir/:firId/accused', auth, accusedCtrl.getByFIR)

// ── Chargesheets ──────────────────────────────────────────────────────────────
router.get('/chargesheets', auth, chargesheetCtrl.getAll)
router.get('/chargesheets/:id', auth, chargesheetCtrl.getById)
router.post('/chargesheets', auth, chargesheetCtrl.create)
router.put('/chargesheets/:id', auth, chargesheetCtrl.update)
router.delete('/chargesheets/:id', auth, chargesheetCtrl.remove)
router.get('/fir/:firId/chargesheets', auth, chargesheetCtrl.getByFIR)

// ── Master Data ───────────────────────────────────────────────────────────────
// States
router.get('/master/states', auth, masterCtrl.getStates)
router.get('/master/states/:id', auth, masterCtrl.getState)
router.post('/master/states', auth, masterCtrl.createState)
router.put('/master/states/:id', auth, masterCtrl.updateState)
router.delete('/master/states/:id', auth, masterCtrl.deleteState)

// Districts
router.get('/master/districts', auth, masterCtrl.getDistricts)
router.get('/master/districts/:id', auth, masterCtrl.getDistrict)
router.post('/master/districts', auth, masterCtrl.createDistrict)
router.put('/master/districts/:id', auth, masterCtrl.updateDistrict)
router.delete('/master/districts/:id', auth, masterCtrl.deleteDistrict)

// Occupations
router.get('/master/occupations', auth, masterCtrl.getOccupations)
router.get('/master/occupations/:id', auth, masterCtrl.getOccupation)
router.post('/master/occupations', auth, masterCtrl.createOccupation)
router.put('/master/occupations/:id', auth, masterCtrl.updateOccupation)
router.delete('/master/occupations/:id', auth, masterCtrl.deleteOccupation)

// Religions
router.get('/master/religions', auth, masterCtrl.getReligions)
router.get('/master/religions/:id', auth, masterCtrl.getReligion)
router.post('/master/religions', auth, masterCtrl.createReligion)
router.put('/master/religions/:id', auth, masterCtrl.updateReligion)
router.delete('/master/religions/:id', auth, masterCtrl.deleteReligion)

// Castes
router.get('/master/castes', auth, masterCtrl.getCastes)
router.get('/master/castes/:id', auth, masterCtrl.getCaste)
router.post('/master/castes', auth, masterCtrl.createCaste)
router.put('/master/castes/:id', auth, masterCtrl.updateCaste)
router.delete('/master/castes/:id', auth, masterCtrl.deleteCaste)

// Ranks
router.get('/master/ranks', auth, masterCtrl.getRanks)
router.get('/master/ranks/:id', auth, masterCtrl.getRank)
router.post('/master/ranks', auth, masterCtrl.createRank)
router.put('/master/ranks/:id', auth, masterCtrl.updateRank)
router.delete('/master/ranks/:id', auth, masterCtrl.deleteRank)

// Designations
router.get('/master/designations', auth, masterCtrl.getDesignations)
router.get('/master/designations/:id', auth, masterCtrl.getDesignation)
router.post('/master/designations', auth, masterCtrl.createDesignation)
router.put('/master/designations/:id', auth, masterCtrl.updateDesignation)
router.delete('/master/designations/:id', auth, masterCtrl.deleteDesignation)

// Police Units
router.get('/police-units', auth, masterCtrl.getPoliceUnits)
router.get('/police-units/:id', auth, masterCtrl.getPoliceUnit)
router.post('/police-units', auth, masterCtrl.createPoliceUnit)
router.put('/police-units/:id', auth, masterCtrl.updatePoliceUnit)
router.delete('/police-units/:id', auth, masterCtrl.deletePoliceUnit)

// Courts
router.get('/courts', auth, masterCtrl.getCourts)
router.get('/courts/:id', auth, masterCtrl.getCourt)
router.post('/courts', auth, masterCtrl.createCourt)
router.put('/courts/:id', auth, masterCtrl.updateCourt)
router.delete('/courts/:id', auth, masterCtrl.deleteCourt)

// Acts
router.get('/master/acts', auth, masterCtrl.getActs)
router.get('/master/acts/:id', auth, masterCtrl.getAct)
router.post('/master/acts', auth, masterCtrl.createAct)
router.put('/master/acts/:id', auth, masterCtrl.updateAct)
router.delete('/master/acts/:id', auth, masterCtrl.deleteAct)

// Sections
router.get('/master/sections', auth, masterCtrl.getSections)
router.get('/master/sections/:id', auth, masterCtrl.getSection)
router.post('/master/sections', auth, masterCtrl.createSection)
router.put('/master/sections/:id', auth, masterCtrl.updateSection)
router.delete('/master/sections/:id', auth, masterCtrl.deleteSection)

// Crime Heads
router.get('/master/crime-heads', auth, masterCtrl.getCrimeHeads)
router.get('/master/crime-heads/:id', auth, masterCtrl.getCrimeHead)
router.post('/master/crime-heads', auth, masterCtrl.createCrimeHead)
router.put('/master/crime-heads/:id', auth, masterCtrl.updateCrimeHead)
router.delete('/master/crime-heads/:id', auth, masterCtrl.deleteCrimeHead)

// Crime Subheads
router.get('/master/crime-subheads', auth, masterCtrl.getCrimeSubheads)
router.get('/master/crime-subheads/:id', auth, masterCtrl.getCrimeSubhead)
router.post('/master/crime-subheads', auth, masterCtrl.createCrimeSubhead)
router.put('/master/crime-subheads/:id', auth, masterCtrl.updateCrimeSubhead)
router.delete('/master/crime-subheads/:id', auth, masterCtrl.deleteCrimeSubhead)

// Case Statuses
router.get('/master/case-statuses', auth, masterCtrl.getCaseStatuses)
router.get('/master/case-statuses/:id', auth, masterCtrl.getCaseStatus)
router.post('/master/case-statuses', auth, masterCtrl.createCaseStatus)
router.put('/master/case-statuses/:id', auth, masterCtrl.updateCaseStatus)
router.delete('/master/case-statuses/:id', auth, masterCtrl.deleteCaseStatus)

module.exports = router
