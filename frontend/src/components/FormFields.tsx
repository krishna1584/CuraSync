'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
}

export function TextField({ id, label, hint, ...inputProps }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {hint && <span className="ml-1 font-normal text-gray-500">{hint}</span>}
      </label>
      <input id={id} name={id} className="field-input" {...inputProps} />
    </div>
  );
}

export function PasswordField({ id, label, hint, ...inputProps }: FieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {hint && <span className="ml-1 font-normal text-gray-500">{hint}</span>}
      </label>
      <div className="relative">
        <input id={id} name={id} type={visible ? 'text' : 'password'} className="field-input pr-11" {...inputProps} />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-gray-400 hover:text-gray-600"
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
