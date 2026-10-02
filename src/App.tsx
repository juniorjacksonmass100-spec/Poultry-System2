import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { SupabaseSetupBanner } from './components/auth/SupabaseSetupBanner';
import { AuthModal } from './components/auth/AuthModal';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { SchemaSetupNotice } from './components/common/SchemaSetupNotice';

// Modules
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { PoultryStockList } from './components/poultry/PoultryStockList';
import { PoultryModal } from './components/poultry/PoultryModal';
import { MortalityModal } from './components/poultry/MortalityModal';
import { EggProductionList } from './components/eggs/EggProductionList';
import { EggProductionModal } from './components/eggs/EggProductionModal';
import { BroodingList } from './components/brooding/BroodingList';
import { BroodingModal } from './components/brooding/BroodingModal';
import { ExpenseList } from './components/expenses/ExpenseList';
import { ExpenseModal } from './components/expenses/ExpenseModal';
import { CategoryModal } from './components/expenses/CategoryModal';
import { SalesList } from './components/sales/SalesList';
import { SaleModal } from './components/sales/SaleModal';
import { FinancialOverview } from './components/financials/FinancialOverview';
import { ReportsView } from './components/reports/ReportsView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { NewsCenter } from './components/news/NewsCenter';
import { AccountDataManagementModal } from './components/auth/AccountDataManagementModal';

// Services
import {
  fetchPoultryStocks,
  createPoultryStock,
  updatePoultryStock,
  recordMortality,
  deletePoultryStock,
} from './services/poultryService';
import {
  fetchEggProductions,
  createOrUpdateEggProduction,
  deleteEggProduction,
} from './services/eggService';
import {
  fetchBroodingRecords,
  createBroodingRecord,
  updateBroodingRecord,
  deleteBroodingRecord,
} from './services/broodingService';
import {
  fetchExpenses,
  fetchExpenseCategories,
  createExpense,
  createExpenseCategory,
  updateExpense,
  deleteExpense,
} from './services/expenseService';
import {
  fetchSales,
  createSale,
  updateSale,
  deleteSale,
} from './services/salesService';
import { calculateFinancials } from './services/financialService';
import {
  fetchAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUserProfile,
} from './services/adminService';
import { fetchActivityLogs } from './services/activityService';
import { exportToExcel } from './services/exportService';
import {
  fetchNewsForUser,
  createNews,
  deleteNews,
} from './services/newsService';

