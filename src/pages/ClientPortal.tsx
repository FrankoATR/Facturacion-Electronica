import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

export const ClientPortal: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);

  const load = async () => {
    const res = await apiFetch<{ data: any[] }>(`/portal/my/invoices`);
    setInvoices(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDownloadDTE = async (id: string) => {
    const res = await apiFetch<{ data: any }>(`/portal/my/invoices/${id}/dte`);
    if (res?.data?.xmlUrl) window.open(res.data.xmlUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Portal del Cliente</h1>
      <div className="bg-white p-4 rounded border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Número</th>
              <th className="p-2">Fecha</th>
              <th className="p-2">Total</th>
              <th className="p-2">DTE</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t">
                <td className="p-2">{inv.number}</td>
                <td className="p-2">{inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '-'}</td>
                <td className="p-2">${Number(inv.total).toFixed(2)}</td>
                <td className="p-2">
                  <button className="text-blue-600" onClick={() => handleDownloadDTE(inv.id)}>Descargar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


