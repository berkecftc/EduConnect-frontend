import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../../store/slices/authSlice';
import { useTheme } from '../../../context/ThemeContext';
import adminService from '../../../api/adminService';
import {
  Shield, Users, GraduationCap, Building2, Calendar, Archive,
  Search, Check, X, Image, Trash2, LogOut, Loader2,
  AlertCircle, UserCheck, Clock, Sun, Moon, Menu, BarChart2, Briefcase
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, role, email } = useSelector((state) => state.auth);
  const { isDarkMode, toggleTheme } = useTheme();

  // Layout & Theme State
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClubForDelete, setSelectedClubForDelete] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [stats, setStats] = useState({ totalStudents: 0, activeClubs: 0, monthlyEvents: 0, pendingTotal: 0 });

  useEffect(() => {
    if (activeTab === 'overview') fetchDashboardStats();
    else fetchData();
  }, [activeTab]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const getSafe = async (fn) => { try { return await fn(); } catch { return { data: [] }; } };
      const [usersRes, clubsRes, clubReqRes, eventsRes, academicianReqRes, studentReqRes, clubOfficialReqRes] = await Promise.all([
        getSafe(adminService.getAllUsers.bind(adminService)),
        getSafe(adminService.getAllActiveClubs.bind(adminService)),
        getSafe((adminService.getClubRequests || adminService.getClubCreationRequests).bind(adminService)),
        getSafe((adminService.getAllEvents || adminService.getEventRequests).bind(adminService)),
        getSafe(adminService.getAcademicianRequests.bind(adminService)),
        getSafe(adminService.getStudentRequests.bind(adminService)),
        getSafe(adminService.getClubOfficialRequests.bind(adminService))
      ]);

      const users = usersRes.data || [];
      const clubs = clubsRes.data || [];
      const events = eventsRes.data || [];

      const studentCount = users.filter((u) => u.roles?.includes('ROLE_STUDENT')).length;
      const eventsThisMonth = events.filter((e) => {
        const d = new Date(e.date || e.eventDate);
        return !isNaN(d) && d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
      }).length;

      setStats({
        totalStudents: studentCount,
        activeClubs: clubs.length,
        monthlyEvents: eventsThisMonth,
        pendingTotal: (academicianReqRes.data?.length || 0) + (studentReqRes.data?.length || 0) + (clubOfficialReqRes.data?.length || 0) + (clubReqRes.data?.length || 0)
      });
    } catch { } finally { setLoading(false); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === 'users') response = await adminService.getAllUsers();
      else if (activeTab === 'students') response = await adminService.getStudentRequests();
      else if (activeTab === 'academicians') response = await adminService.getAcademicianRequests();
      else if (activeTab === 'clubOfficials') response = await adminService.getClubOfficialRequests();
      else if (activeTab === 'clubs') response = await adminService.getClubCreationRequests();
      else if (activeTab === 'activeClubs') response = await adminService.getAllActiveClubs();
      else if (activeTab === 'inactiveClubs') response = await adminService.getInactiveClubs();
      else if (activeTab === 'inactiveStudents') response = await adminService.getInactiveStudents();
      else if (activeTab === 'inactiveAcademicians') response = await adminService.getInactiveAcademicians();
      setData(response?.data || []);
    } catch { setData([]); } finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Bu isteği onaylamak istiyor musunuz?")) return;
    try {
      if (activeTab === 'students') await adminService.approveStudent(id);
      else if (activeTab === 'academicians') await adminService.approveAcademician(id);
      else if (activeTab === 'clubOfficials') await adminService.approveClubOfficial(id);
      else if (activeTab === 'clubs') await adminService.approveClubCreation(id);
      alert("İşlem Başarılı!");
      fetchData();
    } catch (error) { alert("Hata: " + (error.response?.data?.message || '')); }
  };

  const handleReject = async (id) => {
    if (activeTab === 'activeClubs') {
      setSelectedClubForDelete(data.find(c => c.id === id));
      setIsDeleteModalOpen(true);
      return;
    }
    if (!window.confirm("Bu isteği REDDETMEK istediğinize emin misiniz?")) return;
    try {
      if (activeTab === 'students') await adminService.rejectStudent(id);
      else if (activeTab === 'academicians') await adminService.rejectAcademician(id);
      else if (activeTab === 'clubOfficials') await adminService.rejectClubOfficial(id);
      else if (activeTab === 'clubs') await adminService.rejectClubCreation(id);
      alert("Reddedildi/Silindi.");
      fetchData();
    } catch (error) { alert("Hata: " + (error.response?.data?.message || '')); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;
    try { await adminService.deleteUser(userId); alert("Silindi."); fetchData(); } catch { alert("Silinemedi."); }
  };

  const confirmDeleteClub = async () => {
    try { await adminService.deleteClub(selectedClubForDelete.id); alert("Kapatıldı"); setIsDeleteModalOpen(false); setSelectedClubForDelete(null); fetchData(); }
    catch (e) { alert("Hata"); }
  };

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  const getFilteredData = () => {
    let filtered = data;
    if (activeTab === 'users' && userRoleFilter !== 'ALL') {
      filtered = filtered.filter(u => u.roles?.includes(userRoleFilter));
    }
    if (searchTerm.trim() !== '') {
      const t = searchTerm.toLowerCase();
      filtered = filtered.filter(item => JSON.stringify(item).toLowerCase().includes(t));
    }
    return filtered;
  };

  const displayData = getFilteredData();

  const menuGroups = [
    { label: 'Genel', items: [{ id: 'overview', icon: BarChart2, label: 'Genel Bakış' }, { id: 'users', icon: Users, label: 'Kullanıcılar' }] },
    { label: 'Başvurular', items: [{ id: 'students', icon: GraduationCap, label: 'Öğrenci Başvuru' }, { id: 'academicians', icon: Briefcase, label: 'Eğitmen Başvuru' }, { id: 'clubOfficials', icon: Shield, label: 'Kulüp Başk. Başvuru' }, { id: 'clubs', icon: Building2, label: 'Yeni Kulüp Başvuruları' }] },
    { label: 'Yönetim', items: [{ id: 'activeClubs', icon: Building2, label: 'Aktif Kulüpler' }] },
    { label: 'Arşiv', items: [{ id: 'inactiveClubs', icon: Archive, label: 'Pasif Kulüpler' }, { id: 'inactiveStudents', icon: Archive, label: 'Pasif Öğrenciler' }, { id: 'inactiveAcademicians', icon: Archive, label: 'Pasif Akademisyenler' }] }
  ];

  const statsCards = [
    { label: 'Toplam Öğrenci', value: stats.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Aktif Kulüpler', value: stats.activeClubs, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Bu Ayki Etkinlikler', value: stats.monthlyEvents, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Bekleyen Onay', value: stats.pendingTotal, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col md:flex-row">
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 relative">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300"><Menu className="w-6 h-6" /></button>
        <span className="font-bold text-lg text-blue-600 dark:text-blue-400">Admin Paneli</span>
        <button onClick={toggleTheme} className="p-2 text-slate-600 dark:text-slate-300">{isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
      </div>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 transition-transform duration-300 ease-in-out transform overflow-y-auto ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 hidden md:flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex flex-col">
            <span className="font-bold text-xl text-blue-600 dark:text-blue-400">EduConnect</span>
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1 mt-1"><Shield className="w-3 h-3" /> Sistem Yöneticisi</span>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex-1 py-4 px-3 space-y-6">
          {menuGroups.map((group, i) => (
            <div key={i} className="space-y-1">
              <div className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">{group.label}</div>
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" /> <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        {activeTab === 'overview' ? (
          <div className="animate-in fade-in duration-500 py-4">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Genel Bakış</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsCards.map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-slate-100">{loading ? '-' : stat.value}</p>
                  </div>
                  <div className={`p-4 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 mb-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Hoş Geldiniz, Yaratıcı Zihin</h2>
              <p className="text-slate-600 dark:text-slate-400">Soldaki menüyü kullanarak EduConnect platformunun tüm denetimlerini gerçekleştirebilirsiniz. Bekleyen onaylar kısmındaki kırmızı rozetler, aksiyon almanız gereken yerleri işaret eder.</p>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                {menuGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label}
              </h1>

              <div className="flex items-center gap-3">
                {activeTab === 'users' && (
                  <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-700 dark:text-slate-300">
                    <option value="ALL">Tümü</option>
                    <option value="ROLE_STUDENT">Öğrenciler</option>
                    <option value="ROLE_ACADEMICIAN">Eğitmenler</option>
                    <option value="ROLE_CLUB_OFFICIAL">Kulüp Bşk.</option>
                  </select>
                )}
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:border-blue-500 dark:text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div> : displayData.length === 0 ? <div className="p-12 text-center text-slate-500 dark:text-slate-400">Kayıt Bulunamadı.</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Detaylar</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bilgi / Rol</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {displayData.map((item, i) => (
                        <tr key={item.id || item.userId || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{String(item.archiveId || item.originalId || item.id || item.userId || 'N/A').substring(0, 8)}...</td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 dark:text-slate-200">
                              {activeTab === 'users' && item.email}
                              {activeTab === 'students' && `${item.firstName || item.first_name} ${item.lastName || item.last_name}`}
                              {activeTab === 'academicians' && `${item.title || ''} ${item.firstName} ${item.lastName}`}
                              {activeTab === 'clubOfficials' && `${item.firstName} ${item.lastName}`}
                              {activeTab === 'clubs' && item.clubName}
                              {activeTab === 'activeClubs' && item.name}
                              {activeTab.includes('inactive') && (item.name || `${item.firstName} ${item.lastName}` || item.studentNumber)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {activeTab === 'students' && item.email}
                              {activeTab === 'academicians' && item.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {activeTab === 'users' && (item.roles || []).map(r => String(r).replace('ROLE_', '')).join(', ')}
                            {activeTab === 'students' && item.department}
                            {activeTab === 'academicians' && item.department}
                            {activeTab === 'clubs' && item.description?.substring(0, 40) + '...'}
                            {activeTab === 'activeClubs' && `Başkan: ${item.presidentName}`}
                          </td>
                          <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                            {activeTab === 'users' && <button onClick={() => handleDeleteUser(item.id)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                            {activeTab === 'activeClubs' && <button onClick={() => handleReject(item.id)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                            {['students', 'academicians', 'clubOfficials', 'clubs'].includes(activeTab) && (
                              <>
                                <button onClick={() => handleApprove(item.id || item.userId)} className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg"><Check className="w-4 h-4" /></button>
                                <button onClick={() => handleReject(item.id || item.userId)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg"><X className="w-4 h-4" /></button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Basic Modals can be placed below */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-lg border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Kulübü Kapat</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 flex flex-col gap-2">
              <span>{selectedClubForDelete?.name} kulübünü kapatmak istediğinizden emin misiniz?</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setIsDeleteModalOpen(false); setSelectedClubForDelete(null); }} className="flex-1 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200">İptal</button>
              <button onClick={confirmDeleteClub} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Evet, Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
