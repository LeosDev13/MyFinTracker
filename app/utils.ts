export const parseMoney = (value: number, currency: Currency = Currency.EUR) => {
  const formatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  return formatter.format(value);
}

export enum Currency {
  EUR = "EUR"
}
