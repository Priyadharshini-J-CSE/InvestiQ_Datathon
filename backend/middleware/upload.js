const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
})

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.mp4']
  const ext = path.extname(file.originalname).toLowerCase()
  cb(null, allowed.includes(ext))
}

module.exports = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } })
