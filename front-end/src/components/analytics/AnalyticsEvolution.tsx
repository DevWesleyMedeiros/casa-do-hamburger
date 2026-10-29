import { useId } from 'react';
import type { AdminAnalytics } from '../../types/AdminAnalytics';
import { analyticsCurrency, analyticsDate } from '../../shared/utils/analyticsPeriod';

export function AnalyticsEvolution({ series }: { series: AdminAnalytics['series'] }) {
  const id = useId();
  const chart = (field: 'orders' | 'orderValueInCents', label: string) => {
    const max = Math.max(0, ...series.map((day) => day[field]));
    const scale = Math.max(1, max);
    const points = series
      .map(
        (day, index) =>
          `${20 + (index * 560) / Math.max(1, series.length - 1)},${150 - (day[field] / scale) * 120}`,
      )
      .join(' ');
    return (
      <figure className="min-w-0 rounded-xl border border-slate-700 bg-slate-900 p-4">
        <figcaption className="mb-3 font-medium text-slate-200">{label}</figcaption>
        <svg
          viewBox="0 0 600 180"
          role="img"
          aria-labelledby={`${id}-${field}`}
          className="w-full text-blue-400"
        >
          <title id={`${id}-${field}`}>
            {label}. Valores por dia disponíveis na tabela abaixo.
          </title>
          <path d="M20 20V150H580" fill="none" stroke="#64748b" />
          <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" />
          {series.length === 1 && (
            <circle cx="20" cy={150 - (series[0][field] / scale) * 120} r="4" fill="currentColor" />
          )}
          <text x="20" y="175" fill="#cbd5e1" fontSize="12">
            {analyticsDate(series[0]?.date ?? '')}
          </text>
          <text x="580" y="175" textAnchor="end" fill="#cbd5e1" fontSize="12">
            {analyticsDate(series.at(-1)?.date ?? '')}
          </text>
          <text x="580" y="16" textAnchor="end" fill="#cbd5e1" fontSize="12">
            Máx. {field === 'orders' ? max : analyticsCurrency(max)}
          </text>
        </svg>
      </figure>
    );
  };
  return (
    <section aria-label="Evolução diária" className="space-y-4">
      <h2 className="text-xl font-semibold">Evolução diária</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {chart('orders', 'Quantidade de pedidos')}
        {chart('orderValueInCents', 'Valor dos pedidos não cancelados')}
      </div>
      <details className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <summary className="cursor-pointer rounded text-blue-200 focus-visible:outline-2 focus-visible:outline-blue-400">
          Ver dados diários em tabela
        </summary>
        <div className="mt-4 max-h-80 overflow-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Pedidos por dia em America/Sao_Paulo. Valores simulados, excluindo cancelados.
            </caption>
            <thead>
              <tr>
                <th scope="col" className="p-2">
                  Data
                </th>
                <th scope="col" className="p-2">
                  Pedidos
                </th>
                <th scope="col" className="p-2">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {series.map((day) => (
                <tr key={day.date} className="border-t border-slate-700">
                  <th scope="row" className="p-2 font-normal">
                    {analyticsDate(day.date)}
                  </th>
                  <td className="p-2">{day.orders}</td>
                  <td className="p-2">{analyticsCurrency(day.orderValueInCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
