export type Language = 'en' | 'sw';

export interface Translations {
  // Navigation & General
  appName: string;
  tagline: string;
  dashboard: string;
  flockStock: string;
  eggProduction: string;
  broodingHatching: string;
  expenses: string;
  sales: string;
  financials: string;
  reports: string;
  newsAdvisory: string;
  adminPanel: string;
  settings: string;
  signOut: string;
  signIn: string;
  signUp: string;
  welcome: string;
  role: string;
  admin: string;
  staff: string;
  active: string;
  inactive: string;
  connected: string;
  disconnected: string;
  currency: string;
  all: string;
  actions: string;
  edit: string;
  delete: string;
  cancel: string;
  save: string;
  saving: string;
  confirm: string;
  search: string;
  filter: string;
  exportExcel: string;
  exporting: string;
  notes: string;
  date: string;
  status: string;
  recordedBy: string;
  loading: string;
  noDataYet: string;
  refresh: string;
  close: string;

  // Theme
  theme: string;
  darkMode: string;
  lightMode: string;
  switchTheme: string;
  switchThemeToLight: string;
  switchThemeToDark: string;

  // Header & Cockpit
  operationalCockpit: string;
  liveNeonGrid: string;
  cockpitSubtitle: string;
  welcomeTitle: string;
  welcomeDesc: string;

  // StatCard & KPIs
  femalePoultryLabel: string;
  femalePoultrySubtitle: string;
  malePoultryLabel: string;
  malePoultrySubtitle: string;
  batchesRegistered: string;
  inReserve: string;
  soldToCustomers: string;
  upcomingHatchingsLabel: string;
  batchesInIncubation: string;
  transactionsCount: string;
  operatingCostsCount: string;
  profitableLabel: string;
  deficitLabel: string;
  outstandingBalancesLabel: string;
  uncollectedReceivables: string;
  clearStatus: string;
  receivablesStatus: string;
  revenueTrend: string;
  costsTrend: string;
  inflowTrend: string;
  outflowTrend: string;

  // Dashboard Charts
  flockByCategory: string;
  birds: string;
  recentDays: string;
  salesRevenueByProduct: string;
  salesVsExpenses: string;

  // Poultry Stock
  poultryTitle: string;
  addPoultry: string;
  editPoultry: string;
  poultryType: string;
  breed: string;
  initialQuantity: string;
  currentQuantity: string;
  maleQty: string;
  femaleQty: string;
  youngBirds: string;
  adultBirds: string;
  dateAcquired: string;
  source: string;
  purchaseCost: string;
  mortality: string;
  soldQty: string;
  recordMortality: string;
  mortalityReason: string;
  deadBirdsCount: string;
  stockSummary: string;
  totalFlock: string;
  allTypes: string;
  totalCurrentFlock: string;
  batchVariety: string;
  dateAcquiredCol: string;
  initialCol: string;
  mortalityCol: string;
  soldCol: string;
  currentStockCol: string;
  genderCol: string;
  costCol: string;
  deletePoultryConfirm: string;
  deletePoultryTitle: string;
  noPoultryFound: string;
  noPoultryDesc: string;
  customPoultryType: string;
  customPoultryTypePlaceholder: string;
  breedPlaceholder: string;
  sourcePlaceholder: string;
  notesPlaceholder: string;

  // Poultry types
  indigenousChicken: string;
  crossbredChicken: string;
  broiler: string;
  layer: string;
  duck: string;
  turkey: string;
  otherPoultry: string;

  // Egg Production
  eggTitle: string;
  logEggProduction: string;
  hensCount: string;
  eggsCollected: string;
  brokenEggs: string;
  spoiledEggs: string;
  eggsSold: string;
  eggsUsedInternally: string;
  remainingEggs: string;
  pricePerEgg: string;
  eggRevenue: string;
  collectionDate: string;
  rateCol: string;
  deleteEggConfirm: string;
  deleteEggTitle: string;
  damagedSpoiled: string;
  filterByDate: string;
  clearFilter: string;
  noEggsFound: string;
  noEggsDesc: string;
  layingHensCol: string;
  collectedCol: string;
  damagedCol: string;
  usedFarmCol: string;
  remainingCol: string;
  ratePctCol: string;

  // Brooding & Hatching
  broodingTitle: string;
  newBroodingBatch: string;
  motherBirdTag: string;
  incubationDays: string;
  startDate: string;
  expectedHatchDate: string;
  actualHatchDate: string;
  eggsHatched: string;
  eggsFailed: string;
  chicksProduced: string;
  updateHatchOutcome: string;
  daysRemaining: string;
  hatchRate: string;
  deleteBroodingConfirm: string;
  deleteBroodingTitle: string;
  incubationNotice: string;
  noBroodingFound: string;
  noBroodingDesc: string;
  poultryTagCol: string;
  eggsSetCol: string;
  settingDateCol: string;
  expectedHatchCol: string;
  hatchedCol: string;
  chicksCol: string;
  statusCol: string;
  dueBadge: string;
  standardBatchTag: string;

  // Expenses
  expensesTitle: string;
  addExpense: string;
  expenseCategory: string;
  description: string;
  amount: string;
  paymentMethod: string;
  personResponsible: string;
  receiptReference: string;
  addCategory: string;
  totalExpenses: string;
  feedExpenses: string;
  medicationExpenses: string;
  cashMethod: string;
  bankMethod: string;
  mobileMpesa: string;
  mobileAirtel: string;
  mobileTigo: string;
  creditMethod: string;
  deleteExpenseConfirm: string;
  deleteExpenseTitle: string;
  noExpensesFound: string;
  noExpensesDesc: string;
  expenseDateCol: string;
  expenseCategoryCol: string;
  expenseDescriptionCol: string;
  expenseAmountCol: string;
  expenseMethodCol: string;
  expenseResponsibleCol: string;

  // Sales
  salesTitle: string;
  newSale: string;
  productSold: string;
  selectStock: string;
  quantity: string;
  unitPrice: string;
  totalAmount: string;
  customerName: string;
  customerPhone: string;
  amountPaid: string;
  balanceDue: string;
  totalSales: string;
  fullyPaid: string;
  partial: string;
  deleteSaleConfirm: string;
  deleteSaleTitle: string;
  noSalesFound: string;
  noSalesDesc: string;
  saleDateCol: string;
  saleCustomerCol: string;
  saleProductCol: string;
  saleQtyCol: string;
  salePriceCol: string;
  saleTotalCol: string;
  salePaidCol: string;
  saleBalanceCol: string;

  // Financials
  financialOverview: string;
  totalRevenue: string;
  grossProfit: string;
  netProfit: string;
  poultryPurchases: string;
  operatingExpenses: string;
  outstandingReceivables: string;
  cashReceived: string;
  monthlyBreakdown: string;
  financialHealth: string;
  allProductSalesSub: string;
  feedVaccinesLabourSub: string;
  grossProfitSub: string;
  netProfitSub: string;
  otherOperatingCosts: string;
  cashFlowRealization: string;
  totalBilledSales: string;
  actualCashReceived: string;
  totalDisbursements: string;
  uncollectedDebt: string;
  collectionRate: string;
  liquidityStatus: string;
  healthyMargin: string;
  negativeMargin: string;
  periodMonthCol: string;
  revenueCol: string;
  expensesCol: string;
  netProfitCol: string;

