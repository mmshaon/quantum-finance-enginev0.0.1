import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'gradient';
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  onClick
}) => {
  const baseStyles = 'rounded-xl p-6 shadow-lg transition-all duration-300';
  
  const variants = {
    default: 'bg-white dark:bg-gray-800',
    glass: 'bg-white/10 dark:bg-gray-800/10 backdrop-blur-lg border border-white/20',
    gradient: 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30'
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className} ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
