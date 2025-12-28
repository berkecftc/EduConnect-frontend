import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../../api/adminService';
import { 
  Shield, Users, GraduationCap, Building2, Calendar, Archive, 
  Search, Check, X, Eye, Crown, Image, Trash2, LogOut, Loader2, 
  Sun, Moon, AlertCircle, UserCheck, UserX, Clock, ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('PENDING');
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [boardMembers, setBoardMembers] = useState([]);
  const [selectedClubName, setSelectedClubName] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('adminDarkMode');
    return saved !== null ? JSON.parse(saved) : true; // Varsayılan olarak dark mode
  });
  const [isPresidentModalOpen, setIsPresidentModalOpen] = useState(false);
  const [selectedClubForPresident, setSelectedClubForPresident] = useState(null);
  const [newPresidentId, setNewPresidentId] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClubForDelete, setSelectedClubForDelete] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeClubs: 0,
    monthlyEvents: 0,
    pendingTotal: 0
  });

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const getAllUsers = adminService.getAllUsers?.bind(adminService);
      const getAllActiveClubs = adminService.getAllActiveClubs?.bind(adminService);
      const getClubRequests =
        (adminService.getClubRequests && adminService.getClubRequests.bind(adminService)) ||
        (adminService.getClubCreationRequests && adminService.getClubCreationRequests.bind(adminService));
      const getAllEvents =
        (adminService.getAllEvents && adminService.getAllEvents.bind(adminService)) ||
        (adminService.getEventRequests && adminService.getEventRequests.bind(adminService));

      const safeCall = async (fn) => {
        if (!fn) return { data: [] };
        return fn();
      };

      const [usersRes, clubsRes, clubReqRes, eventsRes] = await Promise.all([
        safeCall(getAllUsers),
        safeCall(getAllActiveClubs),
        safeCall(getClubRequests),
        safeCall(getAllEvents)
      ]);

      const users = usersRes.data || [];
      const clubs = clubsRes.data || [];
      const clubRequests = clubReqRes.data || [];
      const events = eventsRes.data || [];

      const studentCount = users.filter((u) => u.roles && u.roles.includes('ROLE_STUDENT')).length;
      const activeClubCount = clubs.length;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const eventsThisMonth = events.filter((event) => {
        const rawDate = event?.date || event?.eventDate;
        if (!rawDate) return false;
        const eventDate = new Date(rawDate);
        if (Number.isNaN(eventDate.getTime())) return false;
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
      }).length;

      const totalPending = clubRequests.length;

      setStats({
        totalStudents: studentCount,
        activeClubs: activeClubCount,
        monthlyEvents: eventsThisMonth,
        pendingTotal: totalPending
      });
    } catch (err) {
      console.error('İstatistikler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboardStats();
    } else {
      fetchData();
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let response;
      
      if (activeTab === 'users') {
        response = await adminService.getAllUsers();
      } else if (activeTab === 'academicians') {
        response = await adminService.getAcademicianRequests();
      } else if (activeTab === 'clubOfficials') {
        response = await adminService.getClubOfficialRequests();
      } else if (activeTab === 'clubs') {
        response = await adminService.getClubCreationRequests();
      } else if (activeTab === 'activeClubs') {
        response = await adminService.getAllActiveClubs();
      } else if (activeTab === 'events') {
        response = await adminService.getAllEvents();
      } else if (activeTab === 'inactiveClubs') {
        response = await adminService.getInactiveClubs();
      } else if (activeTab === 'inactiveStudents') {
        response = await adminService.getInactiveStudents();
      } else if (activeTab === 'inactiveAcademicians') {
        response = await adminService.getInactiveAcademicians();
      }
      
      setData(response?.data || []); 
    } catch (error) {
      console.error("Veri çekilemedi:", error);
      setData([]); 
    } finally {
      setLoading(false);
    }
  };

  const parseDate = (item) => {
    if (!item) return null;
    const raw = item.eventTime || item.date || item.eventDate || item.startDate || item.startTime || item.time || item.createdDate;
    if (!raw) return null;
    if (Array.isArray(raw)) {
      return new Date(raw[0], raw[1] - 1, raw[2], raw[3] || 0, raw[4] || 0);
    }
    if (typeof raw === 'number') {
      return new Date(raw);
    }
    return new Date(raw);
  };

  const handleApprove = async (id) => {
    if(!window.confirm("Bu isteği onaylamak istiyor musunuz?")) return;
    try {
      if (activeTab === 'academicians') await adminService.approveAcademician(id);
      else if (activeTab === 'clubOfficials') await adminService.approveClubOfficial(id);
      else if (activeTab === 'clubs') await adminService.approveClubCreation(id);
      else if (activeTab === 'events') await adminService.approveEvent(id);
      
      alert("İşlem Başarılı!");
      fetchData();
    } catch (error) {
      alert("Onay işlemi başarısız: " + (error.response?.data?.message || error.message));
    }
  };

  const handleApproveEvent = async (eventId) => {
    try {
      await adminService.approveEvent(eventId);
      alert("Etkinlik onaylandı!");
      fetchData();
    } catch (err) {
      alert("Onaylanırken hata oluştu.");
    }
  };

  const handleReject = async (id) => {
    if (activeTab === 'activeClubs') {
      const club = data.find(c => c.id === id);
      setSelectedClubForDelete(club);
      setIsDeleteModalOpen(true);
      return;
    }

    if(!window.confirm("Bu isteği REDDETMEK istediğinize emin misiniz?")) return;

    try {
      if (activeTab === 'academicians') await adminService.rejectAcademician(id);
      else if (activeTab === 'clubOfficials') await adminService.rejectClubOfficial(id);
      else if (activeTab === 'clubs') await adminService.rejectClubCreation(id);
      else if (activeTab === 'events') await adminService.rejectEvent(id);
      
      alert("İstek reddedildi/silindi.");
      fetchData();
    } catch (error) {
      alert("İşlem başarısız: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if(!window.confirm("Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) return;
    try {
      await adminService.deleteUser(userId);
      alert("Kullanıcı silindi.");
      fetchData();
    } catch (error) {
      alert("Silme işlemi başarısız.");
    }
  };

  const handleUpdateLogo = async (clubId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert("Dosya boyutu 5MB'dan büyük olamaz!");
        return;
      }

      try {
        const response = await adminService.updateClubLogo(clubId, file);
        alert("Logo başarıyla güncellendi!");
        const newLogoUrl = response.data;
        setData(prevData => prevData.map(item => {
          if (item.id === clubId) {
            return { ...item, logoUrl: newLogoUrl };
          }
          return item;
        }));
      } catch (err) {
        console.error(err);
        alert("Logo yüklenirken hata oluştu: " + (err.response?.data || err.message));
      }
    };

    fileInput.click();
  };

  const handleViewBoard = async (clubId, clubName) => {
    try {
      const response = await adminService.getClubBoardMembers(clubId);
      setBoardMembers(response.data);
      setSelectedClubName(clubName);
      setIsBoardModalOpen(true);
    } catch (err) {
      alert("Yönetim kurulu bilgileri alınamadı.");
    }
  };

  const handleChangePresident = async (clubId) => {
    const club = data.find(c => c.id === clubId);
    setSelectedClubForPresident(club);
    setIsPresidentModalOpen(true);
  };

  const confirmChangePresident = async () => {
    if (!newPresidentId.trim()) {
      alert("Lütfen geçerli bir Öğrenci ID'si giriniz!");
      return;
    }

    try {
      await adminService.changeClubPresident(selectedClubForPresident.id, newPresidentId);
      alert("Başkan başarıyla değiştirildi.");
      setIsPresidentModalOpen(false);
      setNewPresidentId('');
      setSelectedClubForPresident(null);
      fetchData();
    } catch (err) {
      alert("Hata: " + (err.response?.data?.message || "Başkan değiştirilemedi. ID'nin kulübe üye olduğundan emin olun."));
    }
  };

  const handleLogout = () => {
    if (window.confirm("Çıkış yapmak istediğinize emin misiniz?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      navigate('/login');
    }
  };

  const confirmDeleteClub = async () => {
    try {
      await adminService.deleteClub(selectedClubForDelete.id);
      alert("Kulüp başarıyla kapatıldı.");
      setIsDeleteModalOpen(false);
      setSelectedClubForDelete(null);
      fetchData();
    } catch (error) {
      alert("İşlem başarısız: " + (error.response?.data?.message || error.message));
    }
  };

  const getFilteredEvents = () => {
    if (!data || !Array.isArray(data)) return [];
    const now = new Date();

    return data.filter(event => {
      const eventDate = parseDate(event);
      const isValidDate = eventDate && !isNaN(eventDate.getTime());
      const status = event.status ? event.status.trim() : '';

      switch (eventFilter) {
        case 'PENDING':
          return status === 'PENDING';
        case 'APPROVED': 
          return status === 'ACTIVE' && isValidDate && eventDate > now;
        case 'PAST':
          return status === 'ACTIVE' && (!isValidDate || eventDate <= now);
        case 'REJECTED':
          return status === 'REJECTED';
        default:
          return true;
      }
    });
  };

  const getFilteredData = () => {
    let filtered = data;

    if (activeTab === 'users' && userRoleFilter !== 'ALL') {
      filtered = filtered.filter(user => user.roles && user.roles.includes(userRoleFilter));
    }

    if (searchTerm.trim() !== '') {
      const lowerTerm = searchTerm.toLowerCase();
      
      filtered = filtered.filter(item => {
        if (activeTab === 'users') {
          return item.email?.toLowerCase().includes(lowerTerm);
        }
        if (activeTab === 'academicians') {
          const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
          return item.email?.toLowerCase().includes(lowerTerm) || 
                 fullName.includes(lowerTerm) ||
                 item.department?.toLowerCase().includes(lowerTerm);
        }
        if (activeTab === 'clubs' || activeTab === 'clubRequests') {
          return item.name?.toLowerCase().includes(lowerTerm) ||
                 item.description?.toLowerCase().includes(lowerTerm);
        }
        return JSON.stringify(item).toLowerCase().includes(lowerTerm);
      });
    }

    return filtered;
  };

  const displayData = activeTab === 'events' ? getFilteredEvents() : getFilteredData();
  
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('adminDarkMode', JSON.stringify(newValue));
      return newValue;
    });
  };

  const tabCategories = [
    {
      label: 'Genel',
      icon: Shield,
      gradient: 'from-blue-500 to-indigo-600',
      tabs: [
        { id: 'overview', label: 'Genel Bakış', icon: '📊' },
        { id: 'users', label: 'Tüm Kullanıcılar', icon: '👥' }
      ]
    },
    {
      label: 'İstek & Başvurular',
      icon: UserCheck,
      gradient: 'from-purple-500 to-pink-600',
      tabs: [
        { id: 'academicians', label: 'Akademisyen', icon: '👨‍🏫' },
        { id: 'clubOfficials', label: 'Kulüp Başkanı', icon: '🎓' },
        { id: 'clubs', label: 'Kulüp Kurma', icon: '🏛️' }
      ]
    },
    {
      label: 'Kulüp & Etkinlikler',
      icon: Calendar,
      gradient: 'from-emerald-500 to-teal-600',
      tabs: [
        { id: 'activeClubs', label: 'Aktif Kulüpler', icon: '✅' },
        { id: 'events', label: 'Etkinlikler', icon: '🎉' }
      ]
    },
    {
      label: 'Arşiv',
      icon: Archive,
      gradient: 'from-orange-500 to-red-600',
      tabs: [
        { id: 'inactiveClubs', label: 'Pasif Kulüpler', icon: '🔴' },
        { id: 'inactiveStudents', label: 'Pasif Öğrenciler', icon: '🔴' },
        { id: 'inactiveAcademicians', label: 'Pasif Akademisyenler', icon: '🔴' }
      ]
    }
  ];

  const statsCards = [
    { label: 'Toplam Öğrenci', value: stats.totalStudents, icon: Users, gradient: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-500/20' },
    { label: 'Aktif Kulüpler', value: stats.activeClubs, icon: Building2, gradient: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-500/20' },
    { label: 'Etkinlikler (Bu Ay)', value: stats.monthlyEvents, icon: Calendar, gradient: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-500/20' },
    { label: 'Bekleyen Onaylar', value: stats.pendingTotal, icon: Clock, gradient: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-500/20' }
  ];

  const CardLoader = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
    </div>
  );

  const EmptyState = ({ message }) => (
    <div className={`flex flex-col items-center justify-center py-12 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
      <div className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-700/60' : 'bg-gray-100'}`}>
        <span className="text-3xl">📭</span>
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDarkMode ? 'bg-linear-to-br from-slate-900 via-blue-900 to-slate-900' : 'bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <div className="relative z-10 p-4 md:p-8">
        {/* Header */}
        <header className={`backdrop-blur-xl border rounded-2xl p-6 mb-8 shadow-2xl transition-all duration-300 ${isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white/70 border-gray-200'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${isDarkMode ? 'bg-linear-to-r from-white to-blue-200 bg-clip-text text-transparent' : 'text-slate-900'}`}>
                  🎯 Yönetici Paneli
                </h1>
                <p className={`mt-1 ${isDarkMode ? 'text-blue-200/70' : 'text-slate-700'}`}>Hoş geldiniz, Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleTheme}
                className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 ${isDarkMode ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30' : 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300'}`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                onClick={handleLogout} 
                className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300' : 'bg-red-100 hover:bg-red-200 border border-red-300 text-red-700'}`}
              >
                <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </header>

        {/* Tab Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {tabCategories.map((category, catIndex) => (
            <div 
              key={catIndex} 
              className={`backdrop-blur-xl border rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/70 border-gray-200 hover:bg-white/90'}`}
            >
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-linear-to-r ${category.gradient} text-white text-sm font-semibold mb-3`}>
                <category.icon className="w-4 h-4" />
                {category.label}
              </div>
              <div className="flex flex-wrap gap-2">
                {category.tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? `bg-linear-to-r ${category.gradient} text-white shadow-lg`
                        : isDarkMode
                          ? 'bg-slate-700/60 text-slate-200 hover:bg-slate-600/70 border border-slate-600/50'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Overview Stats */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <div 
                key={index}
                className={`backdrop-blur-xl border rounded-2xl p-6 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white/80 border-gray-200'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-slate-700'}`}>{stat.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : stat.value}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-8 h-8 bg-linear-to-br ${stat.gradient} bg-clip-text text-transparent`} style={{color: stat.gradient.includes('blue') ? '#3b82f6' : stat.gradient.includes('purple') ? '#a855f7' : stat.gradient.includes('emerald') ? '#10b981' : '#f97316'}} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content Area */}
        {activeTab !== 'overview' && (
          <div className={`backdrop-blur-xl border rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white/80 border-gray-200'}`}>
            {/* Filter Bar */}
            <div className={`p-4 border-b ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/60'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Event Filters */}
                {activeTab === 'events' && (
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '⏳ Bekleyen', value: 'PENDING' },
                      { label: '📅 Gelecek', value: 'APPROVED' },
                      { label: '🕒 Geçmiş', value: 'PAST' },
                      { label: '❌ Reddedilen', value: 'REJECTED' },
                    ].map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setEventFilter(filter.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          eventFilter === filter.value
                            ? 'bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                            : isDarkMode
                              ? 'bg-slate-700/60 text-slate-200 hover:bg-slate-600/70 border border-slate-600/50'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* User Role Filters */}
                {activeTab === 'users' && (
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Tümü', value: 'ALL' },
                      { label: 'Öğrenciler', value: 'ROLE_STUDENT' },
                      { label: 'Akademisyenler', value: 'ROLE_ACADEMICIAN' },
                      { label: 'Kulüp Bşk.', value: 'ROLE_CLUB_OFFICIAL' },
                      { label: 'Adminler', value: 'ROLE_ADMIN' },
                    ].map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setUserRoleFilter(filter.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                          userRoleFilter === filter.value
                            ? 'bg-linear-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                            : isDarkMode
                              ? 'bg-slate-700/60 text-slate-200 hover:bg-slate-600/70 border border-slate-600/50'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                )}

                {activeTab !== 'events' && activeTab !== 'users' && <div />}

                {/* Search */}
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`} />
                  <input
                    type="text"
                    placeholder="Ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-xl border w-64 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      isDarkMode 
                        ? 'bg-slate-700/60 border-slate-600/50 text-slate-200 placeholder-slate-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <CardLoader />
            ) : displayData.length === 0 ? (
              <EmptyState message="Bu kategoride kayıt bulunamadı." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`${isDarkMode ? 'bg-linear-to-r from-blue-600 to-indigo-600' : 'bg-linear-to-r from-blue-500 to-indigo-500'}`}>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Başlık / İsim</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Detay</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {displayData.map((item, index) => (
                      <tr 
                        key={item.archiveId || item.originalId || item.id || index}
                        className={`transition-all duration-300 ${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'}`}
                      >
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                          {String(item.archiveId || item.originalId || item.id || item.userId || 'N/A').substring(0, 8)}...
                        </td>
                        <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                          {activeTab === 'users' && item.email}
                          {activeTab === 'academicians' && `${item.title || ''} ${item.firstName} ${item.lastName}`}
                          {activeTab === 'clubOfficials' && `${item.firstName} ${item.lastName}`}
                          {activeTab === 'clubs' && item.clubName}
                          {activeTab === 'events' && (
                            <div className="flex items-center gap-3">
                              <img src={item.imageUrl || '/placeholder-event.jpg'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                              <div>
                                <p className="font-medium">{item.title || item.eventName}</p>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>{item.clubName}</p>
                              </div>
                            </div>
                          )}
                          {activeTab === 'activeClubs' && (
                            <div className="flex items-center gap-3">
                              {item.logoUrl ? (
                                <img src={item.logoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs">N/A</div>
                              )}
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>{item.memberCount} üye</p>
                              </div>
                            </div>
                          )}
                          {(activeTab === 'inactiveClubs' || activeTab === 'inactiveStudents' || activeTab === 'inactiveAcademicians') && (
                            <span className="opacity-60">
                              {item.name || `${item.firstName || ''} ${item.lastName || ''}` || item.studentNumber || 'İsimsiz'}
                            </span>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-700'}`}>
                          {activeTab === 'users' && (
                            <div className="flex flex-wrap gap-1">
                              {(item.roles || []).map((role, i) => (
                                <span key={i} className={`px-2 py-0.5 rounded-full text-xs ${isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                  {String(role).replace('ROLE_', '')}
                                </span>
                              ))}
                            </div>
                          )}
                          {activeTab === 'academicians' && item.department}
                          {activeTab === 'clubOfficials' && item.email}
                          {activeTab === 'clubs' && (item.description?.substring(0, 50) + '...')}
                          {activeTab === 'events' && (
                            <div>
                              <p>{parseDate(item)?.toLocaleDateString('tr-TR') || 'Tarih Yok'}</p>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-slate-600'}`}>{item.location || 'Online'}</p>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
                                item.status === 'ACTIVE' || item.status === 'APPROVED' 
                                  ? isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                                  : item.status === 'PENDING' 
                                    ? isDarkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'
                                    : isDarkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                              }`}>
                                {item.status === 'ACTIVE' || item.status === 'APPROVED' ? (parseDate(item) && parseDate(item) < new Date() ? 'GEÇMİŞ' : 'ONAYLI') : item.status === 'PENDING' ? 'BEKLİYOR' : 'REDDEDİLDİ'}
                              </span>
                            </div>
                          )}
                          {activeTab === 'activeClubs' && `Başkan: ${item.presidentName}`}
                          {(activeTab === 'inactiveClubs' || activeTab === 'inactiveStudents' || activeTab === 'inactiveAcademicians') && (
                            <span className="opacity-60">
                              {item.deletedAt ? `Arşiv: ${new Date(item.deletedAt).toLocaleDateString('tr-TR')}` : 'Arşivlendi'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {activeTab === 'users' && (
                              <button onClick={() => handleDeleteUser(item.id)} className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            {activeTab === 'events' && item.status === 'PENDING' && (
                              <>
                                <button onClick={() => handleApproveEvent(item.id)} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm transition-all flex items-center gap-1">
                                  <Check className="w-4 h-4" /> Onayla
                                </button>
                                <button onClick={() => handleReject(item.id)} className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm transition-all flex items-center gap-1">
                                  <X className="w-4 h-4" /> Reddet
                                </button>
                              </>
                            )}
                            {activeTab === 'activeClubs' && (
                              <>
                                <button onClick={() => handleViewBoard(item.id, item.name)} className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm transition-all flex items-center gap-1">
                                  <Eye className="w-4 h-4" /> Yönetim
                                </button>
                                <button onClick={() => handleChangePresident(item.id)} className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm transition-all flex items-center gap-1">
                                  <Crown className="w-4 h-4" /> Başkan
                                </button>
                                <button onClick={() => handleUpdateLogo(item.id)} className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm transition-all">
                                  <Image className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleReject(item.id)} className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm transition-all">
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {(activeTab === 'academicians' || activeTab === 'clubOfficials' || activeTab === 'clubs') && (
                              <>
                                <button onClick={() => handleApprove(activeTab === 'clubs' ? item.id : item.userId)} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm transition-all flex items-center gap-1">
                                  <Check className="w-4 h-4" /> Onayla
                                </button>
                                <button onClick={() => handleReject(activeTab === 'clubs' ? item.id : item.userId)} className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm transition-all flex items-center gap-1">
                                  <X className="w-4 h-4" /> Reddet
                                </button>
                              </>
                            )}
                            {(activeTab === 'inactiveClubs' || activeTab === 'inactiveStudents' || activeTab === 'inactiveAcademicians') && (
                              <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>Arşivlendi</span>
                            )}
                            {activeTab === 'events' && item.status !== 'PENDING' && (
                              <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-slate-500'}`}>—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Board Modal */}
      {isBoardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="p-6 bg-linear-to-r from-blue-500 to-indigo-600">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{selectedClubName} - Yönetim Kurulu</h3>
                <button onClick={() => setIsBoardModalOpen(false)} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 max-h-80 overflow-y-auto">
              {boardMembers.length > 0 ? (
                <div className="space-y-3">
                  {boardMembers.map((member, index) => (
                    <div key={index} className={`flex items-center justify-between p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                      <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{member.firstName} {member.lastName}</span>
                      <span className={`px-3 py-1 rounded-full text-xs ${member.role.includes('PRESIDENT') ? (isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : (isDarkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700')}`}>
                        {member.role.replace('CLUB_', '').replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="Bu kulüpte kayıtlı yetkili bulunamadı." />
              )}
            </div>
            <div className={`p-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <button onClick={() => setIsBoardModalOpen(false)} className="w-full py-2 rounded-xl bg-linear-to-r from-blue-500 to-indigo-600 text-white font-medium hover:shadow-lg transition-all">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* President Change Modal */}
      {isPresidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="p-6 bg-linear-to-r from-amber-500 to-orange-600">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Crown className="w-6 h-6" /> Başkan Değiştir</h3>
                <button onClick={() => { setIsPresidentModalOpen(false); setNewPresidentId(''); setSelectedClubForPresident(null); }} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className={`p-4 rounded-xl mb-4 ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>Kulüp: <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{selectedClubForPresident?.name}</span></p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>Mevcut Başkan: <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{selectedClubForPresident?.presidentName}</span></p>
              </div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>Yeni Başkanın Öğrenci ID'si (UUID)</label>
              <input
                type="text"
                value={newPresidentId}
                onChange={(e) => setNewPresidentId(e.target.value)}
                placeholder="a1b2c3d4-e5f6-7890-..."
                className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${isDarkMode ? 'bg-white/10 border-white/20 text-white placeholder-gray-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'}`}
              />
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-slate-600'}`}>⚠️ Yeni başkanın kulüp üyesi olduğundan emin olun.</p>
            </div>
            <div className={`p-4 border-t flex gap-3 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <button onClick={() => { setIsPresidentModalOpen(false); setNewPresidentId(''); setSelectedClubForPresident(null); }} className={`flex-1 py-2 rounded-xl border transition-all ${isDarkMode ? 'border-white/20 text-gray-300 hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                İptal
              </button>
              <button onClick={confirmChangePresident} className="flex-1 py-2 rounded-xl bg-linear-to-r from-amber-500 to-orange-600 text-white font-medium hover:shadow-lg transition-all">
                Değiştir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Club Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="p-6 bg-linear-to-r from-red-500 to-rose-600">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><AlertCircle className="w-6 h-6" /> Kulübü Kapat</h3>
                <button onClick={() => { setIsDeleteModalOpen(false); setSelectedClubForDelete(null); }} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
                <p className="text-sm text-red-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> <strong>Dikkat:</strong> Bu işlem geri alınamaz!</p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-slate-700'}`}>Kulüp kapatıldığında tüm üyelikler ve veriler silinecektir.</p>
              </div>
              <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>Kulüp Adı: <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{selectedClubForDelete?.name}</span></p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>Başkan: <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{selectedClubForDelete?.presidentName}</span></p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>Üye Sayısı: <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{selectedClubForDelete?.memberCount}</span></p>
              </div>
            </div>
            <div className={`p-4 border-t flex gap-3 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <button onClick={() => { setIsDeleteModalOpen(false); setSelectedClubForDelete(null); }} className={`flex-1 py-2 rounded-xl border transition-all ${isDarkMode ? 'border-white/20 text-gray-300 hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                İptal
              </button>
              <button onClick={confirmDeleteClub} className="flex-1 py-2 rounded-xl bg-linear-to-r from-red-500 to-rose-600 text-white font-medium hover:shadow-lg transition-all">
                Kulübü Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
