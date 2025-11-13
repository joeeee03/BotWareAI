'use client'

import Image from 'next/image'
import { useState } from 'react'

export function CompanyLogo() {
  const [logoError, setLogoError] = useState(false)

  // Intenta cargar el logo. Si no existe, muestra un logo por defecto
  const logoPath = '/logos/company-logo.png'

  return (
    <div className="flex items-center justify-center mb-6">
      <div className="relative w-24 h-24 sm:w-28 sm:h-28">
        {!logoError ? (
          <Image
            src={logoPath}
            alt="Company Logo"
            width={112}
            height={112}
            className="w-full h-full object-contain drop-shadow-lg rounded-lg"
            priority
            onError={() => setLogoError(true)}
          />
        ) : (
          // Logo por defecto si no encuentra la imagen
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center drop-shadow-lg">
            <svg
              className="w-12 h-12 sm:w-16 sm:h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompanyLogo
