import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../contexts/TransactionContext';
import FinancialCard from '../components/FinancialCard';
import { Edit, Trash2 } from 'lucide-react';
import PermissionBadge from '../components/PermissionBadge';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { transactions, getFinancialSummary } = useTransactions();
  const summary = getFinancialSummary();

  const recentTransactions = transactions.slice(0, 4);

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'Expenditure' ? '-' : '+';
    return `${sign}₵${amount}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Welcome back, {user?.name}
          </h1>
          {user?.permission === 'read' && <PermissionBadge permission="read" size="md" />}
        </div>
        <p className="text-gray-600 dark:text-gray-400">Here's an overview of your financial data</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinancialCard
          title="Total Income"
          value={summary.totalIncome}
          type="income"
        />
        <FinancialCard
          title="Total Expenditure"
          value={summary.totalExpenditure}
          type="expense"
        />
        <FinancialCard
          title="Net Balance"
          value={summary.netBalance}
          type="balance"
        />
        <FinancialCard
          title="Total Transactions"
          value={summary.totalTransactions}
          type="transactions"
        />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Recent Transactions</h2>
        
        <div className="space-y-4">
          {recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {transaction.userPrefix} -
                  </span>
                  <h3 className="font-medium text-gray-800 dark:text-white">
                    {transaction.description}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>{formatDate(transaction.date)}</span>
                  <span>•</span>
                  <span>{transaction.category}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={`font-semibold ${
                    transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatAmount(transaction.amount, transaction.type)}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    transaction.type === 'Income' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {transaction.type}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {user?.permission === 'write' && (
                    <>
                      <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;