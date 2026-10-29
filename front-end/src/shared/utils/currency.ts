const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatCurrency(cents: number): string {
  if (!Number.isFinite(cents)) throw new TypeError('Valor monetário inválido');
  return formatter.format(cents / 100);
}

/** O campo do formulário usa reais; a API recebe somente centavos inteiros. */
export function reaisToCents(value: string): number {
  if (!/^\d+([.,]\d{1,2})?$/.test(value)) throw new TypeError('Preço inválido');
  const [whole, fraction = ''] = value.replace(',', '.').split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 2_147_483_647)
    throw new TypeError('Preço fora do limite suportado');
  return cents;
}
