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
// This function returns a Date object that when displayed in the LOCAL browser timezone
// will show the same time as it would in the target country's timezone
// WARNING: This is a bit of a hack - the Date object is still in UTC, but the local time
// values (getHours, getMinutes, etc) will be correct for the target timezone
export function convertToTimezone(utcDate: string | Date, countryCode: string): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  const timezone = COUNTRY_TIMEZONES[countryCode] || 'UTC'
  
  // Get the date components in the target timezone
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
  
  // Create a date string in the local timezone of the browser
  // This creates a date that represents the target timezone's time
  // interpreted as if it were in the browser's local timezone
  const localDateStr = `${partsObj.year}-${partsObj.month}-${partsObj.day}T${partsObj.hour}:${partsObj.minute}:${partsObj.second}`
  return new Date(localDateStr)
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

// Get date string in YYYY-MM-DD format for a given date and timezone
function getDateString(date: Date, countryCode: string): string {
  const timezone = COUNTRY_TIMEZONES[countryCode] || 'UTC'
  
  // Use Intl to get the date components in the target timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  
  // Format returns YYYY-MM-DD in the target timezone
  const formatted = formatter.format(date)
  return formatted
}

// Check if two dates are the same day in the given timezone
export function isSameDay(date1: Date, date2: Date): boolean {
  // Comparar año, mes y día directamente
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

// Check if two UTC dates are the same day when converted to a specific timezone
export function isSameDayInTimezone(utcDate1: string | Date, utcDate2: string | Date, countryCode: string): boolean {
  const date1 = typeof utcDate1 === 'string' ? new Date(utcDate1) : utcDate1
  const date2 = typeof utcDate2 === 'string' ? new Date(utcDate2) : utcDate2
  const timezone = COUNTRY_TIMEZONES[countryCode] || 'UTC'
  
  // Get date parts for first date in target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
  
  const parts1 = formatter.formatToParts(date1)
  const year1 = parseInt(parts1.find(p => p.type === 'year')?.value || '0')
  const month1 = parseInt(parts1.find(p => p.type === 'month')?.value || '0')
  const day1 = parseInt(parts1.find(p => p.type === 'day')?.value || '0')
  
  const parts2 = formatter.formatToParts(date2)
  const year2 = parseInt(parts2.find(p => p.type === 'year')?.value || '0')
  const month2 = parseInt(parts2.find(p => p.type === 'month')?.value || '0')
  const day2 = parseInt(parts2.find(p => p.type === 'day')?.value || '0')
  
  const isSame = year1 === year2 && month1 === month2 && day1 === day2
  
  console.log('[isSameDayInTimezone] Comparing:', {
    date1: typeof utcDate1 === 'string' ? utcDate1 : date1.toISOString(),
    date2: typeof utcDate2 === 'string' ? utcDate2 : date2.toISOString(),
    inTimezone: `${year1}-${month1}-${day1} vs ${year2}-${month2}-${day2}`,
    isSame,
    timezone
  })
  
  return isSame
}

// Format date separator like WhatsApp (Hoy, Ayer, or formatted date)
export function formatDateSeparator(utcDate: string | Date, countryCode: string): string {
  // Parse the UTC date from the database
  const messageDate = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  const timezone = COUNTRY_TIMEZONES[countryCode] || 'UTC'
  
  // Get current UTC time
  const nowUtc = new Date()
  
  // Convert message date to target timezone and extract date parts
  const messageFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
  const messageParts = messageFormatter.formatToParts(messageDate)
  const messageYear = parseInt(messageParts.find(p => p.type === 'year')?.value || '0')
  const messageMonth = parseInt(messageParts.find(p => p.type === 'month')?.value || '0')
  const messageDay = parseInt(messageParts.find(p => p.type === 'day')?.value || '0')
  
  // Convert current UTC time to target timezone and extract date parts
  const todayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
  const todayParts = todayFormatter.formatToParts(nowUtc)
  const todayYear = parseInt(todayParts.find(p => p.type === 'year')?.value || '0')
  const todayMonth = parseInt(todayParts.find(p => p.type === 'month')?.value || '0')
  const todayDay = parseInt(todayParts.find(p => p.type === 'day')?.value || '0')
  
  console.log('[DATE-SEPARATOR] Debug:', { 
    utcInput: typeof utcDate === 'string' ? utcDate : utcDate.toISOString(),
    messageDateUTC: messageDate.toISOString(),
    nowUTC: nowUtc.toISOString(),
    messageInTimezone: `${messageYear}-${String(messageMonth).padStart(2, '0')}-${String(messageDay).padStart(2, '0')}`,
    todayInTimezone: `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`,
    timezone,
    countryCode
  })
  
  // Check if message is from today (same year, month, and day)
  if (messageYear === todayYear && messageMonth === todayMonth && messageDay === todayDay) {
    console.log('[DATE-SEPARATOR] ✅ Es HOY')
    return 'Hoy'
  }
  
  // Calculate yesterday in UTC, then convert to target timezone
  const yesterdayUtc = new Date(nowUtc.getTime() - 24 * 60 * 60 * 1000)
  const yesterdayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
  const yesterdayParts = yesterdayFormatter.formatToParts(yesterdayUtc)
  const yesterdayYear = parseInt(yesterdayParts.find(p => p.type === 'year')?.value || '0')
  const yesterdayMonth = parseInt(yesterdayParts.find(p => p.type === 'month')?.value || '0')
  const yesterdayDay = parseInt(yesterdayParts.find(p => p.type === 'day')?.value || '0')
  
  console.log('[DATE-SEPARATOR] Yesterday check:', {
    yesterdayInTimezone: `${yesterdayYear}-${String(yesterdayMonth).padStart(2, '0')}-${String(yesterdayDay).padStart(2, '0')}`,
    matches: messageYear === yesterdayYear && messageMonth === yesterdayMonth && messageDay === yesterdayDay
  })
  
  // Check if message is from yesterday (same year, month, and day)
  if (messageYear === yesterdayYear && messageMonth === yesterdayMonth && messageDay === yesterdayDay) {
    console.log('[DATE-SEPARATOR] ✅ Es AYER')
    return 'Ayer'
  }
  
  // For older dates, format as: "Sáb 9 nov" or "Lun 21 oct"
  console.log('[DATE-SEPARATOR] ✅ Es fecha antigua, formateando...')
  const displayFormatter = new Intl.DateTimeFormat('es-ES', {
    timeZone: timezone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  
  const formatted = displayFormatter.format(messageDate)
  // Remove commas and periods: "sáb., 9 nov" -> "sáb 9 nov"
  return formatted.replace(/\.,/g, '').replace(/\./g, '').replace(',', '')
}
