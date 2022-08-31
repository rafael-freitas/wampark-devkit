/* eslint-disable */
/**
 * Criar uma query para filtro de um campo especifico para ser usado em consultas no MongoDB
 * @param {String} field 
 * @param {String} text 
 */
 export function createMongoFieldSearchQueryAnd (field = '', text = '') {
    return { $and: createMongoFieldSearchQuery(field, text) }
}
export default function createMongoFieldSearchQuery (field = '', text = '') {
    const $and = []
    let texts = String(text).split(' ')
    for (const str of texts) {
        let cond = {
            [field]: {
                $regex: diacriticSensitiveRegex(escapeRegex(str)), $options: 'i'
            }
        }
        $and.push(cond)
    }
    return $and
}

export function escapeRegex (text) {
    let needles = String(text).split(' ')
    return needles.map(x => {
        x = x.replace(/[-[\]{}()*+?.,\\^$|#\s]/ig, "\\$&")
        return x
    })
    .join(' ')
}

export function diacriticSensitiveRegex(string = '') {
    return string.replace(/a/g, '[a,á,à,ä,â]')
       .replace(/e/g, '[e,é,ë,è]')
       .replace(/i/g, '[i,í,ï,ì]')
       .replace(/o/g, '[o,ó,ö,ò]')
       .replace(/u/g, '[u,ü,ú,ù]')
       .replace(/c/g, '[c,ç]')
}