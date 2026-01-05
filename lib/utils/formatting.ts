/**
 * Formatting Utilities
 * Helper functions for displaying dates and numbers
 */

import { format, formatDistance, isValid } from 'date-fns'

/**
 * Format a date for display
 * Default: "Aug 18, 2024"
 */
export function formatDate(
  date: Date | string,
  formatStr: string = 'MMM dd, yyyy'
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (!isValid(d)) {
    return 'Invalid date'
  }

  return format(d, formatStr)
}

/**
 * Format a date for input fields
 * Returns: "2024-08-18"
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (!isValid(d)) {
    return ''
  }

  return format(d, 'yyyy-MM-dd')
}

/**
 * Format date as relative time
 * Examples: "2 days ago", "in 3 hours"
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (!isValid(d)) {
    return 'Invalid date'
  }

  return formatDistance(d, new Date(), { addSuffix: true })
}

/**
 * Format number with commas
 * 1234567 -> "1,234,567"
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

/**
 * Format percentage
 * 0.75 -> "75%"
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Get initials from name
 * "Áron Lukács" -> "ÁL"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
