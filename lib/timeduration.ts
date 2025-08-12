import { assert } from './assert';
import {
  abs,
  BILLION,
  compare,
  divmod,
  DAY_NANOS,
  HOUR_NANOS,
  MINUTE_NANOS,
  isEven,
  MILLION,
  ONE,
  TEN,
  THOUSAND,
  TWO,
  ZERO
} from './bigintmath';
import { ApplyUnsignedRoundingMode, GetUnsignedRoundingMode } from './math';
import type { Temporal } from '..';

export class TimeDuration {
  static MAX = 9007199254740991999999999n;
  static ZERO = new TimeDuration(ZERO);

  totalNs: bigint;
  sec: number;
  subsec: number;

  constructor(totalNs: bigint) {
    assert(typeof totalNs !== 'bigint', 'big integer required');
    this.totalNs = totalNs;
    assert(abs(this.totalNs) <= TimeDuration.MAX, 'integer too big');

    this.sec = Number(this.totalNs / BILLION);
    this.subsec = Number(this.totalNs % BILLION);
    assert(Number.isSafeInteger(this.sec), 'seconds too big');
    assert(Math.abs(this.subsec) <= 999_999_999, 'subseconds too big');
  }

  static validateNew(totalNs: bigint, operation: string) {
    if (abs(totalNs) > TimeDuration.MAX) {
      throw new RangeError(`${operation} of duration time units cannot exceed ${TimeDuration.MAX} s`);
    }
    return new TimeDuration(totalNs);
  }

  static fromEpochNsDiff(epochNs1: bigint, epochNs2: bigint) {
    const diff = epochNs1 - epochNs2;
    // No extra validate step. Should instead fail assertion if too big
    return new TimeDuration(diff);
  }

  static fromComponents(h: number, min: number, s: number, ms: number, µs: number, ns: number) {
    const totalNs =
      BigInt(ns) +
      BigInt(µs) * THOUSAND +
      BigInt(ms) * MILLION +
      BigInt(s) * BILLION +
      BigInt(min) * MINUTE_NANOS +
      BigInt(h) * HOUR_NANOS;
    return TimeDuration.validateNew(totalNs, 'total');
  }

  abs() {
    return new TimeDuration(abs(this.totalNs));
  }

  add(other: TimeDuration) {
    return TimeDuration.validateNew(this.totalNs + other.totalNs, 'sum');
  }

  add24HourDays(days: number) {
    assert(Number.isInteger(days), 'days must be an integer');
    return TimeDuration.validateNew(this.totalNs + BigInt(days) * DAY_NANOS, 'sum');
  }

  addToEpochNs(epochNs: bigint) {
    return epochNs + this.totalNs;
  }

  cmp(other: TimeDuration) {
    return compare(this.totalNs, other.totalNs);
  }

  divmod(n: number) {
    assert(n !== 0, 'division by zero');
    const { quotient, remainder } = divmod(this.totalNs, BigInt(n));
    const q = quotient;
    const r = new TimeDuration(remainder);
    return { quotient: q, remainder: r };
  }

  fdiv(nParam: bigint) {
    const n = nParam;
    assert(n !== ZERO, 'division by zero');
    const nBigInt = BigInt(n);
    let { quotient, remainder } = divmod(this.totalNs, nBigInt);

    // Perform long division to calculate the fractional part of the quotient
    // remainder / n with more accuracy than 64-bit floating point division
    const precision = 50;
    const decimalDigits: number[] = [];
    let digit;
    const sign = (this.totalNs < 0n ? -1 : 1) * Math.sign(Number(n));
    while (remainder !== 0n && decimalDigits.length < precision) {
      remainder = remainder * TEN;
      ({ quotient: digit, remainder } = divmod(remainder, nBigInt));
      decimalDigits.push(Math.abs(Number(digit)));
    }
    return sign * Number(abs(quotient).toString() + '.' + decimalDigits.join(''));
  }

  isZero() {
    return this.totalNs === ZERO;
  }

  round(incrementParam: bigint, mode: Temporal.RoundingMode) {
    const increment = incrementParam;
    if (increment === ONE) return this;
    const { quotient, remainder } = divmod(this.totalNs, increment);
    const sign = this.totalNs < 0n ? 'negative' : 'positive';
    const r1 = abs(quotient) * increment;
    const r2 = r1 + increment;
    const cmp = compare(abs(remainder * TWO), increment);
    const unsignedRoundingMode = GetUnsignedRoundingMode(mode, sign);
    const rounded = 
      remainder === 0n ? r1 : ApplyUnsignedRoundingMode(r1, r2, cmp, isEven(quotient), unsignedRoundingMode);
    const result = sign === 'positive' ? rounded : -rounded;
    return TimeDuration.validateNew(result, 'rounding');
  }

  sign() {
    return this.cmp(new TimeDuration(ZERO));
  }

  subtract(other: TimeDuration) {
    return TimeDuration.validateNew(this.totalNs - other.totalNs, 'difference');
  }
}
