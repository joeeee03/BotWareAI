// Timezone utilities for country-based date conversion
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

// Country to timezone mapping (major timezone for each country)
export const COUNTRY_TIMEZONES: Record<string, string> = {
  'AR': 'America/Argentina/Buenos_Aires', // Argentina
  'BO': 'America/La_Paz', // Bolivia
  'BR': 'America/Sao_Paulo', // Brasil
  'CL': 'America/Santiago', // Chile
  'CO': 'America/Bogota', // Colombia
  'CR': 'America/Costa_Rica', // Costa Rica
  'CU': 'America/Havana', // Cuba
  'DO': 'America/Santo_Domingo', // República Dominicana
  'EC': 'America/Guayaquil', // Ecuador
  'SV': 'America/El_Salvador', // El Salvador
  'GT': 'America/Guatemala', // Guatemala
  'HN': 'America/Tegucigalpa', // Honduras
  'MX': 'America/Mexico_City', // México
  'NI': 'America/Managua', // Nicaragua
  'PA': 'America/Panama', // Panamá
  'PY': 'America/Asuncion', // Paraguay
  'PE': 'America/Lima', // Perú
  'PR': 'America/Puerto_Rico', // Puerto Rico
  'UY': 'America/Montevideo', // Uruguay
  'VE': 'America/Caracas', // Venezuela
  'ES': 'Europe/Madrid', // España
  'US': 'America/New_York', // Estados Unidos (Este)
  'CA': 'America/Toronto', // Canadá (Este)
  'GB': 'Europe/London', // Reino Unido
  'FR': 'Europe/Paris', // Francia
  'DE': 'Europe/Berlin', // Alemania
  'IT': 'Europe/Rome', // Italia
  'PT': 'Europe/Lisbon', // Portugal
  'JP': 'Asia/Tokyo', // Japón
  'CN': 'Asia/Shanghai', // China
  'IN': 'Asia/Kolkata', // India
  'AU': 'Australia/Sydney', // Australia
  'NZ': 'Pacific/Auckland', // Nueva Zelanda
}

// Country names in Spanish
export const COUNTRY_NAMES: Record<string, string> = {
  'AR': 'Argentina',
  'BO': 'Bolivia',
  'BR': 'Brasil',
  'CL': 'Chile',
  'CO': 'Colombia',
  'CR': 'Costa Rica',
  'CU': 'Cuba',
  'DO': 'República Dominicana',
  'EC': 'Ecuador',
  'SV': 'El Salvador',
  'GT': 'Guatemala',
  'HN': 'Honduras',
  'MX': 'México',
  'NI': 'Nicaragua',
  'PA': 'Panamá',
  'PY': 'Paraguay',
  'PE': 'Perú',
  'PR': 'Puerto Rico',
  'UY': 'Uruguay',
  'VE': 'Venezuela',
  'ES': 'España',
  'US': 'Estados Unidos',
  'CA': 'Canadá',
  'GB': 'Reino Unido',
  'FR': 'Francia',
  'DE': 'Alemania',
  'IT': 'Italia',
  'PT': 'Portugal',
  'JP': 'Japón',
  'CN': 'China',
  'IN': 'India',
  'AU': 'Australia',
  'NZ': 'Nueva Zelanda',
}

// Get list of countries for selection
export function getCountryList(): Array<{ code: string; name: string; timezone: string }> {
  return Object.entries(COUNTRY_NAMES).map(([code, name]) => ({
    code,
    name,
    timezone: COUNTRY_TIMEZONES[code] || 'UTC',
  })).sort((a, b) => a.name.localeCompare(b.name))
}

// Convert UTC date to local timezone
export function convertToTimezone(utcDate: string | Date, countryCode: string): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  const timezone = COUNTRY_TIMEZONES[countryCode] || 'UTC'
  
  // Create a new date in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  
  const parts = formatter.formatToParts(date)
  const partsObj = parts.reduce((acc, part) => {
    acc[part.type] = part.value
    return acc
  }, {} as Record<string, string>)
  
  return new Date(
    `${partsObj.year}-${partsObj.month}-${partsObj.day}T${partsObj.hour}:${partsObj.minute}:${partsObj.second}`
  )
}

// Format message timestamp for display
export function formatMessageTime(utcDate: string | Date, countryCode: string): string {
  const localDate = convertToTimezone(utcDate, countryCode)
  
  // Always show only time in HH:mm format
  return format(localDate, 'HH:mm', { locale: es })
}

// Format conversation last message time
export function formatConversationTime(utcDate: string | Date, countryCode: string): string {
  const localDate = convertToTimezone(utcDate, countryCode)
  
  return formatDistanceToNow(localDate, {
    addSuffix: true,
    locale: es,
  })
}

// Get user's country from localStorage or default
export function getUserCountry(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userCountry') || 'AR' // Default to Argentina
  }
  return 'AR'
}

// Save user's country to localStorage
export function setUserCountry(countryCode: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userCountry', countryCode)
  }
}
