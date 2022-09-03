export default {
  validate (value) {
    const cnpj = value.replace(/[^\d]+/g, '')
  
    // Valida a quantidade de caracteres
    if (cnpj.length !== 14) {
      return false
    }
  
    // Elimina inválidos com todos os caracteres iguais
    if (/^(\d)\1+$/.test(cnpj)) {
      return false
    }
  
    // Cáculo de validação
    const t = cnpj.length - 2
    const d = cnpj.substring(t)
    const d1 = parseInt(d.charAt(0))
    const d2 = parseInt(d.charAt(1))
  
    const calc = x => {
      const n = cnpj.substring(0, x)
      let y = x - 7
      let s = 0
      let r = 0
  
      for (let i = x; i >= 1; i--) {
        s += n.charAt(x - i) * y--
        if (y < 2) {
          y = 9
        }
      }
  
      r = 11 - s % 11
      return r > 9 ? 0 : r
    }
  
    return calc(t) === d1 && calc(t + 1) === d2
  }  
}