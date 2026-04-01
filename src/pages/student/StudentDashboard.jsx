import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';
import { getMyCourses, getAllCourses, applyToCourse, getMyApplications, getAnnouncements, downloadCourseFile } from '../../api/courseService';
import { getMyAssignments, submitAssignment, downloadAssignmentFile, deleteAssignmentSubmission } from '../../api/assignmentService';
import { getMyMemberships, getMyMembershipRequests, cancelMembershipRequest } from '../../api/clubService';
import { getMyRegistrations, getMyParticipationRequests, sendParticipationRequest, getClubEvents } from '../../api/eventService';
import {
  BookOpen, ClipboardList, Users, Calendar, LogOut, Loader2, Send, X, Check,
  CalendarPlus, Image, Bell, FileDown, Megaphone, User, Menu, Moon, Sun, ChevronRight,
  Upload, AlertCircle, Clock, GraduationCap, Trash2, Search, MessageSquare, Trophy
} from 'lucide-react';
import UserProfileTab from '../../components/profile/UserProfileTab';

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
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [membershipRequests, setMembershipRequests] = useState([]);
  const [participationRequests, setParticipationRequests] = useState([]);
  const [clubEvents, setClubEvents] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [applyingCourse, setApplyingCourse] = useState({});

  const [loading, setLoading] = useState({
    courses: true,
    assignments: true,
    clubs: true,
    events: true,
    membershipRequests: true,
    participationRequests: true,
    clubEvents: true,
    allCourses: false,
    myApplications: false,
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [submitFiles, setSubmitFiles] = useState({});
  const [submitting, setSubmitting] = useState({});

  useEffect(() => {
    fetchCourses();
    fetchAssignments();
    fetchClubs();
    fetchEvents();
    fetchMembershipRequests();
    fetchParticipationRequests();
  }, []);

  useEffect(() => {
    if (activeTab === 'courseApplications') {
      fetchAllCourses();
      fetchMyApplications();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!loading.clubs && clubs.length > 0) {
      fetchClubEvents();
    } else if (!loading.clubs) {
      setLoading(prev => ({ ...prev, clubEvents: false }));
    }
  }, [clubs, loading.clubs]);

  const fetchCourses = async () => {
    try {
      const data = await getMyCourses();
      setCourses(data || []);
    } catch (error) {
      setErrors(prev => ({ ...prev, courses: 'Kurslar yüklenemedi' }));
    } finally { setLoading(prev => ({ ...prev, courses: false })); }
  };

  const fetchAssignments = async () => {
    try {
      const data = await getMyAssignments();
      setAssignments(data || []);
    } catch (error) {
      setErrors(prev => ({ ...prev, assignments: 'Ödevler yüklenemedi' }));
    } finally { setLoading(prev => ({ ...prev, assignments: false })); }
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

  const handleSubmitAssignment = async (assignmentId) => {
    const file = submitFiles[assignmentId];
    if (!file) { alert('Lütfen bir dosya seçin'); return; }
    setSubmitting(prev => ({ ...prev, [assignmentId]: true }));
    try {
      await submitAssignment(assignmentId, file);
      showSuccess('Ödev başarıyla teslim edildi');
      setSubmitFiles(prev => ({ ...prev, [assignmentId]: null, [assignmentId + '_editing']: false }));
      fetchAssignments();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data || 'Ödev teslim edilemedi';
      alert(typeof msg === 'string' ? msg : 'Ödev teslim edilemedi');
    } finally {
      setSubmitting(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const handleDeleteSubmission = async (assignmentId) => {
    if (!window.confirm('Ödev teslimini silmek istediğinize emin misiniz?')) return;
    setSubmitting(prev => ({ ...prev, [assignmentId]: true }));
    try {
      await deleteAssignmentSubmission(assignmentId);
      showSuccess('Ödev teslimi başarıyla silindi');
      fetchAssignments();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data || 'Ödev teslimi silinemedi';
      alert(typeof msg === 'string' ? msg : 'Ödev teslimi silinemedi');
    } finally {
      setSubmitting(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const handleDownloadFile = async (fileUrl, fileName) => {
    try {
      const response = await downloadAssignmentFile(fileUrl);

      let finalName = fileName || 'dosya';
      if (!finalName.includes('.') && fileUrl) {
         const originalName = fileUrl.split('?')[0].split('/').pop();
         const extIndex = originalName.lastIndexOf('.');
         if (extIndex !== -1) {
            finalName += originalName.substring(extIndex); // örneğin: ".docx"
         }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', finalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      if (e?.response?.status === 404) {
        alert('Dosya bulunamadı');
      } else {
        alert('Dosya indirilemedi');
      }
    }
  };

  // Course Application Functions
  const fetchAllCourses = async () => {
    setLoading(prev => ({ ...prev, allCourses: true }));
    try { setAllCourses((await getAllCourses()) || []); }
    catch { setAllCourses([]); }
    finally { setLoading(prev => ({ ...prev, allCourses: false })); }
  };

  const fetchMyApplications = async () => {
    setLoading(prev => ({ ...prev, myApplications: true }));
    try { setMyApplications((await getMyApplications()) || []); }
    catch { setMyApplications([]); }
    finally { setLoading(prev => ({ ...prev, myApplications: false })); }
  };

  const handleApplyToCourse = async (courseId) => {
    setApplyingCourse(prev => ({ ...prev, [courseId]: true }));
    try {
      await applyToCourse(courseId);
      showSuccess('Ders başvurusu gönderildi!');
      fetchMyApplications();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data || 'Başvuru yapılamadı';
      alert(typeof msg === 'string' ? msg : 'Başvuru yapılamadı');
    } finally {
      setApplyingCourse(prev => ({ ...prev, [courseId]: false }));
    }
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

  // Assignments Filter
  const validAssignments = assignments.filter(a => {
    if (a.courseId) return courses.some(c => (c.id || c.courseId) === a.courseId);
    if (a.courseName) return courses.some(c => (c.name || c.title) === a.courseName);
    return true;
  });

  // Membership Requests Filter
  const validMembershipRequests = membershipRequests.filter(req => {
    const reqClubId = req.clubId || req.club?.id;
    return !clubs.some(c => (c.club?.id || c.clubId) === reqClubId);
  });

  // Club Events Filter (Only upcoming events)
  const validClubEvents = clubEvents.filter(e => {
    const eventDate = new Date(e.eventTime || e.eventDate);
    return eventDate >= new Date();
  });

  // Layout Configuration
  const menuItems = [
    { id: 'profile', label: 'Profil Karşılama', icon: User },
    { id: 'all_clubs', label: 'Tüm Kulüpler', icon: Search, path: '/clubs' },
    { id: 'posts', label: 'Öğrenci Forumu (Blog)', icon: MessageSquare, path: '/posts' },
    { id: 'leaderboard', label: 'Liderlik Tablosu', icon: Trophy, path: '/leaderboard' },
    { id: 'courses', label: 'Kurslarım', icon: BookOpen, count: courses.length },
    { id: 'courseApplications', label: 'Ders Başvurusu', icon: GraduationCap },
    { id: 'assignments', label: 'Ödevlerim', icon: ClipboardList, count: validAssignments.length },
    { id: 'clubs', label: 'Kulüplerim', icon: Users, count: clubs.length },
    { id: 'events', label: 'Etkinliklerim', icon: Calendar, count: events.length },
    { id: 'clubEvents', label: 'Kulüp Etkinlikleri', icon: CalendarPlus, count: validClubEvents.length },
    { id: 'requests', label: 'Üyelik İsteklerim', icon: Send, count: validMembershipRequests.length },
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
              onClick={() => { 
                if (item.path) {
                  navigate(item.path);
                } else {
                  setActiveTab(item.id); 
                  setIsMobileMenuOpen(false); 
                }
              }}
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
          <UserProfileTab />
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

        {activeTab === 'courseApplications' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Ders Başvurusu</h1>

            {/* Tüm Dersler */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-500" /> Mevcut Dersler
                </h2>
              </div>
              {loading.allCourses ? <CardLoader /> :
                allCourses.length === 0 ? <EmptyState message="Mevcut ders bulunamadı" icon={BookOpen} /> : (() => {
                  const enrolledIds = courses.map(c => c.id || c.courseId).filter(Boolean);
                  const appliedIds = myApplications.map(a => a.courseId || a.course?.id).filter(Boolean);
                  const availableCourses = allCourses.filter(c => !enrolledIds.includes(c.id) && !appliedIds.includes(c.id));
                  return availableCourses.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">Başvurulabilecek ders kalmadı</div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {availableCourses.map((course, i) => (
                        <div key={course.id || i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-slate-900 dark:text-slate-200">{course.name || course.title}</h3>
                            <div className="flex flex-wrap gap-3 mt-1">
                              {course.code && <span className="text-xs text-slate-500 dark:text-slate-400">Kod: {course.code}</span>}
                              {course.credit && <span className="text-xs text-slate-500 dark:text-slate-400">{course.credit} Kredi</span>}
                              {course.capacity && <span className="text-xs text-slate-500 dark:text-slate-400">Kapasite: {course.capacity}</span>}
                            </div>
                            {course.description && <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">{course.description}</p>}
                          </div>
                          <button
                            onClick={() => handleApplyToCourse(course.id)}
                            disabled={applyingCourse[course.id]}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors whitespace-nowrap"
                          >
                            {applyingCourse[course.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Başvur
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()
              }
            </div>

            {/* Başvurularım */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-500" /> Başvurularım
                </h2>
              </div>
              {loading.myApplications ? <CardLoader /> :
                myApplications.length === 0 ? <EmptyState message="Henüz başvurunuz yok" icon={Send} /> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myApplications.map((app, i) => {
                      const statusMap = {
                        PENDING: { label: 'Bekliyor', classes: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50' },
                        APPROVED: { label: 'Onaylandı', classes: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' },
                        REJECTED: { label: 'Reddedildi', classes: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50' },
                      };
                      const status = statusMap[app.status] || statusMap.PENDING;
                      return (
                        <div key={app.id || i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div>
                            <h3 className="font-medium text-slate-900 dark:text-slate-200">{app.courseName || app.course?.name || app.course?.title || 'Ders'}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Başvuru: {app.applicationDate || app.createdAt ? new Date(app.applicationDate || app.createdAt).toLocaleDateString('tr-TR') : '-'}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.classes}`}>
                            {status.label}
                          </span>
                        </div>
                      );
                    })}
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
                validAssignments.length === 0 ? <EmptyState message="Aktif ödev bulunmuyor" icon={ClipboardList} /> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {validAssignments.map((assignment, i) => {
                      const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
                      const isSubmitted = Boolean(assignment.submitted || assignment.submission || assignment.submissionFileUrl || assignment.submittedFileUrl || assignment.status === 'SUBMITTED');
                      
                      return (
                        <div key={assignment.id || i} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-200 text-lg">{assignment.title}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  isSubmitted
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                    : isOverdue
                                      ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50'
                                      : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                                }`}>
                                  {isSubmitted ? 'Teslim Edildi' : isOverdue ? 'Süresi Geçti' : 'Bekliyor'}
                                </span>
                              </div>
                              {assignment.description && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{assignment.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 mt-2">
                                {assignment.dueDate && (
                                  <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    Son Teslim: {new Date(assignment.dueDate).toLocaleString('tr-TR')}
                                  </span>
                                )}
                                {assignment.courseName && (
                                  <span className="text-xs text-slate-400 dark:text-slate-500">
                                    Ders: {assignment.courseName}
                                  </span>
                                )}
                              </div>

                              {/* Grade Display */}
                              {isSubmitted && assignment.grade !== null && assignment.grade !== undefined && (
                                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Not: {assignment.grade}</span>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 md:items-end">
                              {/* Download assignment file */}
                              {(assignment.fileUrl || assignment.assignmentFileUrl) && (
                                <button onClick={() => handleDownloadFile(assignment.fileUrl || assignment.assignmentFileUrl, assignment.title + '_dosya')} className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                                  <FileDown className="w-4 h-4" /> Ödev Dosyasını İndir
                                </button>
                              )}

                              {/* First submission */}
                              {!isSubmitted && !isOverdue && (
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
                                    <Upload className="w-4 h-4 text-slate-500" />
                                    <span className="text-slate-600 dark:text-slate-300 max-w-[150px] truncate">
                                      {submitFiles[assignment.id]?.name || 'Dosya seç'}
                                    </span>
                                    <input type="file" className="hidden" onChange={e => setSubmitFiles(prev => ({ ...prev, [assignment.id]: e.target.files[0] }))} />
                                  </label>
                                  <button
                                    onClick={() => handleSubmitAssignment(assignment.id)}
                                    disabled={!submitFiles[assignment.id] || submitting[assignment.id]}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                                  >
                                    {submitting[assignment.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Teslim Et
                                  </button>
                                </div>
                              )}

                              {/* After submission: download + edit */}
                              {isSubmitted && (
                                <>
                                  {/* Download submitted file */}
                                  {(() => {
                                    const subUrl = assignment.submissionFileUrl || assignment.submittedFileUrl || assignment.submission?.fileUrl;
                                    return subUrl ? (
                                      <button onClick={() => handleDownloadFile(subUrl, 'teslimim_' + assignment.title)} className="flex items-center gap-1.5 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                                        <FileDown className="w-4 h-4" /> Teslimimi İndir
                                      </button>
                                    ) : null;
                                  })()}

                                  {/* Edit / Delete toggle */}
                                  {!isOverdue && (
                                    <>
                                      {!submitFiles[assignment.id + '_editing'] ? (
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => setSubmitFiles(prev => ({ ...prev, [assignment.id + '_editing']: true }))}
                                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                                          >
                                            <Upload className="w-4 h-4" /> Düzenle
                                          </button>
                                          <button
                                            onClick={() => handleDeleteSubmission(assignment.id)}
                                            disabled={submitting[assignment.id]}
                                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                          >
                                            {submitting[assignment.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            Sil
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col gap-2">
                                          <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
                                              <Upload className="w-4 h-4 text-slate-500" />
                                              <span className="text-slate-600 dark:text-slate-300 max-w-[150px] truncate">
                                                {submitFiles[assignment.id]?.name || 'Yeni dosya seç'}
                                              </span>
                                              <input type="file" className="hidden" onChange={e => setSubmitFiles(prev => ({ ...prev, [assignment.id]: e.target.files[0] }))} />
                                            </label>
                                            <button
                                              onClick={() => handleSubmitAssignment(assignment.id)}
                                              disabled={!submitFiles[assignment.id] || submitting[assignment.id]}
                                              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                                            >
                                              {submitting[assignment.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                              Güncelle
                                            </button>
                                          </div>
                                          <button
                                            onClick={() => setSubmitFiles(prev => ({ ...prev, [assignment.id + '_editing']: false, [assignment.id]: null }))}
                                            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 self-end"
                                          >
                                            İptal
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                validClubEvents.length === 0 ? <EmptyState message="Şu an açık kulüp etkinliği yok" icon={CalendarPlus} /> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {validClubEvents.map((event, i) => (
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
                validMembershipRequests.length === 0 ? <EmptyState message="Bekleyen isteğiniz bulunmuyor" icon={Send} /> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {validMembershipRequests.map((req, i) => (
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
