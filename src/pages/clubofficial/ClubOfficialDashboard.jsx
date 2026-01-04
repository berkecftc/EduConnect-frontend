import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { 
  getMyManagedClubs, 
  getClubBoardMembers, 
  getMyMemberships,
  getPendingMembershipRequests,
  getPendingMembershipRequestCount,
  approveMembershipRequest,
  rejectMembershipRequest
} from '../../api/clubService';
import { getMyEvents, getEventRegistrations, createEvent, verifyQrCode, getMyRegistrations, getAllMyPendingRequests, approveParticipationRequest, rejectParticipationRequest } from '../../api/eventService';
import { getMyCourses } from '../../api/courseService';
import { getMyAssignments } from '../../api/assignmentService';

import { 
  Users, 
  Calendar, 
  LogOut, 
  Loader2, 
  Plus, 
  QrCode, 
  UserCheck, 
  Crown,
  BookOpen,
  ClipboardList,
  Check,
  AlertCircle,
  X,
  FileText,
  UserPlus
} from 'lucide-react';

import './ClubOfficialDashboard.css';

function ClubOfficialDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [managedClubs, setManagedClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [boardMembers, setBoardMembers] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [eventParticipationRequests, setEventParticipationRequests] = useState([]);
  
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]); // Tüm ödevler
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);

  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    eventTime: '',
    location: '',
  });
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [qrCode, setQrCode] = useState('');
  
  const [loading, setLoading] = useState({
    managedClubs: true,
    boardMembers: false,
    myEvents: true,
    eventRegistrations: false,
    courses: true,
    assignments: true,
    clubs: true,
    events: true,
    creatingEvent: false,
    verifyingQr: false,
    pendingRequests: false,
    approvingRequest: false,
    eventParticipationRequests: true,
  });
  
  const [errors, setErrors] = useState({
    managedClubs: null,
    boardMembers: null,
    myEvents: null,
    eventRegistrations: null,
    courses: null,
    assignments: null,
    clubs: null,
    events: null,
    createEvent: null,
    verifyQr: null,
    pendingRequests: null,
    eventParticipationRequests: null,
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('official');

  useEffect(() => {
    fetchManagedClubs();
    fetchMyEvents();
    fetchCourses();
    fetchAssignments();
    fetchClubs();
    fetchEvents();
    fetchEventParticipationRequests();
  }, []);

  useEffect(() => {
    if (selectedClubId) {
      fetchBoardMembers(selectedClubId);
      fetchPendingRequests(selectedClubId);
      fetchPendingCount(selectedClubId);
    }
  }, [selectedClubId]);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventRegistrations(selectedEventId);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchManagedClubs = async () => {
    try {
      const response = await getMyManagedClubs();
      console.log('Managed Clubs Response:', response);
      if (response && response.length > 0) {
        console.log('İlk yönetilen kulüp örneği:', response[0]);
      }
      setManagedClubs(response || []);
    } catch (error) {
      setErrors(prev => ({ ...prev, managedClubs: 'Kulüpler yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, managedClubs: false }));
    }
  };

  const fetchBoardMembers = async (clubId) => {
    setLoading(prev => ({ ...prev, boardMembers: true }));
    try {
      const response = await getClubBoardMembers(clubId);
      setBoardMembers(response || []);
    } catch (error) {
      setErrors(prev => ({ ...prev, boardMembers: 'Yönetim kurulu yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, boardMembers: false }));
    }
  };

  const fetchMyEvents = async () => {
    try {
      const response = await getMyEvents();
      setMyEvents(response || []);
    } catch (error) {
      setErrors(prev => ({ ...prev, myEvents: 'Etkinlikler yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, myEvents: false }));
    }
  };

  const fetchEventRegistrations = async (eventId) => {
    setLoading(prev => ({ ...prev, eventRegistrations: true }));
    try {
      const response = await getEventRegistrations(eventId);
      setEventRegistrations(response || []);
    } catch (error) {
      setErrors(prev => ({ ...prev, eventRegistrations: 'Kayıtlar yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, eventRegistrations: false }));
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await getMyCourses();
      console.log('Kulüp Başkanı - Kayıtlı derslerim:', response);
      setCourses(response || []);
      // Dersler yüklendikten sonra ödevleri filtrele
      filterAssignmentsByCourses(response || []);
    } catch (error) {
      setErrors(prev => ({ ...prev, courses: 'Kurslar yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await getMyAssignments();
      console.log('Kulüp Başkanı - Tüm ödevler:', response);
      setAllAssignments(response || []);
      // Dersler yüklendiyse ödevleri filtrele
      if (courses.length > 0) {
        filterAssignmentsByCourses(courses, response || []);
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, assignments: 'Ödevler yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, assignments: false }));
    }
  };

  const filterAssignmentsByCourses = (coursesData = courses, assignmentsData = allAssignments) => {
    if (!coursesData || coursesData.length === 0 || !assignmentsData || assignmentsData.length === 0) {
      return;
    }

    // Kayıtlı olunan ders ID'lerini al
    const enrolledCourseIds = coursesData.map(course => 
      course.id || course.courseId || course.course?.id
    ).filter(id => id !== undefined);

    console.log('Kulüp Başkanı - Kayıtlı ders IDleri:', enrolledCourseIds);

    // Sadece kayıtlı olunan derslerin ödevlerini filtrele
    const filteredAssignments = assignmentsData.filter(assignment => {
      const assignmentCourseId = assignment.courseId || assignment.course?.id;
      return enrolledCourseIds.includes(assignmentCourseId);
    });

    console.log('Kulüp Başkanı - Filtrelenmiş ödevler:', filteredAssignments);
    setAssignments(filteredAssignments);
  };

  const fetchClubs = async () => {
    try {
      const response = await getMyMemberships();
      console.log('Kulüp Başkanı - Kulüplerim verisi:', response);
      if (response && response.length > 0) {
        console.log('İlk kulüp membership örneği:', response[0]);
      }
      setClubs(response || []);
    } catch (error) {
      setErrors(prev => ({ ...prev, clubs: 'Kulüpler yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, clubs: false }));
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await getMyRegistrations();
      console.log('My Registrations Response:', response);
      setEvents(response || []);
    } catch (error) {
      setErrors(prev => ({ ...prev, events: 'Etkinlikler yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  };

  const fetchPendingRequests = async (clubId) => {
    setLoading(prev => ({ ...prev, pendingRequests: true }));
    try {
      const response = await getPendingMembershipRequests(clubId);
      setPendingRequests(response || []);
    } catch (error) {
      setErrors(prev => ({ ...prev, pendingRequests: 'Üyelik istekleri yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, pendingRequests: false }));
    }
  };

  const fetchPendingCount = async (clubId) => {
    try {
      const response = await getPendingMembershipRequestCount(clubId);
      setPendingCount(response?.count || 0);
    } catch (error) {
      console.error('Bekleyen istek sayısı alınamadı:', error);
    }
  };

  const handleApproveRequest = async (requestId) => {
    if (!selectedClubId) return;
    
    setLoading(prev => ({ ...prev, approvingRequest: true }));
    try {
      await approveMembershipRequest(selectedClubId, requestId);
      setSuccessMessage('Üyelik isteği onaylandı!');
      fetchPendingRequests(selectedClubId);
      fetchPendingCount(selectedClubId);
    } catch (error) {
      setErrors(prev => ({ ...prev, pendingRequests: error.response?.data?.message || 'İstek onaylanamadı' }));
    } finally {
      setLoading(prev => ({ ...prev, approvingRequest: false }));
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!selectedClubId) return;
    
    setLoading(prev => ({ ...prev, approvingRequest: true }));
    try {
      await rejectMembershipRequest(selectedClubId, requestId);
      setSuccessMessage('Üyelik isteği reddedildi');
      fetchPendingRequests(selectedClubId);
      fetchPendingCount(selectedClubId);
    } catch (error) {
      setErrors(prev => ({ ...prev, pendingRequests: error.response?.data?.message || 'İstek reddedilemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, approvingRequest: false }));
    }
  };

  const fetchEventParticipationRequests = async () => {
    try {
      const response = await getAllMyPendingRequests();
      console.log('Etkinlik katılım istekleri:', response);
      setEventParticipationRequests(response || []);
    } catch (error) {
      setErrors(prev => ({ ...prev, eventParticipationRequests: 'Katılım istekleri yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, eventParticipationRequests: false }));
    }
  };

  const handleApproveParticipationRequest = async (requestId) => {
    setLoading(prev => ({ ...prev, approvingRequest: true }));
    try {
      await approveParticipationRequest(requestId);
      setSuccessMessage('Katılım isteği onaylandı!');
      fetchEventParticipationRequests();
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        eventParticipationRequests: error.response?.data?.message || 'İstek onaylanamadı' 
      }));
      setTimeout(() => setErrors(prev => ({ ...prev, eventParticipationRequests: null })), 3000);
    } finally {
      setLoading(prev => ({ ...prev, approvingRequest: false }));
    }
  };

  const handleRejectParticipationRequest = async (requestId) => {
    setLoading(prev => ({ ...prev, approvingRequest: true }));
    try {
      await rejectParticipationRequest(requestId);
      setSuccessMessage('Katılım isteği reddedildi');
      fetchEventParticipationRequests();
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        eventParticipationRequests: error.response?.data?.message || 'İstek reddedilemedi' 
      }));
      setTimeout(() => setErrors(prev => ({ ...prev, eventParticipationRequests: null })), 3000);
    } finally {
      setLoading(prev => ({ ...prev, approvingRequest: false }));
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, creatingEvent: true }));
    setErrors(prev => ({ ...prev, createEvent: null }));

    const clubData = managedClubs[0]?.club || managedClubs[0];
    const clubName = clubData?.name || clubData?.clubName || managedClubs[0]?.clubName;

    if (!clubName) {
      setErrors(prev => ({ ...prev, createEvent: 'Yönetilen kulüp bulunamadı' }));
      setLoading(prev => ({ ...prev, creatingEvent: false }));
      return;
    }

    if (!posterFile) {
      setErrors(prev => ({ ...prev, createEvent: 'Etkinlik afişi zorunludur' }));
      setLoading(prev => ({ ...prev, creatingEvent: false }));
      return;
    }

    try {
      const formData = new FormData();
      
      // Add event data as JSON Blob (required format)
      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        eventTime: eventForm.eventTime,
        location: eventForm.location,
        clubName: clubName
      };
      formData.append('data', new Blob([JSON.stringify(eventData)], { type: 'application/json' }));
      
      // Add poster file
      formData.append('poster', posterFile);

      await createEvent(formData);
      setSuccessMessage('Etkinlik başarıyla oluşturuldu!');
      setShowCreateEventModal(false);
      setEventForm({ title: '', description: '', eventTime: '', location: '' });
      setPosterFile(null);
      setPosterPreview(null);
      fetchMyEvents();
    } catch (error) {
      setErrors(prev => ({ ...prev, createEvent: error.response?.data?.message || 'Etkinlik oluşturulamadı' }));
    } finally {
      setLoading(prev => ({ ...prev, creatingEvent: false }));
    }
  };

  const handleVerifyQr = async (e) => {
    e.preventDefault();
    if (!qrCode.trim()) return;

    setLoading(prev => ({ ...prev, verifyingQr: true }));
    setErrors(prev => ({ ...prev, verifyQr: null }));

    try {
      await verifyQrCode({ qrCode });
      setSuccessMessage('QR kod başarıyla doğrulandı!');
      setQrCode('');
      setShowQrModal(false);
    } catch (error) {
      setErrors(prev => ({ ...prev, verifyQr: error.response?.data?.message || 'QR kod doğrulanamadı' }));
    } finally {
      setLoading(prev => ({ ...prev, verifyingQr: false }));
    }
  };

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, createEvent: 'Sadece JPG ve PNG formatları desteklenmektedir' }));
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, createEvent: 'Dosya boyutu 5MB\'dan küçük olmalıdır' }));
        return;
      }

      setPosterFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous errors
      setErrors(prev => ({ ...prev, createEvent: null }));
    }
  };

  const handleRemovePoster = () => {
    setPosterFile(null);
    setPosterPreview(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const CardLoader = () => (
    <div className="loading-container">
      <Loader2 className="loading-spinner" />
    </div>
  );

  const EmptyState = ({ message }) => (
    <div className="empty-state">
      <div className="empty-state-icon">📭</div>
      <p className="text-sm">{message}</p>
    </div>
  );

  const ErrorState = ({ message }) => (
    <div className="error-state">
      <AlertCircle className="w-5 h-5 mr-2" />
      <p className="text-sm">{message}</p>
    </div>
  );

  return (
    <div className="club-official-dashboard">
      {successMessage && (
        <div className="toast success">
          <Check className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="relative z-10 p-4 md:p-8">
        <header className="dashboard-header">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="dashboard-title">Kulüp Yetkilisi Paneli</h1>
              <p className="dashboard-subtitle">Hoş geldin, {user}</p>
            </div>
            <div className="button-group">
              <button className="btn btn-indigo" onClick={() => setShowCreateEventModal(true)}>
                <Plus className="w-4 h-4" />
                <span>Etkinlik Oluştur</span>
              </button>
              <button className="btn btn-emerald" onClick={() => setShowQrModal(true)}>
                <QrCode className="w-4 h-4" />
                <span>QR Doğrula</span>
              </button>
              <button className="btn btn-danger" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>

          <div className="tab-list mt-6">
            <button className={`tab-button ${activeTab === 'official' ? 'active' : ''}`} onClick={() => setActiveTab('official')}>
              Yönetici Paneli
            </button>
            <button className={`tab-button ${activeTab === 'student' ? 'active' : ''}`} onClick={() => setActiveTab('student')}>
              Öğrenci Paneli
            </button>
          </div>
        </header>

        {activeTab === 'official' && (
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <div className="card-header">
                <div className="icon-container purple"><Crown className="w-6 h-6 text-white" /></div>
                <h2 className="card-title">Yönettiğim Kulüpler</h2>
                <span className="count-badge purple">{managedClubs.length}</span>
              </div>
              <div className="card-content">
                {loading.managedClubs ? <CardLoader /> :
                 errors.managedClubs ? <ErrorState message={errors.managedClubs} /> :
                 managedClubs.length === 0 ? <EmptyState message="Yönettiğiniz kulüp yok" /> : (
                  <div className="scrollable-list">
                    {managedClubs.map((club, index) => {
                      const clubData = club.club || club;
                      const clubId = clubData.id || club.clubId || club.id;
                      const clubName = clubData.name || clubData.clubName || club.clubName || 'İsimsiz Kulüp';
                      const clubDesc = clubData.description || club.description || '';
                      const advisorName = clubData.advisorName || club.advisorName;
                      const memberCount = clubData.memberCount || club.memberCount;
                      
                      return (
                        <div key={clubId || index} onClick={() => setSelectedClubId(clubId)} className={`list-item ${selectedClubId === clubId ? 'selected' : ''}`}>
                          <h3 className="item-title">{clubName}</h3>
                          <p className="item-subtitle">{clubDesc}</p>
                          {advisorName && (
                            <p className="item-subtitle text-xs mt-1" style={{color: '#a5b4fc'}}>
                              👨‍🏫 Danışman: {advisorName}
                            </p>
                          )}
                          {memberCount !== undefined && (
                            <span className="status-badge success text-xs mt-1">
                              👥 {memberCount} üye
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <div className="icon-container amber"><UserCheck className="w-6 h-6 text-white" /></div>
                <h2 className="card-title">Yönetim Kurulu</h2>
                <span className="count-badge amber">{boardMembers.length}</span>
              </div>
              <div className="card-content">
                {!selectedClubId ? <EmptyState message="Kulüp seçin" /> :
                 loading.boardMembers ? <CardLoader /> :
                 errors.boardMembers ? <ErrorState message={errors.boardMembers} /> :
                 boardMembers.length === 0 ? <EmptyState message="Yönetim kurulu üyesi yok" /> : (
                  <div className="scrollable-list">
                    {boardMembers.map((member, index) => (
                      <div key={member.id || index} className="list-item">
                        <h3 className="item-title">{member.name || member.fullName}</h3>
                        <p className="item-subtitle">{member.role || member.position}</p>
                        <span className="status-badge warning">{member.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <div className="icon-container cyan"><Calendar className="w-6 h-6 text-white" /></div>
                <h2 className="card-title">Oluşturduğum Etkinlikler</h2>
                <span className="count-badge cyan">{myEvents.length}</span>
              </div>
              <div className="card-content">
                {loading.myEvents ? <CardLoader /> :
                 errors.myEvents ? <ErrorState message={errors.myEvents} /> :
                 myEvents.length === 0 ? <EmptyState message="Henüz etkinlik oluşturmadınız" /> : (
                  <div className="scrollable-list">
                    {myEvents.map((event, index) => {
                      // Tarih formatı düzeltmesi
                      const eventDate = event.eventTime || event.eventDate || event.date;
                      let formattedDate = 'Tarih belirtilmemiş';
                      let eventStatus = 'upcoming'; // upcoming, past, cancelled, rejected
                      
                      if (eventDate) {
                        try {
                          // ISO 8601 formatını düzgün parse et
                          let dateObj;
                          
                          // Eğer string ise
                          if (typeof eventDate === 'string') {
                            // ISO 8601 format (2026-01-15T19:00:00)
                            dateObj = new Date(eventDate);
                          } else {
                            dateObj = new Date(eventDate);
                          }
                          
                          if (!isNaN(dateObj.getTime())) {
                            formattedDate = dateObj.toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                            
                            // Etkinlik durumunu belirle - Şu anki zamanla karşılaştır
                            const now = new Date();
                            const eventLocalTime = dateObj.getTime();
                            const nowLocalTime = now.getTime();
                            
                            if (eventLocalTime < nowLocalTime) {
                              eventStatus = 'past';
                            } else {
                              eventStatus = 'upcoming';
                            }
                          }
                        } catch (e) {
                          console.error('Tarih parse hatası:', e, 'Tarih:', eventDate);
                        }
                      }

                      // Backend'den gelen status varsa onu kullan (öncelikli)
                      if (event.status === 'CANCELLED' || event.cancelled) {
                        eventStatus = 'cancelled';
                      } else if (event.status === 'REJECTED') {
                        eventStatus = 'rejected';
                      } else if (event.status === 'APPROVED' || event.status === 'ACTIVE') {
                        // Status APPROVED veya ACTIVE ise, tarih kontrolüne bak
                        // Yukarıda zaten tarih kontrolü yapıldı
                      }

                      return (
                        <div 
                          key={event.id || index} 
                          onClick={() => setSelectedEventId(event.id)} 
                          className={`list-item ${selectedEventId === event.id ? 'selected cyan' : ''}`}
                        >
                          <div className="flex flex-col gap-1">
                            <h3 className="item-title">{event.title || event.name}</h3>
                            <p className="item-subtitle">{formattedDate}</p>
                            {event.location && <p className="item-subtitle">📍 {event.location}</p>}
                            <span className={`status-badge ${
                              eventStatus === 'upcoming' ? 'success' : 
                              eventStatus === 'past' ? 'warning' : 
                              eventStatus === 'rejected' ? 'danger' :
                              'danger'
                            }`}>
                              {eventStatus === 'upcoming' ? '🟢 Aktif' : 
                               eventStatus === 'past' ? '⏰ Geçmiş' : 
                               eventStatus === 'rejected' ? '🔴 Reddedildi' :
                               '🔴 İptal Edildi'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <div className="icon-container emerald"><Users className="w-6 h-6 text-white" /></div>
                <h2 className="card-title">Etkinliğe Kayıtlılar</h2>
                <span className="count-badge emerald">{eventRegistrations.length}</span>
              </div>
              <div className="card-content">
                {!selectedEventId ? <EmptyState message="Etkinlik seçin" /> :
                 loading.eventRegistrations ? <CardLoader /> :
                 errors.eventRegistrations ? <ErrorState message={errors.eventRegistrations} /> :
                 eventRegistrations.length === 0 ? <EmptyState message="Kayıtlı katılımcı yok" /> : (
                  <div className="scrollable-list">
                    {eventRegistrations.map((reg, index) => (
                      <div key={reg.id || index} className="list-item">
                        <h3 className="item-title">{reg.studentName || reg.name}</h3>
                        <p className="item-subtitle">{reg.email}</p>
                        <span className={`status-badge ${reg.attended ? 'success' : 'warning'}`}>{reg.attended ? 'Katıldı' : 'Bekliyor'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <div className="icon-container orange"><UserPlus className="w-6 h-6 text-white" /></div>
                <h2 className="card-title">Bekleyen Üyelik İstekleri</h2>
                <span className="count-badge orange">{pendingCount}</span>
              </div>
              <div className="card-content">
                {!selectedClubId ? <EmptyState message="Kulüp seçin" /> :
                 loading.pendingRequests ? <CardLoader /> :
                 errors.pendingRequests ? <ErrorState message={errors.pendingRequests} /> :
                 pendingRequests.length === 0 ? <EmptyState message="Bekleyen istek yok" /> : (
                  <div className="scrollable-list">
                    {pendingRequests.map((request, index) => (
                      <div key={request.id || index} className="list-item">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="item-title">{request.studentName || request.name}</h3>
                            <p className="item-subtitle">{request.email}</p>
                            <p className="item-subtitle text-xs">{new Date(request.requestDate || request.createdAt).toLocaleDateString('tr-TR')}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              disabled={loading.approvingRequest}
                              className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 transition-all duration-300 disabled:opacity-50"
                              title="Onayla"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              disabled={loading.approvingRequest}
                              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 transition-all duration-300 disabled:opacity-50"
                              title="Reddet"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <div className="icon-container teal"><UserCheck className="w-6 h-6 text-white" /></div>
                <h2 className="card-title">Bekleyen Etkinlik İstekleri</h2>
                <span className="count-badge teal">{eventParticipationRequests.length}</span>
              </div>
              <div className="card-content">
                {loading.eventParticipationRequests ? <CardLoader /> :
                 errors.eventParticipationRequests ? <ErrorState message={errors.eventParticipationRequests} /> :
                 eventParticipationRequests.length === 0 ? <EmptyState message="Bekleyen etkinlik isteği yok" /> : (
                  <div className="scrollable-list">
                    {eventParticipationRequests.map((request, index) => {
                      const eventData = request.event || {};
                      const studentData = request.student || {};
                      const eventDate = eventData.eventTime || eventData.eventDate;
                      let formattedDate = 'Tarih belirtilmemiş';
                      
                      if (eventDate) {
                        try {
                          const dateObj = new Date(eventDate);
                          if (!isNaN(dateObj.getTime())) {
                            formattedDate = dateObj.toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                          }
                        } catch (e) {
                          console.error('Tarih parse hatası:', e);
                        }
                      }

                      return (
                        <div key={request.id || index} className="list-item">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="item-title">{eventData.title || 'Etkinlik'}</h3>
                              <p className="item-subtitle">
                                👤 {studentData.name || studentData.studentName || request.studentName || 'Öğrenci'}
                              </p>
                              <p className="item-subtitle text-xs">📅 {formattedDate}</p>
                              <p className="item-subtitle text-xs">
                                📍 {eventData.location || 'Konum belirtilmemiş'}
                              </p>
                              <p className="item-subtitle text-xs text-purple-300/50">
                                {new Date(request.requestDate || request.createdAt).toLocaleDateString('tr-TR')} tarihinde istendi
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveParticipationRequest(request.id)}
                                disabled={loading.approvingRequest}
                                className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 transition-all duration-300 disabled:opacity-50"
                                title="Onayla"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectParticipationRequest(request.id)}
                                disabled={loading.approvingRequest}
                                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 transition-all duration-300 disabled:opacity-50"
                                title="Reddet"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'student' && (
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <div className="card-header">
                <div className="icon-container indigo"><BookOpen className="w-6 h-6 text-white" /></div>
                <h2 className="card-title">Kurslarım</h2>
                <span className="count-badge indigo">{courses.length}</span>
              </div>
              <div className="card-content">
                {loading.courses ? <CardLoader /> :
                 errors.courses ? <ErrorState message={errors.courses} /> :
                 courses.length === 0 ? <EmptyState message="Kayıtlı kurs yok" /> : (
                  <div className="scrollable-list">
                    {courses.map((course, index) => (
                      <div key={course.id || index} className="list-item">
                        <h3 className="item-title">{course.name || course.title}</h3>
                        <p className="item-subtitle">{course.instructor || course.instructorName}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <div className="icon-container rose"><FileText className="w-6 h-6 text-white" /></div>
                <h2 className="card-title">Ödevlerim</h2>
                <span className="count-badge rose">{assignments.length}</span>
              </div>
              <div className="card-content">
                {loading.assignments ? <CardLoader /> :
                 errors.assignments ? <ErrorState message={errors.assignments} /> :
                 assignments.length === 0 ? <EmptyState message="Ödev yok" /> : (
                  <div className="scrollable-list">
                    {assignments.map((assignment, index) => (
                      <div key={assignment.id || index} className="list-item">
                        <h3 className="item-title">{assignment.title}</h3>
                        <p className="item-subtitle">Son Tarih: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}</p>
                        <span className={`status-badge ${assignment.submitted ? 'success' : 'danger'}`}>{assignment.submitted ? 'Teslim Edildi' : 'Bekliyor'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <div className="icon-container violet"><Users className="w-6 h-6 text-white" /></div>
                <h2 className="card-title">Kulüplerim</h2>
                <span className="count-badge violet">{clubs.length}</span>
              </div>
              <div className="card-content">
                {loading.clubs ? <CardLoader /> :
                 errors.clubs ? <ErrorState message={errors.clubs} /> :
                 clubs.length === 0 ? <EmptyState message="Üye olduğunuz kulüp yok" /> : (
                  <div className="scrollable-list">
                    {clubs.map((club, index) => {
                      const clubData = club.club || club;
                      const advisorName = clubData.advisorName || club.advisorName;
                      const memberCount = clubData.memberCount || club.memberCount;
                      
                      return (
                        <div key={clubData.id || index} className="list-item">
                          <h3 className="item-title">{clubData.name || club.clubName}</h3>
                          <p className="item-subtitle">{clubData.description || ''}</p>
                          {advisorName && (
                            <p className="item-subtitle text-xs mt-1" style={{color: '#a5b4fc'}}>
                              👨‍🏫 Danışman: {advisorName}
                            </p>
                          )}
                          {memberCount !== undefined && (
                            <span className="status-badge success text-xs mt-1">
                              👥 {memberCount} üye
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <div className="icon-container teal"><Calendar className="w-6 h-6 text-white" /></div>
                <h2 className="card-title">Etkinliklerim</h2>
                <span className="count-badge teal">{events.length}</span>
              </div>
              <div className="card-content">
                {loading.events ? <CardLoader /> :
                 errors.events ? <ErrorState message={errors.events} /> :
                 events.length === 0 ? <EmptyState message="Kayıtlı etkinlik yok" /> : (
                  <div className="scrollable-list">
                    {events.map((event, index) => {
                      const eventData = event.event || event;
                      const eventDate = eventData.eventTime || eventData.eventDate || eventData.date;
                      let formattedDate = 'Tarih belirtilmemiş';
                      let eventStatus = 'upcoming';
                      
                      if (eventDate) {
                        try {
                          const dateObj = new Date(eventDate);
                          if (!isNaN(dateObj.getTime())) {
                            formattedDate = dateObj.toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                            
                            const now = new Date();
                            eventStatus = dateObj < now ? 'past' : 'upcoming';
                          }
                        } catch (e) {
                          console.error('Tarih parse hatası:', e);
                        }
                      }

                      return (
                        <div key={eventData.id || index} className="list-item">
                          <h3 className="item-title">{eventData.title || eventData.name}</h3>
                          <p className="item-subtitle">{formattedDate}</p>
                          <span className={`status-badge ${eventStatus === 'upcoming' ? 'success' : 'warning'}`}>
                            {eventStatus === 'upcoming' ? 'Yaklaşan' : 'Geçmiş'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreateEventModal && (
        <div className="modal-overlay" onClick={() => setShowCreateEventModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Yeni Etkinlik Oluştur</h2>
              <button className="modal-close" onClick={() => setShowCreateEventModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateEvent} className="modal-body">
              {errors.createEvent && <div className="error-message">{errors.createEvent}</div>}
              <div className="form-group">
                <label className="form-label">Etkinlik Başlığı</label>
                <input type="text" className="form-input" value={eventForm.title} onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Açıklama</label>
                <textarea className="form-textarea" value={eventForm.description} onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Tarih ve Saat</label>
                <input type="datetime-local" className="form-input" value={eventForm.eventTime} onChange={(e) => setEventForm(prev => ({ ...prev, eventTime: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Konum</label>
                <input type="text" className="form-input" value={eventForm.location} onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Etkinlik Afişi <span className="text-red-500">*</span></label>
                <input 
                  type="file" 
                  className="form-input" 
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handlePosterChange}
                  required 
                />
                <p className="text-xs text-gray-500 mt-1">JPG veya PNG formatında, maksimum 5MB</p>
                {posterPreview && (
                  <div className="mt-3 relative">
                    <img 
                      src={posterPreview} 
                      alt="Afiş önizleme" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePoster}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateEventModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary" disabled={loading.creatingEvent}>
                  {loading.creatingEvent ? <><Loader2 className="w-4 h-4 animate-spin" /> Oluşturuluyor...</> : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">QR Kod Doğrula</h2>
              <button className="modal-close" onClick={() => setShowQrModal(false)}>×</button>
            </div>
            <form onSubmit={handleVerifyQr} className="modal-body">
              {errors.verifyQr && <div className="error-message">{errors.verifyQr}</div>}
              <div className="form-group">
                <label className="form-label">QR Kod</label>
                <input type="text" className="form-input" value={qrCode} onChange={(e) => setQrCode(e.target.value)} placeholder="QR kodu girin veya okutun" required />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQrModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary" disabled={loading.verifyingQr}>
                  {loading.verifyingQr ? <><Loader2 className="w-4 h-4 animate-spin" /> Doğrulanıyor...</> : 'Doğrula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubOfficialDashboard;
