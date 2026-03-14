export function pvDivisor(inflationRate: number, yearIndex: number): number {
   return (1 + inflationRate) ** yearIndex;
}

export function toPV(
   value: number,
   inflationRate: number,
   yearIndex: number,
): number {
   return value / pvDivisor(inflationRate, yearIndex);
}
