import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export const ClientPortal: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const { token } = useAuthStore();

  const load = async () => {
    const res = await apiFetch<{ data: any[] }>(`/portal/my/invoices`);
    setInvoices(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const downloadJson = async (id: string) => {
    const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
    window.open(`${base}/dte/${id}/json?token=${token ?? ''}`, '_blank');
  };

  const downloadPdf = async (id: string) => {
    // Usa acuse si existe; sino genera PDF del servidor
    const res = await apiFetch<{ data: any }>(`/portal/my/invoices/${id}/dte`);
    if (res?.data?.ackUrl) {
      window.open(res.data.ackUrl, '_blank');
    } else {
      const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
      window.open(`${base}/dte/${id}/pdf?token=${token ?? ''}`, '_blank');
    }
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
                  <div className="flex space-x-2">
                    <button className="text-gray-700 underline" onClick={() => downloadJson(inv.id)}>JSON</button>
                    <button className="text-blue-600 underline" onClick={() => downloadPdf(inv.id)}>PDF</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


