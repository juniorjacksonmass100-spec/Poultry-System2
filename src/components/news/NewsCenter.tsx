import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { PoultryNews, UserProfile, PoultryStock, EggProduction, BroodingRecord } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Newspaper,
  Send,
  AlertTriangle,
  Wheat,
  Flame,
  TrendingUp,
  Lightbulb,
  Search,
  User,
  Users,
  CheckCircle2,
  Trash2,
  X,
  Clock,
  Shield,
  MessageSquarePlus,
} from 'lucide-react';

interface NewsCenterProps {
  news: PoultryNews[];
  users: UserProfile[];
  poultry: PoultryStock[];
  eggs: EggProduction[];
  brooding: BroodingRecord[];
  onDispatchNews: (newsData: Omit<PoultryNews, 'id' | 'created_at'>) => Promise<void>;
  onDeleteNews: (id: string) => Promise<void>;
}

export const NewsCenter: React.FC<NewsCenterProps> = ({
  news,
  users,
  poultry,
  eggs,
  brooding,
  onDispatchNews,
  onDeleteNews,
}) => {
  const { t, lang } = useLanguage();
  const { user, isAdmin, profile } = useAuth();
  const { theme } = useTheme();
  const { notify } = useToast();

  const isLight = theme === 'light';
  const isSw = lang === 'sw';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State for Dispatching News (Admin)
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PoultryNews['category']>('disease_alert');
  const [priority, setPriority] = useState<PoultryNews['priority']>('normal');
  const [targetUserId, setTargetUserId] = useState<string>('broadcast');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Quick Advisory Templates for Admin (Dynamic bilingual)
  const applyTemplate = (type: 'outbreak' | 'feed' | 'brooder' | 'laying' | 'vaccine') => {
    switch (type) {
      case 'outbreak':
        setTitle(
          isSw
            ? 'Tahadhari ya Haraka: Ugonjwa wa Kideri (Newcastle) & Usafi wa Shamba'
            : 'Urgent Biosecurity Alert: Newcastle Disease Precaution'
        );
        setCategory('disease_alert');
        setPriority('urgent');
        setContent(
          isSw
            ? 'Kumetokea mlipuko wa ugonjwa wa Kideri katika maeneo ya jirani. Hatua za kuchukua: Zuia wageni kuingia banda la kuku bila kupulizia dawa viatu langoni, weka dawa ya klorini kwenye maji (3-5 ppm), na wape kuku chanjo ya LaSota kwenye maji ya kunywa mara moja.'
            : 'A rise in Newcastle disease cases has been reported regionally. Recommended action: Restrict farm visitors, disinfect footwear at the gate, chlorinate drinking water (3-5 ppm), and administer booster LaSota immediately.'
        );
        break;
      case 'feed':
        setTitle(
          isSw
            ? 'Ushauri wa Lishe: Uwiano Sahihi wa Protini na Nishati kwa Ukuaji'
            : 'Feed Efficiency Advisory: Crude Protein & Energy Balance'
        );
        setCategory('feeding_nutrition');
        setPriority('normal');
        setContent(
          isSw
            ? 'Ili kupunguza gharama za chakula na kuku wakue haraka: ongeza kiwango cha soya na pumba laini kwenye mchanganyiko. Epuka chakula kilicho na ukungu au vumbi jingi ili kuzuia sumu kuvu (aflatoxin) na ugonjwa wa matumbo.'
            : 'To lower feed conversion ratio (FCR) while maintaining bird weight, balance fine bran and soya meal ratio. Avoid dusty or moldy mash to prevent aflatoxin contamination and gut enteritis.'
        );
        break;
      case 'brooder':
        setTitle(
          isSw
            ? 'Ushauri wa Vifaranga: Joto na Hewa Katika Chumba cha Malezi (Brooder)'
            : 'Chicks Brooding Advisory: Temperature & Ventilation Tuning'
        );
        setCategory('brooding_hatching');
        setPriority('high');
        setContent(
          isSw
            ? 'Kagua taa za joto kila siku. Wape vifaranga maji yenye glukosi na vitamini kwa siku 3 za kwanza. Hakikisha kuna hewa safi inayopita bila upepo mkali kuwapuliza vifaranga moja kwa moja.'
            : 'Check brooder heat lamps daily. Provide 24 hours of light for the first 3 days with glucose/multivitamin water. Ensure adequate cross-ventilation without direct drafts on young chicks.'
        );
        break;
      case 'laying':
        setTitle(
          isSw
            ? 'Kuongeza Mayai: Madini ya Chokaa (Calcium) kwa Maganda Magumu'
            : 'Egg Yield Optimization: Peak Laying Calcium Supplementation'
        );
        setCategory('management_tips');
        setPriority('normal');
        setContent(
          isSw
            ? 'Kuku wa mayai wanahitaji madini ya chokaa (calcium) wakati wa jioni wakati ganda la yai linatengenezwa. Wape kuku mawe madogo ya chokaa (limestone grit) au maganda ya chaza ili kuzuia mayai laini na maganda kuvunjika ovyo.'
            : 'Your layers require high calcium intake during shell calcification in the evening. Provide coarse limestone grit alongside standard layer mash to minimize cracked and thin-shelled eggs.'
        );
        break;
      case 'vaccine':
        setTitle(
          isSw
            ? 'Kikumbusho cha Chanjo: Chanjo ya Gumboro ya Siku ya 21'
            : 'Vaccination Schedule Reminder: Day 21 Gumboro Booster'
        );
        setCategory('disease_alert');
        setPriority('high');
        setContent(
          isSw
            ? 'Kwa makundi yanayokaribia siku 21: wanyime kuku maji kwa masaa 2 kabla ya kutoa chanjo. Changanya chanjo na maziwa ya unga au stabilizer ili virusi visiuawe na jua au joto.'
            : 'For all batches approaching day 21: withhold water for 2 hours before administering the vaccine in skim milk stabilized cool water. Protect vaccine from direct heat and sunlight.'
        );
        break;
    }
  };

  // Helper for Admin to craft personalized suggestion for a farmer
  const openAdvisoryForUser = (targetUser: UserProfile) => {
    setTargetUserId(targetUser.id);
    const farmerName = targetUser.full_name || targetUser.email.split('@')[0];

    setTitle(
      isSw
        ? `Ushauri Maalum wa Shamba kwa ${farmerName}`
        : `Custom Farm Advisory for ${farmerName}`
    );
    setCategory('management_tips');
    setPriority('normal');
    setContent(
      isSw
        ? `Habari ndugu ${farmerName},\n\nKutokana na ukaguzi wa kumbukumbu za kuku wako shambani, hapa kuna miongozo ya kuboresha uzalishaji:\n• Hakikisha usafi thabiti wa vyombo vya maji mara mbili kwa siku.\n• Fuatilia uzito na ulaji wa chakula kila wiki.\n• Wasiliana na uongozi wa shamba mara moja ukiona dalili zozote za ugonjwa.`
        : `Hello ${farmerName},\n\nBased on your recent poultry operations and farm log reviews, here is your customized guidance:\n• Ensure strict sanitation of drinking fonts twice daily.\n• Monitor feed intake to optimize bird growth and egg yield.\n• Reach out to farm administration if you observe any clinical symptoms.`
    );
    setIsModalOpen(true);
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedUserObj = users.find((u) => u.id === targetUserId);
      const isBroadcast = targetUserId === 'broadcast';

      await onDispatchNews({
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        target_user_id: isBroadcast ? null : targetUserId,
        target_user_email: isBroadcast ? null : (selectedUserObj?.email || null),
        author_id: user?.id || null,
        author_name: profile?.full_name || (isSw ? 'Msimamizi wa Shamba' : 'Farm Administration'),
        suggestion_context: isBroadcast
          ? isSw ? 'Tangazo la Msimamizi Mkuu' : 'Administrator Broadcast'
          : `${isSw ? 'Ushauri Maalum kwa' : 'Custom Advisory for'} ${selectedUserObj?.full_name || selectedUserObj?.email || 'User'}`,
      });

      setSuccessToast(
        isBroadcast
          ? isSw ? 'Tangazo la habari limetumwa kwa watumiaji wote!' : 'Broadcast news dispatched to all users!'
          : `${isSw ? 'Ushauri umetumwa moja kwa moja kwa' : 'Advisory sent directly to'} ${selectedUserObj?.email}!`
      );
      setTimeout(() => setSuccessToast(null), 4000);
      setIsModalOpen(false);
      setTitle('');
      setContent('');
      setTargetUserId('broadcast');
    } catch (err: any) {
      // Keep the form open so nothing the admin typed is lost, and say what went wrong
      notify('error', err?.message || (isSw ? 'Imeshindwa kutuma habari.' : 'Could not post the news.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await onDeleteNews(deleteTargetId);
      setDeleteTargetId(null);
      notify('success', isSw ? 'Habari imefutwa kwa kila mtu.' : 'Message deleted for everyone.');
    } catch (err: any) {
      setDeleteTargetId(null);
      notify('error', err?.message || (isSw ? 'Imeshindwa kufuta.' : 'Could not delete the message.'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter news
  const filteredNews = news.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.author_name && item.author_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'disease_alert':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'feeding_nutrition':
        return <Wheat className="w-4 h-4 text-amber-500" />;
      case 'brooding_hatching':
        return <Flame className={`w-4 h-4 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />;
      case 'market_prices':
        return <TrendingUp className="w-4 h-4 text-cyan-500" />;
      default:
        return <Lightbulb className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40">
            {t.priorityUrgent}
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40">
            {t.priorityHigh}
          </span>
        );
      default:
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              isLight
                ? 'text-teal-800 bg-teal-50 border border-teal-200'
                : 'text-[#8fbdb8] bg-[#051c20] border border-[#00f5c4]/20'
            }`}
          >
            {t.priorityNormal}
          </span>
        );
    }
  };

  const categories = [
    { id: 'all', label: isSw ? 'Habari Zote' : 'All Updates' },
    { id: 'disease_alert', label: isSw ? 'Usalama wa Magonjwa' : 'Biosecurity' },
    { id: 'feeding_nutrition', label: isSw ? 'Lishe & Chakula' : 'Nutrition' },
    { id: 'brooding_hatching', label: isSw ? 'Utotoleshaji' : 'Brooding' },
    { id: 'market_prices', label: isSw ? 'Masoko & Bei' : 'Market' },
    { id: 'management_tips', label: isSw ? 'Vidokezo vya Usimamizi' : 'Tips' },
  ];

  return (
    <div className={`space-y-6 transition-colors ${isLight ? 'text-slate-800' : 'text-white'}`}>
      {/* Header Banner */}
      <div
        className={`border rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
          isLight
            ? 'bg-gradient-to-r from-teal-50 via-emerald-50 to-white border-teal-200 shadow-sm'
            : 'bg-gradient-to-r from-[#031518] via-[#051c20] to-[#072428] border-[#00f5c4]/35 shadow-[0_0_25px_rgba(0,245,196,0.15)] text-white'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-md ${
                isLight
                  ? 'bg-teal-100 text-teal-800 border-teal-300'
                  : 'bg-[#00f5c4]/20 border-[#00f5c4]/45 text-[#00f5c4] shadow-[0_0_12px_rgba(0,245,196,0.35)]'
              }`}
            >
              <Newspaper className="w-5 h-5" />
            </div>
            <h2 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {t.newsAdvisory}
            </h2>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                isLight
                  ? 'text-teal-800 bg-teal-100 border-teal-300'
                  : 'text-[#00f5c4] bg-[#00f5c4]/15 border-[#00f5c4]/35 shadow-[0_0_8px_rgba(0,245,196,0.25)]'
              }`}
            >
              {t.liveFeed}
            </span>
          </div>
          <p className={`text-xs mt-1.5 leading-relaxed max-w-2xl ${isLight ? 'text-slate-600' : 'text-[#8fbdb8]'}`}>
            {isAdmin
              ? isSw
                ? 'Kama Msimamizi Mkuu, kagua data za wakulima wote na tuma miongozo maalum ya shamba, tahadhari za magonjwa, na ushauri wa lishe kwa wakulima binafsi au wote.'
                : 'As the Administrator, review all registered farmers’ data and send customized poultry advisories, disease warnings, or broadcast intelligence to specific users.'
              : isSw
              ? 'Taarifa za moja kwa moja za shamba, tahadhari za magonjwa, fomula za chakula, na miongozo binafsi iliyotumwa kwako na uongozi wa shamba.'
              : 'Real biosecurity warnings, feed ratio guidance, and personalized recommendations dispatched directly to you by farm administration.'}
          </p>
        </div>

        {/* Admin Action: Dispatch news */}
        {isAdmin && (
          <button
            onClick={() => {
              setTargetUserId('broadcast');
              setTitle('');
              setContent('');
              setIsModalOpen(true);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              isLight
                ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-md'
                : 'bg-[#00f5c4] hover:bg-[#1effd5] text-[#021f1a] shadow-[0_0_18px_rgba(0,245,196,0.4)]'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{t.dispatchNews}</span>
          </button>
        )}
      </div>

      {successToast && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-400/40 rounded-xl text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ADMIN ONLY: Farmer Intelligence & Direct Advisory Dispatcher */}
      {isAdmin && users.length > 0 && (
        <div
          className={`border rounded-2xl p-4 sm:p-5 transition-colors ${
            isLight
              ? 'bg-white border-teal-200 shadow-sm'
              : 'bg-[#030d0f] border-[#00f5c4]/30 shadow-[0_0_20px_rgba(0,245,196,0.1)]'
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-teal-200/40 dark:border-[#00f5c4]/15">
            <div className="flex items-center gap-2">
              <Users className={`w-4 h-4 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
              <h3 className={`text-xs sm:text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {t.farmerIntelligence}
              </h3>
            </div>
            <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
              {users.length} {isSw ? 'Watumiaji Waliosajiliwa' : 'Registered Users'}
            </span>
          </div>

          <p className={`text-xs mb-3 leading-relaxed ${isLight ? 'text-slate-600' : 'text-[#8fbdb8]'}`}>
            {isSw
              ? 'Chagua mtumiaji yeyote hapa chini kumtumia ushauri binafsi wa shamba moja kwa moja:'
              : 'Select any farmer below to review and send them an individualized advisory tailored to their farm:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map((u) => {
              const isCurrentAdmin = u.role === 'admin';
              return (
                <div
                  key={u.id}
                  className={`border rounded-xl p-3 flex items-center justify-between gap-2.5 transition-all ${
                    isLight
                      ? 'bg-slate-50 hover:bg-teal-50/60 border-slate-200 hover:border-teal-300'
                      : 'bg-[#020708] border-[#00f5c4]/20 hover:border-[#00f5c4]/50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {u.full_name || u.email.split('@')[0]}
                      </span>
                      {isCurrentAdmin ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold border border-teal-300">
                          {isSw ? 'Msimamizi' : 'Admin'}
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-semibold border border-cyan-300">
                          {isSw ? 'Mtumiaji' : 'User'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate font-mono mt-0.5">{u.email}</p>
                  </div>

                  <button
                    onClick={() => openAdvisoryForUser(u)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 font-semibold text-[11px] rounded-lg border transition-all shrink-0 cursor-pointer ${
                      isLight
                        ? 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600 shadow-sm'
                        : 'bg-[#051c20] hover:bg-[#00f5c4] text-[#00f5c4] hover:text-[#021f1a] border-[#00f5c4]/30'
                    }`}
                    title={isSw ? 'Tuma ushauri maalum kwa mtumiaji huyu' : 'Send targeted advisory to this user'}
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>{t.suggestAdvisory}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border rounded-2xl p-3.5 transition-colors ${
          isLight
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#030d0f] border-[#00f5c4]/25 shadow-[0_0_15px_rgba(0,245,196,0.08)] text-white'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]/70'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isSw ? 'Tafuta ushauri, magonjwa, chakula cha kuku...' : 'Search news, disease alerts, feed formulas...'}
              className={`w-full border rounded-xl pl-9 pr-3 py-1.5 text-xs transition-colors focus:outline-hidden ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500'
                  : 'bg-[#020708] border-[#00f5c4]/20 text-white placeholder:text-neutral-500 focus:border-[#00f5c4] focus:shadow-[0_0_10px_rgba(0,245,196,0.25)]'
              }`}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? isLight
                    ? 'bg-teal-600 text-white font-bold shadow-sm'
                    : 'bg-[#00f5c4] text-[#021f1a] font-bold shadow-[0_0_12px_rgba(0,245,196,0.35)]'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200'
                  : 'bg-[#051618] text-[#8fbdb8] hover:text-white border border-[#00f5c4]/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* News Feed Grid */}
      <div className="space-y-4">
        {filteredNews.length === 0 ? (
          <div
            className={`p-12 text-center border rounded-2xl ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-[#030d0f] border-[#00f5c4]/20 text-white'
            }`}
          >
            <Lightbulb className={`w-8 h-8 mx-auto mb-2 opacity-60 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
            <h3 className="text-sm font-bold">{t.noNewsAvailable}</h3>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>{t.noNewsDesc}</p>
          </div>
        ) : (
          filteredNews.map((item) => {
            const isPersonalAdvisory = Boolean(item.target_user_id || item.target_user_email);

            return (
              <div
                key={item.id}
                className={`border rounded-2xl p-5 sm:p-6 transition-all duration-200 ${
                  isLight
                    ? isPersonalAdvisory
                      ? 'bg-teal-50/70 border-teal-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-teal-400 shadow-sm'
                    : isPersonalAdvisory
                    ? 'bg-gradient-to-b from-[#051618] to-[#030d0f] border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.18)]'
                    : 'bg-gradient-to-b from-[#051618] to-[#030d0f] border-[#00f5c4]/30 hover:border-[#00f5c4]/70 shadow-[0_0_20px_rgba(0,245,196,0.1)]'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
                        isLight
                          ? 'bg-teal-100 border-teal-300 text-teal-800'
                          : 'bg-[#00f5c4]/15 border-[#00f5c4]/30'
                      }`}
                    >
                      {getCategoryIcon(item.category)}
                    </div>
                    <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {item.title}
                    </h3>
                    {getPriorityBadge(item.priority)}

                    {/* Specific Targeted Badge */}
                    {isPersonalAdvisory && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-teal-800 dark:text-cyan-200 bg-teal-100 dark:bg-cyan-500/20 border border-teal-300 dark:border-cyan-400/40 flex items-center gap-1 shadow-sm">
                        <User className="w-3 h-3" />
                        {t.targetedAdvisoryYou}
                      </span>
                    )}
                  </div>

                  <div className={`flex items-center gap-3 text-xs ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
                    <span className="flex items-center gap-1">
                      <Clock className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteTargetId(item.id)}
                        className="text-rose-500 hover:text-white p-1 rounded-md hover:bg-rose-500 transition-colors cursor-pointer"
                        title={t.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${isLight ? 'text-slate-700' : 'text-[#c8eae6]'}`}>
                  {item.content}
                </p>

                <div
                  className={`mt-4 pt-3.5 border-t flex items-center justify-between text-xs ${
                    isLight ? 'border-slate-200 text-slate-500' : 'border-[#00f5c4]/15 text-[#8fbdb8]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{t.authorLabel}:</span>
                    <span className={`font-medium ${isLight ? 'text-teal-700' : 'text-[#00f5c4]'}`}>
                      {item.author_name || (isSw ? 'Msimamizi wa Shamba' : 'Farm Administration')}
                    </span>
                    {item.suggestion_context && (
                      <span className={`hidden sm:inline-block ${isLight ? 'text-slate-400' : 'text-[#5c8b87]'}`}>
                        · {item.suggestion_context}
                      </span>
                    )}
                  </div>

                  {item.target_user_email && (
                    <span className="text-[11px] text-teal-700 dark:text-cyan-300 font-mono">
                      {t.sentToLabel}: {item.target_user_email}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal for Admin */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title={t.deleteNewsTitle}
        message={t.deleteNewsConfirm}
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Dispatch News Modal (Admin Only) */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            className={`border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ${
              isLight
                ? 'bg-white border-teal-300 text-slate-900'
                : 'bg-[#051315] border-[#00f5c4]/45 shadow-[0_0_40px_rgba(0,245,196,0.25)] text-white'
            }`}
          >
            <div
              className={`p-4 sm:p-5 border-b flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#040e10] border-[#00f5c4]/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className={`w-5 h-5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
                <div>
                  <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {t.dispatchNewsModalTitle}
                  </h3>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#8fbdb8]'}`}>
                    {t.dispatchNewsModalDesc}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#0d2729] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Quick Template Selector */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-[#8fbdb8]'}`}>
                  {t.quickTemplates}:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyTemplate('outbreak')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-600 dark:text-rose-300 rounded-lg transition-colors cursor-pointer"
                  >
                    🚨 {isSw ? 'Kideri & Usafi' : 'Newcastle Outbreak'}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('feed')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-600 dark:text-amber-300 rounded-lg transition-colors cursor-pointer"
                  >
                    🌾 {isSw ? 'Fomula ya Chakula' : 'Feed Ratio Tip'}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('brooder')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/35 text-teal-700 dark:text-[#00f5c4] rounded-lg transition-colors cursor-pointer"
                  >
                    🐣 {isSw ? 'Joto la Vifaranga' : 'Brooding Heat'}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('laying')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-700 dark:text-cyan-300 rounded-lg transition-colors cursor-pointer"
                  >
                    🥚 {isSw ? 'Chokaa cha Mayai' : 'Calcium Boost'}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('vaccine')}
                    className="px-2.5 py-1 text-[11px] font-medium bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors cursor-pointer"
                  >
                    💉 {isSw ? 'Chanjo ya Gumboro' : 'Vaccine Reminder'}
                  </button>
                </div>
              </div>

              <form onSubmit={handleDispatchSubmit} className="space-y-4">
                {/* Target Audience Selector */}
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-[#8fbdb8]'}`}>
                    {t.targetRecipient}:
                  </label>
                  <div className="relative">
                    <Users className={`w-4 h-4 absolute left-3 top-2.5 ${isLight ? 'text-teal-600' : 'text-[#00f5c4]'}`} />
                    <select
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-hidden ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500'
                          : 'bg-[#020708] border-[#00f5c4]/25 text-white focus:border-[#00f5c4]'
                      }`}
                    >
                      <option value="broadcast">{t.broadcastAll}</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          👤 {u.full_name ? `${u.full_name} (${u.email})` : u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-[#8fbdb8]'}`}>
                      {t.advisoryCategory}:
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-hidden ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500'
                          : 'bg-[#020708] border-[#00f5c4]/25 text-white focus:border-[#00f5c4]'
                      }`}
                    >
                      <option value="disease_alert">{t.diseaseOutbreak}</option>
                      <option value="feeding_nutrition">{t.feedingNutritionCat}</option>
                      <option value="brooding_hatching">{t.broodingHatchingCat}</option>
                      <option value="market_prices">{t.marketPricesCat}</option>
                      <option value="management_tips">{t.managementTipsCat}</option>
                      <option value="general">{t.generalAnnouncement}</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-[#8fbdb8]'}`}>
                      {t.priorityLevel}:
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-hidden ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500'
                          : 'bg-[#020708] border-[#00f5c4]/25 text-white focus:border-[#00f5c4]'
                      }`}
                    >
                      <option value="normal">{t.priorityNormal}</option>
                      <option value="high">{t.priorityHigh}</option>
                      <option value="urgent">{t.priorityUrgent}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-[#8fbdb8]'}`}>
                    {t.advisoryHeadline}:
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={isSw ? 'mfano: Mpango wa Chanjo ya Gumboro & Uingizaji Hewa' : 'e.g. Day 14 Gumboro Vaccine Protocol & Cold Weather Ventilation'}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-hidden ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500'
                        : 'bg-[#020708] border-[#00f5c4]/25 text-white focus:border-[#00f5c4]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-[#8fbdb8]'}`}>
                    {t.detailedAdvisory}:
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      isSw
                        ? 'Andika maelezo kamili ya ushauri, dalili, dawa zinazopendekezwa, vipimo vya chakula, au hatua za kuchukua kwa mkulima...'
                        : 'Describe specific symptoms, recommended medications, exact feed measurements, or operational steps for the poultry farmer...'
                    }
                    className={`w-full border rounded-xl p-3 text-xs focus:outline-hidden ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500'
                        : 'bg-[#020708] border-[#00f5c4]/25 text-white focus:border-[#00f5c4]'
                    }`}
                  />
                </div>

                <div className={`pt-3 border-t flex items-center justify-end gap-2.5 ${isLight ? 'border-slate-200' : 'border-[#00f5c4]/20'}`}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-[#092225] hover:bg-slate-300 dark:hover:bg-[#0e2e33] text-slate-700 dark:text-neutral-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-5 py-2 font-bold rounded-xl text-xs transition-all cursor-pointer ${
                      isLight
                        ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md'
                        : 'bg-[#00f5c4] hover:bg-[#1effd5] text-[#021f1a] shadow-[0_0_15px_rgba(0,245,196,0.35)]'
                    }`}
                  >
                    {isSubmitting ? t.dispatching : t.sendAdvisory}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
