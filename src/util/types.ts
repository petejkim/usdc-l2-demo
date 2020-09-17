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

export function bnFromDecimalString(
  decimalNumber: string,
  decimalPlaces = 0
): BN | null {
  if (decimalNumber.startsWith("-")) {
    return null;
  }
  if (!decimalNumber || !/^\d*(\.\d*)?$/.test(decimalNumber)) {
    return null;
  }

  let [whole, fractional] = decimalNumber.split(".");
  whole = whole || "0";
  fractional = (fractional || "0")
    .slice(0, decimalPlaces)
    .padEnd(decimalPlaces, "0");

  return new BN(whole + fractional, 10);
}

export function bnFromHexString(hex: string): BN {
  return new BN(strip0x(hex), 16);
}

export function formatTime(date: Date): string {
  const [h, m, s] = [
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ].map((v) => v.toString().padStart(2, "0"));

  return `${h}:${m}:${s}`;
}

export function appendError(msg: string, errMsg?: string | null): string {
  return errMsg ? `${msg}: ${errMsg}` : msg;
}

export function abbreviateHex(hex: string): string {
  const h = prepend0x(hex);
  if (h.length <= 10) {
    return h;
  }
  return `${h.slice(0, 6)}⋯${h.slice(-4)}`;
}
