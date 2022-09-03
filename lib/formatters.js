import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import { format as moneyFormat, unformat as moneyUnformat } from '../lib/v-money3.es.js'

dayjs.extend(localizedFormat)

const V_MONEY3_DEFAULT_OPTIONS = {
  // masked: true,
  decimal: ',',
  thousands: '.',
  precision: 2,
  prefix: 'R$ ',
  suffix: '',
  disableNegative: false,
  disabled: false,
  min: null,
  max: null,
  allowBlank: false,
  minimumNumberOfCharacters: 0,
  modelModifiers: {
      number: false,
  },
}

const formatters = {
  parserFormatter (value, options = {}) {
    options = typeof options === 'string' ? { type: options } : options

    switch (options.type) {
      case 'currency':
        return formatters.currencyParser(value, options)
        // break
      case 'cpf':
        return formatters.cpfParser(value, options)
        // break
      case 'cnpj':
        return formatters.cnpjParser(value, options)
        // break
      default:
        return value
    }
  },

  applyFormatter (value, options = {}) {
    options = typeof options === 'string' ? { type: options } : options
    
    switch (options.type) {
      case 'currency':
        return formatters.currency(value, options)
        // break
      case 'date':
        return formatters.date(value, options)
        // break
      case 'datetime':
        return formatters.datetime(value, options)
        // break
      case 'number':
        return formatters.number(value, options)
        // break
      case 'cpf':
        return formatters.cpf(value, options)
        // break
      case 'cnpj':
        return formatters.cnpj(value, options)
        // break
      case 'telefone':
        return formatters.telefone(value, options)
        // break
      case 'timeago':
        return formatters.timeago(value, options)
        // break
      default:
        return value
    }
  },

  cnpj (cnpj) {
    if (!cnpj) return ''
  
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  },

  cnpjParser (cnpj) {
    if (!cnpj) return ''
  
    return cnpj.replace(/\D/g, '').substring(0, 14)
  },

  cpf (cpf) {
    if (!cpf) return ''
  
    return cpf.replace(/[\D]/g, '').replace(/(\d{3}?)(\d{3})(\d{3})(\d{2})(.*)/, '$1.$2.$3-$4')
  },
  
  cpfParser (cpf) {
    if (!cpf) return ''
  
    return cpf.replace(/\D/g, '').substring(0, 11)
  },

  date (value, { format = 'L', language = 'pt-br' }) {
    if (!value) return ''
  
    return dayjs(value).locale(language).format(format)
  },

  datetime (value, { format = 'L LT', language = 'pt-br' }) {
    if (!value) return ''
  
    return dayjs(value).locale(language).format(format)
  },

  currencyParser (value = 0, options = {}) {
    options = Object.assign({}, V_MONEY3_DEFAULT_OPTIONS, options)

    return Number(moneyUnformat(value, options))
  },

  currency (value = 0, options = {}) {
    options = Object.assign({}, V_MONEY3_DEFAULT_OPTIONS, options)

    return moneyFormat(value, options)
  },

  number (value = 0, { language = 'pt-BR' }) {
    value = isNaN(value) ? 0 : value
  
    return new Intl.NumberFormat(language).format(value)
  },

  telefone (value) {
    if (!value) return ''
  
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
  },

  timeago (value) {
    if (!value) return '-'
  
    return dayjs(value).fromNow()
  },
  
}

export default formatters