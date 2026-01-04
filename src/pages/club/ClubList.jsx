import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllClubs, sendMembershipRequest, getMyMembershipRequests } from '../../api/clubService';
import { Users, Search, Send, Check, Clock, X, ArrowLeft, Loader2 } from 'lucide-react';
import './ClubList.css';

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
      console.log('Kulüpler verisi:', data);
      if (data && data.length > 0) {
        console.log('İlk kulüp örneği:', data[0]);
      }
      setClubs(data);
    } catch (error) {
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
      fetchMyRequests(); // İstekleri yenile
    } catch (error) {
      setError(error.response?.data?.message || 'İstek gönderilemedi');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSendingRequest(null);
    }
  };

  const getRequestStatus = (clubId) => {
    const request = myRequests.find(req => 
      (req.clubId === clubId || req.club?.id === clubId)
    );
    return request?.status || null;
  };

  const filteredClubs = clubs.filter(club =>
    club.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="club-list-container">
        <div className="loading-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <p className="mt-4 text-purple-200">Kulüpler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="club-list-container">
      {successMessage && (
        <div className="toast-success">
          <Check className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="toast-error">
          <X className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="club-list-content">
        <div className="club-list-header">
          <button 
            onClick={() => navigate(-1)}
            className="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Geri</span>
          </button>
          
          <div className="header-title-section">
            <h1 className="header-title">Tüm Kulüpler</h1>
            <p className="header-subtitle">Katılmak istediğin kulübü seç ve üyelik isteği gönder</p>
          </div>

          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Kulüp ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="clubs-grid">
          {filteredClubs.length === 0 ? (
            <div className="empty-state">
              <Users className="w-16 h-16 text-purple-300 mb-4" />
              <p className="text-lg text-purple-200">
                {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz kulüp bulunmuyor'}
              </p>
            </div>
          ) : (
            filteredClubs.map((club) => {
              const status = getRequestStatus(club.id);
              const isSending = sendingRequest === club.id;

              return (
                <div key={club.id} className="club-card">
                  {club.logoUrl && (
                    <div className="club-logo-container">
                      <img 
                        src={club.logoUrl} 
                        alt={club.name}
                        className="club-logo"
                      />
                    </div>
                  )}
                  
                  <div className="club-card-content">
                    <h3 className="club-name">{club.name}</h3>
                    <p className="club-description">{club.description || 'Açıklama bulunmuyor'}</p>
                    
                    {/* Danışman bilgisi */}
                    {club.advisorName && (
                      <div className="club-advisor">
                        <span className="advisor-label">👨‍🏫 Danışman:</span>
                        <span className="advisor-name">{club.advisorName}</span>
                      </div>
                    )}
                    
                    <div className="club-footer">
                      {/* Üye sayısını göster */}
                      <div className="club-members">
                        <Users className="w-4 h-4" />
                        <span>
                          {club.memberCount || 0} üye
                        </span>
                      </div>

                      {status === 'PENDING' && (
                        <button className="status-button pending" disabled>
                          <Clock className="w-4 h-4" />
                          <span>Bekliyor</span>
                        </button>
                      )}
                      
                      {status === 'APPROVED' && (
                        <button className="status-button approved" disabled>
                          <Check className="w-4 h-4" />
                          <span>Üyesin</span>
                        </button>
                      )}
                      
                      {status === 'REJECTED' && (
                        <button className="status-button rejected" disabled>
                          <X className="w-4 h-4" />
                          <span>Reddedildi</span>
                        </button>
                      )}
                      
                      {!status && (
                        <button
                          onClick={() => handleSendRequest(club.id)}
                          disabled={isSending}
                          className="request-button"
                        >
                          {isSending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Gönderiliyor...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>İstek Gönder</span>
                            </>
                          )}
                        </button>
                      )}
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
