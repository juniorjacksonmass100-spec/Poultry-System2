import * as XLSX from 'xlsx';
import { PoultryStock, EggProduction, Sale, Expense, BroodingRecord, ActivityLog, FinancialSummary } from '../types';

export interface ExportDataPayload {
  poultry?: PoultryStock[];
  eggs?: EggProduction[];
  sales?: Sale[];
  expenses?: Expense[];
  brooding?: BroodingRecord[];
  activityLogs?: ActivityLog[];
  financials?: FinancialSummary;
}

export const exportToExcel = (
  type: 'all' | 'poultry' | 'eggs' | 'sales' | 'expenses' | 'brooding' | 'financials' | 'activity',
  data: ExportDataPayload,
  fileNamePrefix = 'KukuTrack_Report'
): void => {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().split('T')[0];

  // Helper to add sheet if data exists
  const addSheet = (sheetName: string, rows: Record<string, any>[]) => {
    if (rows && rows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    } else {
      // Empty sheet with notice
      const ws = XLSX.utils.json_to_sheet([{ Notice: 'No records available for this period' }]);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
  };

  if (type === 'poultry' || type === 'all') {
    const poultryRows = (data.poultry || []).map((p) => ({
      'Poultry Type': p.poultry_type,
      'Breed': p.breed,
      'Initial Qty': p.initial_quantity,
      'Current Qty': p.current_quantity,
      'Male Qty': p.male_quantity,
      'Female Qty': p.female_quantity,
      'Young Birds': p.young_birds,
      'Adult Birds': p.adult_birds,
      'Mortality': p.mortality,
      'Sold Qty': p.sold_quantity,
      'Purchase Cost (TZS)': Number(p.purchase_cost || 0),
      'Date Acquired': p.date_acquired,
      'Source': p.source || 'N/A',
      'Notes': p.notes || '',
    }));
    addSheet('Poultry Inventory', poultryRows);
  }

  if (type === 'eggs' || type === 'all') {
    const eggRows = (data.eggs || []).map((e) => ({
      'Date': e.production_date,
      'Active Hens': e.hen_count,
      'Eggs Collected': e.eggs_collected,
      'Broken Eggs': e.broken_eggs,
      'Spoiled Eggs': e.spoiled_eggs,
      'Eggs Sold': e.eggs_sold,
      'Internal Use': e.eggs_used_internally,
      'Remaining Usable': e.remaining_eggs,
      'Unit Price (TZS)': Number(e.selling_price_per_egg || 0),
      'Total Revenue (TZS)': Number(e.total_egg_revenue || 0),
      'Notes': e.notes || '',
    }));
    addSheet('Egg Production', eggRows);
  }

  if (type === 'sales' || type === 'all') {
    const salesRows = (data.sales || []).map((s) => ({
      'Sale Date': s.sale_date,
      'Product': s.product,
      'Poultry Type': s.poultry_type || 'N/A',
      'Quantity': s.quantity,
      'Unit Price (TZS)': Number(s.unit_price || 0),
      'Total Amount (TZS)': Number(s.total_amount || 0),
      'Amount Paid (TZS)': Number(s.amount_paid || 0),
      'Balance (TZS)': Number(s.balance || 0),
      'Customer Name': s.customer_name,
      'Customer Phone': s.customer_phone || 'N/A',
      'Payment Method': s.payment_method,
      'Notes': s.notes || '',
    }));
    addSheet('Sales Records', salesRows);
  }

  if (type === 'expenses' || type === 'all') {
    const expenseRows = (data.expenses || []).map((ex) => ({
      'Date': ex.expense_date,
      'Category': ex.category,
      'Description': ex.description,
      'Amount (TZS)': Number(ex.amount || 0),
      'Payment Method': ex.payment_method,
      'Person Responsible': ex.person_responsible || 'N/A',
      'Receipt Ref': ex.receipt_reference || 'N/A',
      'Notes': ex.notes || '',
    }));
    addSheet('Farm Expenses', expenseRows);
  }

  if (type === 'brooding' || type === 'all') {
    const broodingRows = (data.brooding || []).map((b) => ({
      'Mother / Tag': b.mother_bird_tag || 'N/A',
      'Poultry Type': b.poultry_type,
      'Number of Eggs': b.number_of_eggs,
      'Incubation Days': b.incubation_days,
      'Start Date': b.start_date,
      'Expected Hatch Date': b.expected_hatch_date,
      'Actual Hatch Date': b.actual_hatch_date || 'In Progress',
      'Eggs Hatched': b.eggs_hatched,
      'Eggs Failed': b.eggs_failed,
      'Chicks Produced': b.chicks_produced,
      'Status': b.status,
      'Notes': b.notes || '',
    }));
    addSheet('Brooding & Hatching', broodingRows);
  }

  if (type === 'financials' || type === 'all') {
    if (data.financials) {
      const fin = data.financials;
      const finRows = [
        { Metric: 'Total Gross Revenue (TZS)', Value: fin.totalRevenue },
        { Metric: 'Total Stock Purchase Costs (TZS)', Value: fin.poultryPurchaseCost },
        { Metric: 'Total Operating Expenses (TZS)', Value: fin.totalExpenses - fin.poultryPurchaseCost },
        { Metric: 'Total Combined Expenses (TZS)', Value: fin.totalExpenses },
        { Metric: 'Gross Profit (TZS)', Value: fin.grossProfit },
        { Metric: 'Net Operating Profit (TZS)', Value: fin.netProfit },
        { Metric: 'Total Cash Received (TZS)', Value: fin.cashReceived },
        { Metric: 'Customer Outstanding Receivables (TZS)', Value: fin.totalOutstandingBalance },
        { Metric: 'Feed Expenses (TZS)', Value: fin.feedExpenses },
        { Metric: 'Medication & Vaccines Expenses (TZS)', Value: fin.medicationExpenses },
      ];
      addSheet('Financial Summary', finRows);

      if (fin.monthlyBreakdown && fin.monthlyBreakdown.length > 0) {
        const monthlyRows = fin.monthlyBreakdown.map((m) => ({
          'Month': m.month,
          'Revenue (TZS)': m.revenue,
          'Expenses (TZS)': m.expenses,
          'Net Profit (TZS)': m.profit,
        }));
        addSheet('Monthly Profit Breakdown', monthlyRows);
      }
    }
  }

  if (type === 'activity' || type === 'all') {
    const activityRows = (data.activityLogs || []).map((a) => ({
      'Timestamp': a.created_at,
      'User Email': a.user_email || 'System',
      'Action': a.action,
      'Record Type': a.record_type,
      'Record ID': a.record_id || 'N/A',
      'Details': a.details || '',
    }));
    addSheet('Audit Trail', activityRows);
  }

  // Trigger browser download of real XLSX file
  const fullFileName = `${fileNamePrefix}_${type}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fullFileName);
};
