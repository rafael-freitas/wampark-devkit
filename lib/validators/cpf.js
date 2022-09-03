// import { leadingZeros } from '../strings'

/*
*   Gerador e Validador de CPF v4.0.0-beta.0
*   http://tiagoporto.github.io/gerador-validador-cpf
*   Copyright (c) 2014-2019 Tiago Porto (http://tiagoporto.com)
*   Released under the MIT license
*/

/**
 * https://www.devmedia.com.br/validar-cpf-com-javascript/23916
 *
 * Para o nosso exemplo vamos usar o CPF fictício 123.456.789-09
Vamos começar a validação pelo primeiro dígito verificador, distribuindo os nove primeiros dígitos do CPF.
Logo abaixo, da esquerda para a direita, vamos colocar os números decrescentes de 10 à 2.
Então vamos multiplicar as colunas, colocando o resutado de cada uma, em uma terceira linha, conforme mostrado a seguir:

Nove primeiros dígitos antes do traço	1	2	3	4	5	6	7	8	9
Valor de 10 até 2 para multiplicar	10	9	8	7	6	5	4	3	2
Resultado da multiplicação	10	18	24	28	30	30	28	24	18
Agora somamos os resultados obtidos: 10 + 18 + 24 + 28 + 30 + 30 + 28 + 24 + 18 = 210

OBS.: essa parte do cálculo é que se diferencia nos sites em que o algoritmo ficou obsoleto
Pegamos o valor encontrado (210) multiplicamos por 10 e então dividimos por 11. Vamos considerar para o quociente desta divisão apenas o valor inteiro. O resto da divisão será responsável pelo cálculo do primeiro dígito verificador:

(210 * 10) / 11 = 190
Resto = 10

Se o valor do resto da divisão for igual a 10 ou 11, este valor será considerado automaticamente como 0 (zero), como é o caso de nosso exemplo.
Então comparamos se o resto obtido é igual ao primeiro número do dígito verificador, caso não seja igual, o CPF é inválido e os passos seguintes não precisam ser feitos. No nosso caso é igual!

Resto encontrado	Primeiro dígito verificador
0	0	Resultados iguais!!
Caso a condição acima seja verdadeira então repetimos os passos verificando agora os dez primeiros dígitos (incluindo o primeiro dítigo verificador)

Dez primeiros dígitos	1	2	3	4	5	6	7	8	9	0
Valor de 11 até 2 para multiplicar	11	10	9	8	7	6	5	4	3	2
Resultado da multiplicação	11	20	27	32	35	36	35	32	27	0
Soma dos resultados obtidos: 11 + 20 + 27 + 32 + 35 + 36 + 35 + 32 + 27 + 0 = 255

Pegamos o valor encontrado (255) multiplicamos por 10 e então dividimos por 11. Vamos considerar para o quociente desta divisão apenas o valor inteiro. O resto da divisão será responsável pelo cálculo do segundo dígito verificador:

(255 * 10) / 11 = 231
Resto = 9

Se o valor do resto dessa segunda divisão for igual a 10 ou 11, este valor será considerado automaticamente como 0 (zero), o que não é o caso de nosso exemplo.
Então comparamos se o resto obtido é igual ao segundo numeral do dígito verificador, caso não seja igual, o CPF é inválido. No nosso caso é igual!

Resto encontrado	Segundo dígito verificador
9	9	Resultados iguais!!
Caso a condição acima seja verdadeira então o CPF é válido.
 * @param {String|Number} value
 */

const BLACKLIST = [
  '00000000000',
  '11111111111',
  '22222222222',
  '33333333333',
  '44444444444',
  '55555555555',
  '66666666666',
  '77777777777',
  '88888888888',
  '99999999999',
  ''
]

function validarCPF (value) {
  let soma = 0
  let resto

  if (typeof value !== 'string' && typeof value !== 'number') {
    console.warn('[validarCPF] Unsupported value. Only String or Number')
    return false
  }

  value = String(value).replace(/\D/g, '')
  // Elimina CPF invalidos conhecidos
  if (BLACKLIST.includes(value) || value.length < 8) {
    return false
  }

  for (let i = 1; i <= 9; i++) {
    soma = soma + parseInt(value.substring(i - 1, i)) * (11 - i)
  }
  resto = (soma * 10) % 11

  if ((resto === 10) || (resto === 11)) resto = 0
  if (resto !== parseInt(value.substring(9, 10))) return false

  soma = 0
  for (let i = 1; i <= 10; i++) {
    soma = soma + parseInt(value.substring(i - 1, i)) * (12 - i)
  }
  resto = (soma * 10) % 11

  if ((resto === 10) || (resto === 11)) resto = 0
  if (resto !== parseInt(value.substring(10, 11))) return false
  return true
}

