import { describe, expect, it } from 'vitest';
import { formatCurrency, reaisToCents } from './currency';

describe('contrato monetário em centavos', () => {
  it.each([
    [0, '0,00'],
    [100, '1,00'],
    [1000, '10,00'],
    [100000, '1.000,00'],
    [1000000, '10.000,00'],
  ])('formata %i centavos como %s reais', (cents, expected) => {
    expect(formatCurrency(cents).replace(/\s/g, ' ')).toBe(`R$ ${expected}`);
  });
  it.each([
    ['29,90', 2990],
    ['29.90', 2990],
    ['29', 2900],
    ['0,01', 1],
  ])('converte %s somente na entrada do formulário', (value, cents) => {
    expect(reaisToCents(value)).toBe(cents);
  });
  it.each(['0', '-1', '1.234', 'Infinity', '99999999999999', 'abc'])(
    'rejeita entrada inválida %s',
    (value) => {
      expect(() => reaisToCents(value)).toThrow(TypeError);
    },
  );
});
