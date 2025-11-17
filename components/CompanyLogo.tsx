'use client'

import Image from 'next/image'
import { useState } from 'react'

export function CompanyLogo() {
  const [logoError, setLogoError] = useState(false)

  // Logo correcto del proyecto
  const logoPath = '/icon-light-32x32.png'

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
          // Logo por defecto si no encuentra la imagen - mostrar logo de Botware
          <Image
            src="/icon-light-32x32.png"
            alt="Botware AI Logo"
            width={112}
            height={112}
            className="w-full h-full object-contain drop-shadow-lg"
            style={{ backgroundColor: 'transparent' }}
            priority
          />
        )}
      </div>
    </div>
  )
}

export default CompanyLogo
