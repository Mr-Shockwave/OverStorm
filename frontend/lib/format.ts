export function formatCurrency(amount: number, compact = false): string {
  if (compact && amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const formatted =
      millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    return `$${formatted}M`;
  }

  if (compact && amount >= 1_000) {
    const thousands = amount / 1_000;
    const formatted =
      thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1);
    return `$${formatted}k`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
