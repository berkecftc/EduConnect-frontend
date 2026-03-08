import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';
import { getMyCourses, getAllCourses, applyToCourse, getMyApplications, getAnnouncements, downloadCourseFile } from '../../api/courseService';
import { getMyAssignments, downloadAssignmentFile } from '../../api/assignmentService';
import { getMyMemberships, getMyMembershipRequests, cancelMembershipRequest } from '../../api/clubService';
import { getMyRegistrations, getMyParticipationRequests, sendParticipationRequest, getClubEvents } from '../../api/eventService';
import {
  BookOpen, ClipboardList, Users, Calendar, LogOut, Loader2, Send, X, Check,
  CalendarPlus, Image, Bell, FileDown, Megaphone, User, Menu, Moon, Sun, ChevronRight
} from 'lucide-react';

function StudentDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, role, email, studentNumber, department } = useSelector((state) => state.auth);
  const { isDarkMode, toggleTheme } = useTheme();

  // Sidebar State
  const [activeTab, setActiveTab] = useState('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data States
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [membershipRequests, setMembershipRequests] = useState([]);
  const [participationRequests, setParticipationRequests] = useState([]);
  const [clubEvents, setClubEvents] = useState([]);

  const [loading, setLoading] = useState({
    courses: true,
    assignments: true,
    clubs: true,
    events: true,
    membershipRequests: true,
    participationRequests: true,
    clubEvents: true,
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchAssignments();
    fetchClubs();
    fetchEvents();
    fetchMembershipRequests();
    fetchParticipationRequests();
  }, []);

  useEffect(() => {
    if (!loading.clubs && clubs.length > 0) {
      fetchClubEvents();
    } else if (!loading.clubs) {
      setLoading(prev => ({ ...prev, clubEvents: false }));
    }
  }, [clubs, loading.clubs]);

  // Data Fetching Logic (Same as before)
  const fetchCourses = async () => {
    try {
      const data = await getMyCourses();
      setCourses(data);
      filterAssignmentsByCourses(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, courses: 'Kurslar yüklenemedi' }));
    } finally { setLoading(prev => ({ ...prev, courses: false })); }
  };

  const fetchAssignments = async () => {
    try {
      const data = await getMyAssignments();
      setAllAssignments(data);
      if (courses.length > 0) filterAssignmentsByCourses(courses, data);
    } catch (error) {
      setErrors(prev => ({ ...prev, assignments: 'Ödevler yüklenemedi' }));
    } finally { setLoading(prev => ({ ...prev, assignments: false })); }
  };

  const filterAssignmentsByCourses = (coursesData = courses, assignmentsData = allAssignments) => {
    if (!coursesData.length || !assignmentsData.length) return;
    const enrolledCourseIds = coursesData.map(c => c.id || c.courseId || c.course?.id).filter(Boolean);
    setAssignments(assignmentsData.filter(a => enrolledCourseIds.includes(a.courseId || a.course?.id)));
  };

  const fetchClubs = async () => {
    try {
      const data = await getMyMemberships();
      setClubs(data || []);
    } catch (error) {
      setErrors(prev => ({ ...prev, clubs: 'Kulüpler yüklenemedi' }));
    } finally { setLoading(prev => ({ ...prev, clubs: false })); }
  };

  const fetchEvents = async () => {
    try {
      const data = await getMyRegistrations();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrors(prev => ({ ...prev, events: 'Etkinlikler yüklenemedi' }));
      setEvents([]);
    } finally { setLoading(prev => ({ ...prev, events: false })); }
  };

  const fetchMembershipRequests = async () => {
    try {
      const data = await getMyMembershipRequests();
      setMembershipRequests(data || []);
    } catch (error) {
      setErrors(prev => ({ ...prev, membershipRequests: 'İstekler yüklenemedi' }));
    } finally { setLoading(prev => ({ ...prev, membershipRequests: false })); }
  };

  const fetchParticipationRequests = async () => {
    try {
      const data = await getMyParticipationRequests();
      const reqs = Array.isArray(data) ? data : [];
      setParticipationRequests(reqs);

      if (clubs.length > 0) {
        const myClubIds = clubs.map(membership => membership.club?.id || membership.clubId);
        setClubEvents(reqs.filter(req => myClubIds.includes(req.event?.clubId || req.clubId)));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, participationRequests: 'İstekler yüklenemedi' }));
    } finally { setLoading(prev => ({ ...prev, participationRequests: false })); }
  };

  const fetchClubEvents = async () => {
    if (clubs.length === 0) return setLoading(prev => ({ ...prev, clubEvents: false }));
    try {
      const promises = clubs.map(async (membership) => {
        const clubId = membership.club?.id || membership.clubId;
        if (!clubId) return [];
        try {
          const events = await getClubEvents(clubId);
          return events.map(e => ({ ...e, clubName: membership.club?.name || membership.clubName, clubId }));
        } catch { return []; }
      });
      const allEvents = (await Promise.all(promises)).flat();
      const requestedIds = participationRequests.map(r => r.event?.id || r.eventId);
      const registeredIds = events.map(e => e.event?.id || e.eventId || e.id);
      const excludedIds = [...requestedIds, ...registeredIds];
      setClubEvents(allEvents.filter(e => !excludedIds.includes(e.id)));
    } catch (error) {
      setErrors(prev => ({ ...prev, clubEvents: 'Etkinlikler yüklenemedi' }));
    } finally { setLoading(prev => ({ ...prev, clubEvents: false })); }
  };

  const handleSendParticipationRequest = async (eventId) => {
    try {
      await sendParticipationRequest(eventId);
      showSuccess('Katılım isteği başarıyla gönderildi');
      await fetchParticipationRequests();
      setClubEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      alert('Hata: ' + (error.response?.data?.message || 'İstek gönderilemedi'));
    }
  };

  const handleCancelRequest = async (clubId) => {
    try {
      await cancelMembershipRequest(clubId);
      showSuccess('Üyelik isteği iptal edildi');
      fetchMembershipRequests();
    } catch (error) {
      alert('İptal edilemedi');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // UI Components
  const CardLoader = () => (
    <div className="flex justify-center py-8">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );

  const EmptyState = ({ message, icon: Icon = BookOpen }) => (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
      <Icon className="w-12 h-12 mb-4 opacity-50" />
      <p>{message}</p>
    </div>
  );

  // Layout Configuration
  const menuItems = [
    { id: 'profile', label: 'Profil Karşılama', icon: User },
    { id: 'courses', label: 'Kurslarım', icon: BookOpen, count: courses.length },
    { id: 'assignments', label: 'Ödevlerim', icon: ClipboardList, count: assignments.length },
    { id: 'clubs', label: 'Kulüplerim', icon: Users, count: clubs.length },
    { id: 'events', label: 'Etkinliklerim', icon: Calendar, count: events.length },
    { id: 'clubEvents', label: 'Kulüp Etkinlikleri', icon: CalendarPlus, count: clubEvents.length },
    { id: 'requests', label: 'Üyelik İsteklerim', icon: Send, count: membershipRequests.length },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col md:flex-row">

      {/* Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 shadow-lg animate-in slide-in-from-top-2">
          <Check className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Top Mobile Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 relative">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-bold text-lg text-blue-600 dark:text-blue-400">EduConnect</span>
        <button onClick={toggleTheme} className="p-2 text-slate-600 dark:text-slate-300">
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
        flex flex-col z-50 transition-transform duration-300 ease-in-out transform 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 hidden md:flex items-center justify-between">
          <span className="font-bold text-xl text-blue-600 dark:text-blue-400">EduConnect</span>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Öğrenci Paneli
          </div>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${activeTab === item.id
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === item.id ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {activeTab === 'profile' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Öğrenci Profili</h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm max-w-2xl">
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center border-b border-slate-100 dark:border-slate-800 pb-8 mb-8">
                <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl font-bold">
                  {user?.[0]?.toUpperCase() || 'Ö'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user}</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">{email || 'ogrenci@university.edu'}</p>
                  <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full mt-3">
                    Öğrenci
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Öğrenci Numarası</p>
                  <p className="font-medium text-slate-900 dark:text-slate-200">{studentNumber || '2023001234'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Bölüm / Departman</p>
                  <p className="font-medium text-slate-900 dark:text-slate-200">{department || 'Bilgisayar Mühendisliği'}</p>
                </div>
                <div className="col-span-1 md:col-span-2 mt-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Hızlı İşlemler</p>
                  <div className="flex gap-3">
                    <button onClick={() => navigate('/clubs')} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      Tüm Kulüpleri Keşfet
                    </button>
                    <button onClick={() => navigate('/posts')} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      Öğrenci Forumu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Kayıtlı Kurslarım</h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {loading.courses ? <CardLoader /> :
                courses.length === 0 ? <EmptyState message="Henüz kayıtlı kursunuz yok" icon={BookOpen} /> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {courses.map((course, i) => (
                      <div key={course.id || i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center group cursor-pointer">
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-slate-200">{course.name || course.title}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{course.instructor || course.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Ödevlerim</h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {loading.assignments ? <CardLoader /> :
                assignments.length === 0 ? <EmptyState message="Aktif ödev bulunmuyor" icon={ClipboardList} /> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {assignments.map((assignment, i) => (
                      <div key={assignment.id || i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-slate-200">{assignment.title}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Son Teslim: {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${assignment.submitted
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                          }`}>
                          {assignment.submitted ? 'Teslim Edildi' : 'Bekliyor'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'clubs' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Kulüplerim</h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {loading.clubs ? <CardLoader /> :
                clubs.length === 0 ? <EmptyState message="Herhangi bir kulübe üye değilsiniz" icon={Users} /> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {clubs.map((membership, i) => (
                      <div key={membership.id || i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-4">
                        {membership.club?.logoUrl || membership.logoUrl ? (
                          <img src={membership.club?.logoUrl || membership.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><Users className="w-6 h-6" /></div>
                        )}
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-slate-200">{membership.club?.name || membership.clubName || 'Kulüp'}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{membership.club?.description || 'Açıklama yok'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Kayıtlı Etkinliklerim</h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {loading.events ? <CardLoader /> :
                events.length === 0 ? <EmptyState message="Kayıtlı etkinlik yok" icon={Calendar} /> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {events.map((event, i) => {
                      const evt = event.event || event;
                      const date = new Date(evt.eventTime || evt.eventDate);
                      return (
                        <div key={event.id || i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-medium text-slate-900 dark:text-slate-200">{evt.title || evt.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              📅 {date.toLocaleDateString('tr-TR')} 📍 {evt.location || 'Konum belirtilmedi'}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'clubEvents' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Açık Kulüp Etkinlikleri</h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {loading.clubEvents ? <CardLoader /> :
                clubEvents.length === 0 ? <EmptyState message="Şu an açık kulüp etkinliği yok" icon={CalendarPlus} /> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {clubEvents.map((event, i) => (
                      <div key={event.id || i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-slate-200">{event.title || event.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            🏫 {event.clubName} • 📅 {new Date(event.eventTime || event.eventDate).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleSendParticipationRequest(event.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Katılmak İstiyorum
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Üyelik İsteklerim</h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {loading.membershipRequests ? <CardLoader /> :
                membershipRequests.length === 0 ? <EmptyState message="Bekleyen isteğiniz bulunmuyor" icon={Send} /> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {membershipRequests.map((req, i) => (
                      <div key={req.id || i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-slate-200">{req.clubName || req.club?.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Gönderim: {new Date(req.requestDate || req.createdAt).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50`}>
                            Bekliyor
                          </span>
                          <button onClick={() => handleCancelRequest(req.clubId || req.club?.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors" title="İptal Et">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default StudentDashboard;
