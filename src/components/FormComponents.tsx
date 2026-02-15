import React from 'react';

/**
 * Composants de formulaire réutilisables pour l'application
 */

// ==================== Interfaces ====================

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  helpText?: string;
}

interface NumberInputProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  helpText?: string;
  allowUndefined?: boolean;
}

interface CheckboxFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// ==================== Composants ====================

/**
 * Champ de sélection (select) réutilisable
 */
export const SelectField = ({ label, value, onChange, options, helpText }: SelectFieldProps) => (
  <div>
    <label className="block text-[14px] font-medium text-[#1D1D1F] mb-2">{label}</label>
    <select
      value={value}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-[12px] text-[14px] focus:border-[#0096BC] focus:outline-none transition-colors"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {helpText && <p className="text-[12px] text-[#86868B] mt-1">{helpText}</p>}
  </div>
);

/**
 * Champ de saisie numérique réutilisable
 */
export const NumberInput = ({ label, value, onChange, min, max, placeholder, helpText, allowUndefined = false }: NumberInputProps) => (
  <div>
    <label className="block text-[14px] font-medium text-[#1D1D1F] mb-2">
      {label}{value !== undefined && value !== 0 ? ` : ${value}` : ''}
    </label>
    <input
      type="number"
      min={min}
      max={max}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(allowUndefined && val === '' ? undefined : Number(val));
      }}
      className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-[12px] text-[14px] focus:border-[#0096BC] focus:outline-none transition-colors"
    />
    {helpText && <p className="text-[12px] text-[#86868B] mt-1">{helpText}</p>}
  </div>
);

/**
 * Champ checkbox réutilisable
 */
export const CheckboxField = ({ id, label, checked, onChange }: CheckboxFieldProps) => (
  <div className="flex items-center gap-3">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
      className="w-5 h-5 accent-[#0096BC] cursor-pointer"
    />
    <label htmlFor={id} className="text-[14px] font-medium text-[#1D1D1F] cursor-pointer">
      {label}
    </label>
  </div>
);
