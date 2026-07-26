export type DisplayUnit = "m" | "cm" | "ft";

/** Format a centimeter value for display in the given unit. */
export function formatLength(cm: number, unit: DisplayUnit): string {
  switch (unit) {
    case "cm":
      return `${Math.round(cm)} cm`;
    case "ft": {
      const feet = cm / 30.48;
      return `${feet.toFixed(2)} ft`;
    }
    case "m":
    default:
      return `${(cm / 100).toFixed(2)} m`;
  }
}

/** Parse a user-typed length string (in the active display unit) back to cm. */
export function parseLengthToCm(value: string, unit: DisplayUnit): number {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return 0;
  switch (unit) {
    case "cm":
      return n;
    case "ft":
      return n * 30.48;
    case "m":
    default:
      return n * 100;
  }
}
