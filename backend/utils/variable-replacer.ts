/**
 * Utility to replace variables in messages with customer data
 * Variables format: {nombre}, {telefono}
 */

interface CustomerData {
  customer_name?: string | null
  customer_phone?: string | null
}

/**
 * Replace variables in message text with actual customer data
 * @param message - Message text with variables like {nombre}, {telefono}
 * @param customerData - Customer data object
 * @returns Message with variables replaced
 */
export function replaceVariables(message: string, customerData: CustomerData): string {
  if (!message) return message

  let result = message

  // Replace {nombre} with customer_name
  if (customerData.customer_name) {
    result = result.replace(/\{nombre\}/gi, customerData.customer_name)
  } else {
    // If no name, replace with "Cliente"
    result = result.replace(/\{nombre\}/gi, "Cliente")
  }

  // Replace {telefono} with customer_phone
  if (customerData.customer_phone) {
    result = result.replace(/\{telefono\}/gi, customerData.customer_phone)
  } else {
    // If no phone, keep the variable or replace with empty
    result = result.replace(/\{telefono\}/gi, "")
  }

  return result
}
