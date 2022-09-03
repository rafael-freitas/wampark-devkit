var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
// var BigInt = window.BigInt

const RESTRICTED_CHARACTERS = ["+", "-"];
const RESTRICTED_OPTIONS = ["decimal", "thousands", "prefix", "suffix"];
function fixed(precision) {
  return Math.max(0, Math.min(precision, 1e3));
}
function numbersToCurrency(numbers, precision) {
  numbers = numbers.padStart(precision + 1, "0");
  return precision === 0 ? numbers : `${numbers.slice(0, -precision)}.${numbers.slice(-precision)}`;
}
function onlyNumbers(input) {
  input = input ? input.toString() : "";
  return input.replace(/\D+/g, "") || "0";
}
function addThousandSeparator(integer, separator) {
  return integer.replace(/(\d)(?=(?:\d{3})+\b)/gm, `$1${separator}`);
}
function joinIntegerAndDecimal(integer, decimal, separator) {
  return decimal ? integer + separator + decimal : integer;
}
function validateRestrictedInput(value, caller) {
  if (RESTRICTED_CHARACTERS.includes(value)) {
    console.warn(`v-money3 "${caller}" property don't accept "${value}" as a value.`);
    return false;
  }
  if (/\d/g.test(value)) {
    console.warn(`v-money3 "${caller}" property don't accept "${value}" (any number) as a value.`);
    return false;
  }
  return true;
}
function validateRestrictedOptions(opt) {
  for (const target of RESTRICTED_OPTIONS) {
    const isValid = validateRestrictedInput(opt[target], target);
    if (!isValid) {
      return false;
    }
  }
  return true;
}
function filterOptRestrictions(opt) {
  for (const option of RESTRICTED_OPTIONS) {
    opt[option] = opt[option].replace(/\d+/g, "");
    for (const character of RESTRICTED_CHARACTERS) {
      opt[option] = opt[option].replaceAll(character, "");
    }
  }
  return opt;
}
function guessFloatPrecision(string) {
  const total = string.length;
  const index2 = string.indexOf(".");
  return total - (index2 + 1);
}
function removeLeadingZeros(string) {
  return string.replace(/^(-?)0+(?!\.)(.+)/, "$1$2");
}
function isValidInteger(str) {
  return /^-?[\d]+$/g.test(str);
}
function isValidFloat(str) {
  return /^-?[\d]+(\.[\d]+)$/g.test(str);
}
function replaceAt(str, index2, chr) {
  if (index2 > str.length - 1)
    return str;
  return str.substring(0, index2) + chr + str.substring(index2 + 1);
}
function round(string, precision) {
  const diff = precision - guessFloatPrecision(string);
  if (diff >= 0) {
    return string;
  }
  let firstPiece = string.slice(0, diff);
  const lastPiece = string.slice(diff);
  if (firstPiece.charAt(firstPiece.length - 1) === ".") {
    firstPiece = firstPiece.slice(0, -1);
  }
  if (parseInt(lastPiece.charAt(0), 10) >= 5) {
    for (let i = firstPiece.length - 1; i >= 0; i -= 1) {
      const char = firstPiece.charAt(i);
      if (char !== "." && char !== "-") {
        const newValue = parseInt(char, 10) + 1;
        if (newValue < 10) {
          return replaceAt(firstPiece, i, newValue);
        }
        firstPiece = replaceAt(firstPiece, i, "0");
      }
    }
    return `1${firstPiece}`;
  }
  return firstPiece;
}
function debug({ debug: debug2 = false }, ...args) {
  if (debug2)
    console.log(...args);
}
var defaults = {
  debug: false,
  masked: false,
  prefix: "",
  suffix: "",
  thousands: ",",
  decimal: ".",
  precision: 2,
  disableNegative: false,
  disabled: false,
  min: null,
  max: null,
  allowBlank: false,
  minimumNumberOfCharacters: 0,
  modelModifiers: {
    number: false
  },
  shouldRound: true
};
class BigNumber {
  constructor(number) {
    __publicField(this, "number", BigInt(0));
    __publicField(this, "decimal", 0);
    this.setNumber(number);
  }
  getNumber() {
    return this.number;
  }
  getDecimalPrecision() {
    return this.decimal;
  }
  setNumber(number) {
    this.decimal = 0;
    if (typeof number === "bigint") {
      this.number = number;
    } else if (typeof number === "number") {
      this.setupString(number.toString());
    } else {
      this.setupString(number);
    }
  }
  toFixed(precision = 0, shouldRound = true) {
    let string = this.toString();
    const diff = precision - this.getDecimalPrecision();
    if (diff > 0) {
      if (!string.includes(".")) {
        string += ".";
      }
      return string.padEnd(string.length + diff, "0");
    }
    if (diff < 0) {
      if (shouldRound) {
        return round(string, precision);
      }
      return string.slice(0, diff);
    }
    return string;
  }
  toString() {
    let string = this.number.toString();
    if (this.decimal) {
      let isNegative = false;
      if (string.charAt(0) === "-") {
        string = string.substring(1);
        isNegative = true;
      }
      string = string.padStart(string.length + this.decimal, "0");
      string = `${string.slice(0, -this.decimal)}.${string.slice(-this.decimal)}`;
      string = removeLeadingZeros(string);
      return (isNegative ? "-" : "") + string;
    }
    return string;
  }
  lessThan(thatBigNumber) {
    const [thisNumber, thatNumber] = this.adjustComparisonNumbers(thatBigNumber);
    return thisNumber < thatNumber;
  }
  biggerThan(thatBigNumber) {
    const [thisNumber, thatNumber] = this.adjustComparisonNumbers(thatBigNumber);
    return thisNumber > thatNumber;
  }
  isEqual(thatBigNumber) {
    const [thisNumber, thatNumber] = this.adjustComparisonNumbers(thatBigNumber);
    return thisNumber === thatNumber;
  }
  setupString(number) {
    number = removeLeadingZeros(number);
    if (isValidInteger(number)) {
      this.number = BigInt(number);
    } else if (isValidFloat(number)) {
      this.decimal = guessFloatPrecision(number);
      this.number = BigInt(number.replace(".", ""));
    } else {
      throw new Error(`BigNumber has received and invalid format for the constructor: ${number}`);
    }
  }
  adjustComparisonNumbers(thatNumberParam) {
    let thatNumber;
    if (thatNumberParam.constructor.name !== "BigNumber") {
      thatNumber = new BigNumber(thatNumberParam);
    } else {
      thatNumber = thatNumberParam;
    }
    const diff = this.getDecimalPrecision() - thatNumber.getDecimalPrecision();
    let thisNum = this.getNumber();
    let thatNum = thatNumber.getNumber();
    if (diff > 0) {
      thatNum = thatNumber.getNumber() * BigInt(10) ** BigInt(diff);
    } else if (diff < 0) {
      thisNum = this.getNumber() * BigInt(10) ** BigInt(diff * -1);
    }
    return [thisNum, thatNum];
  }
}
function format(input, opt = defaults, caller = "") {
  debug(opt, "utils format() - caller", caller);
  debug(opt, "utils format() - input1", input);
  if (input === null || input === void 0) {
    input = "";
  } else if (typeof input === "number") {
    if (opt.shouldRound) {
      input = input.toFixed(fixed(opt.precision));
    } else {
      input = input.toFixed(fixed(opt.precision) + 1).slice(0, -1);
    }
  } else if (opt.modelModifiers && opt.modelModifiers.number && isValidInteger(input)) {
    input = Number(input).toFixed(fixed(opt.precision));
  }
  debug(opt, "utils format() - input2", input);
  const negative = opt.disableNegative ? "" : input.indexOf("-") >= 0 ? "-" : "";
  let filtered = input.replace(opt.prefix, "").replace(opt.suffix, "");
  debug(opt, "utils format() - filtered", filtered);
  if (!opt.precision && opt.thousands !== "." && isValidFloat(filtered)) {
    filtered = round(filtered, 0);
    debug(opt, "utils format() - !opt.precision && isValidFloat()", filtered);
  }
  const numbers = onlyNumbers(filtered);
  debug(opt, "utils format() - numbers", numbers);
  debug(opt, "utils format() - numbersToCurrency", negative + numbersToCurrency(numbers, opt.precision));
  const bigNumber = new BigNumber(negative + numbersToCurrency(numbers, opt.precision));
  debug(opt, "utils format() - bigNumber1", bigNumber.toString());
  if (opt.max) {
    if (bigNumber.biggerThan(opt.max)) {
      bigNumber.setNumber(opt.max);
    }
  }
  if (opt.min) {
    if (bigNumber.lessThan(opt.min)) {
      bigNumber.setNumber(opt.min);
    }
  }
  const currency = bigNumber.toFixed(fixed(opt.precision), opt.shouldRound);
  debug(opt, "utils format() - bigNumber2", bigNumber.toFixed(fixed(opt.precision)));
  if (/^0(\.0+)?$/g.test(currency) && opt.allowBlank) {
    return "";
  }
  let [integer, decimal] = currency.split(".");
  const decimalLength = decimal !== void 0 ? decimal.length : 0;
  integer = integer.padStart(opt.minimumNumberOfCharacters - decimalLength, "0");
  integer = addThousandSeparator(integer, opt.thousands);
  const output = opt.prefix + joinIntegerAndDecimal(integer, decimal, opt.decimal) + opt.suffix;
  debug(opt, "utils format() - output", output);
  return output;
}
function unformat(input, opt = defaults, caller = "") {
  debug(opt, "utils unformat() - caller", caller);
  debug(opt, "utils unformat() - input", input);
  const negative = opt.disableNegative ? "" : input.indexOf("-") >= 0 ? "-" : "";
  const filtered = input.replace(opt.prefix, "").replace(opt.suffix, "");
  debug(opt, "utils unformat() - filtered", filtered);
  const numbers = onlyNumbers(filtered);
  debug(opt, "utils unformat() - numbers", numbers);
  const bigNumber = new BigNumber(negative + numbersToCurrency(numbers, opt.precision));
  debug(opt, "utils unformat() - bigNumber1", numbers.toString());
  if (opt.max) {
    if (bigNumber.biggerThan(opt.max)) {
      bigNumber.setNumber(opt.max);
    }
  }
  if (opt.min) {
    if (bigNumber.lessThan(opt.min)) {
      bigNumber.setNumber(opt.min);
    }
  }
  let output = bigNumber.toFixed(fixed(opt.precision), opt.shouldRound);
  if (opt.modelModifiers && opt.modelModifiers.number) {
    output = parseFloat(output);
  }
  debug(opt, "utils unformat() - output", output);
  return output;
}


export { BigNumber, format, unformat };
