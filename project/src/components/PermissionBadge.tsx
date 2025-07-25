import React from 'react';
import { Shield, Eye } from 'lucide-react';

interface PermissionBadgeProps {
  permission: 'read' | 'write';
  size?: 'sm' | 'md';
}

const PermissionBadge: React.FC<PermissionBadgeProps> = ({ permission, size = 'sm' }) => {
  const isRead = permission === 'read';
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
      size === 'sm' ? 'text-xs' : 'text-sm'
    } ${
      isRead 
        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' 
        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    }`}>
      {isRead ? <Eye className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
      {permission}
    </span>
  );
};

export default PermissionBadge;