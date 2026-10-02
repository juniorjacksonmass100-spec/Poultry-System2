import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserProfile, ActivityLog } from '../../types';
import { DangerZoneModal } from './DangerZoneModal';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Trash2,
  User,
} from 'lucide-react';

interface AdminDashboardProps {
  users: UserProfile[];
  activityLogs: ActivityLog[];
  onToggleUserStatus: (userId: string, isActive: boolean) => Promise<void>;
  onChangeUserRole: (userId: string, role: 'admin' | 'staff') => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  activityLogs,
  onToggleUserStatus,
  onChangeUserRole,
  onDeleteUser,
  onRefreshData,
}) => {
  const { t, lang } = useLanguage();
  const { user: currentAuthUser } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [isDangerModalOpen, setIsDangerModalOpen] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserProfile | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'danger'>('users');

  const handleDeleteUserConfirm = async () => {
    if (!deleteTargetUser) return;
    setIsDeletingUser(true);
    try {
      await onDeleteUser(deleteTargetUser.id);
      setDeleteTargetUser(null);
    } catch {
      // Quiet failover
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with admin status */}
      <div
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border rounded-2xl p-5 shadow-sm transition-colors ${
          isLight
            ? 'bg-gradient-to-r from-teal-50 to-white border-teal-200 text-slate-800'
            : 'bg-gradient-to-r from-[#031518] to-[#072428] border-[#00f5c4]/35 text-white shadow-[0_0_20px_rgba(0,245,196,0.14)]'
        }`}
      >
        <div>
          <div className={`flex items-center gap-2 font-bold text-sm ${isLight ? 'text-teal-800' : 'text-[#00f5c4]'}`}>
            <Shield className="w-4 h-4" />
            <span>{t.adminDashboard}</span>
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-[#94b8b6]'}`}>
            {t.adminGovernanceDesc}
          </p>
        </div>

        {/* Tab switcher */}
        <div
          className={`flex items-center gap-1 p-1 border rounded-xl text-xs ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#040c0c] border-[#00f5c4]/20'
          }`}
        >
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? isLight
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-[#00f5c4] text-[#02211b] shadow-[0_0_10px_rgba(0,245,196,0.3)]'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-[#94b8b6] hover:text-white'
            }`}
          >
            {t.userManagement} ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'activity'
                ? isLight
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-[#00f5c4] text-[#02211b] shadow-[0_0_10px_rgba(0,245,196,0.3)]'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-[#94b8b6] hover:text-white'
            }`}
          >
            {t.activityLog}
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'danger'
                ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                : isLight
                ? 'text-rose-600 hover:text-rose-800'
                : 'text-[#94b8b6] hover:text-rose-400'
            }`}
          >
            {t.dangerZone}
          </button>
        </div>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <div
          className={`border rounded-2xl overflow-hidden transition-colors ${
            isLight
              ? 'bg-white border-teal-200/80 shadow-sm'
              : 'bg-[#081515] border-[#00f5c4]/20 shadow-[0_0_20px_rgba(0,0,0,0.3)]'
          }`}
        >
          <div
            className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'border-slate-200 bg-slate-50' : 'border-[#00f5c4]/20 bg-[#061212]'
            }`}
          >
            <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {t.registeredUsers}
            </h3>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#729997]'}`}>
              {t.firstUserAdminNote}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`border-b font-semibold ${
                    isLight ? 'border-slate-200 bg-slate-100/70 text-slate-700' : 'border-[#00f5c4]/20 bg-[#040c0c] text-[#94b8b6]'
                  }`}
                >
                  <th className="py-3 px-4">{t.userNameCol}</th>
                  <th className="py-3 px-3">{t.emailCol}</th>
                  <th className="py-3 px-3">{t.roleCol}</th>
                  <th className="py-3 px-3">{t.userStatusCol}</th>
                  <th className="py-3 px-3">{t.registeredAtCol}</th>
                  <th className="py-3 px-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight ? 'divide-slate-100 text-slate-700' : 'divide-[#00f5c4]/10 text-[#c4dedc]'
                }`}
              >
                {users.map((u) => {
                  const isSelf = u.id === currentAuthUser?.id;
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        isLight ? 'hover:bg-teal-50/40' : 'hover:bg-[#0c2020]/60'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className={`font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          <User className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
                          <span>{u.full_name || t.teamMemberDefault}</span>
                          {isSelf && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${
                                isLight
                                  ? 'text-teal-800 bg-teal-100 border-teal-300'
                                  : 'text-[#00f5c4] bg-[#00f5c4]/15 border-[#00f5c4]/40'
                              }`}
                            >
                              {t.youBadge}
                            </span>
                          )}
                        </div>
                        {u.phone && (
                          <div className={`text-[11px] font-mono pl-5.5 ${isLight ? 'text-slate-500' : 'text-[#729997]'}`}>
                            {u.phone}
                          </div>
                        )}
                      </td>

                      <td className={`py-3 px-3 font-mono font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {u.email}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`text-xs font-bold capitalize ${
                            u.role === 'admin'
                              ? isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                              : isLight ? 'text-slate-600' : 'text-[#c4dedc]'
                          }`}
                        >
                          {u.role === 'admin' ? t.admin : t.staff}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`text-xs font-bold ${
                            u.is_active
                              ? isLight ? 'text-teal-700' : 'text-[#00f5c4]'
                              : 'text-rose-500'
                          }`}
                        >
                          {u.is_active ? t.active : t.inactive}
                        </span>
                      </td>

                      <td className={`py-3 px-3 font-mono text-[11px] whitespace-nowrap ${isLight ? 'text-slate-500' : 'text-[#94b8b6]'}`}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isSelf && (
                            <button
                              onClick={() => onChangeUserRole(u.id, u.role === 'admin' ? 'staff' : 'admin')}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                                isLight
                                  ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
                                  : 'text-white bg-[#0b2222] hover:bg-[#103030] border-[#00f5c4]/25 hover:border-[#00f5c4]/60'
                              }`}
                              title={t.userRoleToggleTitle}
                            >
                              {u.role === 'admin' ? t.makeStaff : t.makeAdmin}
                            </button>
                          )}

                          {!isSelf && (
                            <button
                              onClick={() => onToggleUserStatus(u.id, !u.is_active)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                u.is_active
                                  ? isLight ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50' : 'text-[#94b8b6] hover:text-amber-400 hover:bg-[#0c1f1f]'
                                  : isLight ? 'text-slate-500 hover:text-teal-600 hover:bg-teal-50' : 'text-[#94b8b6] hover:text-[#00f5c4] hover:bg-[#0c1f1f]'
                              }`}
                              title={u.is_active ? t.deactivateUser : t.activateUser}
                            >
                              {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {!isSelf && (
                            <button
                              onClick={() => setDeleteTargetUser(u)}
                              title={t.deleteUser}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isLight ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-[#94b8b6] hover:text-rose-400 hover:bg-[#0c1f1f]'
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Activity Audit Trail */}
      {activeTab === 'activity' && (
        <div
          className={`border rounded-2xl overflow-hidden transition-colors ${
            isLight
              ? 'bg-white border-teal-200/80 shadow-sm'
              : 'bg-[#081515] border-[#00f5c4]/20 shadow-[0_0_20px_rgba(0,0,0,0.3)]'
          }`}
        >
          <div
            className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'border-slate-200 bg-slate-50' : 'border-[#00f5c4]/20 bg-[#061212]'
            }`}
          >
            <h3 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {t.activityLog}
            </h3>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#729997]'}`}>
              {isSw ? 'Kumbukumbu ya mfumo ya matukio yote' : 'Realtime tamper-evident system ledger'}
            </span>
          </div>

          {activityLogs.length === 0 ? (
            <div className={`py-12 text-center text-xs ${isLight ? 'text-slate-500' : 'text-[#94b8b6]'}`}>
              {isSw ? 'Hakuna kumbukumbu za matukio bado.' : 'No activity logged yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b font-semibold ${
                      isLight ? 'border-slate-200 bg-slate-100/70 text-slate-700' : 'border-[#00f5c4]/20 bg-[#040c0c] text-[#94b8b6]'
                    }`}
                  >
                    <th className="py-3 px-4">{t.timestamp}</th>
                    <th className="py-3 px-3">{t.user}</th>
                    <th className="py-3 px-3">{t.action}</th>
                    <th className="py-3 px-3">{t.module}</th>
                    <th className="py-3 px-4">{t.details}</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y font-mono text-[11px] ${
                    isLight ? 'divide-slate-100 text-slate-700' : 'divide-[#00f5c4]/10 text-[#c4dedc]'
                  }`}
                >
                  {activityLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={`transition-colors ${
                        isLight ? 'hover:bg-teal-50/40' : 'hover:bg-[#0c2020]/60'
                      }`}
                    >
                      <td className={`py-2.5 px-4 whitespace-nowrap ${isLight ? 'text-slate-500' : 'text-[#94b8b6]'}`}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className={`py-2.5 px-3 font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {log.user_email || 'System'}
                      </td>
                      <td className={`py-2.5 px-3 font-bold ${isLight ? 'text-teal-700' : 'text-[#00f5c4]'}`}>
                        {log.action}
                      </td>
                      <td className={`py-2.5 px-3 ${isLight ? 'text-slate-500' : 'text-[#94b8b6]'}`}>
                        {log.record_type}
                      </td>
                      <td className={`py-2.5 px-4 font-sans truncate max-w-xs ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Dangerous Actions / Danger Zone */}
      {activeTab === 'danger' && (
        <div
          className={`border rounded-2xl p-6 space-y-6 transition-colors ${
            isLight
              ? 'bg-rose-50/40 border-rose-200 shadow-sm'
              : 'bg-[#081515] border-rose-500/35 shadow-[0_0_25px_rgba(244,63,94,0.15)]'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
                {t.dangerZone}
              </h3>
              <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#94b8b6]'}`}>
                {t.dangerWarning}
              </p>
            </div>
          </div>

          <div
            className={`p-4 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isLight ? 'bg-white border-rose-200' : 'bg-[#050e0e] border-rose-500/20'
            }`}
          >
            <div>
              <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {t.resetDatabase}
              </h4>
              <p className={`text-xs mt-0.5 max-w-md leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#94b8b6]'}`}>
                {isSw
                  ? 'Futa kumbukumbu zote za shamba (kuku, mayai, utotoleshaji, matumizi na mauzo). Akaunti yako ya Msimamizi Mkuu itabaki salama.'
                  : 'Deletes all business records (flock stock, egg productions, brooding batches, expenses, and sales). Your admin account and authentication will remain intact.'}
              </p>
            </div>

            <button
              onClick={() => setIsDangerModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all whitespace-nowrap shadow-[0_0_15px_rgba(244,63,94,0.35)] cursor-pointer"
            >
              {isSw ? 'Anzisha Uwekaji Upya wa Mfumo' : 'Initiate System Reset'}
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone Modal */}
      <DangerZoneModal
        isOpen={isDangerModalOpen}
        onClose={() => setIsDangerModalOpen(false)}
        onResetComplete={onRefreshData}
      />

      {/* Delete User Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetUser)}
        title={isSw ? 'Ondoa Wasifu wa Mwanachama' : 'Remove Team Member Profile'}
        message={
          isSw
            ? `Una uhakika unataka kumwondoa ${deleteTargetUser?.full_name || deleteTargetUser?.email}? Hatakuwa na uwezo wa kuingia tena kwenye mfumo huu wa usimamizi wa kuku.`
            : `Are you sure you want to remove ${deleteTargetUser?.full_name || deleteTargetUser?.email}? They will no longer have access to this poultry management platform.`
        }
        isDestructive={true}
        isLoading={isDeletingUser}
        onConfirm={handleDeleteUserConfirm}
        onCancel={() => setDeleteTargetUser(null)}
      />
    </div>
  );
};
