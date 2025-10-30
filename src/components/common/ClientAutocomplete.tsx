import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Client } from '../../types';

interface ClientAutocompleteProps {
  clients: Client[];
  selectedClientId: string;
  onClientSelect: (clientId: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export const ClientAutocomplete: React.FC<ClientAutocompleteProps> = ({
  clients,
  selectedClientId,
  onClientSelect,
  placeholder = "Buscar por identificador fiscal...",
  error,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Obtener cliente seleccionado
  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Filtrar clientes por identificador fiscal o nombre
  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.taxId.toLowerCase().includes(searchLower) ||
      client.name.toLowerCase().includes(searchLower)
    );
  }).slice(0, 10); // Limitar a 10 resultados

  // Manejar cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(value.length > 0); // Solo abrir si hay texto
    setHighlightedIndex(-1);
    
    // Si se borra el texto, limpiar selección
    if (!value) {
      onClientSelect('');
    }
  };

  // Manejar selección de cliente
  const handleClientSelect = (client: Client) => {
    onClientSelect(client.id);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  // Limpiar selección
  const handleClear = () => {
    onClientSelect('');
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Manejar teclas
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredClients.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredClients[highlightedIndex]) {
          handleClientSelect(filteredClients[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mostrar cliente seleccionado o valor de búsqueda
  const displayValue = selectedClient && !isOpen
    ? `${selectedClient.taxId} - ${selectedClient.name}`
    : searchTerm;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (!selectedClient) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-10 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-300' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
        />
        
        {selectedClient && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={disabled}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredClients.length > 0 ? (
            filteredClients.map((client, index) => (
              <div
                key={client.id}
                onClick={() => handleClientSelect(client)}
                className={`
                  px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0
                  ${index === highlightedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}
                `}
              >
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-medium text-blue-600">
                      {client.taxId}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-900">
                      {client.name}
                    </span>
                  </div>
                  {client.email && (
                    <span className="text-xs text-gray-500 mt-1">
                      📧 {client.email}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">
              {searchTerm ? 'No se encontraron clientes' : 'Escriba para buscar clientes'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
