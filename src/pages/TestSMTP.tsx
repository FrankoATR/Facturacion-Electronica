import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { hasPermission } from '../config/permissions';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { apiFetch } from '../lib/api';
import { showSuccess, showError } from '../lib/toast';

export const TestSMTP: React.FC = () => {
  const { user, token } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<any>(null);

  const canTestSMTP = user && hasPermission(user.role, 'dashboard', 'read');

  const checkSmtpStatus = async () => {
    try {
      const response = await apiFetch('/admin/smtp-status');
      setSmtpStatus(response);
      
      // Auto-llenar el email con el SMTP_USER si está configurado
      if (response.config && response.config.configured && !email && response.config.user !== "No configurado") {
        setEmail(response.config.user);
      }
    } catch (error) {
      console.error('Error al verificar estado SMTP:', error);
      showError('Error al verificar estado SMTP');
    }
  };

  const testEmail = async () => {
    if (!email) {
      showError('Por favor ingrese un email');
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch('/admin/test-smtp', {
        method: 'POST',
        body: { email }, // Cambiar: no usar JSON.stringify aquí
      });

      if (response.success) {
        showSuccess('Correo de prueba enviado exitosamente');
      } else {
        showError(response.message || 'Error al enviar correo');
      }
    } catch (error: any) {
      console.error('Error al enviar correo de prueba:', error);
      showError(error.message || 'Error al enviar correo de prueba');
    } finally {
      setLoading(false);
    }
  };

  if (!canTestSMTP) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Denegado</h3>
          <p className="text-gray-600">No tienes permisos para acceder a esta funcionalidad.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prueba de SMTP</h1>
          <p className="text-gray-600">Verificar configuración y envío de correos</p>
        </div>
      </div>

      {/* SMTP Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Estado del SMTP</h2>
          <Button onClick={checkSmtpStatus} variant="secondary">
            Verificar Estado
          </Button>
        </div>

        {smtpStatus && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              {smtpStatus.config.configured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm">
                {smtpStatus.config.configured ? 'Configurado' : 'No configurado'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Host:</span>
                <span className="ml-2 text-gray-600">{smtpStatus.config.host}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Puerto:</span>
                <span className="ml-2 text-gray-600">{smtpStatus.config.port}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Usuario:</span>
                <span className="ml-2 text-gray-600">{smtpStatus.config.userMasked}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">From:</span>
                <span className="ml-2 text-gray-600">{smtpStatus.config.from}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Email */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Enviar Correo de Prueba</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email de destino
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="w-full"
            />
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={testEmail}
              loading={loading}
              disabled={!email || loading}
            >
              <Send size={16} className="mr-2" />
              Enviar Correo de Prueba
            </Button>
            
            {smtpStatus?.config?.configured && smtpStatus.config.user !== "No configurado" && (
              <Button
                onClick={() => setEmail(smtpStatus.config.user)}
                variant="secondary"
                disabled={loading}
              >
                Usar Email SMTP
              </Button>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <Mail className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Información del Correo de Prueba
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>• Se enviará un correo de prueba con el branding de EleCtroZ</p>
                  <p>• Incluirá información del servidor SMTP y fecha de envío</p>
                  <p>• Verificará que la configuración SMTP esté funcionando correctamente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Configuración SMTP
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Para que funcione el envío de correos, asegúrate de que las siguientes variables estén configuradas en el archivo <code className="bg-yellow-100 px-1 rounded">.env</code>:</p>
              <ul className="mt-2 list-disc list-inside">
                <li><code>SMTP_HOST=smtp.office365.com</code></li>
                <li><code>SMTP_PORT=587</code></li>
                <li><code>SMTP_USER=tu-email@ejemplo.com</code></li>
                <li><code>SMTP_PASS=tu-contraseña</code></li>
                <li><code>SMTP_FROM="EleCtroZ &lt;noreply@electroz.com&gt;"</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
