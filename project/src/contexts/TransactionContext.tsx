import React, { createContext, useContext, useState } from 'react';
import { transactionAPI, dashboardAPI, reportsAPI } from '../utils/api';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expenditure';
  category: string;
  date: string;
  userId: string;
  userPrefix: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getFinancialSummary: () => {
    totalIncome: number;
    totalExpenditure: number;
    netBalance: number;
    totalTransactions: number;
  };
  getMonthlyData: (year: number) => Array<{
    month: string;
    Income: number;
    Expenditure: number;
  }>;
  getCategoryData: (startDate?: string, endDate?: string) => Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  getFilteredTransactions: (startDate?: string, endDate?: string) => Transaction[];
  refreshTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};


export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load transactions from API
  const refreshTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await transactionAPI.getAll();
      
      // Convert backend format to frontend format
      const formattedTransactions = response.transactions.map((t: any) => ({
        id: t.id,
        description: t.description,
        amount: t.amount,
        type: t.type === 'INCOME' ? 'Income' : 'Expenditure',
        category: t.category,
        date: t.date.split('T')[0], // Convert to YYYY-MM-DD format
        userId: t.userId,
        userPrefix: t.userPrefix
      }));
      
      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load transactions on mount
 React.useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    refreshTransactions();
  }
}, []);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      await transactionAPI.create({
        type: transaction.type === 'Income' ? 'INCOME' : 'EXPENDITURE',
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: new Date(transaction.date).toISOString()
      });
      
      // Refresh transactions to get updated data
      await refreshTransactions();
    } catch (error) {
      console.error('Failed to add transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id: string, updatedTransaction: Partial<Transaction>) => {
    try {
      const updateData: any = {};
      
      if (updatedTransaction.type) {
        updateData.type = updatedTransaction.type === 'Income' ? 'INCOME' : 'EXPENDITURE';
      }
      if (updatedTransaction.amount !== undefined) updateData.amount = updatedTransaction.amount;
      if (updatedTransaction.category) updateData.category = updatedTransaction.category;
      if (updatedTransaction.description) updateData.description = updatedTransaction.description;
      if (updatedTransaction.date) updateData.date = new Date(updatedTransaction.date).toISOString();
      
      await transactionAPI.update(id, updateData);
      
      // Refresh transactions to get updated data
      await refreshTransactions();
    } catch (error) {
      console.error('Failed to update transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await transactionAPI.delete(id);
      
      // Refresh transactions to get updated data
      await refreshTransactions();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
  };

  const getFinancialSummary = () => {
    const totalIncome = transactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenditure = transactions
      .filter(t => t.type === 'Expenditure')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome,
      totalExpenditure,
      netBalance: totalIncome - totalExpenditure,
      totalTransactions: transactions.length
    };
  };

  const getMonthlyData = (year: number) => {
    // This will be handled by the Reports component directly calling the API
    // Keeping this for backward compatibility
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return months.map((month, index) => ({
      month: `${month} ${year}`,
      Income: 0,
      Expenditure: 0
    }));
  };

  const getCategoryData = (startDate?: string, endDate?: string) => {
    let filteredTransactions = transactions;
    
    if (startDate && endDate) {
      filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
      });
    }

    const categoryTotals: { [key: string]: number } = {};
    let totalAmount = 0;

    filteredTransactions.forEach(t => {
      if (!categoryTotals[t.category]) {
        categoryTotals[t.category] = 0;
      }
      categoryTotals[t.category] += t.amount;
      totalAmount += t.amount;
    });

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      percentage: totalAmount > 0 ? Math.round((value / totalAmount) * 100 * 10) / 10 : 0
    }));
  };

  const getFilteredTransactions = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return transactions;
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
    });
  };

  return (
    <TransactionContext.Provider value={{
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      getFinancialSummary,
      getMonthlyData,
      getCategoryData,
      getFilteredTransactions,
      refreshTransactions
    }}>
      {children}
    </TransactionContext.Provider>
  );
};