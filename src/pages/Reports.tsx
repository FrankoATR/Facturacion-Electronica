import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { format } from 'date-fns';
import { Button } from '../components/common/Button';
import { DataTable } from '../components/common/DataTable';
import { showError, showSuccess } from '../lib/toast';

export const Reports: React.FC = () => {
  const [from, setFrom] = useState<string>(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'));
  const [to, setTo] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const res = await apiFetch(`/reports/iva?from=${from}&to=${to}`);
      setData(res);
      showSuccess('Reporte de IVA cargado exitosamente');
    } catch (e: any) {
      const errorMsg = e.message || 'No se pudo cargar el reporte de IVA';
      setError(errorMsg);
      setData(null);
      showError(`Error al cargar reporte: ${errorMsg}`);
    }
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reporte IVA</h1>
      <div className="flex items-center space-x-2">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 border rounded" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 border rounded" />
        <Button onClick={load}>Consultar</Button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
      )}
      {data && (
        <div className="bg-white p-4 rounded border space-y-2">
          <div>Subtotal: ${Number(data.totals.subtotal).toFixed(2)}</div>
          <div>IVA: ${Number(data.totals.taxTotal).toFixed(2)}</div>
          <div>Total: ${Number(data.totals.total).toFixed(2)}</div>
        </div>
      )}
      {data && (
        <div className="bg-white p-4 rounded border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalle de facturas del período</h2>
          {Array.isArray(data.data) && data.data.length > 0 ? (
            <DataTable
              data={data.data}
              columns={[
                { key: 'number', header: 'Número' },
                { key: 'type', header: 'Tipo', render: (r: any) => (r.type === 'ELECTRONIC' ? 'Electrónica' : 'Tradicional') },
                { key: 'issuedAt', header: 'Fecha', render: (r: any) => (r.issuedAt ? new Date(r.issuedAt).toLocaleDateString() : '-') },
                { key: 'subtotal', header: 'Subtotal', render: (r: any) => `$${Number(r.subtotal).toFixed(2)}` },
                { key: 'taxTotal', header: 'IVA', render: (r: any) => `$${Number(r.taxTotal).toFixed(2)}` },
                { key: 'total', header: 'Total', render: (r: any) => `$${Number(r.total).toFixed(2)}` },
              ]}
              loading={false}
              pagination={undefined}
              emptyMessage="No hay facturas emitidas en el período"
            />
          ) : (
            <div className="text-sm text-gray-600">No hay facturas emitidas en el período</div>
          )}
        </div>
      )}
    </div>
  );
};