  // Reports
  reportsCenter: string;
  period: string;
  today: string;
  thisWeek: string;
  thisMonth: string;
  thisYear: string;
  customRange: string;
  startDateLabel: string;
  endDateLabel: string;
  generateReport: string;
  completeBusinessReport: string;
  filteredSalesVol: string;
  filteredExpensesVol: string;
  filteredEggsVol: string;
  filteredBroodingVol: string;
  downloadExcelTitle: string;
  exportMasterBtn: string;
  salesLedgerExport: string;
  salesLedgerDesc: string;
  exportSalesBtn: string;
  expensesLedgerExport: string;
  expensesLedgerDesc: string;
  exportExpensesBtn: string;
  eggLedgerExport: string;
  eggLedgerDesc: string;
  exportEggsBtn: string;
  flockLedgerExport: string;
  flockLedgerDesc: string;
  exportFlockBtn: string;
  broodingLedgerExport: string;
  broodingLedgerDesc: string;
  exportBroodingBtn: string;

  // News & Advisory
  liveFeed: string;
  dispatchNews: string;
  dispatchNewsModalTitle: string;
  dispatchNewsModalDesc: string;
  quickTemplates: string;
  targetRecipient: string;
  broadcastAll: string;
  specificUser: string;
  advisoryCategory: string;
  priorityLevel: string;
  advisoryHeadline: string;
  detailedAdvisory: string;
  sendAdvisory: string;
  dispatching: string;
  diseaseOutbreak: string;
  feedingNutritionCat: string;
  broodingHatchingCat: string;
  marketPricesCat: string;
  managementTipsCat: string;
  generalAnnouncement: string;
  priorityUrgent: string;
  priorityHigh: string;
  priorityNormal: string;
  authorLabel: string;
  sentToLabel: string;
  noNewsAvailable: string;
  noNewsDesc: string;
  targetedAdvisoryYou: string;
  smartSuggestionFlock: string;
  farmerIntelligence: string;
  suggestAdvisory: string;
  customFarmAdvisory: string;
  deleteNewsTitle: string;
  deleteNewsConfirm: string;

  // Account Data Management
  accountDataManagement: string;
  accountDataManagementDesc: string;
  clearErroneousData: string;
  clearDataBtn: string;
  fullAccountReset: string;
  fullAccountResetDesc: string;
  resetAllDataBtn: string;
  confirmDataDeletion: string;
  confirmDataDeletionDesc: string;
  yesDeleteData: string;

  // Admin Dashboard
  adminDashboard: string;
  registeredUsers: string;
  userManagement: string;
  dangerZone: string;
  dangerWarning: string;
  resetDatabase: string;
  resetConfirmPrompt: string;
  deleteEverythingPrompt: string;
  resetWarningText: string;
  resetSuccessText: string;
  deleteRecord: string;
  deleteUser: string;
  deactivateUser: string;
  activateUser: string;
  makeAdmin: string;
  makeStaff: string;
  activityLog: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
  adminGovernanceDesc: string;
  firstUserAdminNote: string;
  userNameCol: string;
  emailCol: string;
  roleCol: string;
  userStatusCol: string;
  registeredAtCol: string;
  youBadge: string;
  teamMemberDefault: string;
  userRoleToggleTitle: string;

  // Auth
  createAdminAccount: string;
  createStaffAccount: string;
  firstRunNotice: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  alreadyHaveAccount: string;
  dontHaveAccount: string;
  authError: string;
  signUpSuccess: string;
  registerAccountTab: string;
  adminRegistrationTitle: string;
  newUserRegistrationTitle: string;
  adminRegistrationDesc: string;
  newUserRegistrationDesc: string;
  signInTitle: string;
  signInDesc: string;
  deleteErroneousDataBtn: string;
  memberSinceLabel: string;
  emailLabel: string;
  fullNameLabel: string;
  phoneLabel: string;
  roleLabel: string;
  supabaseSetupTitle: string;
  supabaseSetupDesc: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'KukuTrack',
    tagline: 'Poultry Business Management Platform',
    dashboard: 'Dashboard',
    flockStock: 'Flock Inventory',
    eggProduction: 'Egg Production',
    broodingHatching: 'Brooding & Hatching',
    expenses: 'Farm Expenses',
    sales: 'Sales & Invoicing',
    financials: 'Financials & Profit',
    reports: 'Reports & Analytics',
    newsAdvisory: 'News & Advisory',
    adminPanel: 'Admin Console',
    settings: 'Settings',
    signOut: 'Sign Out',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    welcome: 'Welcome',
    role: 'Role',
    admin: 'Administrator',
    staff: 'Staff Member',
    active: 'Active',
    inactive: 'Deactivated',
    connected: 'Realtime Connected',
    disconnected: 'Offline / Reconnecting',
    currency: 'TZS',
    all: 'All',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save Record',
    saving: 'Saving...',
    confirm: 'Confirm',
    search: 'Search records...',
    filter: 'Filter',
    exportExcel: 'Export to Excel',
    exporting: 'Exporting...',
    notes: 'Notes / Remarks',
    date: 'Date',
    status: 'Status',
    recordedBy: 'Recorded By',
    loading: 'Loading real data from Supabase...',
    noDataYet: 'No records available yet.',
    refresh: 'Refresh',
    close: 'Close',

    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    switchTheme: 'Toggle Theme',
    switchThemeToLight: 'Switch to Light Mode',
    switchThemeToDark: 'Switch to Dark Mode',

    operationalCockpit: 'Operational Cockpit',
    liveNeonGrid: 'Live Neon Grid',
    cockpitSubtitle: 'Realtime poultry inventory, laying yield, sales ledger & financials',
    welcomeTitle: 'Welcome to KukuTrack Poultry Business Management',
    welcomeDesc: 'Sign in or create your account to log live sales, flock batches, track incubation, and manage permissions.',

    femalePoultryLabel: 'Females (Layers / Breeding)',
    femalePoultrySubtitle: 'Layers / Breeding stock',
    malePoultryLabel: 'Males (Roosters / Drakes)',
    malePoultrySubtitle: 'Roosters / Breeding males',
    batchesRegistered: 'batches registered',
    inReserve: 'in reserve',
    soldToCustomers: 'Sold to customers',
    upcomingHatchingsLabel: 'Upcoming Hatchings',
    batchesInIncubation: 'Batches in incubation',
    transactionsCount: 'transactions',
    operatingCostsCount: 'operating costs',
    profitableLabel: 'Profitable',
    deficitLabel: 'Deficit',
    outstandingBalancesLabel: 'Outstanding Balances',
    uncollectedReceivables: 'Uncollected customer debt',
    clearStatus: 'Clear',
    receivablesStatus: 'Receivables',
    revenueTrend: '+ Revenue',
    costsTrend: '- Costs',
    inflowTrend: '+ Inflow',
    outflowTrend: '- Outflow',

    flockByCategory: 'Flock Stock by Poultry Category',
    birds: 'birds',
    recentDays: 'Recent Days',
    salesRevenueByProduct: 'Sales Revenue by Product',
    salesVsExpenses: 'Sales vs Expenses',

