import { Zap, Shield, Github, Twitter } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-card mt-auto">
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-white">Inverti<span className="text-primary">Q</span></span>
            <span className="text-gray-600 text-sm ml-2">Karnataka State Police</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Shield size={12} className="text-primary" />
            <span>Classified System – Authorized Personnel Only</span>
          </div>
          <p className="text-xs text-gray-600">© 2024 InvertiQ. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
