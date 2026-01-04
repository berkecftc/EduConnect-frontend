import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { getMyCourses } from '../../api/courseService';
import { getMyAssignments } from '../../api/assignmentService';
import { getMyMemberships, getMyMembershipRequests, cancelMembershipRequest } from '../../api/clubService';
import { getMyRegistrations, getMyParticipationRequests, sendParticipationRequest, getClubEvents } from '../../api/eventService';
import { BookOpen, ClipboardList, Users, Calendar, LogOut, Loader2, Send, X, Check, UserCheck, CalendarPlus } from 'lucide-react';

function StudentDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]); // Tüm ödevler
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [membershipRequests, setMembershipRequests] = useState([]);
  const [participationRequests, setParticipationRequests] = useState([]);
  const [clubEvents, setClubEvents] = useState([]); // Kulüp etkinlikleri
  
  const [loading, setLoading] = useState({
    courses: true,
    assignments: true,
    clubs: true,
    events: true,
    membershipRequests: true,
    participationRequests: true,
    clubEvents: true,
  });
  
  const [errors, setErrors] = useState({
    courses: null,
    assignments: null,
    clubs: null,
    events: null,
    membershipRequests: null,
    participationRequests: null,
    clubEvents: null,
  });

  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchAssignments();
    fetchClubs();
    fetchEvents();
    fetchMembershipRequests();
    fetchParticipationRequests();
  }, []);

  // Kulüpler yüklendikten sonra etkinlikleri getir
  useEffect(() => {
    if (clubs.length > 0) {
      fetchClubEvents();
    }
  }, [clubs]);

  const fetchCourses = async () => {
    try {
      const data = await getMyCourses();
      console.log('Kayıtlı derslerim:', data);
      setCourses(data);
      // Dersler yüklendikten sonra ödevleri filtrele
      filterAssignmentsByCourses(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, courses: 'Kurslar yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  };

  const fetchAssignments = async () => {
    try {
      const data = await getMyAssignments();
      console.log('Tüm ödevler:', data);
      setAllAssignments(data);
      // Dersler yüklendiyse ödevleri filtrele
      if (courses.length > 0) {
        filterAssignmentsByCourses(courses, data);
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

    console.log('Kayıtlı ders IDleri:', enrolledCourseIds);

    // Sadece kayıtlı olunan derslerin ödevlerini filtrele
    const filteredAssignments = assignmentsData.filter(assignment => {
      const assignmentCourseId = assignment.courseId || assignment.course?.id;
      const isEnrolled = enrolledCourseIds.includes(assignmentCourseId);
      
      if (!isEnrolled) {
        console.log('Filtrelenen ödev:', assignment.title, 'Ders ID:', assignmentCourseId);
      }
      
      return isEnrolled;
    });

    console.log('Filtrelenmiş ödevler:', filteredAssignments);
    setAssignments(filteredAssignments);
  };

  const fetchClubs = async () => {
    try {
      const data = await getMyMemberships();
      console.log('Kulüplerim verisi:', data);
      if (data && data.length > 0) {
        console.log('İlk kulüp membership örneği:', data[0]);
      }
      setClubs(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, clubs: 'Kulüpler yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, clubs: false }));
    }
  };

  const fetchEvents = async () => {
    try {
      const data = await getMyRegistrations();
      console.log('Kayıtlı etkinliklerim:', data);
      console.log('Etkinlik sayısı:', Array.isArray(data) ? data.length : 0);
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Etkinlikler yüklenirken hata:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Etkinlikler yüklenemedi';
      console.error('Hata mesajı:', errorMessage);
      setErrors(prev => ({ ...prev, events: errorMessage }));
      setEvents([]); // Hata durumunda boş dizi set et
    } finally {
      setLoading(prev => ({ ...prev, events: false }));
    }
  };

  const fetchMembershipRequests = async () => {
    try {
      const data = await getMyMembershipRequests();
      setMembershipRequests(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, membershipRequests: 'Üyelik istekleri yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, membershipRequests: false }));
    }
  };

  const fetchParticipationRequests = async () => {
    try {
      const data = await getMyParticipationRequests();
      console.log('Katılım isteklerim (raw):', data);
      console.log('İlk istek örneği:', data?.[0]);
      if (data?.[0]) {
        console.log('İlk istek event bilgisi:', data[0].event);
      }
      setParticipationRequests(Array.isArray(data) ? data : []);
      
      // Kulüp etkinliklerini ayır (üye olduğum kulüplerin etkinlikleri)
      if (clubs.length > 0) {
        const myClubIds = clubs.map(membership => membership.club?.id || membership.clubId);
        const myClubEvents = data.filter(request => {
          const eventClubId = request.event?.clubId || request.clubId;
          return myClubIds.includes(eventClubId);
        });
        setClubEvents(myClubEvents);
      }
    } catch (error) {
      console.error('Katılım istekleri yüklenirken hata:', error);
      setErrors(prev => ({ ...prev, participationRequests: 'Katılım istekleri yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, participationRequests: false }));
    }
  };

  const handleSendParticipationRequest = async (eventId) => {
    try {
      console.log('Katılım isteği gönderiliyor, eventId:', eventId);
      await sendParticipationRequest(eventId);
      setSuccessMessage('Katılım isteği başarıyla gönderildi');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Önce katılım isteklerini güncelle, sonra etkinlikleri yenile
      await fetchParticipationRequests();
      
      // Etkinliği manuel olarak listeden kaldır (state güncelleme beklemeden)
      setClubEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Katılım isteği gönderilirken hata:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'Katılım isteği gönderilemedi';
      console.error('Hata mesajı:', errorMessage);
      setErrors(prev => ({ 
        ...prev, 
        participationRequests: errorMessage
      }));
      setTimeout(() => setErrors(prev => ({ ...prev, participationRequests: null })), 5000);
    }
  };

  const fetchClubEvents = async () => {
    if (clubs.length === 0) {
      setLoading(prev => ({ ...prev, clubEvents: false }));
      return;
    }

    try {
      // Her kulüp için etkinlikleri getir
      const clubEventPromises = clubs.map(async (membership) => {
        const clubId = membership.club?.id || membership.clubId;
        if (!clubId) return [];
        
        try {
          const events = await getClubEvents(clubId);
          return events.map(event => ({
            ...event,
            clubName: membership.club?.name || membership.clubName,
            clubId: clubId
          }));
        } catch (error) {
          console.error(`Kulüp ${clubId} etkinlikleri getirilemedi:`, error);
          return [];
        }
      });

      const allClubEventsArrays = await Promise.all(clubEventPromises);
      const allClubEvents = allClubEventsArrays.flat();
      
      console.log('Tüm kulüp etkinlikleri:', allClubEvents);
      
      // Zaten katılım isteği gönderilen veya kayıtlı olunan etkinlikleri filtrele
      const requestedEventIds = participationRequests.map(req => req.event?.id || req.eventId);
      const registeredEventIds = events.map(ev => ev.event?.id || ev.eventId || ev.id);
      const excludedEventIds = [...requestedEventIds, ...registeredEventIds];
      
      const availableEvents = allClubEvents.filter(event => !excludedEventIds.includes(event.id));
      
      console.log('Katılım isteği gönderilebilir etkinlikler:', availableEvents);
      setClubEvents(availableEvents);
    } catch (error) {
      console.error('Kulüp etkinlikleri yüklenirken hata:', error);
      setErrors(prev => ({ 
        ...prev, 
        clubEvents: error.response?.data?.message || 'Kulüp etkinlikleri yüklenemedi' 
      }));
    } finally {
      setLoading(prev => ({ ...prev, clubEvents: false }));
    }
  };

  const handleCancelRequest = async (clubId) => {
    try {
      await cancelMembershipRequest(clubId);
      setSuccessMessage('Üyelik isteği başarıyla iptal edildi');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchMembershipRequests();
    } catch (error) {
      setErrors(prev => ({ ...prev, membershipRequests: error.response?.data?.message || 'İstek iptal edilemedi' }));
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const CardLoader = () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );

  const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
      <div className="w-16 h-16 mb-3 rounded-full bg-white/10 flex items-center justify-center">
        <span className="text-2xl">📭</span>
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );

  const ErrorState = ({ message }) => (
    <div className="flex items-center justify-center py-8 text-red-400">
      <p className="text-sm">{message}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 backdrop-blur-xl shadow-lg">
          <Check className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}
      
      <div className="relative z-10 p-4 md:p-8">
        <header className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Öğrenci Paneli
              </h1>
              <p className="text-purple-200/70 mt-1">Hoş geldin, {user}</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/clubs')}
                className="group flex items-center gap-2 px-5 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl text-indigo-300 transition-all duration-300 hover:scale-105"
              >
                <Users className="w-4 h-4" />
                <span>Tüm Kulüpler</span>
              </button>
              <button 
                onClick={handleLogout} 
                className="group flex items-center gap-2 px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-300 transition-all duration-300 hover:scale-105"
              >
                <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-500 hover:bg-white/15 hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Kurslarım</h2>
              <span className="ml-auto px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium">
                {courses.length}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loading.courses ? <CardLoader /> : 
               errors.courses ? <ErrorState message={errors.courses} /> :
               courses.length === 0 ? <EmptyState message="Henüz kayıtlı kurs yok" /> : (
                <div className="space-y-3">
                  {courses.map((course, index) => (
                    <div 
                      key={course.id || index}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:translate-x-1"
                    >
                      <h3 className="font-medium text-white">{course.name || course.title}</h3>
                      <p className="text-sm text-purple-200/60 mt-1">{course.instructor || course.description}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs">Aktif</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-500 hover:bg-white/15 hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-linear-to-br from-orange-500 to-pink-600 shadow-lg shadow-orange-500/30">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Ödevlerim</h2>
              <span className="ml-auto px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-sm font-medium">
                {assignments.length}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loading.assignments ? <CardLoader /> :
               errors.assignments ? <ErrorState message={errors.assignments} /> :
               assignments.length === 0 ? <EmptyState message="Henüz ödev yok" /> : (
                <div className="space-y-3">
                  {assignments.map((assignment, index) => (
                    <div 
                      key={assignment.id || index}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:translate-x-1"
                    >
                      <h3 className="font-medium text-white">{assignment.title}</h3>
                      <p className="text-sm text-purple-200/60 mt-1">Son Tarih: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}</p>
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded-md text-xs ${assignment.submitted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {assignment.submitted ? 'Teslim Edildi' : 'Bekliyor'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-500 hover:bg-white/15 hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Kulüplerim</h2>
              <span className="ml-auto px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-sm font-medium">
                {clubs.length}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loading.clubs ? <CardLoader /> :
               errors.clubs ? <ErrorState message={errors.clubs} /> :
               clubs.length === 0 ? <EmptyState message="Henüz üye olunan kulüp yok" /> : (
                <div className="space-y-3">
                  {clubs.map((membership, index) => (
                    <div 
                      key={membership.id || membership.club?.id || index}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:translate-x-1 flex items-center gap-4"
                    >
                      {(membership.club?.logoUrl || membership.logoUrl || membership.logo) && (
                        <img 
                          src={membership.club?.logoUrl || membership.logoUrl || membership.logo} 
                          alt={membership.club?.name || membership.clubName || membership.name}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-white/20"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{membership.club?.name || membership.clubName || membership.name || 'İsimsiz Kulüp'}</h3>
                        <p className="text-sm text-purple-200/60 mt-1">{membership.club?.description || membership.clubDescription || membership.description || ''}</p>
                        {(membership.club?.advisorName || membership.advisorName) && (
                          <p className="text-xs text-indigo-300/80 mt-1">
                            👨‍🏫 Danışman: {membership.club?.advisorName || membership.advisorName}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-xs">Üye</span>
                          {(membership.club?.memberCount !== undefined || membership.memberCount !== undefined) && (
                            <span className="text-xs text-purple-200/60">
                              👥 {membership.club?.memberCount || membership.memberCount || 0} üye
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-500 hover:bg-white/15 hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-linear-to-br from-rose-500 to-purple-600 shadow-lg shadow-rose-500/30">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Etkinliklerim</h2>
              <span className="ml-auto px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-sm font-medium">
                {events.length}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loading.events ? <CardLoader /> :
               errors.events ? <ErrorState message={errors.events} /> :
               events.length === 0 ? <EmptyState message="Henüz kayıtlı etkinlik yok" /> : (
                <div className="space-y-3">
                  {events.map((event, index) => {
                    // Tarih formatı düzeltmesi
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
                      <div 
                        key={event.id || index}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer hover:translate-x-1"
                      >
                        <h3 className="font-medium text-white">{eventData.title || eventData.name}</h3>
                        <p className="text-sm text-purple-200/60 mt-1">{formattedDate}</p>
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded-md text-xs ${
                          eventStatus === 'upcoming' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {eventStatus === 'upcoming' ? '🟢 Yaklaşan' : '⏰ Geçmiş'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-500 hover:bg-white/15 hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
                <Send className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Üyelik İsteklerim</h2>
              <span className="ml-auto px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm font-medium">
                {membershipRequests.length}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loading.membershipRequests ? <CardLoader /> :
               errors.membershipRequests ? <ErrorState message={errors.membershipRequests} /> :
               membershipRequests.length === 0 ? <EmptyState message="Bekleyen üyelik isteği yok" /> : (
                <div className="space-y-3">
                  {membershipRequests.map((request, index) => (
                    <div 
                      key={request.id || index}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{request.clubName || request.club?.name || 'Kulüp'}</h3>
                          <p className="text-sm text-purple-200/60 mt-1">
                            {new Date(request.requestDate || request.createdAt).toLocaleDateString('tr-TR')}
                          </p>
                          <span className={`inline-block mt-2 px-2 py-0.5 rounded-md text-xs ${
                            request.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300' :
                            request.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {request.status === 'PENDING' ? 'Bekliyor' :
                             request.status === 'APPROVED' ? 'Onaylandı' : 'Reddedildi'}
                          </span>
                        </div>
                        {request.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancelRequest(request.clubId || request.club?.id)}
                            className="ml-2 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 transition-all duration-300"
                            title="İsteği İptal Et"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-500 hover:bg-white/15 hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
                <CalendarPlus className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Kulüp Etkinlikleri</h2>
              <span className="ml-auto px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-sm font-medium">
                {clubEvents.length}
              </span>
            </div>
            
            {errors.participationRequests && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                ⚠️ {errors.participationRequests}
              </div>
            )}
            
            <div className="max-h-64 overflow-y-auto">
              {loading.clubEvents ? <CardLoader /> :
               errors.clubEvents ? <ErrorState message={errors.clubEvents} /> :
               clubEvents.length === 0 ? <EmptyState message="Kulüp etkinliği bulunamadı" /> : (
                <div className="space-y-3">
                  {clubEvents.map((event, index) => {
                    const eventDate = event.eventTime || event.eventDate;
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

                    // Geçmiş etkinliklere katılım isteği gönderilemez
                    const canRequest = eventStatus === 'upcoming';

                    return (
                      <div 
                        key={event.id || index}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-white">{event.title || event.name}</h3>
                            <p className="text-sm text-purple-200/60 mt-1">
                              🏫 {event.clubName || 'Kulüp'}
                            </p>
                            <p className="text-sm text-purple-200/60 mt-1">
                              📅 {formattedDate}
                            </p>
                            <p className="text-xs text-purple-200/50 mt-1">
                              📍 {event.location || 'Konum belirtilmemiş'}
                            </p>
                            <span className={`inline-block mt-2 px-2 py-0.5 rounded-md text-xs ${
                              eventStatus === 'upcoming' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {eventStatus === 'upcoming' ? '🟢 Yaklaşan' : '⏰ Geçmiş'}
                            </span>
                          </div>
                          {canRequest && (
                            <button
                              onClick={() => handleSendParticipationRequest(event.id)}
                              className="p-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-300 transition-all duration-300 hover:scale-110"
                              title="Katılım İsteği Gönder"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-500 hover:bg-white/15 hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Katılım İsteklerim</h2>
              <span className="ml-auto px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium">
                {participationRequests.length}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {loading.participationRequests ? <CardLoader /> :
               errors.participationRequests ? <ErrorState message={errors.participationRequests} /> :
               participationRequests.length === 0 ? <EmptyState message="Henüz katılım isteği yok" /> : (
                <div className="space-y-3">
                  {participationRequests.map((request, index) => {
                    // Backend'den gelen farklı veri formatlarını destekle
                    const eventData = request.event || request.eventDto || {};
                    
                    // Etkinlik adı - önce request'in kendisine bak, sonra nested event'e
                    const eventTitle = request.eventTitle ||
                                      request.title ||
                                      eventData.title || 
                                      eventData.name || 
                                      eventData.eventTitle ||
                                      eventData.eventName ||
                                      'Etkinlik';
                    
                    // Etkinlik tarihi - önce request'in kendisine bak
                    const eventDate = request.eventTime ||
                                     request.eventDate || 
                                     request.date ||
                                     eventData.eventTime || 
                                     eventData.eventDate || 
                                     eventData.date ||
                                     eventData.time;
                    
                    let formattedDate = 'Tarih belirtilmemiş';
                    
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
                        }
                      } catch (e) {
                        console.error('Tarih parse hatası:', e);
                      }
                    }
                    
                    // Konum bilgisi - önce request'in kendisine bak
                    const location = request.location ||
                                    request.eventLocation ||
                                    eventData.location || 
                                    eventData.venue ||
                                    eventData.place ||
                                    'Konum belirtilmemiş';
                    
                    // Debug log
                    console.log('Katılım isteği detayı:', {
                      request,
                      parsed: { eventTitle, formattedDate, location, eventDate }
                    });

                    return (
                      <div 
                        key={request.id || index}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                      >
                        <h3 className="font-medium text-white">{eventTitle}</h3>
                        <p className="text-sm text-purple-200/60 mt-1">📅 {formattedDate}</p>
                        <p className="text-xs text-purple-200/50 mt-1">
                          📍 {location}
                        </p>
                        {request.studentName && (
                          <p className="text-xs text-indigo-300/70 mt-1">
                            👤 {request.studentName}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-xs ${
                            request.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300' :
                            request.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {request.status === 'PENDING' ? '⏳ Bekliyor' :
                             request.status === 'APPROVED' ? '✅ Onaylandı' : '❌ Reddedildi'}
                          </span>
                          {(request.requestDate || request.createdAt || request.requestedAt) && (
                            <span className="text-xs text-purple-200/50">
                              {new Date(request.requestDate || request.createdAt || request.requestedAt).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
