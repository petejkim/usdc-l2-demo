import BN from "bn.js";

export function strip0x(str: string): string {
  return str.replace(/^0x/, "");
}

export function prepend0x(str: string): string {
  return str.replace(/^(0x)?/, "0x");
}

export function decimalStringFromBN(bn: BN, decimalPlaces = 0): string {
  if (bn.isZero()) {
    return "0";
  }
  let str = bn.toString(10).padStart(decimalPlaces + 1, "0");
  if (decimalPlaces === 0) {
    return str;
  }
  str = str.slice(0, -decimalPlaces) + "." + str.slice(-decimalPlaces);
  str = str.replace(/\.0+$/, "");
  if (str.includes(".")) {
    str = str.replace(/0+$/, "");
  }
  return str;
}
