import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { Download, Calendar } from 'lucide-react';
import { reportsAPI } from '../utils/api';
import {generateFinancialReportPDF} from '../utils/exportPDF';

const Reports: React.FC = () => {
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [selectedYear, setSelectedYear] = useState(2025);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenditure: 0,
    netBalance: 0,
    totalTransactions: 0
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadReportsData = async () => {
    try {
      setIsLoading(true);
      const summaryResponse = await reportsAPI.getSummary({
        startDate,
        endDate
      });
      setSummary(summaryResponse);

      const monthlyResponse = await reportsAPI.getMonthly(selectedYear);
      setMonthlyData(monthlyResponse.monthlyData);

      const categoryResponse = await reportsAPI.getCategory({
        startDate,
        endDate
      });
      setCategoryData(categoryResponse.categoryData);
    } catch (error) {
      console.error('Failed to load reports data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadReportsData();
  }, [startDate, endDate, selectedYear]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Financial Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyze your cash flow and financial performance
          </p>
        </div>
        <button
  onClick={() =>
    generateFinancialReportPDF({
      businessName: 'Urban-IT',
      startDate: startDate,
      endDate: endDate,
      transactions: transactions
    })
  }
    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
    disabled={isLoading}>
    <Download className="w-5 h-5" />
     Export PDF
      </button>

      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Year for Monthly View
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">Total Income</h3>
          <p className="text-3xl font-bold text-green-600">₵{summary.totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">Total Expenditure</h3>
          <p className="text-3xl font-bold text-red-600">₵{summary.totalExpenditure.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">Net Balance</h3>
          <p
            className={`text-3xl font-bold ${
              summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            ₵{summary.netBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Monthly Cash Flow ({selectedYear})
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} className="dark:text-white">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: 'currentColor' }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Income" fill="#10B981" />
              <Bar dataKey="Expenditure" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Category Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Monthly Cash Flow Details ({selectedYear})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400 font-medium">MONTH</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400 font-medium">INCOME</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400 font-medium">EXPENDITURE</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400 font-medium">NET</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((month, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 text-gray-800 dark:text-white">{month.month}</td>
                    <td className="py-2 text-green-600">₵{month.Income}</td>
                    <td className="py-2 text-red-600">₵{month.Expenditure}</td>
                    <td className="py-2 text-green-600">₵{month.Income - month.Expenditure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Category Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400 font-medium">CATEGORY</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400 font-medium">AMOUNT</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400 font-medium">PERCENTAGE</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((category, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 text-gray-800 dark:text-white">{category.name}</td>
                    <td className="py-2 text-gray-800 dark:text-white">
                      ₵{category.value.toLocaleString()}
                    </td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">{category.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700">
              During this period, Urban-IT generated{' '}
              <strong>₵{summary.totalIncome.toLocaleString()}</strong> in total revenue from{' '}
              <strong>{summary.totalTransactions}</strong> transactions, with expenses totaling{' '}
              <strong>₵{summary.totalExpenditure.toLocaleString()}</strong>, resulting in a net income of{' '}
              <strong
                className={summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}
              >
                ₵{summary.netBalance.toLocaleString()}
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
