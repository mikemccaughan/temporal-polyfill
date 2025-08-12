export const ZERO = 0n;
export const ONE = 1n;
export const TWO = 2n;
export const TEN = 10n;
const TWENTY_FOUR = 24n;
const SIXTY = 60n;
export const THOUSAND = 1_000n;
export const MILLION = 1_000_000n;
export const BILLION = 1_000_000_000n;
const HOUR_SECONDS = 3600n;
export const HOUR_NANOS = HOUR_SECONDS * BILLION;
export const MINUTE_NANOS = SIXTY * BILLION;
export const DAY_NANOS = HOUR_NANOS * TWENTY_FOUR;

export function isEven(value: bigint): boolean {
  return value % 2n === 0n;
}

export function abs(x: bigint): bigint {
  return x < 0n ? -x : x;
}

export function compare(x: bigint, y: bigint): -1 | 0 | 1 {
  return x < y ? -1 : x > y ? 1 : 0;
}

export function divmod(x: bigint, y: bigint): { quotient: bigint; remainder: bigint } {
  const quotient = x / y;
  const remainder = x % y;
  return { quotient, remainder };
}
