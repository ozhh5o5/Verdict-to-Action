export function parseDeadlineText(deadlineText: string, baseDate: Date = new Date()): Date | null {
  const lowerText = deadlineText.toLowerCase()
  
  const daysMatch = lowerText.match(/(\d+)\s+days?/)
  if (daysMatch) {
    const days = parseInt(daysMatch[1])
    const result = new Date(baseDate)
    result.setDate(result.getDate() + days)
    return result
  }
  
  const weeksMatch = lowerText.match(/(\d+)\s+weeks?/)
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1])
    const result = new Date(baseDate)
    result.setDate(result.getDate() + weeks * 7)
    return result
  }
  
  const monthsMatch = lowerText.match(/(\d+)\s+months?/)
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1])
    const result = new Date(baseDate)
    result.setMonth(result.getMonth() + months)
    return result
  }
  
  const dateMatch = deadlineText.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i)
  if (dateMatch) {
    const day = parseInt(dateMatch[1])
    const monthStr = dateMatch[2]
    const year = parseInt(dateMatch[3])
    const monthMap: { [key: string]: number } = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    }
    return new Date(year, monthMap[monthStr.toLowerCase()], day)
  }
  
  const simpleDateMatch = deadlineText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (simpleDateMatch) {
    const day = parseInt(simpleDateMatch[1])
    const month = parseInt(simpleDateMatch[2]) - 1
    const year = parseInt(simpleDateMatch[3])
    return new Date(year, month, day)
  }
  
  return null
}

export function isOverdue(deadline: Date | null): boolean {
  if (!deadline) return false
  return deadline < new Date()
}

export function daysUntil(deadline: Date | null): number | null {
  if (!deadline) return null
  const diff = deadline.getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function formatDeadline(deadline: Date | null): string {
  if (!deadline) return 'No deadline'
  
  const days = daysUntil(deadline)
  if (days === null) return 'No deadline'
  
  if (days < 0) {
    return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`
  } else if (days === 0) {
    return 'Due today'
  } else if (days === 1) {
    return 'Due tomorrow'
  } else if (days <= 7) {
    return `${days} days remaining`
  } else if (days <= 30) {
    const weeks = Math.floor(days / 7)
    return `${weeks} week${weeks === 1 ? '' : 's'} remaining`
  } else {
    const months = Math.floor(days / 30)
    return `${months} month${months === 1 ? '' : 's'} remaining`
  }
}
