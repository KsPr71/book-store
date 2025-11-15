"use client";

import React from 'react';

// Lista de países con códigos telefónicos más comunes
const COUNTRIES = [
  { code: '+53', name: 'Cuba', flag: '🇨🇺' },
  { code: '+1', name: 'Estados Unidos / Canadá', flag: '🇺🇸' },
  { code: '+52', name: 'México', flag: '🇲🇽' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: '+55', name: 'Brasil', flag: '🇧🇷' },
  { code: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: '+51', name: 'Perú', flag: '🇵🇪' },
  { code: '+58', name: 'Venezuela', flag: '🇻🇪' },
  { code: '+593', name: 'Ecuador', flag: '🇪🇨' },
  { code: '+595', name: 'Paraguay', flag: '🇵🇾' },
  { code: '+598', name: 'Uruguay', flag: '🇺🇾' },
  { code: '+591', name: 'Bolivia', flag: '🇧🇴' },
  { code: '+34', name: 'España', flag: '🇪🇸' },
  { code: '+44', name: 'Reino Unido', flag: '🇬🇧' },
  { code: '+49', name: 'Alemania', flag: '🇩🇪' },
  { code: '+33', name: 'Francia', flag: '🇫🇷' },
  { code: '+39', name: 'Italia', flag: '🇮🇹' },
  { code: '+7', name: 'Rusia', flag: '🇷🇺' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+81', name: 'Japón', flag: '🇯🇵' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+27', name: 'Sudáfrica', flag: '🇿🇦' },
];

interface CountryPhoneSelectorProps {
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneNumberChange: (number: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CountryPhoneSelector({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  disabled = false,
  className = '',
}: CountryPhoneSelectorProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Selector de país */}
      <div className="flex-shrink-0">
        <select
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          disabled={disabled}
          className="h-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.code}
            </option>
          ))}
        </select>
      </div>
      
      {/* Campo de número de teléfono */}
      <div className="flex-1">
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => {
            // Solo permitir números
            const value = e.target.value.replace(/\D/g, '');
            onPhoneNumberChange(value);
          }}
          placeholder="Número de teléfono"
          disabled={disabled}
          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

// Función helper para formatear número completo
export function formatFullPhoneNumber(countryCode: string, phoneNumber: string): string {
  if (!phoneNumber) return '';
  return `${countryCode}${phoneNumber}`;
}

// Función helper para parsear número completo
export function parsePhoneNumber(fullNumber: string): { countryCode: string; phoneNumber: string } {
  if (!fullNumber) return { countryCode: '+53', phoneNumber: '' };
  
  // Buscar el código de país más largo que coincida
  const sortedCountries = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  
  for (const country of sortedCountries) {
    if (fullNumber.startsWith(country.code)) {
      return {
        countryCode: country.code,
        phoneNumber: fullNumber.substring(country.code.length),
      };
    }
  }
  
  // Si no se encuentra, asumir código por defecto (Cuba)
  return { countryCode: '+53', phoneNumber: fullNumber };
}

