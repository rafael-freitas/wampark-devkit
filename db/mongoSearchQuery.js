/* eslint-disable */
/**
 * Criar uma query para filtro de um campo especifico para ser usado em consultas no MongoDB
 * @param {String} field 
 * @param {String} text 
 */
export default function createMongoSearchQuery (field = '', text = '') {
    const $and = []
    const query = { $and }
    let texts = String(text).split(' ')
    for (const str of texts) {
        let cond = {
            [field]: {
                $regex: escapeRegex(str), $options: 'i'
            }
        }
        $and.push(cond)
    }
    return query
}

export function escapeRegex (text) {
    let needles = String(text).split(' ')
    return needles.map(x => {
        x = x.replace(/[-[\]{}()*+?.,\\^$|#\s]/ig, "\\$&")
        return x
        // return `(?=.*${x})`
    })
    // .concat(['.*'])
    .join(' ')
    // return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/ig, "\\$&");
}