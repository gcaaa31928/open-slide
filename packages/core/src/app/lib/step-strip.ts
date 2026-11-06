export function stopLabel(stops: readonly number[] | null, index: number): string {
  const seconds = stops?.[index];
  if (seconds === undefined) return String(index);
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;
}

export function clampStop(stop: number, count: number): number {
  return Math.max(0, Math.min(count, Math.trunc(stop)));
}
