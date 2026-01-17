import React from 'react';
import { clsx } from 'clsx'; 

// Helper for conditional classes
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 border border-transparent",
    secondary: "bg-white text-black border border-gray-300 hover:bg-gray-100 focus:ring-gray-500 dark:bg-black dark:text-white dark:border-gray-500 dark:hover:bg-gray-900",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-600",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-200 hover:text-black dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs uppercase tracking-wide",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">{label}</label>}
      <input
        className={cn(
          "w-full rounded-md border-2 border-gray-300 px-3 py-2 text-sm placeholder-gray-500 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-black dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:border-white dark:focus:ring-white",
          error ? "border-red-600 focus:border-red-600 focus:ring-red-600" : "",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}
    </div>
  );
};

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string | number }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className, ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">{label}</label>}
      <select
        className={cn(
          "w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:bg-black dark:border-gray-600 dark:text-white",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }> = ({ children, className, title, action }) => (
  <div className={cn("bg-white rounded-xl shadow border border-gray-200 overflow-hidden dark:bg-dark-card dark:border-dark-border", className)}>
    {(title || action) && (
      <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border flex justify-between items-center bg-gray-50 dark:bg-black">
        {title && <h3 className="text-lg font-bold text-black dark:text-white">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// --- Badge ---
export const Badge: React.FC<{ children: React.ReactNode; color?: 'green' | 'red' | 'blue' | 'yellow' | 'gray' }> = ({ children, color = 'gray' }) => {
  const colors = {
    green: 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900 dark:text-white dark:border-green-700',
    red: 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900 dark:text-white dark:border-red-700',
    blue: 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900 dark:text-white dark:border-blue-700',
    yellow: 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900 dark:text-white dark:border-yellow-700',
    gray: 'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600'
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold", colors[color])}>
      {children}
    </span>
  );
};