    poultryTitle: 'Flock & Poultry Stock Management',
    addPoultry: 'Add Poultry Batch',
    editPoultry: 'Edit Poultry Batch',
    poultryType: 'Poultry Type',
    breed: 'Breed / Variety',
    initialQuantity: 'Initial Qty Acquired',
    currentQuantity: 'Current Available Stock',
    maleQty: 'Male Count',
    femaleQty: 'Female Count',
    youngBirds: 'Young / Chicks',
    adultBirds: 'Adult Birds',
    dateAcquired: 'Date Acquired',
    source: 'Source / Supplier',
    purchaseCost: 'Total Purchase Cost (TZS)',
    mortality: 'Mortality (Deaths)',
    soldQty: 'Sold Count',
    recordMortality: 'Record Mortality / Death',
    mortalityReason: 'Cause of Mortality',
    deadBirdsCount: 'Number of Dead Birds',
    stockSummary: 'Total Active Birds',
    totalFlock: 'Total Birds',
    allTypes: 'All Types',
    totalCurrentFlock: 'Total Current Flock',
    batchVariety: 'Batch / Variety',
    dateAcquiredCol: 'Date Acquired',
    initialCol: 'Initial',
    mortalityCol: 'Mortality',
    soldCol: 'Sold',
    currentStockCol: 'Current Stock',
    genderCol: 'Gender (M/F)',
    costCol: 'Cost (TZS)',
    deletePoultryConfirm: 'Are you sure you want to delete this poultry batch? This action cannot be undone.',
    deletePoultryTitle: 'Delete Poultry Stock Batch',
    noPoultryFound: 'No matching poultry batches found',
    noPoultryDesc: 'Try changing your search term or poultry type filter.',
    customPoultryType: 'Custom Poultry Type',
    customPoultryTypePlaceholder: 'e.g. Quail, Guinea Fowl',
    breedPlaceholder: 'e.g. Kuroiler, Sasso, Cobb 500',
    sourcePlaceholder: 'e.g. Silverlands Hatchery',
    notesPlaceholder: 'e.g. Vaccinated for Gumboro on arrival',

    indigenousChicken: 'Indigenous Chicken (Kienyeji)',
    crossbredChicken: 'Crossbred / Dual-Purpose (Chotara)',
    broiler: 'Commercial Broiler (Meat)',
    layer: 'Commercial Layer (Eggs)',
    duck: 'Duck (Bata)',
    turkey: 'Turkey (Bata Mzinga)',
    otherPoultry: 'Other Poultry Species',

    eggTitle: 'Daily Egg Production & Yield',
    logEggProduction: 'Record Egg Collection',
    hensCount: 'Total Laying Hens (Flock)',
    eggsCollected: 'Eggs Collected Today',
    brokenEggs: 'Broken / Cracked Eggs',
    spoiledEggs: 'Spoiled / Deformed Eggs',
    eggsSold: 'Eggs Sold Today',
    eggsUsedInternally: 'Eggs Used for Farm / Incubation',
    remainingEggs: 'Remaining Eggs in Stock',
    pricePerEgg: 'Unit Price Per Egg (TZS)',
    eggRevenue: 'Egg Sales Revenue',
    collectionDate: 'Collection Date',
    rateCol: 'Laying Rate %',
    deleteEggConfirm: 'Are you sure you want to delete this egg production record? This action cannot be undone.',
    deleteEggTitle: 'Delete Egg Record',
    damagedSpoiled: 'Damaged / Spoiled',
    filterByDate: 'Filter by date (YYYY-MM)...',
    clearFilter: 'Clear Filter',
    noEggsFound: 'No egg records match this filter',
    noEggsDesc: 'Try clearing your date filter or add a new record.',
    layingHensCol: 'Laying Hens',
    collectedCol: 'Collected',
    damagedCol: 'Broken/Spoiled',
    usedFarmCol: 'Used Farm',
    remainingCol: 'Remaining',
    ratePctCol: 'Rate %',

    broodingTitle: 'Brooding & Incubation Tracker',
    newBroodingBatch: 'New Brooding / Hatch Batch',
    motherBirdTag: 'Hen Tag / Incubator Unit ID',
    incubationDays: 'Incubation Duration (Days)',
    startDate: 'Date Set for Incubation',
    expectedHatchDate: 'Calculated Hatch Date',
    actualHatchDate: 'Actual Hatch Date',
    eggsHatched: 'Number of Hatched Eggs',
    eggsFailed: 'Failed / Unfertilized Eggs',
    chicksProduced: 'Healthy Chicks Produced',
    updateHatchOutcome: 'Log Hatch Outcome',
    daysRemaining: 'Days Until Hatch',
    hatchRate: 'Hatch Success Rate %',
    deleteBroodingConfirm: 'Are you sure you want to delete this incubation batch? This action cannot be undone.',
    deleteBroodingTitle: 'Delete Brooding Batch',
    incubationNotice: 'Default incubation: Chicken 21 days · Duck 40 days',
    noBroodingFound: 'No brooding records found',
    noBroodingDesc: 'Register your first brooding batch or incubator run.',
    poultryTagCol: 'Poultry / Tag',
    eggsSetCol: 'Eggs Set',
    settingDateCol: 'Setting Date',
    expectedHatchCol: 'Expected Hatch',
    hatchedCol: 'Hatched',
    chicksCol: 'Chicks',
    statusCol: 'Status',
    dueBadge: 'Due',
    standardBatchTag: 'Standard Batch',

    expensesTitle: 'Farm Operating Expenses',
    addExpense: 'Add Expense Record',
    expenseCategory: 'Expense Category',
    description: 'Expense Details / Purpose',
    amount: 'Amount Spent (TZS)',
    paymentMethod: 'Payment Channel',
    personResponsible: 'Authorized Person',
    receiptReference: 'Receipt # / Reference',
    addCategory: 'Create New Category',
    totalExpenses: 'Total Operational Costs',
    feedExpenses: 'Feed & Nutrition Costs',
    medicationExpenses: 'Vaccines & Medication Costs',
    cashMethod: 'Cash',
    bankMethod: 'Bank Transfer',
    mobileMpesa: 'M-Pesa Mobile Money',
    mobileAirtel: 'Airtel Money',
    mobileTigo: 'Tigo Pesa',
    creditMethod: 'Credit / Pay Later',
    deleteExpenseConfirm: 'Are you sure you want to delete this expense record? This action cannot be undone.',
    deleteExpenseTitle: 'Delete Expense Record',
    noExpensesFound: 'No matching expense entries found',
    noExpensesDesc: 'Try changing your search term or category filter.',
    expenseDateCol: 'Date',
    expenseCategoryCol: 'Category',
    expenseDescriptionCol: 'Description',
    expenseAmountCol: 'Amount (TZS)',
    expenseMethodCol: 'Payment Method',
    expenseResponsibleCol: 'Responsible',

    salesTitle: 'Sales Ledger & Customer Orders',
    newSale: 'Record New Sale',
    productSold: 'Item / Product Sold',
    selectStock: 'Flock Batch (If Live Birds)',
    quantity: 'Quantity Sold',
    unitPrice: 'Unit Selling Price (TZS)',
    totalAmount: 'Total Billed Amount (TZS)',
    customerName: 'Customer Name',
    customerPhone: 'Customer Phone',
    amountPaid: 'Amount Paid (TZS)',
    balanceDue: 'Outstanding Balance (TZS)',
    totalSales: 'Gross Sales Revenue',
    fullyPaid: 'Fully Paid',
    partial: 'Partial Payment',
    deleteSaleConfirm: 'Are you sure you want to delete this sales transaction? This action cannot be undone.',
    deleteSaleTitle: 'Delete Sale Record',
    noSalesFound: 'No matching sales records found',
    noSalesDesc: 'Try changing your search term or add a new sale.',
    saleDateCol: 'Date',
    saleCustomerCol: 'Customer',
    saleProductCol: 'Product',
    saleQtyCol: 'Qty',
    salePriceCol: 'Unit Price',
    saleTotalCol: 'Total (TZS)',
    salePaidCol: 'Paid',
    saleBalanceCol: 'Balance',

