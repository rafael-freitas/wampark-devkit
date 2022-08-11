import moment from 'moment'

export default function parseISODateToDateObject (target) {
  // so aceitar objeto ou array
  if (!['object', 'array'].includes(typeof target)) {
    return target
  }
  for (const i in target) {
    if (Object.prototype.hasOwnProperty.call(target, i)) {
      const element = target[i]
      if (!element) {
        continue
      }
      if (typeof element.$date === 'string') {
        target[i] = new Date(element.$date)
        continue
      }
      if (typeof element === 'string' && moment(element, moment.ISO_8601, true).isValid()) {
        target[i] = new Date(element)
        continue
      }
      parseISODateToDateObject(element)
    }
  }
  return target
}
