import React, { useState, useEffect } from 'react';
import adminService from '../../../api/adminService';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  // MODAL İÇİN STATE'LER
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [boardMembers, setBoardMembers] = useState([]);
  const [selectedClubName, setSelectedClubName] = useState('');
  // 👇 YENİ: İstatistik Verileri
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeClubs: 0,
    monthlyEvents: 0,
    pendingTotal: 0
  });

  // Overview sekmesi için istatistikleri çekip hesaplar
  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Not: adminService'de bazı metotlar farklı isimlerde olabilir.
      // Runtime'da patlamasın diye yoksa boş listeye düşürüyoruz.
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

      // Tüm verileri paralel olarak çek (Daha hızlı yüklenir)
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

      // 1. Toplam Öğrenci Sayısı (Rolünde STUDENT olanlar)
      const studentCount = users.filter((u) => u.roles && u.roles.includes('ROLE_STUDENT')).length;

      // 2. Aktif Kulüp Sayısı
      const activeClubCount = clubs.length;

      // 3. Bu Ay Yapılan Etkinlik Sayısı
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const eventsThisMonth = events.filter((event) => {
        // Backend alanı değişken olabilir: date/eventDate gibi.
        const rawDate = event?.date || event?.eventDate;
        if (!rawDate) return false;
        const eventDate = new Date(rawDate);
        if (Number.isNaN(eventDate.getTime())) return false;
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
      }).length;

      // 4. Toplam Bekleyen Onay (Kulüp İstekleri + (İlerde Etkinlik İstekleri))
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

  // Sekme değişince veriyi çek: overview ise istatistik, diğerlerinde tablo verisi
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboardStats();
    } else {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === 'users') response = await adminService.getAllUsers(); // <-- EKLENDİ
      if (activeTab === 'academicians') response = await adminService.getAcademicianRequests();
      else if (activeTab === 'clubOfficials') response = await adminService.getClubOfficialRequests();
      else if (activeTab === 'clubs') response = await adminService.getClubCreationRequests();
      else if (activeTab === 'activeClubs') response = await adminService.getAllActiveClubs();
      else if (activeTab === 'events') response = await adminService.getEventRequests();
      
      // Backend'den dönen verinin yapısına göre burayı ayarla (örn: response.data)
      setData(response.data || []); 
    } catch (error) {
      console.error("Veri çekilemedi:", error);
      setData([]); // Hata olursa boş liste
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if(!window.confirm("Bu isteği onaylamak istiyor musunuz?")) return;
    
    try {
      if (activeTab === 'academicians') await adminService.approveAcademician(id);
      else if (activeTab === 'clubOfficials') await adminService.approveClubOfficial(id);
      else if (activeTab === 'clubs') await adminService.approveClubCreation(id);
      else if (activeTab === 'events') await adminService.approveEvent(id);
      
      alert("İşlem Başarılı!");
      fetchData(); // Listeyi yenile
    } catch (error) {
      alert("Onay işlemi başarısız: " + (error.response?.data?.message || error.message));
    }
  };

  const handleReject = async (id) => {
    if(!window.confirm("Bu isteği REDDETMEK istediğinize emin misiniz?")) return;

    try {
      if (activeTab === 'academicians') await adminService.rejectAcademician(id);
      else if (activeTab === 'clubOfficials') await adminService.rejectClubOfficial(id);
      else if (activeTab === 'clubs') await adminService.rejectClubCreation(id); // <-- YENİ
      else if (activeTab === 'activeClubs') await adminService.deleteClub(id);
      else if (activeTab === 'events') await adminService.rejectEvent(id);
      
      alert("İstek reddedildi/silindi.");
      fetchData(); // Listeyi yenile
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
  // LOGO GÜNCELLEME (MinIO Entegrasyonlu)
  const handleUpdateLogo = async (clubId) => {
    // 1. Gizli bir dosya inputu oluştur
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*'; // Sadece resim dosyaları

    // 2. Dosya seçildiğinde çalışacak fonksiyon
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Dosya boyutu kontrolü (Örn: 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Dosya boyutu 5MB'dan büyük olamaz!");
        return;
      }

      try {
        // Yükleniyor efekti verebilirsin istersen...
        const response = await adminService.updateClubLogo(clubId, file);
        
        alert("Logo başarıyla güncellendi!");
        
        // 3. Tablodaki görüntüyü anında güncelle (Sayfayı yenilemeden)
        const newLogoUrl = response.data; // Backend'den dönen MinIO URL'i
        
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

    // 3. Dosya seçme penceresini aç
    fileInput.click();
  };

  // YÖNETİM KURULU GÖRÜNTÜLEME (Modal Versiyonu)
  const handleViewBoard = async (clubId, clubName) => {
    try {
      // Önce modalı açmadan yükleniyor diyebilirsin veya direkt açarsın
      const response = await adminService.getClubBoardMembers(clubId);
      setBoardMembers(response.data); // Gelen üye listesini kaydet
      setSelectedClubName(clubName);  // Başlıkta göstermek için ismini al
      setIsBoardModalOpen(true);      // Modalı aç
    } catch (err) {
      alert("Yönetim kurulu bilgileri alınamadı.");
    }
  };
  // BAŞKAN DEĞİŞTİRME
  const handleChangePresident = async (clubId) => {
    // Gerçek bir projede burada Modal açıp üye listesinden seçtiririz.
    // Şimdilik basitçe ID istiyoruz:
    const newId = prompt("Yeni Başkanın Öğrenci ID'sini (UUID) giriniz:");
    if (!newId) return;

    try {
      await adminService.changeClubPresident(clubId, newId);
      alert("Başkan değiştirildi.");
      fetchData();
    } catch (err) {
      alert("Hata: " + (err.response?.data?.message || "Başkan değiştirilemedi. ID'nin kulübe üye olduğundan emin olun."));
    }
  };

  // 👇 YENİ: Tabloya gönderilecek veriyi hesaplayan mantık
  const getFilteredData = () => {
    // 1. Temel Veri Kaynağı
    let filtered = data;

    // 2. Rol Filtresi (Sadece Users sekmesi için geçerli)
    if (activeTab === 'users' && userRoleFilter !== 'ALL') {
      filtered = filtered.filter(user => user.roles && user.roles.includes(userRoleFilter));
    }

    // 3. ARAMA MANTIĞI (Burayı Güncelledik)
    if (searchTerm.trim() !== '') {
      const lowerTerm = searchTerm.toLowerCase();
      
      filtered = filtered.filter(item => {
        
        // A. Users Sekmesi: Sadece Email'e bak (Çünkü isim yok)
        if (activeTab === 'users') {
             return item.email?.toLowerCase().includes(lowerTerm);
        }

        // B. Akademisyen Sekmesi: Email + İsim + Bölüm
        if (activeTab === 'academicians') {
            const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
            return item.email?.toLowerCase().includes(lowerTerm) || 
                   fullName.includes(lowerTerm) ||
                   item.department?.toLowerCase().includes(lowerTerm);
        }

        // C. Kulüp İstekleri: Kulüp Adı + Açıklama
        if (activeTab === 'clubs' || activeTab === 'clubRequests') { // Sekme ismin neyse
            return item.name?.toLowerCase().includes(lowerTerm) ||
                   item.description?.toLowerCase().includes(lowerTerm);
        }

        // D. Diğerleri (Genel yedek)
        return JSON.stringify(item).toLowerCase().includes(lowerTerm);
      });
    }

    return filtered;
  };

  const displayData = getFilteredData();
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-800">Yönetici Paneli</h1>

        {/* --- SEKMELER (TABS) --- */}
        <div className="mb-6 flex space-x-2 overflow-x-auto border-b border-gray-200 pb-2">
          {['overview', 'users', 'academicians', 'clubOfficials', 'clubs', 'activeClubs', 'events'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                ${activeTab === tab 
                  ? 'bg-white text-blue-600 border border-b-0 border-gray-200 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              {tab === 'overview' && 'Genel Bakış'}
              {tab === 'users' && 'Tüm Kullanıcılar'} {/* <-- Bunu Ekle */}
              {tab === 'academicians' && 'Akademisyen Başvuruları'}
              {tab === 'clubOfficials' && 'Kulüp Başkanı İstekleri'}
              {tab === 'clubs' && 'Kulüp Kurma İstekleri'}
              {tab === 'activeClubs' && 'Aktif Kulüpler'}
              {tab === 'events' && 'Etkinlik İstekleri'}
            </button>
          ))}
        </div>

        {/* ==================== DASHBOARD HOME (ÖZET) ==================== */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fadeIn">
            {/* Kart 1: Toplam Öğrenci */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Toplam Öğrenci</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Kart 2: Aktif Kulüpler */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Aktif Kulüpler</p>
                <p className="text-2xl font-bold text-gray-800">{stats.activeClubs}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <svg className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
            </div>

            {/* Kart 3: Bu Ayki Etkinlikler */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Etkinlikler (Bu Ay)</p>
                <p className="text-2xl font-bold text-gray-800">{stats.monthlyEvents}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            {/* Kart 4: Bekleyen Onaylar */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Bekleyen Onaylar</p>
                <p className="text-2xl font-bold text-gray-800">{stats.pendingTotal}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-full">
                <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* --- İÇERİK TABLOSU (ÖZET DIŞINDA) --- */}
        {activeTab !== 'overview' && (
          <>
            <div className="rounded-lg bg-white shadow overflow-hidden mb-4">
              {/* Filtre Butonları + Arama */}
              <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                {/* SOL TARAF: Rol Butonları (Sadece Users sekmesinde) */}
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                  {activeTab === 'users' &&
                    [
                      { label: 'Tümü', value: 'ALL' },
                      { label: 'Öğrenciler', value: 'ROLE_STUDENT' },
                      { label: 'Akademisyenler', value: 'ROLE_ACADEMICIAN' },
                      { label: 'Kulüp Bşk.', value: 'ROLE_CLUB_OFFICIAL' },
                      { label: 'Adminler', value: 'ROLE_ADMIN' },
                    ].map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setUserRoleFilter(filter.value)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                          userRoleFilter === filter.value
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                </div>

                {/* SAĞ TARAF: ARAMA ÇUBUĞU (Her sekmede görünsün) */}
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Ara (Mail, İsim)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-10 text-gray-500">Yükleniyor...</div>
              ) : displayData.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  {activeTab === 'activeClubs' ? 'Aktif kulüp bulunmamaktadır.' : 'Bekleyen istek bulunmamaktadır.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-100 uppercase text-gray-700">
                      <tr>
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Başlık / İsim</th>
                        <th className="px-6 py-3">Detay (Bölüm/Tarih vb.)</th>
                        <th className="px-6 py-3 text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayData.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                            Kayıt bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        displayData.map((item) => (
                          <React.Fragment key={item.id}>
                            <tr key={item.id} className="border-b hover:bg-gray-50">
                              <td className="px-6 py-4 font-medium">
                                {/* Users sekmesindeysek ID'nin sadece başını gösterelim ki tablo taşmasın */}
                                {activeTab === 'users' ? item.id.substring(0, 8) + '...' : item.id}
                              </td>

                              <td className="px-6 py-4">
                                {/* İSİM / BAŞLIK SÜTUNU */}
                                {activeTab === 'users' && item.email} {/* Kullanıcılar için Email */}
                                {activeTab === 'academicians' && `${item.title || ''} ${item.firstName} ${item.lastName}`}
                                {activeTab === 'clubOfficials' && `${item.firstName} ${item.lastName}`}
                                {activeTab === 'clubs' && item.clubName}
                                {/* AKTİF KULÜPLER İÇİN GÖRÜNÜM */}
                                {activeTab === 'activeClubs' && (
                                  <div className="flex items-center">
                                    {item.logoUrl ? (
                                      <img
                                        src={item.logoUrl}
                                        alt="Logo"
                                        className="mr-3 h-10 w-10 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-xs">
                                        Yok
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-bold">{item.name}</div>
                                      <div className="text-xs text-gray-500">Üye: {item.memberCount}</div>
                                    </div>
                                  </div>
                                )}
                                {activeTab === 'events' && item.eventName}
                              </td>

                              <td className="px-6 py-4">
                                {/* DETAY SÜTUNU */}
                                {activeTab === 'users' && (
                                  <span className="flex gap-1 flex-wrap">
                                    {(item.roles || []).map((role) => (
                                      <span
                                        key={role}
                                        className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded"
                                      >
                                        {String(role).replace('ROLE_', '')}
                                      </span>
                                    ))}
                                  </span>
                                )}
                                {activeTab === 'academicians' && item.department}
                                {activeTab === 'clubOfficials' && `Email: ${item.email}`}
                                {activeTab === 'clubs' &&
                                  (item.description ? item.description.substring(0, 50) + '...' : '')}
                                {/* BAŞKAN BİLGİSİ */}
                                {activeTab === 'activeClubs' && (
                                  <span className="text-sm text-gray-700">Başkan: {item.presidentName}</span>
                                )}
                                {activeTab === 'events' && item.eventDate}
                              </td>

                              <td className="px-6 py-4 text-right space-x-2">
                                {/* KULLANICI SİLME BUTONU (Sadece Users sekmesinde) */}
                                {activeTab === 'users' && (
                                  <button
                                    onClick={() => handleDeleteUser(item.id)}
                                    className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                  >
                                    Kullanıcıyı Sil
                                  </button>
                                )}

                                {/* AKTİF KULÜPLER: İŞLEM BUTONLARI */}
                                {activeTab === 'activeClubs' && (
                                  <>
                                    <button
                                      onClick={() => handleViewBoard(item.id, item.name)}
                                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                                    >
                                      Yönetim
                                    </button>

                                    <button
                                      onClick={() => handleChangePresident(item.id)}
                                      className="rounded bg-yellow-500 px-2 py-1 text-xs text-white hover:bg-yellow-600"
                                    >
                                      Bşk. Değiştir
                                    </button>

                                    <button
                                      onClick={() => handleUpdateLogo(item.id)}
                                      className="rounded bg-purple-500 px-2 py-1 text-xs text-white hover:bg-purple-600"
                                    >
                                      Logo
                                    </button>

                                    <button
                                      onClick={() => handleReject(item.id)}
                                      className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                                    >
                                      Kapat
                                    </button>
                                  </>
                                )}

                                {/* DİĞER ONAY/RET BUTONLARI (Users sekmesinde GİZLİ OLMALI) */}
                                {activeTab !== 'users' && activeTab !== 'activeClubs' && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(activeTab === 'clubs' ? item.id : item.userId)}
                                      className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                                    >
                                      Onayla
                                    </button>

                                    <button
                                      onClick={() => handleReject(activeTab === 'clubs' ? item.id : item.userId)}
                                      className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                                    >
                                      Reddet
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ------------------ YÖNETİM KURULU MODALI ------------------ */}
      {isBoardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-fadeIn">
            {/* Modal Başlık */}
            <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {selectedClubName} - Yönetim Kurulu
              </h3>
              <button
                onClick={() => setIsBoardModalOpen(false)}
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal İçerik (Liste) */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {boardMembers.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">İsim</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {boardMembers.map((member, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {member.firstName} {member.lastName}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              member.role.includes('PRESIDENT')
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {member.role.replace('CLUB_', '').replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500 py-4">Bu kulüpte kayıtlı yetkili bulunamadı.</p>
              )}
            </div>

            {/* Modal Alt Kısım */}
            <div className="bg-gray-50 px-6 py-3 flex justify-end">
              <button
                onClick={() => setIsBoardModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}