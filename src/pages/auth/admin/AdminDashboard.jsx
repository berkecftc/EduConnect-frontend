import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../../api/adminService';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState([]);
  console.log("Şu anki Sekme (activeTab):", activeTab);
  console.log("Elimizdeki Veri Sayısı:", data ? data.length : "Veri Yok");
  const [loading, setLoading] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  // Etkinlik sekmesi için durum filtresi
  const [eventFilter, setEventFilter] = useState('PENDING');
  // MODAL İÇİN STATE'LER
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [boardMembers, setBoardMembers] = useState([]);
  const [selectedClubName, setSelectedClubName] = useState('');
  // TEMA İÇİN STATE
  const [isDarkMode, setIsDarkMode] = useState(false);
  // YENİ: Başkan Değiştirme Modal
  const [isPresidentModalOpen, setIsPresidentModalOpen] = useState(false);
  const [selectedClubForPresident, setSelectedClubForPresident] = useState(null);
  const [newPresidentId, setNewPresidentId] = useState('');
  // YENİ: Kulüp Kapatma Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClubForDelete, setSelectedClubForDelete] = useState(null);
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
      
      console.log("Veri çekiliyor... Sekme:", activeTab); // Debug için

      if (activeTab === 'users') {
        response = await adminService.getAllUsers();
      } 
      else if (activeTab === 'academicians') {
        response = await adminService.getAcademicianRequests();
      } 
      else if (activeTab === 'clubOfficials') {
        response = await adminService.getClubOfficialRequests();
      } 
      else if (activeTab === 'clubs') {
        response = await adminService.getClubCreationRequests();
      } 
      else if (activeTab === 'activeClubs') {
        response = await adminService.getAllActiveClubs();
      } 
      // 👇 KRİTİK DÜZELTME BURADA
      else if (activeTab === 'events') {
        // response = await adminService.getEventRequests(); // <-- BU HATALIYDI (Sadece bekleyenleri getirir)
        response = await adminService.getAllEvents();     // <-- DOĞRUSU BU (Tüm geçmiş/gelecek etkinlikleri getirir)
      }
      // 👇 YENİ: PASİF KAYITLAR İÇİN
      else if (activeTab === 'inactiveClubs') {
        response = await adminService.getInactiveClubs();
      }
      else if (activeTab === 'inactiveStudents') {
        response = await adminService.getInactiveStudents();
      }
      else if (activeTab === 'inactiveAcademicians') {
        response = await adminService.getInactiveAcademicians();
      }
      
      console.log("Gelen Ham Veri:", response?.data); // Debug için
      console.log("Aktif Sekme:", activeTab); // Hangi sekme
      console.log("Veri Sayısı:", response?.data?.length); // Kaç kayıt
      if (response?.data && response.data.length > 0) {
        console.log("İlk Kayıt Örneği:", response.data[0]); // İlk kaydın yapısı
        console.log("İlk Kayıt ID Bilgileri:", {
          id: response.data[0].id,
          originalId: response.data[0].originalId,
          archiveId: response.data[0].archiveId,
          userId: response.data[0].userId
        });
      }
      setData(response?.data || []); 

    } catch (error) {
      console.error("Veri çekilemedi:", error);
      setData([]); 
    } finally {
      setLoading(false);
    }
  };

  // Etkinlik objesinden güvenli tarih okuma/parsing
  const getEventDate = (event) => {
    const raw = event?.date ?? event?.eventDate ?? event?.startDate ?? event?.startTime;
    if (!raw) return null;

    // epoch (ms/s) desteği
    if (typeof raw === 'number') {
      const ms = raw < 1e12 ? raw * 1000 : raw;
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
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

  // Etkinlik sekmesi için ayrı onay handler'ı (UI'dan direkt çağırmak için)
  const handleApproveEvent = async (eventId) => {
    try {
      await adminService.approveEvent(eventId); // Backend isteği
      alert("Etkinlik onaylandı!");
      
      // 👇 KRİTİK NOKTA: Listeyi hemen güncellemeliyiz
      // 1. Yöntem: Sayfadaki veriyi tekrar çekmek (En garantisi)
      fetchData(); 
      
      // VEYA 2. Yöntem: State'i manuel güncellemek (Daha hızlı)
      /*
      setData(prevData => prevData.map(item => 
        item.id === eventId ? { ...item, status: 'APPROVED' } : item
      ));
      */
      
    } catch (err) {
      alert("Onaylanırken hata oluştu.");
    }
  };

  const handleReject = async (id) => {
    // Aktif kulüpler sekmesindeyse modal aç
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
    // Kulübü bul ve modal aç
    const club = data.find(c => c.id === clubId);
    setSelectedClubForPresident(club);
    setIsPresidentModalOpen(true);
  };

  // Başkan değiştirme işlemini onayla
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
      alert(
        "Hata: " +
          (err.response?.data?.message ||
            "Başkan değiştirilemedi. ID'nin kulübe üye olduğundan emin olun.")
      );
    }
  };

  // ÇIKIŞ YAP FONKSİYONU
  const handleLogout = () => {
    if (window.confirm("Çıkış yapmak istediğinize emin misiniz?")) {
      // localStorage'ı temizle
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      
      // Login sayfasına yönlendir
      navigate('/login');
    }
  };
  // Kulüp kapatma işlemini onayla
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
  // KAPSAMLI TARİH OKUYUCU
  const parseDate = (item) => {
    if (!item) return null;

    // Backend'den gelebilecek TÜM ihtimalleri buraya yazdım.
    // Konsolda hangisini gördüysen o çalışacaktır.
    const raw = item.eventTime || item.date || item.eventDate || item.startDate || item.startTime || item.time || item.createdDate;
    if (!raw) return null;

    // 1. Dizi Formatı: [2025, 12, 21, 14, 0]
    if (Array.isArray(raw)) {
      return new Date(raw[0], raw[1] - 1, raw[2], raw[3] || 0, raw[4] || 0);
    }

    // 2. Sayı (Timestamp) Formatı: 17354654654
    if (typeof raw === 'number') {
      return new Date(raw);
    }

    // 3. String Formatı: "2025-12-21T14:00:00"
    return new Date(raw);
  };

  // FİLTRELEME FONKSİYONU (ACTIVE Olarak Güncellendi)
  const getFilteredEvents = () => {
    if (!data || !Array.isArray(data)) return [];

    const now = new Date();

    return data.filter(event => {
      // Tarihi düzelt
      const eventDate = parseDate(event);
      const isValidDate = eventDate && !isNaN(eventDate.getTime());

      // Status boşluklarını temizle
      const status = event.status ? event.status.trim() : '';

      switch (eventFilter) {
        case 'PENDING':
          // Bekleyenler hala PENDING ise burası kalabilir. 
          // Eğer Backend bekleyenleri de farklı kaydediyorsa (örn: WAITING) burayı da güncellemelisin.
          return status === 'PENDING';
        
        case 'APPROVED': 
          // GELECEK ETKİNLİKLER (Onaylılar artık ACTIVE olarak aranıyor)
          // Mantık: Durumu ACTIVE OLSUN + (Tarih Geçerli VE Şu andan İLERİDE olsun)
          return status === 'ACTIVE' && isValidDate && eventDate > now;

        case 'PAST':
          // GEÇMİŞ ETKİNLİKLER
          // Mantık: Durumu ACTIVE OLSUN + (Tarih Geçersiz VEYA Şu andan GERİDE olsun)
          return status === 'ACTIVE' && (!isValidDate || eventDate <= now);
          
        case 'REJECTED':
          return status === 'REJECTED';

        default:
          return true;
      }
    });
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

  // Tabloda kullanacağımız veri kaynağı
  // Events sekmesindeysek önce status/tarih filtresini uygula, sonra (varsa) arama mantığı ile süz.
  const displayData = activeTab === 'events' ? getFilteredEvents() : getFilteredData();
  
  // Tema değiştirme fonksiyonu
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`admin-dashboard ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Header with Theme Toggle and Logout */}
      <div className="admin-header">
        {/* Theme Toggle Button */}
        <button onClick={toggleTheme} className="theme-toggle" title={isDarkMode ? 'Açık Mod' : 'Koyu Mod'}>
          {isDarkMode ? (
            // Güneş ikonu (Light Mode)
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            // Ay ikonu (Dark Mode)
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Logout Button */}
        <button onClick={handleLogout} className="logout-button" title="Çıkış Yap">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Çıkış Yap</span>
        </button>
      </div>

      <div className="admin-container">
        <h1 className="admin-title">🎯 Yönetici Paneli</h1>

        {/* --- SEKMELER (TABS) - KATEGORİLENMİŞ --- */}
        <div className="tab-container">
          {/* GENEL BAKIŞ */}
          <div className="tab-category">
            <div className="category-label">📊 Genel</div>
            <div className="category-tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              >
                Genel Bakış
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
              >
                Tüm Kullanıcılar
              </button>
            </div>
          </div>

          {/* İSTEK & BAŞVURULAR */}
          <div className="tab-category">
            <div className="category-label">📝 İstek & Başvurular</div>
            <div className="category-tabs">
              <button
                onClick={() => setActiveTab('academicians')}
                className={`tab-button ${activeTab === 'academicians' ? 'active' : ''}`}
              >
                👨‍🏫 Akademisyen
              </button>
              <button
                onClick={() => setActiveTab('clubOfficials')}
                className={`tab-button ${activeTab === 'clubOfficials' ? 'active' : ''}`}
              >
                🎓 Kulüp Başkanı
              </button>
              <button
                onClick={() => setActiveTab('clubs')}
                className={`tab-button ${activeTab === 'clubs' ? 'active' : ''}`}
              >
                🏛️ Kulüp Kurma
              </button>
            </div>
          </div>

          {/* KULÜP & ETKİNLİKLER */}
          <div className="tab-category">
            <div className="category-label">🎯 Kulüp & Etkinlikler</div>
            <div className="category-tabs">
              <button
                onClick={() => setActiveTab('activeClubs')}
                className={`tab-button ${activeTab === 'activeClubs' ? 'active' : ''}`}
              >
                ✅ Aktif Kulüpler
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
              >
                🎉 Etkinlikler
              </button>
            </div>
          </div>

          {/* ARŞİV */}
          <div className="tab-category">
            <div className="category-label">📦 Arşiv</div>
            <div className="category-tabs">
              <button
                onClick={() => setActiveTab('inactiveClubs')}
                className={`tab-button ${activeTab === 'inactiveClubs' ? 'active' : ''}`}
              >
                🔴 Pasif Kulüpler
              </button>
              <button
                onClick={() => setActiveTab('inactiveStudents')}
                className={`tab-button ${activeTab === 'inactiveStudents' ? 'active' : ''}`}
              >
                🔴 Pasif Öğrenciler
              </button>
              <button
                onClick={() => setActiveTab('inactiveAcademicians')}
                className={`tab-button ${activeTab === 'inactiveAcademicians' ? 'active' : ''}`}
              >
                🔴 Pasif Akademisyenler
              </button>
            </div>
          </div>
        </div>

        {/* ==================== DASHBOARD HOME (ÖZET) ==================== */}
        {activeTab === 'overview' && (
          <div className="stats-grid">
            {/* Kart 1: Toplam Öğrenci */}
            <div className="stat-card">
              <div className="stat-info">
                <h3>Toplam Öğrenci</h3>
                <p>{stats.totalStudents}</p>
              </div>
              <div className="stat-icon blue">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="stat-card">
              <div className="stat-info">
                <h3>Aktif Kulüpler</h3>
                <p>{stats.activeClubs}</p>
              </div>
              <div className="stat-icon purple">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="stat-card">
              <div className="stat-info">
                <h3>Etkinlikler (Bu Ay)</h3>
                <p>{stats.monthlyEvents}</p>
              </div>
              <div className="stat-icon green">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="stat-card">
              <div className="stat-info">
                <h3>Bekleyen Onaylar</h3>
                <p>{stats.pendingTotal}</p>
              </div>
              <div className="stat-icon orange">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

            {/* ==================== ETKİNLİKLER SEKME İÇERİĞİ ==================== */}
            {activeTab === 'events' ? (
              <div className="table-wrapper">
                {/* 👇 FİLTRE BUTONLARI */}
                <div className="filter-bar">
                  <div className="filter-buttons">
                    {[
                      { label: '⏳ Bekleyen Onaylar', value: 'PENDING' },
                      { label: '📅 Gelecek Etkinlikler', value: 'APPROVED' },
                      { label: '🕒 Geçmiş Etkinlikler', value: 'PAST' },
                      { label: '❌ Reddedilenler', value: 'REJECTED' },
                    ].map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setEventFilter(filter.value)}
                        className={`filter-button ${eventFilter === filter.value ? 'active' : ''}`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TABLO BAŞLANGICI */}
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Afiş & İsim</th>
                        <th>Kulüp</th>
                        <th>Tarih & Yer</th>
                        <th>Durum</th>
                        <th style={{ textAlign: 'right' }}>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayData.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="empty-state">
                            Bu kategoride etkinlik bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        displayData.map((item) => (
                          <tr key={item.id}>
                            {/* AFİŞ VE İSİM */}
                            <td>
                              <div className="club-info">
                                <img
                                  src={item.imageUrl || '/placeholder-event.jpg'}
                                  alt=""
                                  className="club-logo"
                                />
                                <div className="club-details">
                                  <h4>{item.title || item.eventName}</h4>
                                  <p>{item.description ? item.description.substring(0, 50) + '...' : ''}</p>
                                </div>
                              </div>
                            </td>

                            {/* KULÜP ADI */}
                            <td>
                              {item.clubName || 'Bilinmiyor'}
                            </td>

                            {/* TARİH VE YER SÜTUNU */}
                            <td>
                              <div className="event-date">
                                {(() => {
                                  const d = parseDate(item);
                                  
                                  if (!d) return <span className="event-error">Tarih Yok</span>;
                                  if (isNaN(d.getTime())) return <span className="event-error">Format Hatası</span>;

                                  return d.toLocaleDateString('tr-TR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  });
                                })()}
                              </div>
                              <div className="event-location">
                                {item.location || 'Online'}
                              </div>
                            </td>

                            {/* DURUM ETİKETİ (DÜZELTİLDİ) */}
                            <td>
                              <span
                                className={`status-badge ${
                                  item.status === 'ACTIVE' || item.status === 'APPROVED'
                                    ? (() => {
                                        const d = parseDate(item); 
                                        const now = new Date();
                                        return d && d < now ? 'badge-past' : 'badge-approved';
                                      })()
                                    : item.status === 'PENDING'
                                      ? 'badge-pending'
                                      : 'badge-rejected'
                                }`}
                              >
                                {
                                  (item.status === 'ACTIVE' || item.status === 'APPROVED')
                                    ? (() => {
                                        // 👇 DÜZELTME BURADA DA YAPILDI
                                        const d = parseDate(item);
                                        const now = new Date();
                                        return d && d < now ? 'GEÇMİŞ' : 'ONAYLI';
                                      })()
                                    : item.status === 'PENDING'
                                      ? 'BEKLİYOR'
                                      : 'REDDEDİLDİ'
                                }
                              </span>
                            </td>

                            {/* İŞLEMLER BUTONLARI */}
                            <td style={{ textAlign: 'right' }}>
                              {/* Sadece BEKLEYENLER için Onay/Red butonları görünsün */}
                              {item.status === 'PENDING' && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => handleApproveEvent(item.id)}
                                    className="action-button btn-approve"
                                  >
                                    Onayla
                                  </button>
                                  <button
                                    onClick={() => handleReject(item.id)}
                                    className="action-button btn-reject"
                                  >
                                    Reddet
                                  </button>
                                </div>
                              )}

                              {/* ONAYLI / REDDEDİLEN / GEÇMİŞ etkinlikler için şimdilik silme butonu yok */}
                              {item.status !== 'PENDING' && (
                                <span className="table-text-secondary">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="table-wrapper">
                {/* Filtre Butonları + Arama */}
                <div className="filter-bar">
                  {/* SOL TARAF: Rol Butonları (Sadece Users sekmesinde) */}
                  <div className="filter-buttons">
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
                          className={`filter-button ${userRoleFilter === filter.value ? 'active' : ''}`}
                        >
                          {filter.label}
                        </button>
                      ))}
                  </div>

                  {/* SAĞ TARAF: ARAMA ÇUBUĞU (Her sekmede görünsün) */}
                  <div className="search-container">
                    <svg className="search-icon h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Ara (Mail, İsim)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="loading-spinner">Yükleniyor...</div>
                ) : displayData.length === 0 ? (
                  <div className="empty-state">
                    {activeTab === 'activeClubs'
                      ? 'Aktif kulüp bulunmamaktadır.'
                      : activeTab === 'clubOfficials'
                        ? 'Bekleyen kulüp başkanı isteği bulunmamaktadır.'
                        : activeTab === 'academicians'
                          ? 'Bekleyen akademisyen başvurusu bulunmamaktadır.'
                          : activeTab === 'inactiveClubs'
                            ? 'Arşivlenmiş kulüp bulunmamaktadır.'
                            : activeTab === 'inactiveStudents'
                              ? 'Arşivlenmiş öğrenci bulunmamaktadır.'
                              : activeTab === 'inactiveAcademicians'
                                ? 'Arşivlenmiş akademisyen bulunmamaktadır.'
                                : 'Bekleyen istek bulunmamaktadır.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Başlık / İsim</th>
                          <th>Detay (Bölüm/Tarih vb.)</th>
                          <th style={{ textAlign: 'right' }}>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayData.map((item, index) => (
                          <React.Fragment key={item.archiveId || item.originalId || item.id || index}>
                            <tr key={item.archiveId || item.originalId || item.id || index}>
                              <td>
                                {/* ID SÜTUNU - archiveId öncelikli, sonra originalId */}
                                {(activeTab === 'users' || activeTab === 'inactiveStudents' || activeTab === 'inactiveAcademicians' || activeTab === 'inactiveClubs') ? 
                                  (item.archiveId || item.originalId || item.id || '').toString().substring(0, 8) + '...' 
                                  : (item.archiveId || item.originalId || item.id || item.userId || 'N/A')}
                              </td>

                              <td>
                                  {/* İSİM / BAŞLIK SÜTUNU */}
                                  {activeTab === 'users' && item.email} {/* Kullanıcılar için Email */}
                                  {activeTab === 'academicians' &&
                                    `${item.title || ''} ${item.firstName} ${item.lastName}`}
                                  {activeTab === 'clubOfficials' && `${item.firstName} ${item.lastName}`}
                                  {activeTab === 'clubs' && item.clubName}
                                  {/* AKTİF KULÜPLER İÇİN GÖRÜNÜM */}
                                  {activeTab === 'activeClubs' && (
                                    <div className="club-info">
                                      {item.logoUrl ? (
                                        <img
                                          src={item.logoUrl}
                                          alt="Logo"
                                          className="club-logo"
                                        />
                                      ) : (
                                        <div style={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center', 
                                          width: '2.5rem', 
                                          height: '2.5rem', 
                                          borderRadius: '50%', 
                                          background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                                          fontSize: '0.75rem'
                                        }}>
                                          Yok
                                        </div>
                                      )}
                                      <div className="club-details">
                                        <h4>{item.name}</h4>
                                        <p>Üye: {item.memberCount}</p>
                                      </div>
                                    </div>
                                  )}
                                  {/* PASİF KULÜPLER İÇİN GÖRÜNÜM */}
                                  {activeTab === 'inactiveClubs' && (
                                    <div className="club-info">
                                      {item.logoUrl ? (
                                        <img
                                          src={item.logoUrl}
                                          alt="Logo"
                                          className="club-logo"
                                          style={{ opacity: 0.5 }}
                                        />
                                      ) : (
                                        <div style={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center', 
                                          width: '2.5rem', 
                                          height: '2.5rem', 
                                          borderRadius: '50%', 
                                          background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                                          fontSize: '0.75rem',
                                          opacity: 0.5
                                        }}>
                                          Yok
                                        </div>
                                      )}
                                      <div className="club-details">
                                        <h4 style={{ opacity: 0.6 }}>{item.name || 'İsimsiz Kulüp'}</h4>
                                        <p style={{ opacity: 0.6 }}>Kapatıldı</p>
                                      </div>
                                    </div>
                                  )}
                                  {/* PASİF ÖĞRENCİLER İÇİN GÖRÜNÜM */}
                                  {activeTab === 'inactiveStudents' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      {item.profileImageUrl && (
                                        <img
                                          src={item.profileImageUrl}
                                          alt="Profil"
                                          className="user-avatar"
                                          style={{ opacity: 0.5, width: '2rem', height: '2rem', borderRadius: '50%' }}
                                        />
                                      )}
                                      <span style={{ opacity: 0.6 }}>
                                        {item.firstName && item.lastName 
                                          ? `${item.firstName} ${item.lastName}`
                                          : item.studentNumber || 'İsim Yok'}
                                      </span>
                                    </div>
                                  )}
                                  {/* PASİF AKADEMİSYENLER İÇİN GÖRÜNÜM */}
                                  {activeTab === 'inactiveAcademicians' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      {item.profileImageUrl && (
                                        <img
                                          src={item.profileImageUrl}
                                          alt="Profil"
                                          className="user-avatar"
                                          style={{ opacity: 0.5, width: '2rem', height: '2rem', borderRadius: '50%' }}
                                        />
                                      )}
                                      <span style={{ opacity: 0.6 }}>
                                        {item.title && `${item.title} `}
                                        {item.firstName} {item.lastName}
                                      </span>
                                    </div>
                                  )}
                                </td>

                                <td>
                                  {/* DETAY SÜTUNU */}
                                  {activeTab === 'users' && (
                                    <span style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                      {(item.roles || []).map((role) => (
                                        <span key={role} className="role-badge">
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
                                    <span className="table-text-secondary">
                                      Başkan: {item.presidentName}
                                    </span>
                                  )}
                                  {/* PASİF KULÜPLER - KAPATILMA TARİHİ */}
                                  {activeTab === 'inactiveClubs' && (
                                    <div className="table-text-secondary" style={{ opacity: 0.6 }}>
                                      {item.about && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                          Açıklama: {item.about.length > 50 ? item.about.substring(0, 50) + '...' : item.about}
                                        </div>
                                      )}
                                      <div>
                                        Kapatılma: {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                                      </div>
                                      {item.deletionReason && (
                                        <div style={{ marginTop: '0.25rem', fontSize: '0.85em', fontStyle: 'italic' }}>
                                          Neden: {item.deletionReason}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {/* PASİF ÖĞRENCİLER - SİLİNME TARİHİ VE ROLLER */}
                                  {activeTab === 'inactiveStudents' && (
                                    <div style={{ opacity: 0.6 }}>
                                      {item.studentNumber && (
                                        <div>Öğrenci No: {item.studentNumber}</div>
                                      )}
                                      {item.department && (
                                        <div>Bölüm: {item.department}</div>
                                      )}
                                      {item.deletedAt && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                          Arşivlendi: {new Date(item.deletedAt).toLocaleDateString('tr-TR')}
                                        </div>
                                      )}
                                      {item.deletionReason && (
                                        <div style={{ marginTop: '0.25rem', fontSize: '0.85em', fontStyle: 'italic' }}>
                                          Neden: {item.deletionReason}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {/* PASİF AKADEMİSYENLER - BÖLÜM */}
                                  {activeTab === 'inactiveAcademicians' && (
                                    <div style={{ opacity: 0.6 }}>
                                      {item.department && (
                                        <div>Bölüm: {item.department}</div>
                                      )}
                                      {item.officeNumber && (
                                        <div>Ofis: {item.officeNumber}</div>
                                      )}
                                      {item.deletedAt && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                          Arşivlendi: {new Date(item.deletedAt).toLocaleDateString('tr-TR')}
                                        </div>
                                      )}
                                      {item.deletionReason && (
                                        <div style={{ marginTop: '0.25rem', fontSize: '0.85em', fontStyle: 'italic' }}>
                                          Neden: {item.deletionReason}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>

                                <td style={{ textAlign: 'right' }}>
                                  {/* KULLANICI SİLME BUTONU (Sadece Users sekmesinde) */}
                                  {activeTab === 'users' && (
                                    <button
                                      onClick={() => handleDeleteUser(item.id)}
                                      className="action-button btn-delete"
                                    >
                                      Kullanıcıyı Sil
                                    </button>
                                  )}

                                  {/* AKTİF KULÜPLER: İŞLEM BUTONLARI */}
                                  {activeTab === 'activeClubs' && (
                                    <>
                                      <button
                                        onClick={() => handleViewBoard(item.id, item.name)}
                                        className="action-button btn-view"
                                        style={{ marginRight: '0.5rem' }}
                                      >
                                        Yönetim
                                      </button>

                                      <button
                                        onClick={() => handleChangePresident(item.id)}
                                        className="action-button btn-change"
                                        style={{ marginRight: '0.5rem' }}
                                      >
                                        Bşk. Değiştir
                                      </button>

                                      <button
                                        onClick={() => handleUpdateLogo(item.id)}
                                        className="action-button btn-logo"
                                        style={{ marginRight: '0.5rem' }}
                                      >
                                        Logo
                                      </button>

                                      <button
                                        onClick={() => handleReject(item.id)}
                                        className="action-button btn-reject"
                                      >
                                        Kapat
                                      </button>
                                    </>
                                  )}

                                  {/* PASİF KAYITLAR: İŞLEM BUTONLARI GÖSTERME */}
                                  {activeTab === 'inactiveClubs' && (
                                    <span className="table-text-secondary" style={{ opacity: 0.6 }}>
                                      Arşivlendi
                                    </span>
                                  )}
                                  {activeTab === 'inactiveStudents' && (
                                    <span className="table-text-secondary" style={{ opacity: 0.6 }}>
                                      Öğrenci Arşivlendi
                                    </span>
                                  )}
                                  {activeTab === 'inactiveAcademicians' && (
                                    <span className="table-text-secondary" style={{ opacity: 0.6 }}>
                                      Akademisyen Arşivlendi
                                    </span>
                                  )}

                                  {/* DİĞER ONAY/RET BUTONLARI (Users, activeClubs ve Pasif sekmelerde GİZLİ OLMALI) */}
                                  {activeTab !== 'users' && 
                                   activeTab !== 'activeClubs' && 
                                   activeTab !== 'inactiveClubs' && 
                                   activeTab !== 'inactiveStudents' && 
                                   activeTab !== 'inactiveAcademicians' && (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleApprove(activeTab === 'clubs' ? item.id : item.userId)
                                        }
                                        className="action-button btn-approve"
                                        style={{ marginRight: '0.5rem' }}
                                      >
                                        Onayla
                                      </button>

                                      <button
                                        onClick={() =>
                                          handleReject(activeTab === 'clubs' ? item.id : item.userId)
                                        }
                                        className="action-button btn-reject"
                                      >
                                        Reddet
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            </React.Fragment>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ------------------ YÖNETİM KURULU MODALI ------------------ */}
      {isBoardModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            {/* Modal Başlık */}
            <div className="modal-header">
              <h3>
                {selectedClubName} - Yönetim Kurulu
              </h3>
              <button
                onClick={() => setIsBoardModalOpen(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            {/* Modal İçerik (Liste) */}
            <div className="modal-body">
              {boardMembers.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>İsim</th>
                      <th>Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boardMembers.map((member, index) => (
                      <tr key={index}>
                        <td>
                          {member.firstName} {member.lastName}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              member.role.includes('PRESIDENT')
                                ? 'badge-approved'
                                : 'badge-pending'
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
                <p className="empty-state">Bu kulüpte kayıtlı yetkili bulunamadı.</p>
              )}
            </div>

            {/* Modal Alt Kısım */}
            <div className="modal-footer">
              <button
                onClick={() => setIsBoardModalOpen(false)}
                className="action-button btn-view"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ BAŞKAN DEĞİŞTİRME MODALI ------------------ */}
      {isPresidentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>👑 Başkan Değiştir</h3>
              <button
                onClick={() => {
                  setIsPresidentModalOpen(false);
                  setNewPresidentId('');
                  setSelectedClubForPresident(null);
                }}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <strong>Kulüp:</strong> {selectedClubForPresident?.name}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <strong>Mevcut Başkan:</strong> {selectedClubForPresident?.presidentName}
                </p>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Yeni Başkanın Öğrenci ID'si (UUID)
                </label>
                <input
                  type="text"
                  value={newPresidentId}
                  onChange={(e) => setNewPresidentId(e.target.value)}
                  placeholder="Örnek: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  ⚠️ Yeni başkanın kulüp üyesi olduğundan emin olun.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => {
                  setIsPresidentModalOpen(false);
                  setNewPresidentId('');
                  setSelectedClubForPresident(null);
                }}
                className="action-button btn-view"
                style={{ marginRight: '0.5rem' }}
              >
                İptal
              </button>
              <button
                onClick={confirmChangePresident}
                className="action-button btn-approve"
              >
                Değiştir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ KULÜP KAPATMA MODALI ------------------ */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>⚠️ Kulübü Kapat</h3>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedClubForDelete(null);
                }}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{ 
                padding: '1rem', 
                backgroundColor: 'var(--danger-bg, #fee)', 
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--danger-color, #c00)', marginBottom: '0.5rem' }}>
                  <strong>⚠️ Dikkat:</strong> Bu işlem geri alınamaz!
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Kulüp kapatıldığında tüm üyelikler ve veriler silinecektir.
                </p>
              </div>

              <div>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <strong>Kulüp Adı:</strong> {selectedClubForDelete?.name}
                </p>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <strong>Başkan:</strong> {selectedClubForDelete?.presidentName}
                </p>
                <p style={{ fontSize: '0.875rem' }}>
                  <strong>Üye Sayısı:</strong> {selectedClubForDelete?.memberCount}
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedClubForDelete(null);
                }}
                className="action-button btn-view"
                style={{ marginRight: '0.5rem' }}
              >
                İptal
              </button>
              <button
                onClick={confirmDeleteClub}
                className="action-button btn-reject"
              >
                Kulübü Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}