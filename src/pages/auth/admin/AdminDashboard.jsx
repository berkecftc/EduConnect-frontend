import { useState, useEffect } from 'react';
import adminService from '../../../api/adminService';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('academicians'); // Varsayılan sekme
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  // Sekme değişince veriyi çek
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === 'users') response = await adminService.getAllUsers(); // <-- EKLENDİ
      if (activeTab === 'academicians') response = await adminService.getAcademicianRequests();
      else if (activeTab === 'clubOfficials') response = await adminService.getClubOfficialRequests();
      else if (activeTab === 'clubs') response = await adminService.getClubCreationRequests();
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

  // 👇 YENİ: Tabloya gönderilecek veriyi hesaplayan mantık
  const getFilteredData = () => {
    // Eğer "Kullanıcılar" sekmesinde değilsek direkt veriyi dön (Filtreleme yapma)
    if (activeTab !== 'users') return data;

    // Eğer filtre "ALL" ise hepsini dön
    if (userRoleFilter === 'ALL') return data;

    // Seçilen role göre filtrele (Backend'den ROLE_STUDENT şeklinde geliyor)
    return data.filter(user => user.roles && user.roles.includes(userRoleFilter));
  };

  const displayData = getFilteredData(); // Artık map işleminde bunu kullanacağız

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-800">Yönetici Paneli</h1>

        {/* --- SEKMELER (TABS) --- */}
        <div className="mb-6 flex space-x-2 overflow-x-auto border-b border-gray-200 pb-2">
          {['users', 'academicians', 'clubOfficials', 'clubs', 'events'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                ${activeTab === tab 
                  ? 'bg-white text-blue-600 border border-b-0 border-gray-200 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              {tab === 'users' && 'Tüm Kullanıcılar'} {/* <-- Bunu Ekle */}
              {tab === 'academicians' && 'Akademisyen Başvuruları'}
              {tab === 'clubOfficials' && 'Kulüp Başkanı İstekleri'}
              {tab === 'clubs' && 'Kulüp Kurma İstekleri'}
              {tab === 'events' && 'Etkinlik İstekleri'}
            </button>
          ))}
        </div>

        {/* --- İÇERİK TABLOSU --- */}
        <div className="rounded-lg bg-white p-6 shadow">
          {/* 👇 YENİ: SADECE KULLANICILAR SEKME İÇİN ALT FİLTRE BUTONLARI */}
          {activeTab === 'users' && (
            <div className="mb-4 rounded-md border bg-gray-50 p-4 flex gap-2 flex-wrap">
              {[
                { label: 'Tümü', value: 'ALL' },
                { label: 'Öğrenciler', value: 'ROLE_STUDENT' },
                { label: 'Akademisyenler', value: 'ROLE_ACADEMICIAN' },
                { label: 'Kulüp Başkanları', value: 'ROLE_CLUB_OFFICIAL' },
                { label: 'Adminler', value: 'ROLE_ADMIN' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setUserRoleFilter(filter.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    userRoleFilter === filter.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
          {loading ? (
            <div className="text-center py-10 text-gray-500">Yükleniyor...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-10 text-gray-400">Bekleyen istek bulunmamaktadır.</div>
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
                          {activeTab === 'clubs' && (item.description ? item.description.substring(0, 50) + '...' : '')}
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

                          {/* DİĞER ONAY/RET BUTONLARI (Users sekmesinde GİZLİ OLMALI) */}
                          {activeTab !== 'users' && (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}