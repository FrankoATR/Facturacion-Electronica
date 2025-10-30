import React from 'react';
import { CheckCircle, XCircle, Clock, FileText, Shield } from 'lucide-react';

interface DTEStatusBadgeProps {
  status: string;
  hasDTESignature?: boolean;
  className?: string;
}

export const DTEStatusBadge: React.FC<DTEStatusBadgeProps> = ({ 
  status, 
  hasDTESignature = false,
  className = '' 
}) => {
  const normalized = (status || '').toString().toLowerCase();

  const getStatusConfig = () => {
    switch (normalized) {
      case 'draft':
      case 'borrador':
        return {
          icon: <Clock size={16} />,
          label: 'Draft',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-300',
        };
      case 'issued':
      case 'emmited':
      case 'emitida':
        return {
          icon: hasDTESignature ? <Shield size={16} /> : <CheckCircle size={16} />,
          label: hasDTESignature ? 'Signed DTE' : 'Emmited',
          bgColor: hasDTESignature ? 'bg-green-100' : 'bg-blue-100',
          textColor: hasDTESignature ? 'text-green-700' : 'text-blue-700',
          borderColor: hasDTESignature ? 'border-green-300' : 'border-blue-300',
        };
      case 'annulled':
      case 'canceled':
      case 'cancelled':
      case 'anulada':
      case 'rejected':
        return {
          icon: <XCircle size={16} />,
          label: 'Rejected',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-300',
        };
      default:
        return {
          icon: <FileText size={16} />,
          label: status || 'Unknown',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-300',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

