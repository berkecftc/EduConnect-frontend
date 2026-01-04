import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { getMyManagedClubs, getClubBoardMembers, getMyMemberships } from '../../api/clubService';
import { getMyEvents, getEventRegistrations, createEvent, verifyQrCode, getMyRegistrations } from '../../api/eventService';
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
  FileText
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
  
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
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
  }, []);

  useEffect(() => {
    if (selectedClubId) {
      fetchBoardMembers(selectedClubId);
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
      setCourses(response || []);
    } catch (error) {
      setErrors(prev => ({ ...prev, courses: 'Kurslar yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await getMyAssignments();
      setAssignments(response || []);
    } catch (error) {
      setErrors(prev => ({ ...prev, assignments: 'Ödevler yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, assignments: false }));
    }
  };

  const fetchClubs = async () => {
    try {
      const response = await getMyMemberships();
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
                      return (
                        <div key={clubId || index} onClick={() => setSelectedClubId(clubId)} className={`list-item ${selectedClubId === clubId ? 'selected' : ''}`}>
                          <h3 className="item-title">{clubName}</h3>
                          <p className="item-subtitle">{clubDesc}</p>
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
                    {myEvents.map((event, index) => (
                      <div key={event.id || index} onClick={() => setSelectedEventId(event.id)} className={`list-item ${selectedEventId === event.id ? 'selected cyan' : ''}`}>
                        <h3 className="item-title">{event.title || event.name}</h3>
                        <p className="item-subtitle">{new Date(event.eventDate || event.date).toLocaleDateString('tr-TR')}</p>
                        <p className="item-subtitle">{event.location}</p>
                      </div>
                    ))}
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
                      return (
                        <div key={clubData.id || index} className="list-item">
                          <h3 className="item-title">{clubData.name || club.clubName}</h3>
                          <p className="item-subtitle">{clubData.description || ''}</p>
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
                      return (
                        <div key={eventData.id || index} className="list-item">
                          <h3 className="item-title">{eventData.title || eventData.name}</h3>
                          <p className="item-subtitle">{new Date(eventData.eventDate || eventData.date).toLocaleDateString('tr-TR')}</p>
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
