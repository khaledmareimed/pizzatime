/**
 * Number Utilities for Dashboard
 * 
 * Ensures all dashboard inputs and displays use English/Western Arabic numerals (0123456789)
 * instead of Indian Arabic numerals (٠١٢٣٤٥٦٧٨٩)
 */

// Map of Arabic-Indic digits to Western Arabic digits
const ARABIC_TO_ENGLISH_MAP: { [key: string]: string } = {
  '٠': '0',
  '١': '1', 
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9'
}

// Map of Western Arabic digits to Arabic-Indic digits (for reverse conversion if needed)
const ENGLISH_TO_ARABIC_MAP: { [key: string]: string } = {
  '0': '٠',
  '1': '١',
  '2': '٢', 
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩'
}

/**
 * Convert Arabic-Indic numerals to Western Arabic numerals
 * @param value - String containing Arabic-Indic numerals
 * @returns String with Western Arabic numerals
 */
export function convertArabicToEnglishNumbers(value: string): string {
  if (!value) return value
  
  return value.replace(/[٠-٩]/g, (match) => ARABIC_TO_ENGLISH_MAP[match] || match)
}

/**
 * Convert Western Arabic numerals to Arabic-Indic numerals
 * @param value - String containing Western Arabic numerals
 * @returns String with Arabic-Indic numerals
 */
export function convertEnglishToArabicNumbers(value: string): string {
  if (!value) return value
  
  return value.replace(/[0-9]/g, (match) => ENGLISH_TO_ARABIC_MAP[match] || match)
}

/**
 * Format number input value to ensure English numerals
 * @param value - Input value (string or number)
 * @returns Formatted string with English numerals only
 */
export function formatNumberInput(value: string | number): string {
  if (typeof value === 'number') {
    return value.toString()
  }
  
  if (!value) return ''
  
  // Convert Arabic numerals to English
  const englishValue = convertArabicToEnglishNumbers(value.toString())
  
  // Remove any non-numeric characters except decimal point and minus sign
  const cleanValue = englishValue.replace(/[^\d.-]/g, '')
  
  return cleanValue
}

/**
 * Format currency input to ensure English numerals
 * @param value - Currency value
 * @returns Formatted currency string with English numerals
 */
export function formatCurrencyInput(value: string | number): string {
  const numericValue = formatNumberInput(value)
  
  // Parse as float and format to 2 decimal places if it's a valid number
  const parsed = parseFloat(numericValue)
  if (!isNaN(parsed)) {
    return parsed.toFixed(2)
  }
  
  return numericValue
}

/**
 * Format integer input to ensure English numerals
 * @param value - Integer value
 * @returns Formatted integer string with English numerals
 */
export function formatIntegerInput(value: string | number): string {
  const numericValue = formatNumberInput(value)
  
  // Parse as integer
  const parsed = parseInt(numericValue)
  if (!isNaN(parsed)) {
    return parsed.toString()
  }
  
  return numericValue.replace(/\D/g, '') // Remove all non-digits
}

/**
 * Format phone number input to ensure English numerals
 * @param value - Phone number value
 * @returns Formatted phone number with English numerals
 */
export function formatPhoneInput(value: string): string {
  if (!value) return ''
  
  // Convert Arabic numerals to English
  const englishValue = convertArabicToEnglishNumbers(value)
  
  // Keep only digits and common phone number characters
  return englishValue.replace(/[^\d+\-\s()]/g, '')
}

/**
 * Create professional number input event handler
 * Uses text input with numeric keyboard on mobile, no spinners on desktop
 * @param onChange - Original onChange handler
 * @param formatter - Optional custom formatter function
 * @returns Enhanced onChange handler
 */
export function createNumberInputHandler(
  onChange: (value: string) => void,
  formatter: (value: string) => string = formatNumberInput
) {
  return (event: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatter(event.target.value)
    
    // Update the input value immediately to show English numerals
    event.target.value = formattedValue
    
    onChange(formattedValue)
  }
}

/**
 * Professional number input props for consistent styling
 * @param value - Current input value
 * @param onChange - Change handler
 * @param placeholder - Placeholder text
 * @param formatter - Optional formatter function
 * @returns Input props object
 */
export function createProfessionalNumberInputProps(
  value: string | number,
  onChange: (value: string) => void,
  placeholder: string = "0",
  formatter: (value: string) => string = formatNumberInput
) {
  return {
    type: "text" as const,
    inputMode: "numeric" as const,
    value: formatter(value.toString()),
    onChange: createNumberInputHandler(onChange, formatter),
    placeholder,
    autoComplete: "off",
    spellCheck: false
  }
}

/**
 * Professional currency input props
 */
export function createCurrencyInputProps(
  value: string | number,
  onChange: (value: string) => void,
  placeholder: string = "0.00"
) {
  return createProfessionalNumberInputProps(value, onChange, placeholder, formatCurrencyInput)
}

/**
 * Professional integer input props
 */
export function createIntegerInputProps(
  value: string | number,
  onChange: (value: string) => void,
  placeholder: string = "0"
) {
  return createProfessionalNumberInputProps(value, onChange, placeholder, formatIntegerInput)
}

/**
 * Hook for number input with English numeral enforcement
 * @param initialValue - Initial value
 * @param formatter - Optional custom formatter
 * @returns [value, setValue, inputHandler]
 */
export function useNumberInput(
  initialValue: string | number = '',
  formatter: (value: string) => string = formatNumberInput
): [string, (value: string) => void, (event: React.ChangeEvent<HTMLInputElement>) => void] {
  const [value, setValue] = React.useState(() => formatter(initialValue.toString()))
  
  const inputHandler = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const formattedValue = formatter(event.target.value)
      setValue(formattedValue)
    },
    [formatter]
  )
  
  return [value, setValue, inputHandler]
}

/**
 * Format display numbers to ensure English numerals in UI
 * @param value - Number to display
 * @param options - Intl.NumberFormat options
 * @returns Formatted string with English numerals
 */
export function formatDisplayNumber(
  value: number | string,
  options: Intl.NumberFormatOptions = {}
): string {
  const numValue = typeof value === 'string' ? parseFloat(convertArabicToEnglishNumbers(value)) : value
  
  if (isNaN(numValue)) return '0'
  
  // Force English numerals in formatting
  const formatted = new Intl.NumberFormat('en-US', {
    ...options,
    numberingSystem: 'latn' // Ensure Western Arabic numerals
  }).format(numValue)
  
  return formatted
}

// React import for hooks
import React from 'react'

export default {
  convertArabicToEnglishNumbers,
  convertEnglishToArabicNumbers,
  formatNumberInput,
  formatCurrencyInput,
  formatIntegerInput,
  formatPhoneInput,
  createNumberInputHandler,
  useNumberInput,
  formatDisplayNumber
}