import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { getMyCourses } from '../../api/courseService';
import { getMyAssignments } from '../../api/assignmentService';
import { getMyMemberships, getMyMembershipRequests, cancelMembershipRequest } from '../../api/clubService';
import { getMyRegistrations } from '../../api/eventService';
import { BookOpen, ClipboardList, Users, Calendar, LogOut, Loader2, Send, X, Check } from 'lucide-react';

function StudentDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [membershipRequests, setMembershipRequests] = useState([]);
  
  const [loading, setLoading] = useState({
    courses: true,
    assignments: true,
    clubs: true,
    events: true,
    membershipRequests: true,
  });
  
  const [errors, setErrors] = useState({
    courses: null,
    assignments: null,
    clubs: null,
    events: null,
    membershipRequests: null,
  });

  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchAssignments();
    fetchClubs();
    fetchEvents();
    fetchMembershipRequests();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await getMyCourses();
      setCourses(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, courses: 'Kurslar yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  };

  const fetchAssignments = async () => {
    try {
      const data = await getMyAssignments();
      setAssignments(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, assignments: 'Ödevler yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, assignments: false }));
    }
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
      setEvents(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, events: 'Etkinlikler yüklenemedi' }));
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
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
