/**
 * Export Button Component for VULCA Data
 */

import React from 'react';
import { IOSButton } from '../ios/core/IOSButton';

interface ExportButtonProps {
  onClick: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onClick,
  children = 'Export Data',
  disabled = false,
  variant = 'outline',
  size = 'default',
  className = '',
}) => {
  // Map size to IOSButton compatible values
  const iosSize = size === 'icon' ? 'sm' : size === 'default' ? 'md' : size;

  return (
    <IOSButton
      variant={variant === 'outline' ? 'secondary' : 'primary'}
      size={iosSize as 'sm' | 'md' | 'lg'}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 ${className}`}
    >
      {children}
    </IOSButton>
  );
};

export default ExportButton;