    financialOverview: 'Financial Overview & P&L',
    totalRevenue: 'Total Gross Inflow',
    grossProfit: 'Gross Operating Profit',
    netProfit: 'Net Farm Profit',
    poultryPurchases: 'Flock Acquisition Costs',
    operatingExpenses: 'Direct Farm Expenses',
    outstandingReceivables: 'Customer Receivables',
    cashReceived: 'Cash Actually Collected',
    monthlyBreakdown: 'Monthly Financial Breakdown',
    financialHealth: 'Farm Financial Stability',
    allProductSalesSub: 'All product & poultry sales',
    feedVaccinesLabourSub: 'Feed, vaccines, labour & stock',
    grossProfitSub: 'Revenue minus stock cost',
    netProfitSub: 'Net after all operating costs',
    otherOperatingCosts: 'Other Operating Costs',
    cashFlowRealization: 'Cash Flow Realization',
    totalBilledSales: 'Total Billed Sales:',
    actualCashReceived: 'Actual Cash Received:',
    totalDisbursements: 'Total Operational Disbursements:',
    uncollectedDebt: 'Uncollected Customer Debt:',
    collectionRate: 'Collection Rate:',
    liquidityStatus: 'Financial Liquidity Status:',
    healthyMargin: 'Healthy Operating Margin',
    negativeMargin: 'Negative Margin',
    periodMonthCol: 'Period (Month)',
    revenueCol: 'Revenue (TZS)',
    expensesCol: 'Expenses (TZS)',
    netProfitCol: 'Net Profit (TZS)',

    reportsCenter: 'Certified Business Reports',
    period: 'Reporting Timeline',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    customRange: 'Custom Date Range',
    startDateLabel: 'Start Date',
    endDateLabel: 'End Date',
    generateReport: 'Generate Workbook',
    completeBusinessReport: 'Comprehensive Farm Excel Master',
    filteredSalesVol: 'Filtered Sales Volume',
    filteredExpensesVol: 'Filtered Operational Expenses',
    filteredEggsVol: 'Filtered Eggs Collected',
    filteredBroodingVol: 'Filtered Incubations',
    downloadExcelTitle: 'Download Certified Business Excel (.xlsx) Files',
    exportMasterBtn: 'Export Full Master Excel',
    salesLedgerExport: 'Sales Ledger Export',
    salesLedgerDesc: 'Complete sales register including customer details, products, quantities, prices, paid amounts, and outstanding balances.',
    exportSalesBtn: 'Export Sales Sheet',
    expensesLedgerExport: 'Farm Expenses Ledger',
    expensesLedgerDesc: 'Itemized expense logs categorized by feed, vaccines, medication, equipment, labour, and transport.',
    exportExpensesBtn: 'Export Expenses Sheet',
    eggLedgerExport: 'Egg Production Ledger',
    eggLedgerDesc: 'Daily egg collections, damaged eggs, sales, internal consumption, and reserves.',
    exportEggsBtn: 'Export Egg Sheet',
    flockLedgerExport: 'Flock Inventory Ledger',
    flockLedgerDesc: 'Active bird counts, mortality logs, sales, gender balance, and flock acquisition costs.',
    exportFlockBtn: 'Export Flock Sheet',
    broodingLedgerExport: 'Brooding & Incubation Ledger',
    broodingLedgerDesc: 'Brooding runs, setting dates, expected hatch dates, hatching rates, and chicks produced.',
    exportBroodingBtn: 'Export Brooding Sheet',

    liveFeed: 'Live Communications',
    dispatchNews: 'Dispatch Advisory / News',
    dispatchNewsModalTitle: 'Dispatch Farm Advisory / Announcement',
    dispatchNewsModalDesc: 'Send tailored guidance to all farmers or a specific recipient',
    quickTemplates: 'Quick Advisory Templates',
    targetRecipient: 'Target Recipient (Select User or Broadcast)',
    broadcastAll: '📢 Broadcast to All Users (General News)',
    specificUser: '👤 Specific User',
    advisoryCategory: 'Advisory Category',
    priorityLevel: 'Priority Level',
    advisoryHeadline: 'Headline / Title',
    detailedAdvisory: 'Detailed Advisory & Instructions',
    sendAdvisory: 'Send Advisory',
    dispatching: 'Dispatching...',
    diseaseOutbreak: '🚨 Biosecurity & Disease Precaution',
    feedingNutritionCat: '🌾 Feeding & Nutrition Guidance',
    broodingHatchingCat: '🐣 Brooding & Chick Rearing',
    marketPricesCat: '📈 Market Prices & Egg Valuation',
    managementTipsCat: '💡 Farm Management Tips',
    generalAnnouncement: '📢 General Announcement',
    priorityUrgent: 'URGENT PRIORITY',
    priorityHigh: 'HIGH PRIORITY',
    priorityNormal: 'NORMAL ADVISORY',
    authorLabel: 'Author',
    sentToLabel: 'Sent to',
    noNewsAvailable: 'No announcements or advisories yet',
    noNewsDesc: 'Real announcements and tailored advisories dispatched by farm administration will appear here.',
    targetedAdvisoryYou: 'Personal Advisory from Administrator',
    smartSuggestionFlock: 'Smart Advisory for Your Flock',
    farmerIntelligence: 'Farmer Intelligence & Targeted Dispatch',
    suggestAdvisory: 'Advise User',
    customFarmAdvisory: 'Custom Farm Advisory',
    deleteNewsTitle: 'Delete News / Advisory',
    deleteNewsConfirm: 'Are you sure you want to delete this advisory? It will be removed throughout the entire system.',

    accountDataManagement: 'Account Data Management & Cleanup',
    accountDataManagementDesc: 'Safely clear erroneous data entries or reset specific sections of your account',
    clearErroneousData: 'Clear Erroneous Data Entries',
    clearDataBtn: 'Clear Category Data',
    fullAccountReset: 'Full Account Reset (Clean Slate)',
    fullAccountResetDesc: 'Permanently wipe all operational test data (poultry, eggs, brooding, expenses, and sales) and start fresh.',
    resetAllDataBtn: 'Wipe All My Data',
    confirmDataDeletion: 'Confirm Data Deletion',
    confirmDataDeletionDesc: 'Are you sure you want to delete these records entered in error? This action cannot be reversed.',
    yesDeleteData: 'Yes, Delete This Data',

    adminDashboard: 'Administrator Central Console',
    registeredUsers: 'Registered Team Members',
    userManagement: 'Staff Accounts & Role Governance',
    dangerZone: 'System Danger Zone',
    dangerWarning: 'Irreversible operational actions.',
    resetDatabase: 'Clear This Account\'s Records',
    resetConfirmPrompt: 'Type the confirmation phrase in UPPERCASE to proceed:',
    deleteEverythingPrompt: 'DELETE EVERYTHING',
    resetWarningText: 'This permanently deletes the flock, egg, brooding, expense and sales records of the account you are currently in. Other users\' data is never touched.',
    resetSuccessText: 'All operational records have been permanently cleared.',
    deleteRecord: 'Delete Record',
    deleteUser: 'Delete User Account',
    deactivateUser: 'Deactivate Account',
    activateUser: 'Activate Account',
    makeAdmin: 'Promote to Admin',
    makeStaff: 'Demote to Staff',
    activityLog: 'System Activity Audit Log',
    timestamp: 'Timestamp',
    user: 'User',
    action: 'Action Taken',
    module: 'Module',
    details: 'Details',
    adminGovernanceDesc: 'Manage authorized staff accounts, system role assignments, activity trails, and database governance.',
    firstUserAdminNote: 'First registered user automatically became Administrator.',
    userNameCol: 'User / Name',
    emailCol: 'Email Address',
    roleCol: 'Role',
    userStatusCol: 'Status',
    registeredAtCol: 'Registered At',
    youBadge: 'You',
    teamMemberDefault: 'Team Member',
    userRoleToggleTitle: 'Toggle between Administrator and Staff role',

