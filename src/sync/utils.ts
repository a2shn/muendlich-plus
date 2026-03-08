const SNAKE_CASE_REGEX = /[A-Z]/g
const CAMEL_CASE_REGEX = /_([a-z])/g

// Recursively converts object keys to snake_case
export function toSnakeCase(obj: any): any {
  if (Array.isArray(obj))
    return obj.map(toSnakeCase)
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(SNAKE_CASE_REGEX, letter => `_${letter.toLowerCase()}`)
      acc[snakeKey] = toSnakeCase(obj[key])
      return acc
    }, {} as any)
  }
  return obj
}

// Recursively converts object keys to camelCase
export function toCamelCase(obj: any): any {
  if (Array.isArray(obj))
    return obj.map(toCamelCase)
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(CAMEL_CASE_REGEX, (_, letter) => letter.toUpperCase())
      acc[camelKey] = toCamelCase(obj[key])
      return acc
    }, {} as any)
  }
  return obj
}