// Types
import {
  PoultryStock,
  EggProduction,
  BroodingRecord,
  Expense,
  ExpenseCategory,
  Sale,
  UserProfile,
  ActivityLog,
  PoultryNews,
} from './types';
import { ShieldAlert, Loader2, LogIn, Sparkles } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, profile, loading: authLoading, isSchemaMissing, isAdmin, showAuthModal, setShowAuthModal, signOut } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);

  // Business Operational Data States
  const [poultry, setPoultry] = useState<PoultryStock[]>([]);
  const [eggs, setEggs] = useState<EggProduction[]>([]);
  const [brooding, setBrooding] = useState<BroodingRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [news, setNews] = useState<PoultryNews[]>([]);
  const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Modals Open State
  const [isPoultryModalOpen, setIsPoultryModalOpen] = useState(false);
  const [editingPoultry, setEditingPoultry] = useState<PoultryStock | null>(null);

  const [isMortalityModalOpen, setIsMortalityModalOpen] = useState(false);
  const [mortalityStock, setMortalityStock] = useState<PoultryStock | null>(null);

  const [isEggModalOpen, setIsEggModalOpen] = useState(false);
  const [editingEgg, setEditingEgg] = useState<EggProduction | null>(null);

  const [isBroodingModalOpen, setIsBroodingModalOpen] = useState(false);
  const [editingBrooding, setEditingBrooding] = useState<BroodingRecord | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Load all records strictly from Supabase
  const loadAllData = useCallback(async () => {
    if (!supabase) {
      setDataLoading(false);
      return;
    }
    try {
      const [
        pData,
        eData,
        bData,
        exData,
        catData,
        sData,
        uData,
        actData,
        nData,
      ] = await Promise.all([
        fetchPoultryStocks(),
        fetchEggProductions(),
        fetchBroodingRecords(),
        fetchExpenses(),
        fetchExpenseCategories(),
        fetchSales(),
        isAdmin ? fetchAllUsers() : Promise.resolve([]),
        isAdmin ? fetchActivityLogs(100) : Promise.resolve([]),
        fetchNewsForUser(user?.id, user?.email, isAdmin),
      ]);

      setPoultry(pData);
      setEggs(eData);
      setBrooding(bData);
      setExpenses(exData);
      setCategories(catData);
      setSales(sData);
      setNews(nData);
      if (isAdmin) {
        setUsers(uData);
        setActivityLogs(actData);
      }
    } catch {
      // Quiet fail if tables are not yet migrated
    } finally {
      setDataLoading(false);
    }
  }, [isAdmin, user?.id, user?.email]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Real-time synchronization across devices using Supabase Realtime
  useEffect(() => {
    if (!supabase) return;

    try {
      const channel = supabase
        .channel('kuku-realtime-bus')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'poultry_stock' },
          () => {
            fetchPoultryStocks().then(setPoultry);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'egg_production' },
          () => {
            fetchEggProductions().then(setEggs);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'brooding_records' },
          () => {
            fetchBroodingRecords().then(setBrooding);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'expenses' },
          () => {
            fetchExpenses().then(setExpenses);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sales' },
          () => {
            fetchSales().then(setSales);
            fetchPoultryStocks().then(setPoultry);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => {
            if (isAdmin) fetchAllUsers().then(setUsers);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'activity_logs' },
          () => {
            if (isAdmin) fetchActivityLogs(100).then(setActivityLogs);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'poultry_news' },
          () => {
            fetchNewsForUser(user?.id, user?.email, isAdmin).then((dbNews) => {
              setNews(dbNews);
            });
          }
        )
        .subscribe((status) => {
          setIsRealtimeActive(status === 'SUBSCRIBED');
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Channel failover if tables not yet published
    }
  }, [isAdmin, user?.id, user?.email]);

  // Derived Financial Calculations strictly from actual records
  const financials = useMemo(() => {
    return calculateFinancials(sales, expenses, poultry, eggs);
  }, [sales, expenses, poultry, eggs]);

  // Guard for actions when user is not signed in
  const requireAuth = (action: () => void) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    action();
  };

  // If Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#040909] flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#00f5c4]" />
        <span className="text-xs font-semibold tracking-wide text-[#94b8b6]">{t.loading}</span>
      </div>
    );
  }

  // If user account is deactivated by administrator
  if (user && profile && !profile.is_active) {
    return (
      <div className="min-h-screen bg-[#040909] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#081515] border border-rose-500/30 rounded-2xl p-6 text-center space-y-4 shadow-[0_0_25px_rgba(244,63,94,0.15)]">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">
            Account Deactivated
          </h2>
          <p className="text-xs text-[#94b8b6] leading-relaxed">
            Your team member account has been deactivated by the farm administrator. Please contact your administrator to reactivate your access.
          </p>
          <button
            onClick={signOut}
            className="w-full py-2 bg-[#0c1f1f] hover:bg-[#112d2d] text-white text-xs font-semibold rounded-xl border border-[#00f5c4]/20 transition-colors"
          >
            {t.signOut}
          </button>
        </div>
      </div>
    );
  }

  // Master Global Export
  const handleExportAll = () => {
    exportToExcel(
      'all',
      {
        poultry,
        eggs,
        sales,
        expenses,
        brooding,
        activityLogs,
        financials,
      },
      'KukuTrack_FullMaster'
    );
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${isLight ? 'bg-[#f4f7f6] text-slate-900' : 'bg-[#020708] text-white'}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onOpenSignIn={() => setShowAuthModal(true)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-colors duration-200 ${isLight ? 'bg-[#f4f7f6]' : 'bg-[#020708]'}`}>
        <TopBar
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onExportAll={handleExportAll}
          isRealtimeActive={isRealtimeActive}
          onOpenSignIn={() => setShowAuthModal(true)}
          onOpenDataManagement={() => setIsDataManagementOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {/* Notice if tables not yet created in Supabase */}
          {isSchemaMissing && (
            <SchemaSetupNotice onRefresh={loadAllData} />
          )}

          {/* Quick Sign-In Prompt banner if not authenticated */}
          {!user && (
            <div
              className={`mb-6 p-4 sm:p-5 border rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                isLight
                  ? 'bg-gradient-to-r from-teal-50 via-emerald-50 to-white border-teal-200 shadow-sm'
                  : 'bg-gradient-to-r from-[#031518] via-[#051c20] to-[#072428] border-[#00f5c4]/35 shadow-[0_0_25px_rgba(0,245,196,0.15)] text-white'
              }`}
            >
              <div>
                <h3 className={`text-xs sm:text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <Sparkles className={`w-4 h-4 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
                  <span>{t.welcomeTitle}</span>
                </h3>
                <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#8fbdb8]'}`}>
                  {t.welcomeDesc}
                </p>
              </div>
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#021f1a] bg-[#00f5c4] hover:bg-[#1effd5] rounded-xl shadow-[0_0_15px_rgba(0,245,196,0.4)] cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" />
                <span>{t.signIn} / {t.signUp}</span>
              </button>
            </div>
          )}

          {dataLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-white gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#00f5c4]" />
              <span className="text-xs font-medium text-[#94b8b6]">{t.loading}</span>
            </div>
          ) : (
            <>
              {/* Tab: Dashboard Overview */}
              {currentTab === 'dashboard' && (
                <DashboardOverview
                  poultry={poultry}
                  eggs={eggs}
                  sales={sales}
                  expenses={expenses}
                  brooding={brooding}
                  financials={financials}
                  onNavigate={setCurrentTab}
                  onAddPoultry={() => requireAuth(() => {
                    setEditingPoultry(null);
                    setIsPoultryModalOpen(true);
                  })}
                  onAddSale={() => requireAuth(() => {
                    setEditingSale(null);
                    setIsSaleModalOpen(true);
                  })}
                  onAddExpense={() => requireAuth(() => {
                    setEditingExpense(null);
                    setIsExpenseModalOpen(true);
                  })}
                />
              )}

              {/* Tab: Flock Inventory */}
              {currentTab === 'poultry' && (
                <PoultryStockList
                  stocks={poultry}
                  onAdd={() => requireAuth(() => {
                    setEditingPoultry(null);
                    setIsPoultryModalOpen(true);
                  })}
                  onEdit={(stock) => requireAuth(() => {
                    setEditingPoultry(stock);
                    setIsPoultryModalOpen(true);
                  })}
                  onRecordMortality={(stock) => requireAuth(() => {
                    setMortalityStock(stock);
                    setIsMortalityModalOpen(true);
                  })}
                  onDelete={async (id) => {
                    setPoultry((prev) => prev.filter((p) => p.id !== id));
                    try {
                      await deletePoultryStock(id);
                    } catch {
                      // Quiet failover
                    }
                    await loadAllData();
                  }}
                />
              )}

              {/* Tab: Egg Production */}
              {currentTab === 'eggs' && (
                <EggProductionList
                  records={eggs}
                  onAdd={() => requireAuth(() => {
                    setEditingEgg(null);
                    setIsEggModalOpen(true);
                  })}
                  onEdit={(rec) => requireAuth(() => {
                    setEditingEgg(rec);
                    setIsEggModalOpen(true);
                  })}
                  onDelete={async (id) => {
                    setEggs((prev) => prev.filter((e) => e.id !== id));
                    try {
                      await deleteEggProduction(id);
                    } catch {
                      // Quiet failover
                    }
                    await loadAllData();
                  }}
                />
              )}

              {/* Tab: Brooding & Hatching */}
              {currentTab === 'brooding' && (
                <BroodingList
                  records={brooding}
                  onAdd={() => requireAuth(() => {
                    setEditingBrooding(null);
                    setIsBroodingModalOpen(true);
                  })}
                  onEdit={(rec) => requireAuth(() => {
                    setEditingBrooding(rec);
                    setIsBroodingModalOpen(true);
                  })}
                  onDelete={async (id) => {
                    setBrooding((prev) => prev.filter((b) => b.id !== id));
                    try {
                      await deleteBroodingRecord(id);
                    } catch {
                      // Quiet failover
                    }
                    await loadAllData();
                  }}
                />
              )}

              {/* Tab: Farm Expenses */}
              {currentTab === 'expenses' && (
                <ExpenseList
                  expenses={expenses}
                  categories={categories}
                  onAddExpense={() => requireAuth(() => {
                    setEditingExpense(null);
                    setIsExpenseModalOpen(true);
                  })}
                  onAddCategory={() => requireAuth(() => setIsCategoryModalOpen(true))}
                  onEdit={(ex) => requireAuth(() => {
                    setEditingExpense(ex);
                    setIsExpenseModalOpen(true);
                  })}
                  onDelete={async (id) => {
                    setExpenses((prev) => prev.filter((ex) => ex.id !== id));
                    try {
                      await deleteExpense(id);
                    } catch {
                      // Quiet failover
                    }
                    await loadAllData();
                  }}
                />
              )}

              {/* Tab: Sales */}
              {currentTab === 'sales' && (
                <SalesList
                  sales={sales}
                  onAddSale={() => requireAuth(() => {
                    setEditingSale(null);
                    setIsSaleModalOpen(true);
                  })}
                  onEdit={(sale) => requireAuth(() => {
                    setEditingSale(sale);
                    setIsSaleModalOpen(true);
                  })}
                  onDelete={async (id) => {
                    setSales((prev) => prev.filter((s) => s.id !== id));
                    try {
                      await deleteSale(id);
                    } catch {
                      // Quiet failover
                    }
                    await loadAllData();
                  }}
                />
              )}

              {/* Tab: Financials */}
              {currentTab === 'financials' && (
                <FinancialOverview
                  financials={financials}
                  sales={sales}
                  expenses={expenses}
                  poultry={poultry}
                />
              )}

              {/* Tab: Reports */}
              {currentTab === 'reports' && (
                <ReportsView
                  poultry={poultry}
                  eggs={eggs}
                  sales={sales}
                  expenses={expenses}
                  brooding={brooding}
                  activityLogs={activityLogs}
                  financials={financials}
                />
              )}

              {/* Tab: News & Advisories */}
              {currentTab === 'news' && (
                <NewsCenter
                  news={news}
                  users={users}
                  poultry={poultry}
                  eggs={eggs}
                  brooding={brooding}
                  onDispatchNews={async (newsData) => {
                    const created = await createNews(newsData);
                    setNews((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
                  }}
                  onDeleteNews={async (id) => {
                    setNews((prev) => prev.filter((item) => item.id !== id));
                    await deleteNews(id);
                  }}
                />
              )}

              {/* Tab: Admin Dashboard */}
              {currentTab === 'admin' && isAdmin && (
                <AdminDashboard
                  users={users}
                  activityLogs={activityLogs}
                  onToggleUserStatus={async (userId, active) => {
                    await toggleUserStatus(userId, active);
                    await loadAllData();
                  }}
                  onChangeUserRole={async (userId, role) => {
                    await updateUserRole(userId, role);
                    await loadAllData();
                  }}
                  onDeleteUser={async (userId) => {
                    await deleteUserProfile(userId);
                    await loadAllData();
                  }}
                  onRefreshData={loadAllData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* --- MODAL DIALOGS --- */}

      {/* 0. Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* 1. Poultry Modal */}
      <PoultryModal
        isOpen={isPoultryModalOpen}
        initialData={editingPoultry}
        onClose={() => setIsPoultryModalOpen(false)}
        onSave={async (data) => {
          if (editingPoultry) {
            await updatePoultryStock(editingPoultry.id, data);
          } else {
            await createPoultryStock(data);
          }
          await loadAllData();
        }}
      />

      {/* 2. Mortality Modal */}
      <MortalityModal
        isOpen={isMortalityModalOpen}
        stock={mortalityStock}
        onClose={() => setIsMortalityModalOpen(false)}
        onRecord={async (stockId, deadCount, reason, date) => {
          await recordMortality(stockId, deadCount, reason, date);
          await loadAllData();
        }}
      />

      {/* 3. Egg Production Modal */}
      <EggProductionModal
        isOpen={isEggModalOpen}
        initialData={editingEgg}
        onClose={() => setIsEggModalOpen(false)}
        onSave={async (data) => {
          await createOrUpdateEggProduction(data);
          await loadAllData();
        }}
      />

      {/* 4. Brooding Modal */}
      <BroodingModal
        isOpen={isBroodingModalOpen}
        initialData={editingBrooding}
        onClose={() => setIsBroodingModalOpen(false)}
        onSave={async (data) => {
          if (editingBrooding) {
            await updateBroodingRecord(editingBrooding.id, data);
          } else {
            await createBroodingRecord(data);
          }
          await loadAllData();
        }}
      />

      {/* 5. Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        categories={categories}
        initialData={editingExpense}
        onClose={() => setIsExpenseModalOpen(false)}
        onOpenAddCategory={() => setIsCategoryModalOpen(true)}
        onSave={async (data) => {
          if (editingExpense) {
            await updateExpense(editingExpense.id, data);
          } else {
            await createExpense(data);
          }
          await loadAllData();
        }}
      />

      {/* 6. Custom Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onAddCategory={async (name) => {
          await createExpenseCategory(name);
          const updatedCats = await fetchExpenseCategories();
          setCategories(updatedCats);
        }}
      />

      {/* 7. Sale Modal */}
      <SaleModal
        isOpen={isSaleModalOpen}
        poultryStocks={poultry}
        initialData={editingSale}
        onClose={() => setIsSaleModalOpen(false)}
        onSave={async (data) => {
          if (editingSale) {
            await updateSale(editingSale.id, data);
          } else {
            await createSale(data);
          }
          await loadAllData();
        }}
      />

      {/* 8. Account Data Management Modal */}
      <AccountDataManagementModal
        isOpen={isDataManagementOpen}
        onClose={() => setIsDataManagementOpen(false)}
        counts={{
          poultry: poultry.length,
          eggs: eggs.length,
          brooding: brooding.length,
          expenses: expenses.length,
          sales: sales.length,
        }}
        onDataCleared={loadAllData}
      />
    </div>
  );
};

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <ThemeProvider>
        <LanguageProvider>
          <SupabaseSetupBanner />
        </LanguageProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
