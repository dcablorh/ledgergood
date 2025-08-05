// src/utils/exportPDF.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';

interface SummaryData {
  totalIncome: number;
  totalExpenditure: number;
  netBalance: number;
}

export const generateFinancialReportPDF = ({
  businessName,
  startDate,
  endDate,
  transactions = [],
}: {
  businessName: string;
  startDate: string;
  endDate: string;
  transactions?: Transaction[];
}) => {
  const doc = new jsPDF();
  const today = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const filteredTxns = transactions.filter(t => {
    const txnDate = new Date(t.date);
    return txnDate >= new Date(startDate) && txnDate <= new Date(endDate);
  });

  const incomeTransactions = filteredTxns.filter(t => t.type === 'Income');
  const expenditureTransactions = filteredTxns.filter(t => t.type === 'Expenditure');

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenditure = expenditureTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpenditure;

  doc.setFontSize(16);
  doc.text('Business Financial Report', 14, 20);
  doc.setFontSize(12);
  doc.text(`Period Covered: ${startDate} – ${endDate}`, 14, 30);
  doc.text(`Prepared For: ${businessName}`, 14, 36);
  doc.text(`Prepared On: ${today}`, 14, 42);

  doc.setFontSize(14);
  doc.text('Cash Flow Statement', 14, 55);

  autoTable(doc, {
    startY: 60,
    head: [['Cash Inflows', 'Amount (GHS)']],
    body: [
      ...incomeTransactions.map(t => [t.description, `₵${t.amount.toLocaleString()}`]),
      ['Total Inflows', `₵${totalIncome.toLocaleString()}`],
    ],
    theme: 'grid',
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 10,
    head: [['Cash Outflows', 'Amount (GHS)']],
    body: [
      ...expenditureTransactions.map(t => [t.description, `₵${t.amount.toLocaleString()}`]),
      ['Total Outflows', `₵${totalExpenditure.toLocaleString()}`],
    ],
    theme: 'grid',
  });

  doc.setTextColor(netBalance < 0 ? 200 : 0, netBalance < 0 ? 0 : 128, 0);
  doc.text(`Net Cash Flow: ₵${netBalance.toLocaleString()}`, 14, doc.lastAutoTable.finalY + 15);
  doc.setTextColor(0, 0, 0);

  // ➤ Monthly Breakdown
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'short' })
  );
  const monthlyBreakdown = months.map((month, index) => {
    const monthTxns = filteredTxns.filter(t => new Date(t.date).getMonth() === index);
    const income = monthTxns.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const expenditure = monthTxns.filter(t => t.type === 'Expenditure').reduce((sum, t) => sum + t.amount, 0);
    return { month: `${month} ${new Date(startDate).getFullYear()}`, income, expenditure };
  });

  doc.addPage();
  doc.setFontSize(14);
  doc.text(`Monthly Cash Flow Details (${new Date(startDate).getFullYear()})`, 14, 20);
  autoTable(doc, {
    startY: 25,
    head: [['Month', 'Income', 'Expenditure', 'Net']],
    body: monthlyBreakdown.map(({ month, income, expenditure }) => [
      month,
      `₵${income.toLocaleString()}`,
      `₵${expenditure.toLocaleString()}`,
      `₵${(income - expenditure).toLocaleString()}`,
    ]),
    theme: 'grid',
  });

  // ➤ Category Breakdown
  const categoryTotals: Record<string, number> = {};
  expenditureTransactions.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const categoryData = Object.entries(categoryTotals).map(([category, amount]) => ({
    category,
    amount,
    percentage: (amount / totalExpenditure) * 100,
  }));

  doc.addPage();
  doc.setFontSize(14);
  doc.text('Category Breakdown', 14, 20);
  autoTable(doc, {
    startY: 25,
    head: [['Category', 'Amount', 'Percentage']],
    body: categoryData.map(({ category, amount, percentage }) => [
      category,
      `₵${amount.toLocaleString()}`,
      `${percentage.toFixed(1)}%`,
    ]),
    theme: 'grid',
  });

  doc.save('Business_Financial_Report.pdf');
};