    createAdminAccount: 'Create Initial Administrator',
    createStaffAccount: 'Register User Account',
    firstRunNotice: 'The first registered account is granted primary administrator privileges.',
    email: 'Email Address',
    password: 'Password',
    fullName: 'Full Name',
    phone: 'Phone Number',
    alreadyHaveAccount: 'Already have an account? Sign in',
    dontHaveAccount: "Don't have an account? Register here",
    authError: 'Authentication error. Please verify your credentials.',
    signUpSuccess: 'Account successfully registered! Signing you in...',
    registerAccountTab: 'Register Account',
    adminRegistrationTitle: 'Administrator Registration',
    newUserRegistrationTitle: 'New User Registration',
    adminRegistrationDesc: 'Primary Administrator access for junior.jacksonmass100@gmail.com',
    newUserRegistrationDesc: 'Register as a standard user. You will have full access to log and manage your poultry, egg, sales & advisory records.',
    signInTitle: 'Sign In to KukuTrack',
    signInDesc: 'Enter your credentials to access your poultry business records',
    deleteErroneousDataBtn: 'Delete Erroneous Account Data',
    memberSinceLabel: 'Member Since',
    emailLabel: 'Email',
    fullNameLabel: 'Full Name',
    phoneLabel: 'Phone',
    roleLabel: 'Role',
    supabaseSetupTitle: 'Connect Supabase Cloud Database',
    supabaseSetupDesc: 'Enable real-time multi-device cloud synchronization and persistent storage for KukuTrack.',
  },

  sw: {
    appName: 'KukuTrack',
    tagline: 'Mfumo wa Kisasa wa Usimamizi wa Biashara ya Kuku',
    dashboard: 'Dashibodi Kuu',
    flockStock: 'Hesabu ya Kuku',
    eggProduction: 'Uzalishaji wa Mayai',
    broodingHatching: 'Utotoleshaji & Kulea Vifaranga',
    expenses: 'Gharama za Shamba',
    sales: 'Mauzo & Ankara',
    financials: 'Fedha & Faida',
    reports: 'Ripoti & Uchambuzi',
    newsAdvisory: 'Habari & Ushauri',
    adminPanel: 'Paneli ya Msimamizi',
    settings: 'Mipangilio',
    signOut: 'Ondoka (Sign Out)',
    signIn: 'Ingia (Sign In)',
    signUp: 'Jisajili (Sign Up)',
    welcome: 'Karibu',
    role: 'Jukumu',
    admin: 'Msimamizi Mkuu',
    staff: 'Mfanyakazi wa Kawaida',
    active: 'Inafanya Kazi',
    inactive: 'Imesimamishwa',
    connected: 'Imeunganishwa Moja kwa Moja',
    disconnected: 'Nje ya Mtandao / Inajaribu Kuunganisha',
    currency: 'TZS',
    all: 'Zote',
    actions: 'Vitendo',
    edit: 'Hariri',
    delete: 'Futa',
    cancel: 'Ghairi',
    save: 'Hifadhi Rekodi',
    saving: 'Inahifadhi...',
    confirm: 'Thibitisha',
    search: 'Tafuta kumbukumbu...',
    filter: 'Chuja',
    exportExcel: 'Pakua Excel',
    exporting: 'Inapakua...',
    notes: 'Maelezo / Vidokezo',
    date: 'Tarehe',
    status: 'Hali',
    recordedBy: 'Imerekodiwa na',
    loading: 'Inapakia takwimu halisi...',
    noDataYet: 'Hakuna kumbukumbu zilizopatikana bado.',
    refresh: 'Pakia Upya',
    close: 'Funga',

    theme: 'Mandhari',
    darkMode: 'Hali ya Giza (Dark)',
    lightMode: 'Hali ya Mwangaza (Light)',
    switchTheme: 'Badilisha Mandhari',
    switchThemeToLight: 'Washa Hali ya Mwangaza',
    switchThemeToDark: 'Washa Hali ya Giza',

    operationalCockpit: 'Kituo cha Uendeshaji Shamba',
    liveNeonGrid: 'Gridi ya Moja kwa Moja',
    cockpitSubtitle: 'Usimamizi wa kuku, uzalishaji wa mayai, mauzo na fedha kwa wakati halisi',
    welcomeTitle: 'Karibu kwenye Mfumo wa Biashara ya Kuku wa KukuTrack',
    welcomeDesc: 'Ingia au sajili akaunti yako kurekodi mauzo, makundi ya kuku, utotoleshaji na kusimamia shamba lako.',

    femalePoultryLabel: 'Kuku Majike (Wanaotaga / Kuzalisha)',
    femalePoultrySubtitle: 'Kuku wa mayai / Uzazi',
    malePoultryLabel: 'Kuku Madume (Majogoo / Mabata)',
    malePoultrySubtitle: 'Majogoo / Madume ya uzazi',
    batchesRegistered: 'makundi yaliyosajiliwa',
    inReserve: 'yaliyopo stoo',
    soldToCustomers: 'Yaliyouzwa kwa wateja',
    upcomingHatchingsLabel: 'Mayai Yanayokaribia Kutotolewa',
    batchesInIncubation: 'Makundi yanayolaliwa',
    transactionsCount: 'miamala ya mauzo',
    operatingCostsCount: 'rekodi za gharama',
    profitableLabel: 'Inatengeneza Faida',
    deficitLabel: 'Hasara / Upungufu',
    outstandingBalancesLabel: 'Madeni Yanayodaiwa',
    uncollectedReceivables: 'Madeni ya wateja ambayo hayajalipwa',
    clearStatus: 'Hakuna Deni',
    receivablesStatus: 'Madeni',
    revenueTrend: '+ Mapato',
    costsTrend: '- Gharama',
    inflowTrend: '+ Pesa Zilizongia',
    outflowTrend: '- Pesa Zilizotoka',

    flockByCategory: 'Mgawanyo wa Kuku kwa Aina',
    birds: 'kuku',
    recentDays: 'Siku za Hivi Karibuni',
    salesRevenueByProduct: 'Mapato ya Mauzo kwa Bidhaa',
    salesVsExpenses: 'Mauzo dhidi ya Gharama',

    poultryTitle: 'Usimamizi wa Makundi & Hesabu ya Kuku',
    addPoultry: 'Ongeza Kundi la Kuku',
    editPoultry: 'Hariri Kundi la Kuku',
    poultryType: 'Aina ya Kuku / Ndege',
    breed: 'Aina / Mbegu ya Kuku',
    initialQuantity: 'Idadi ya Awali Iliyoingia',
    currentQuantity: 'Kuku Waliopo Sasa',
    maleQty: 'Idadi ya Madume',
    femaleQty: 'Idadi ya Majike',
    youngBirds: 'Vifaranga / Wadogo',
    adultBirds: 'Kuku Wakubwa',
    dateAcquired: 'Tarehe ya Kupokea',
    source: 'Chanzo / Muuzaji',
    purchaseCost: 'Gharama ya Kununua (TZS)',
    mortality: 'Vifo Vilivyotokea',
    soldQty: 'Kuku Waliouzwa',
    recordMortality: 'Rekodi Vifo vya Kuku',
    mortalityReason: 'Sababu ya Vifo',
    deadBirdsCount: 'Idadi ya Kuku Waliokufa',
    stockSummary: 'Jumla ya Kuku Walio Hai',
    totalFlock: 'Jumla ya Kuku Wote',
    allTypes: 'Aina Zote',
    totalCurrentFlock: 'Jumla ya Kuku Waliopo Shambani',
    batchVariety: 'Kundi / Mbegu',
    dateAcquiredCol: 'Tarehe ya Kupokea',
    initialCol: 'Idadi ya Awali',
    mortalityCol: 'Vifo',
    soldCol: 'Waliouzwa',
    currentStockCol: 'Waliopo Sasa',
    genderCol: 'Jinsia (Dume/Jike)',
    costCol: 'Gharama (TZS)',
    deletePoultryConfirm: 'Una uhakika unataka kufuta kundi hili la kuku? Kitendo hiki hakiwezi kurudishwa.',
    deletePoultryTitle: 'Futa Kundi la Kuku',
    noPoultryFound: 'Hakuna kundi la kuku linalolingana',
    noPoultryDesc: 'Jaribu kubadilisha neno la utafutaji au chujio la aina ya kuku.',
    customPoultryType: 'Aina Nyingine ya Kuku / Ndege',
    customPoultryTypePlaceholder: 'mf. Kware, Kanga, n.k.',
    breedPlaceholder: 'mf. Kuroiler, Kienyeji, Sasso, Cobb 500',
    sourcePlaceholder: 'mf. Kituo cha Vifaranga Silverlands',
    notesPlaceholder: 'mf. Wamepewa chanjo ya Gumboro walipofika',

    indigenousChicken: 'Kuku wa Kienyeji',
    crossbredChicken: 'Kuku wa Chotara (Dual Purpose)',
    broiler: 'Kuku wa Nyama (Broiler)',
    layer: 'Kuku wa Mayai (Layer)',
    duck: 'Bata wa Kawaida',
    turkey: 'Bata Mzinga',
    otherPoultry: 'Aina Nyingine ya Ndege',

    eggTitle: 'Uzalishaji & Mkusanyiko wa Mayai',
    logEggProduction: 'Rekodi Mkusanyiko wa Mayai',
    hensCount: 'Kuku Wanaotaga (Banda)',
    eggsCollected: 'Mayai Yaliyokusanywa Leo',
    brokenEggs: 'Mayai Yaliyovunjika',
    spoiledEggs: 'Mayai Yaliyoharibika',
    eggsSold: 'Mayai Yaliyouzwa Leo',
    eggsUsedInternally: 'Mayai Yaliyotumika Shambani',
    remainingEggs: 'Mayai Yaliyobaki Stoo',
    pricePerEgg: 'Bei kwa Kila Yai (TZS)',
    eggRevenue: 'Mapato ya Mayai',
    collectionDate: 'Tarehe ya Kukusanya',
    rateCol: 'Kiwango cha Kutaga %',
    deleteEggConfirm: 'Una uhakika unataka kufuta rekodi hii ya mayai? Kitendo hiki hakiwezi kurudishwa.',
    deleteEggTitle: 'Futa Rekodi ya Mayai',
    damagedSpoiled: 'Yaliyovunjika / Kuharibika',
    filterByDate: 'Chuja kwa tarehe (MWAKA-MWEZI)...',
    clearFilter: 'Futa Chujio',
    noEggsFound: 'Hakuna rekodi za mayai kwa chujio hili',
    noEggsDesc: 'Jaribu kufuta chujio la tarehe au weka rekodi mpya ya mkusanyiko.',
    layingHensCol: 'Kuku Wanaotaga',
    collectedCol: 'Yaliyokusanywa',
    damagedCol: 'Yaliyovunjika',
    usedFarmCol: 'Yaliyotumika Shambani',
    remainingCol: 'Yaliyobaki',
    ratePctCol: 'Asilimia %',

    broodingTitle: 'Utotoleshaji & Kulea Vifaranga',
    newBroodingBatch: 'Tega Mayai Mapya ya Kutotolesha',
    motherBirdTag: 'Kuku Mlezi / Namba ya Mashine (Incubator)',
    incubationDays: 'Idadi ya Siku za Kulalia',
    startDate: 'Tarehe ya Kutega Mayai',
    expectedHatchDate: 'Tarehe ya Kutotolewa',
    actualHatchDate: 'Tarehe Halisi ya Kutotoa',
    eggsHatched: 'Mayai Yaliyototoa',
    eggsFailed: 'Mayai Yasiyototoa / Mabovu',
    chicksProduced: 'Vifaranga Wazima Waliopatikana',
    updateHatchOutcome: 'Rekodi Matokeo ya Utotoleshaji',
    daysRemaining: 'Siku Zilizobaki Kutotoa',
    hatchRate: 'Kiwango cha Mafanikio %',
    deleteBroodingConfirm: 'Una uhakika unataka kufuta kundi hili la utotoleshaji? Kitendo hiki hakiwezi kurudishwa.',
    deleteBroodingTitle: 'Futa Kundi la Utotoleshaji',
    incubationNotice: 'Muda wa kulalia: Kuku siku 21 · Bata siku 40',
    noBroodingFound: 'Hakuna kumbukumbu za utotoleshaji',
    noBroodingDesc: 'Sajili kundi la kwanza la mayai yanayolaliwa au mashine ya kutotolesha.',
    poultryTagCol: 'Aina ya Kuku / Lebo',
    eggsSetCol: 'Mayai Yaliyotegwa',
    settingDateCol: 'Tarehe ya Kutega',
    expectedHatchCol: 'Tarehe ya Kutotoa',
    hatchedCol: 'Yaliyototolewa',
    chicksCol: 'Vifaranga',
    statusCol: 'Hali',
    dueBadge: 'Tayari',
    standardBatchTag: 'Kundi la Kawaida',

    expensesTitle: 'Gharama za Uendeshaji Shamba',
    addExpense: 'Rekodi Gharama Mpya',
    expenseCategory: 'Aina ya Gharama',
    description: 'Maelezo ya Matumizi',
    amount: 'Kiasi Kilichotumika (TZS)',
    paymentMethod: 'Njia ya Malipo',
    personResponsible: 'Msimamizi / Mlipaji',
    receiptReference: 'Namba ya Risiti / Kumbukumbu',
    addCategory: 'Unda Aina Mpya ya Gharama',
    totalExpenses: 'Jumla ya Gharama za Shamba',
    feedExpenses: 'Gharama za Chakula cha Kuku',
    medicationExpenses: 'Gharama za Chanjo & Dawa',
    cashMethod: 'Pesa Taslimu (Cash)',
    bankMethod: 'Benki (Bank Transfer)',
    mobileMpesa: 'M-Pesa',
    mobileAirtel: 'Airtel Money',
    mobileTigo: 'Tigo Pesa',
    creditMethod: 'Mkopo / Kulipa Baadaye',
    deleteExpenseConfirm: 'Una uhakika unataka kufuta rekodi hii ya gharama? Kitendo hiki hakiwezi kurudishwa.',
    deleteExpenseTitle: 'Futa Rekodi ya Gharama',
    noExpensesFound: 'Hakuna gharama inayolingana na utafutaji',
    noExpensesDesc: 'Jaribu kubadilisha neno la utafutaji au aina ya gharama.',
    expenseDateCol: 'Tarehe',
    expenseCategoryCol: 'Aina ya Gharama',
    expenseDescriptionCol: 'Maelezo',
    expenseAmountCol: 'Kiasi (TZS)',
    expenseMethodCol: 'Njia ya Malipo',
    expenseResponsibleCol: 'Mhusika',

    salesTitle: 'Daftari la Mauzo & Wateja',
    newSale: 'Rekodi Mauzo Mapya',
    productSold: 'Bidhaa Iliyouzwa',
    selectStock: 'Kundi la Kuku (Kama ni Kuku Walio Hai)',
    quantity: 'Idadi Iliyouzwa',
    unitPrice: 'Bei ya Kila Kimoja (TZS)',
    totalAmount: 'Jumla ya Bei (TZS)',
    customerName: 'Jina la Mteja',
    customerPhone: 'Namba ya Simu ya Mteja',
    amountPaid: 'Kiasi Kilicholipwa (TZS)',
    balanceDue: 'Deni / Baki Linalodaiwa (TZS)',
    totalSales: 'Jumla ya Mapato ya Mauzo',
    fullyPaid: 'Imelipwa Yote',
    partial: 'Imelipwa Kidogo',
    deleteSaleConfirm: 'Una uhakika unataka kufuta mauzo haya? Kitendo hiki hakiwezi kurudishwa.',
    deleteSaleTitle: 'Futa Rekodi ya Mauzo',
    noSalesFound: 'Hakuna mauzo yanayolingana na utafutaji',
    noSalesDesc: 'Jaribu kubadilisha neno la utafutaji au rekodi mauzo mapya.',
    saleDateCol: 'Tarehe',
    saleCustomerCol: 'Mteja',
    saleProductCol: 'Bidhaa',
    saleQtyCol: 'Idadi',
    salePriceCol: 'Bei ya Kipimo',
    saleTotalCol: 'Jumla (TZS)',
    salePaidCol: 'Iliyolipwa',
    saleBalanceCol: 'Deni / Baki',

    financialOverview: 'Muhtasari wa Fedha na Faida',
    totalRevenue: 'Jumla ya Mapato Yote',
    grossProfit: 'Faida Ghafi',
    netProfit: 'Faida Halisi (Net Profit)',
    poultryPurchases: 'Gharama za Kununua Kuku',
    operatingExpenses: 'Gharama za Uendeshaji',
    outstandingReceivables: 'Madeni ya Wateja',
    cashReceived: 'Pesa Taslimu Zilizopokelewa',
    monthlyBreakdown: 'Mwenendo wa Kila Mwezi',
    financialHealth: 'Hali ya Kifedha ya Shamba',
    allProductSalesSub: 'Mauzo yote ya kuku na bidhaa',
    feedVaccinesLabourSub: 'Chakula, chanjo, vibarua na kuku',
    grossProfitSub: 'Mapato baada ya kutoa gharama ya kuku',
    netProfitSub: 'Faida halisi baada ya gharama zote',
    otherOperatingCosts: 'Gharama Nyingine za Uendeshaji',
    cashFlowRealization: 'Mzunguko Halisi wa Fedha Taslimu',
    totalBilledSales: 'Jumla ya Mauzo Yaliyotolewa Ankara:',
    actualCashReceived: 'Pesa Taslimu Zilizopokelewa:',
    totalDisbursements: 'Jumla ya Pesa Zilizotumika Shambani:',
    uncollectedDebt: 'Madeni ya Wateja Yasiyolipwa:',
    collectionRate: 'Kiwango cha Malipo Kilichokusanywa:',
    liquidityStatus: 'Hali ya Ukwasi wa Kifedha:',
    healthyMargin: 'Uendeshaji Wenye Faida Imara',
    negativeMargin: 'Uendeshaji Wenye Hasara',
    periodMonthCol: 'Kipindi (Mwezi)',
    revenueCol: 'Mapato (TZS)',
    expensesCol: 'Gharama (TZS)',
    netProfitCol: 'Faida Halisi (TZS)',

    reportsCenter: 'Kituo cha Ripoti & Uchambuzi',
    period: 'Kipindi cha Ripoti',
    today: 'Leo',
    thisWeek: 'Wiki Hii',
    thisMonth: 'Mwezi Huu',
    thisYear: 'Mwaka Huu',
    customRange: 'Tarehe Maalum',
    startDateLabel: 'Kuanzia Tarehe',
    endDateLabel: 'Mpaka Tarehe',
    generateReport: 'Tengeneza Ripoti',
    completeBusinessReport: 'Ripoti Kamili ya Excel ya Shamba',
    filteredSalesVol: 'Kiwango cha Mauzo cha Kipindi',
    filteredExpensesVol: 'Gharama za Kipindi Hiki',
    filteredEggsVol: 'Mayai Yaliyokusanywa Kipindi Hiki',
    filteredBroodingVol: 'Utotoleshaji wa Kipindi Hiki',
    downloadExcelTitle: 'Pakua Faili Rasmi za Excel (.xlsx) za Biashara',
    exportMasterBtn: 'Pakua Excel Kamili ya Shamba',
    salesLedgerExport: 'Ripoti ya Mauzo',
    salesLedgerDesc: 'Orodha kamili ya mauzo ikijumuisha wateja, bidhaa, idadi, bei, malipo na madeni.',
    exportSalesBtn: 'Pakua Karatasi ya Mauzo',
    expensesLedgerExport: 'Ripoti ya Gharama za Shamba',
    expensesLedgerDesc: 'Gharama zote zikiwemo chakula, chanjo, dawa, vibarua na usafirishaji.',
    exportExpensesBtn: 'Pakua Karatasi ya Gharama',
    eggLedgerExport: 'Ripoti ya Uzalishaji wa Mayai',
    eggLedgerDesc: 'Mkusanyiko wa mayai ya kila siku, yaliyoharibika, mauzo na akiba iliyobaki.',
    exportEggsBtn: 'Pakua Karatasi ya Mayai',
    flockLedgerExport: 'Ripoti ya Hesabu ya Kuku',
    flockLedgerDesc: 'Idadi ya kuku, vifo, mauzo, uwiano wa madume/majike na gharama za manunuzi.',
    exportFlockBtn: 'Pakua Karatasi ya Kuku',
    broodingLedgerExport: 'Ripoti ya Utotoleshaji',
    broodingLedgerDesc: 'Kumbukumbu za kulalia mayai, tarehe za kutotolewa, kiwango cha mafanikio na vifaranga.',
    exportBroodingBtn: 'Pakua Karatasi ya Utotoleshaji',

    liveFeed: 'Mawasiliano ya Moja kwa Moja',
    dispatchNews: 'Tuma Habari / Ushauri',
    dispatchNewsModalTitle: 'Tuma Ushauri wa Shamba / Tangazo',
    dispatchNewsModalDesc: 'Tuma mwongozo kwa wakulima wote au mlengwa maalum',
    quickTemplates: 'Violezo vya Haraka vya Ushauri',
    targetRecipient: 'Mpokeaji (Chagua Mtumiaji au Wote)',
    broadcastAll: '📢 Tangazo kwa Watumiaji Wote (Habari za Jumla)',
    specificUser: '👤 Mtumiaji Maalum',
    advisoryCategory: 'Aina ya Ushauri',
    priorityLevel: 'Kiwango cha Umuhimu',
    advisoryHeadline: 'Kichwa cha Habari / Ushauri',
    detailedAdvisory: 'Maelezo Kamili ya Ushauri & Hatua za Kuchukua',
    sendAdvisory: 'Tuma Ushauri',
    dispatching: 'Inatuma...',
    diseaseOutbreak: '🚨 Milipuko ya Magonjwa & Usalama wa Shamba',
    feedingNutritionCat: '🌾 Ulishaji & Lishe ya Kuku',
    broodingHatchingCat: '🐣 Utotoleshaji & Kulea Vifaranga',
    marketPricesCat: '📈 Bei & Masoko ya Kuku',
    managementTipsCat: '💡 Ushauri wa Usimamizi wa Shamba',
    generalAnnouncement: '📢 Tangazo la Kawaida',
    priorityUrgent: 'HARAKA SANA',
    priorityHigh: 'MUHIMU SANA',
    priorityNormal: 'USHAURI',
    authorLabel: 'Mwandishi',
    sentToLabel: 'Imetumwa kwa',
    noNewsAvailable: 'Hakuna ushauri au taarifa kwa sasa',
    noNewsDesc: 'Taarifa na miongozo halisi inayotumwa na uongozi wa shamba itaonekana hapa.',
    targetedAdvisoryYou: 'Ushauri Maalum Kwako Kutoka kwa Msimamizi',
    smartSuggestionFlock: 'Ushauri Mahiri kwa Ajili ya Kuku Wako',
    farmerIntelligence: 'Takwimu za Wakulima & Kutuma Ushauri Maalum',
    suggestAdvisory: 'Mshauri',
    customFarmAdvisory: 'Ushauri Maalum wa Shamba',
    deleteNewsTitle: 'Futa Habari / Ushauri',
    deleteNewsConfirm: 'Una uhakika unataka kufuta taarifa hii? Itafutwa kwenye mfumo mzima.',

    accountDataManagement: 'Usimamizi na Kufuta Makosa ya Data',
    accountDataManagementDesc: 'Futa kumbukumbu zenye makosa au anzisha upya sehemu maalum za akaunti yako',
    clearErroneousData: 'Futa Data Zenye Makosa kwenye Akaunti',
    clearDataBtn: 'Futa Data Hizi',
    fullAccountReset: 'Kuanza Upya Akaunti Nzima (Clean Slate)',
    fullAccountResetDesc: 'Futa kabisa data zote za majaribio au makosa (kuku, mayai, utotoleshaji, gharama na mauzo) na uanze upya.',
    resetAllDataBtn: 'Futa Data Zangu Zote',
    confirmDataDeletion: 'Thibitisha Kufuta Data',
    confirmDataDeletionDesc: 'Una uhakika unataka kufuta rekodi hizi zilizotokea kwa makosa? Kitendo hiki hakiwezi kurudishwa.',
    yesDeleteData: 'Ndio, Futa Data Hizi',

    adminDashboard: 'Kituo Kikuu cha Msimamizi',
    registeredUsers: 'Watumiaji Waliosajiliwa',
    userManagement: 'Usimamizi wa Wafanyakazi & Majukumu',
    dangerZone: 'Eneo Hatari & Kufuta Mfumo Mzima',
    dangerWarning: 'Vitendo vya kudumu visivyoweza kurudishwa.',
    resetDatabase: 'Futa Kumbukumbu za Akaunti Hii',
    resetConfirmPrompt: 'Andika maneno haya kwa herufi kubwa ili kuendelea:',
    deleteEverythingPrompt: 'DELETE EVERYTHING',
    resetWarningText: 'Kitendo hiki kitafuta kabisa kumbukumbu za kuku, mayai, utotoleshaji, gharama na mauzo za akaunti uliyomo sasa. Data za watumiaji wengine haziguswi kamwe.',
    resetSuccessText: 'Kumbukumbu zote za uendeshaji zimefutwa kabisa.',
    deleteRecord: 'Futa Rekodi',
    deleteUser: 'Futa Akaunti ya Mtumiaji',
    deactivateUser: 'Simamisha Akaunti',
    activateUser: 'Washa Akaunti',
    makeAdmin: 'Mpe Usimamizi Mkuu',
    makeStaff: 'Muweke Mfanyakazi wa Kawaida',
    activityLog: 'Kumbukumbu za Matukio Mfomoni',
    timestamp: 'Muda & Tarehe',
    user: 'Mtumiaji',
    action: 'Kitendo',
    module: 'Sehemu ya Mfumo',
    details: 'Maelezo',
    adminGovernanceDesc: 'Simamia akaunti za wafanyakazi, majukumu ya mfumo, kumbukumbu za matukio na usalama wa data.',
    firstUserAdminNote: 'Mtumiaji wa kwanza kusajiliwa anakuwa Msimamizi Mkuu moja kwa moja.',
    userNameCol: 'Jina la Mtumiaji',
    emailCol: 'Barua Pepe',
    roleCol: 'Jukumu',
    userStatusCol: 'Hali',
    registeredAtCol: 'Tarehe ya Kusajiliwa',
    youBadge: 'Wewe',
    teamMemberDefault: 'Mwanachama wa Timu',
    userRoleToggleTitle: 'Badilisha jukumu kati ya Msimamizi Mkuu na Mfanyakazi',

    createAdminAccount: 'Sajili Msimamizi Mkuu wa Awali',
    createStaffAccount: 'Sajili Akaunti ya Mtumiaji',
    firstRunNotice: 'Akaunti ya kwanza kusajiliwa inapewa mamlaka ya Msimamizi Mkuu moja kwa moja.',
    email: 'Barua Pepe',
    password: 'Nenosiri',
    fullName: 'Jina Kamili',
    phone: 'Namba ya Simu',
    alreadyHaveAccount: 'Una akaunti tayari? Ingia hapa',
    dontHaveAccount: 'Huna akaunti? Jisajili hapa',
    authError: 'Hitilafu ya uthibitishaji. Tafadhali hakiki taarifa zako.',
    signUpSuccess: 'Akaunti imefunguliwa kikamilifu! Inaingia kwenye mfumo...',
    registerAccountTab: 'Sajili Akaunti',
    adminRegistrationTitle: 'Usajili wa Msimamizi Mkuu',
    newUserRegistrationTitle: 'Usajili wa Mtumiaji Mpya',
    adminRegistrationDesc: 'Mamlaka ya Msimamizi Mkuu wa Awali kwa junior.jacksonmass100@gmail.com',
    newUserRegistrationDesc: 'Jisajili kama mtumiaji wa kawaida. Utakuwa na uwezo kamili wa kurekodi kuku, mayai, mauzo na kupokea ushauri.',
    signInTitle: 'Ingia kwenye KukuTrack',
    signInDesc: 'Weka taarifa zako ili kuingia kwenye mfumo wa biashara yako ya kuku',
    deleteErroneousDataBtn: 'Futa Data Zenye Makosa Kwenye Akaunti',
    memberSinceLabel: 'Mwanachama Tangu',
    emailLabel: 'Barua Pepe',
    fullNameLabel: 'Jina Kamili',
    phoneLabel: 'Namba ya Simu',
    roleLabel: 'Jukumu',
    supabaseSetupTitle: 'Unganisha Hifadhidata ya Supabase',
    supabaseSetupDesc: 'Washa maingiliano ya moja kwa moja ya vifaa vingi na hifadhi ya kudumu kwa KukuTrack.',
  },
};