/* eslint no-console: ["error", { allow: ["error", "warn"] }] */
const formatOptions = {
  digits: 'digits',
  checker: 'checker'
}

const calcFirstChecker = function calcFirstChecker (firstNineDigits) {
  var sum = null

  for (var j = 0; j < 9; ++j) {
    sum += Number(firstNineDigits.toString().charAt(j)) * (10 - j)
  }

  var lastSumChecker1 = sum % 11
  var checker1 = lastSumChecker1 < 2 ? 0 : 11 - lastSumChecker1
  return checker1
}

const calcSecondChecker = function calcSecondChecker (cpfWithChecker1) {
  var sum = null
  const cpfCheckerLength = String(cpfWithChecker1).length

  for (var k = 0; k < cpfCheckerLength; ++k) {
    sum += Number(cpfWithChecker1.toString().charAt(k)) * (11 - k)
  }

  var lastSumChecker2 = sum % 11
  var checker2 = lastSumChecker2 < 2 ? 0 : 11 - lastSumChecker2
  return checker2
}

const formatCPF = function formatCPF (value, formatter) {
  var digitsSeparator = '.'
  var checkersSeparator = '-'

  if (formatter === 'digits') {
    digitsSeparator = ''
    checkersSeparator = ''
  } else if (formatter === 'checker') {
    digitsSeparator = ''
    checkersSeparator = '-'
  }

  if (value.length > 11) {
    return console.error('The value contains error. Has more than 11 digits.')
  } else if (value.length < 11) {
    return console.error('The value contains error. Has fewer than 11 digits.')
  } else {
    return value.slice(0, 3) + digitsSeparator + value.slice(3, 6) + digitsSeparator + value.slice(6, 9) + checkersSeparator + value.slice(9, 11)
  }
}
/**
 * generate a valid CPF number
 * @param  {string} [formatOption]   Formatting option
 * @return {string}                  Valid and formatted CPF
 */

const generate = function generate (formatOption) {
  var firstNineDigits = '' // Generating the first CPF's 9 digits

  for (var i = 0; i < 9; ++i) {
    firstNineDigits += String(Math.floor(Math.random() * 9))
  }

  var checker1 = calcFirstChecker(Number(firstNineDigits))
  var generatedCPF = firstNineDigits + checker1 + calcSecondChecker(Number(firstNineDigits + checker1))
  return formatCPF(generatedCPF, formatOption)
}
/**
 * validate CPF numbers
 * @param  {(string|number)} value  CPF for validation
 * @return {boolean}                True = valid || False = invalid
 */

const validate = function validate (value) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    console.warn('[CPF validate] Unsupported value')
    return false
  }

  var cleanCPF = String(value).replace(/\D/g, '')
  // Elimina CPF invalidos conhecidos
  if (BLACKLIST.includes(cleanCPF) || cleanCPF.length < 8) {
    return false
  }
  var firstNineDigits = cleanCPF.substring(0, 9)
  var checker = cleanCPF.substring(9, 11)

  for (var i = 0; i < 10; i++) {
    if ('' + firstNineDigits + checker === Array(12).join(String(i))) {
      return false
    }
  }

  var checker1 = calcFirstChecker(Number(firstNineDigits))
  var checker2 = calcSecondChecker(Number('' + firstNineDigits + checker1))
  return checker.toString() === checker1.toString() + checker2.toString()
}
/**
 * format CPF numbers
 * @param  {(string|number)} value  Formatting value
 * @param  {string} [formatOption]  Formatting option
 *
 * @return {string}                 Formatted CPF || error message
 */

const format = function format (value, formatOption) {
  if (!value) {
    return
  }

  var getCPF = String(value).replace(/[^\d]/g, '')
  return formatCPF(getCPF, formatOption)
}

export default { formatOptions, generate, validate: validarCPF, format }
