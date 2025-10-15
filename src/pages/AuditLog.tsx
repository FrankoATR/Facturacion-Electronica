import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

export const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  const load = async () => {
    const res = await apiFetch<{ data: any[] }>(`/audit/logs`);
    setLogs(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bitácora (append-only)</h1>
      <div className="bg-white p-4 rounded border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Fecha</th>
              <th className="p-2">Actor</th>
              <th className="p-2">Acción</th>
              <th className="p-2">Entidad</th>
              <th className="p-2">ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-2">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="p-2">{l.actorId || '-'}</td>
                <td className="p-2">{l.action}</td>
                <td className="p-2">{l.entity}</td>
                <td className="p-2">{l.entityId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


