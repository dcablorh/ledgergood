import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';

interface FinancialCardProps {
  title: string;
  value: number;
  type: 'income' | 'expense' | 'balance' | 'transactions';
  icon?: React.ReactNode;
}

const FinancialCard: React.FC<FinancialCardProps> = ({ title, value, type, icon }) => {
  const getColorClasses = () => {
    switch (type) {
      case 'income':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'expense':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'balance':
        return value >= 0 
          ? 'text-green-600 bg-green-50 border-green-200'
          : 'text-red-600 bg-red-50 border-red-200';
      case 'transactions':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'income':
        return <TrendingUp className="w-6 h-6" />;
      case 'expense':
        return <TrendingDown className="w-6 h-6" />;
      case 'balance':
        return <DollarSign className="w-6 h-6" />;
      case 'transactions':
        return <FileText className="w-6 h-6" />;
      default:
        return <DollarSign className="w-6 h-6" />;
    }
  };

  const formatValue = () => {
    if (type === 'transactions') {
      return value.toString();
    }
    const formattedValue = Math.abs(value).toLocaleString();
    const sign = type === 'expense' || (type === 'balance' && value < 0) ? '-' : '+';
    return `${sign}₵${formattedValue}`;
  };

  return (
    <div className={`p-6 rounded-xl border-2 ${getColorClasses()} transition-all duration-200 hover:shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80 mb-1">{title}</p>
          <p className="text-2xl font-bold">{formatValue()}</p>
        </div>
        <div className="opacity-60">
          {getIcon()}
        </div>
      </div>
    </div>
  );
};

export default FinancialCard;