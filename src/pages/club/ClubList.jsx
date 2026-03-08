import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllClubs, sendMembershipRequest, getMyMembershipRequests } from '../../api/clubService';
import { Users, Search, Send, Check, Clock, X, ArrowLeft, Loader2 } from 'lucide-react';

function ClubList() {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchClubs();
    fetchMyRequests();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchClubs = async () => {
    try {
      const data = await getAllClubs();
      setClubs(data);
    } catch {
      setError('Kulüpler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const data = await getMyMembershipRequests();
      setMyRequests(data);
    } catch (error) {
      console.error('İstekler yüklenemedi:', error);
    }
  };

  const handleSendRequest = async (clubId) => {
    setSendingRequest(clubId);
    try {
      await sendMembershipRequest(clubId);
      setSuccessMessage('Üyelik isteği başarıyla gönderildi!');
      fetchMyRequests();
    } catch (error) {
      setError(error.response?.data?.message || 'İstek gönderilemedi');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSendingRequest(null);
    }
  };

  const getRequestStatus = (clubId) => {
    const request = myRequests.find(req => (req.clubId === clubId || req.club?.id === clubId));
    return request?.status || null;
  };

  const filteredClubs = clubs.filter(club =>
    club.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20 min-h-screen bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">

      {/* Toast Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-lg">
          <Check className="w-5 h-5" /> <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 shadow-lg">
          <X className="w-5 h-5" /> <span>{error}</span>
        </div>
      )}

      <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-8 shadow-sm transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 flex-col md:flex-row md:items-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Geri Dön</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">Tüm Kulüpler</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Katılmak istediğin kulübü seç ve üyelik isteği gönder</p>
            </div>
          </div>
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Kulüp ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </header>

        {/* Club Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
              <Users className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">{searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz kulüp bulunmuyor'}</p>
            </div>
          ) : (
            filteredClubs.map((club) => {
              const status = getRequestStatus(club.id);
              const isSending = sendingRequest === club.id;

              return (
                <div key={club.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
                  {club.logoUrl ? (
                    <div className="h-48 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
                      <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
                      <Users className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{club.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 flex-1 line-clamp-3">
                      {club.description || 'Açıklama bulunmuyor'}
                    </p>

                    {club.advisorName && (
                      <div className="flex items-center gap-2 mb-4 text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Danışman:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{club.advisorName}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                        <Users className="w-4 h-4" />
                        <span>{club.memberCount || 0} üye</span>
                      </div>

                      <div className="flex-1 flex justify-end">
                        {status === 'PENDING' && (
                          <button disabled className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-xl text-sm font-medium opacity-80 w-full sm:w-auto">
                            <Clock className="w-4 h-4" /> Bekliyor
                          </button>
                        )}
                        {status === 'APPROVED' && (
                          <button disabled className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-sm font-medium opacity-80 w-full sm:w-auto">
                            <Check className="w-4 h-4" /> Üyesin
                          </button>
                        )}
                        {status === 'REJECTED' && (
                          <button disabled className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-xl text-sm font-medium opacity-80 w-full sm:w-auto">
                            <X className="w-4 h-4" /> Reddedildi
                          </button>
                        )}
                        {!status && (
                          <button
                            onClick={() => handleSendRequest(club.id)}
                            disabled={isSending}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-blue-500/25 disabled:opacity-70 w-full sm:w-auto"
                          >
                            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {isSending ? 'Gönderiliyor...' : 'İstek Gönder'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default ClubList;
