import * as XLSX from 'xlsx';
import { saveFileForUser, SaveResult } from '../lib/nativeFiles';
import { currencyLabel, fmtDateTime, tr } from '../lib/locale';
import { actionLabel, categoryLabel, detailsLabel, paymentLabel, poultryTypeLabel, productLabel, statusLabel } from '../lib/labels';
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

export interface ExportResult {
  fileName: string;
  save: SaveResult;
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const exportToExcel = async (
  type: 'all' | 'poultry' | 'eggs' | 'sales' | 'expenses' | 'brooding' | 'financials' | 'activity',
  data: ExportDataPayload,
  fileNamePrefix = 'KukuTrack_Report'
): Promise<ExportResult> => {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().split('T')[0];
  const cur = currencyLabel();
  const na = tr('N/A', 'Hakuna');

  // Every sheet name, column title and known value follows the language on screen
  const addSheet = (sheetName: string, rows: Record<string, any>[]) => {
    const name = sheetName.slice(0, 31);
    if (rows && rows.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
    } else {
      const ws = XLSX.utils.json_to_sheet([
        { [tr('Notice', 'Taarifa')]: tr('No records available for this period', 'Hakuna kumbukumbu kwa kipindi hiki') },
      ]);
      XLSX.utils.book_append_sheet(wb, ws, name);
    }
  };

  if (type === 'poultry' || type === 'all') {
    const rows = (data.poultry || []).map((p) => ({
      [tr('Poultry Type', 'Aina ya Ndege')]: poultryTypeLabel(p.poultry_type),
      [tr('Breed', 'Aina au Ukoo')]: p.breed,
      [tr('Initial Qty', 'Idadi ya Awali')]: p.initial_quantity,
      [tr('Current Qty', 'Idadi ya Sasa')]: p.current_quantity,
      [tr('Male Qty', 'Madume')]: p.male_quantity,
      [tr('Female Qty', 'Majike')]: p.female_quantity,
      [tr('Young Birds', 'Ndege Wadogo')]: p.young_birds,
      [tr('Adult Birds', 'Ndege Wakubwa')]: p.adult_birds,
      [tr('Mortality', 'Vifo')]: p.mortality,
      [tr('Sold Qty', 'Waliouzwa')]: p.sold_quantity,
      [`${tr('Purchase Cost', 'Gharama ya Ununuzi')} (${cur})`]: Number(p.purchase_cost || 0),
      [`${tr('Current Worth per Bird', 'Thamani ya Sasa kwa Ndege')} (${cur})`]: Number(p.unit_value || 0),
      [tr('Date Acquired', 'Tarehe ya Kupatikana')]: p.date_acquired,
      [tr('Source', 'Chanzo')]: p.source || na,
      [tr('Notes', 'Maelezo')]: p.notes || '',
    }));
    addSheet(tr('Poultry Inventory', 'Hesabu ya Ndege'), rows);
  }

  if (type === 'eggs' || type === 'all') {
    const rows = (data.eggs || []).map((e) => ({
      [tr('Date', 'Tarehe')]: e.production_date,
      [tr('Active Hens', 'Kuku Wanaotaga')]: e.hen_count,
      [tr('Eggs Collected', 'Mayai Yaliyokusanywa')]: e.eggs_collected,
      [tr('Broken Eggs', 'Mayai Yaliyovunjika')]: e.broken_eggs,
      [tr('Spoiled Eggs', 'Mayai Yaliyoharibika')]: e.spoiled_eggs,
      [tr('Eggs Sold', 'Mayai Yaliyouzwa')]: e.eggs_sold,
      [tr('Internal Use', 'Matumizi ya Nyumbani')]: e.eggs_used_internally,
      [tr('Remaining Usable', 'Yaliyobaki Yanayofaa')]: e.remaining_eggs,
      [`${tr('Unit Price', 'Bei ya Yai Moja')} (${cur})`]: Number(e.selling_price_per_egg || 0),
      [`${tr('Total Revenue', 'Jumla ya Mapato')} (${cur})`]: Number(e.total_egg_revenue || 0),
      [tr('Notes', 'Maelezo')]: e.notes || '',
    }));
    addSheet(tr('Egg Production', 'Uzalishaji wa Mayai'), rows);
  }

  if (type === 'sales' || type === 'all') {
    const rows = (data.sales || []).map((s) => ({
      [tr('Sale Date', 'Tarehe ya Mauzo')]: s.sale_date,
      [tr('Product', 'Bidhaa')]: productLabel(s.product),
      [tr('Poultry Type', 'Aina ya Ndege')]: s.poultry_type ? poultryTypeLabel(s.poultry_type) : na,
      [tr('Quantity', 'Idadi')]: s.quantity,
      [`${tr('Unit Price', 'Bei ya Kimoja')} (${cur})`]: Number(s.unit_price || 0),
      [`${tr('Total Amount', 'Jumla ya Fedha')} (${cur})`]: Number(s.total_amount || 0),
      [`${tr('Amount Paid', 'Kilicholipwa')} (${cur})`]: Number(s.amount_paid || 0),
      [`${tr('Balance', 'Salio')} (${cur})`]: Number(s.balance || 0),
      [tr('Customer Name', 'Jina la Mteja')]: s.customer_name,
      [tr('Customer Phone', 'Simu ya Mteja')]: s.customer_phone || na,
      [tr('Payment Method', 'Njia ya Malipo')]: paymentLabel(s.payment_method),
      [tr('Notes', 'Maelezo')]: s.notes || '',
    }));
    addSheet(tr('Sales Records', 'Rekodi za Mauzo'), rows);
  }

  if (type === 'expenses' || type === 'all') {
    const rows = (data.expenses || []).map((ex) => ({
      [tr('Date', 'Tarehe')]: ex.expense_date,
      [tr('Category', 'Aina ya Gharama')]: categoryLabel(ex.category),
      [tr('Description', 'Maelezo ya Gharama')]: ex.description,
      [`${tr('Amount', 'Kiasi')} (${cur})`]: Number(ex.amount || 0),
      [tr('Payment Method', 'Njia ya Malipo')]: paymentLabel(ex.payment_method),
      [tr('Person Responsible', 'Aliyehusika')]: ex.person_responsible || na,
      [tr('Receipt Ref', 'Rejea ya Risiti')]: ex.receipt_reference || na,
      [tr('Notes', 'Maelezo')]: ex.notes || '',
    }));
    addSheet(tr('Farm Expenses', 'Gharama za Shamba'), rows);
  }

  if (type === 'brooding' || type === 'all') {
    const rows = (data.brooding || []).map((b) => ({
      [tr('Mother / Tag', 'Ndege Mlezi / Lebo')]: b.mother_bird_tag || na,
      [tr('Poultry Type', 'Aina ya Ndege')]: poultryTypeLabel(b.poultry_type),
      [tr('Number of Eggs', 'Idadi ya Mayai')]: b.number_of_eggs,
      [tr('Incubation Days', 'Siku za Kutotolewa')]: b.incubation_days,
      [tr('Start Date', 'Tarehe ya Kuanza')]: b.start_date,
      [tr('Expected Hatch Date', 'Tarehe Inayotarajiwa ya Kutotolewa')]: b.expected_hatch_date,
      [tr('Actual Hatch Date', 'Tarehe Halisi ya Kutotolewa')]: b.actual_hatch_date || tr('In Progress', 'Inaendelea'),
      [tr('Eggs Hatched', 'Mayai Yaliyototolewa')]: b.eggs_hatched,
      [tr('Eggs Failed', 'Mayai Yaliyoshindwa')]: b.eggs_failed,
      [tr('Chicks Produced', 'Vifaranga Vilivyopatikana')]: b.chicks_produced,
      [tr('Status', 'Hali')]: statusLabel(b.status),
      [tr('Notes', 'Maelezo')]: b.notes || '',
    }));
    addSheet(tr('Brooding & Hatching', 'Utotoleshaji'), rows);
  }

  if (type === 'financials' || type === 'all') {
    if (data.financials) {
      const fin = data.financials;
      const metric = tr('Metric', 'Kipimo');
      const value = tr('Value', 'Thamani');
      const row = (en: string, sw: string, v: number) => ({ [metric]: `${tr(en, sw)} (${cur})`, [value]: v });
      addSheet(tr('Financial Summary', 'Muhtasari wa Fedha'), [
        row('Total Gross Revenue', 'Jumla ya Mapato', fin.totalRevenue),
        row('Total Stock Purchase Costs', 'Gharama za Kununua Ndege', fin.poultryPurchaseCost),
        row('Total Operating Expenses', 'Gharama za Uendeshaji', fin.totalExpenses - fin.poultryPurchaseCost),
        row('Total Combined Expenses', 'Jumla ya Gharama Zote', fin.totalExpenses),
        row('Gross Profit', 'Faida ya Awali', fin.grossProfit),
        row('Net Operating Profit', 'Faida Halisi', fin.netProfit),
        row('Total Cash Received', 'Pesa Taslimu Zilizopokelewa', fin.cashReceived),
        row('Customer Outstanding Receivables', 'Madeni ya Wateja', fin.totalOutstandingBalance),
        row('Feed Expenses', 'Gharama za Chakula', fin.feedExpenses),
        row('Medication & Vaccines Expenses', 'Gharama za Dawa na Chanjo', fin.medicationExpenses),
      ]);

      if (fin.monthlyBreakdown && fin.monthlyBreakdown.length > 0) {
        const rows = fin.monthlyBreakdown.map((m) => ({
          [tr('Month', 'Mwezi')]: m.month,
          [`${tr('Revenue', 'Mapato')} (${cur})`]: m.revenue,
          [`${tr('Expenses', 'Gharama')} (${cur})`]: m.expenses,
          [`${tr('Net Profit', 'Faida Halisi')} (${cur})`]: m.profit,
        }));
        addSheet(tr('Monthly Profit Breakdown', 'Faida kwa Mwezi'), rows);
      }
    }
  }

  if (type === 'activity' || type === 'all') {
    const rows = (data.activityLogs || []).map((a) => ({
      [tr('Timestamp', 'Wakati')]: fmtDateTime(a.created_at),
      [tr('User Email', 'Barua Pepe ya Mtumiaji')]: a.user_email || tr('System', 'Mfumo'),
      [tr('Action', 'Kitendo')]: actionLabel(a.action),
      [tr('Record Type', 'Aina ya Rekodi')]: a.record_type,
      [tr('Record ID', 'Namba ya Rekodi')]: a.record_id || na,
      [tr('Details', 'Maelezo')]: detailsLabel(a.details),
    }));
    addSheet(tr('Audit Trail', 'Kumbukumbu za Shughuli'), rows);
  }

  // Safe for file names: add the time so exporting twice in one day never clashes
  const timeStr = new Date().toTimeString().slice(0, 5).replace(':', '');
  const prefix = tr(fileNamePrefix, fileNamePrefix === 'KukuTrack_FullMaster' ? 'KukuTrack_Nakala_Kamili' : 'KukuTrack_Ripoti');
  const typeWord = tr(type, ({ all: 'yote', poultry: 'ndege', eggs: 'mayai', sales: 'mauzo', expenses: 'gharama', brooding: 'utotoleshaji', financials: 'fedha', activity: 'shughuli' } as Record<string, string>)[type] || type);
  const fullFileName = `${prefix}_${typeWord}_${dateStr}_${timeStr}.xlsx`;

  // Real XLSX file. Browser: normal download. Android app: saved into the Downloads folder.
  const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' }) as string;
  const save = await saveFileForUser(fullFileName, base64, XLSX_MIME, () => XLSX.writeFile(wb, fullFileName));
  return { fileName: fullFileName, save };
};

/** Friendly sentence for a toast after exporting */
export const describeExport = (r: ExportResult, isSw: boolean): string => {
  switch (r.save.status) {
    case 'downloaded':
      return isSw
        ? `Faili limehifadhiwa kwenye folda ya Vipakuliwa: ${r.fileName}`
        : `Saved to your Downloads folder: ${r.fileName}`;
    case 'shared':
      return isSw ? 'Chagua mahali pa kuhifadhi faili.' : 'Choose where to save the file.';
    default:
      return isSw ? `Faili limepakuliwa: ${r.fileName}` : `Downloaded: ${r.fileName}`;
  }
};
