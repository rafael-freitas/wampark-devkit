import createMongoFieldSearchQuery from './createMongoFieldSearchQuery.js'
import { escapeRegex } from './createMongoFieldSearchQuery.js'
import mongoose from 'mongoose'

const { ObjectId } = mongoose.Types

/* eslint-disable */
/**
 * Criar uma query para filtro de um campo especifico para ser usado em consultas no MongoDB
 * @param {String} field 
 * @param {String} text 
 */
const generator = {
    createQueryFromTextFilter (filter) {
        const { operator, value, field } = filter
    
        let expression
    
        switch (operator) {
            case 1: // igual a
                expression = { $eq: value }
                break
            case 2: // comeca com
                expression = { $regex: `^${value}`, $options: 'i' }
                break
            case 3: // termina com
                expression = { $regex: `${value}$`, $options: 'i' }
                break
            case 'date-range': // data
                expression = { $gte: new Date(value[0]), $lt: new Date(value[1]) }
                break
            case 'objectid': // Mongo ObjectId
                expression = { $eq: ObjectId(value) }
                break
            default:
                // contem
                return createMongoFieldSearchQuery(field, value)
        }
    
        return { [field]: expression }
    },

    createMongoRegexQuery (text = '') {
        const $and = []
        let texts = String(text).split(' ')
        for (const str of texts) {
            $and.push(escapeRegex(str))
        }
        return {
            "$regex": $and.join('|'),
            "$options": "i"
        }
    }
}
export default generator