// TODO: validar vs PDF - Header con breadcrumb y controles
import React, { useEffect, useState, useRef } from 'react';
import { Menu, Bell, User, Check, Trash2, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';

interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title = 'Dashboard' }) => {
  const { user } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cargar notificaciones al montar
    fetchNotifications();
    
    // Polling cada 30 segundos para actualizar contador
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    // Cerrar dropdown al hacer click fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (id: string, read: boolean) => {
    if (!read) {
      await markAsRead(id);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'STOCK_LOW':
        return '📦';
      case 'INVOICE_ISSUED':
        return '📄';
      case 'PAYMENT_RECEIVED':
        return '💰';
      case 'SYSTEM_ERROR':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
            <p className="text-sm text-gray-600">
              Sistema de Facturación - {user?.role === 'administrador' ? 'Administrador' : 'Vendedor'}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 max-h-[500px] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllAsRead()}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto flex-1">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      No hay notificaciones
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.id, notification.read)}
                        className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">
                                {new Date(notification.createdAt).toLocaleString()}
                              </span>
                              <button
                                onClick={(e) => handleDeleteNotification(notification.id, e)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User size={16} className="text-gray-600" />
            </div>
            <span className="hidden md:inline text-sm font-medium text-gray-700">
              {user?.name}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};