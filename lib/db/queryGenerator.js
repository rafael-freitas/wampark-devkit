import createMongoFieldSearchQuery from './createMongoFieldSearchQuery.js'

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
            default:
                // contem
                return createMongoFieldSearchQuery(field, value)
        }
    
        return { [field]: expression }
    }
}
export default generator