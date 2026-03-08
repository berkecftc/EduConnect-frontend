import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';
import {
  getInstructorCourses, enrollStudentToCourse, createCourse,
  getPendingApplications, approveApplication, rejectApplication,
  createAnnouncement, getAnnouncements, deleteAnnouncement,
  getEnrolledStudents, downloadCourseFile
} from '../../api/courseService';
import { getCourseSubmissions, gradeSubmission, downloadAssignmentFile } from '../../api/assignmentService';
import academicianService from '../../api/academicianService';

import {
  GraduationCap, BookOpen, UserPlus, ClipboardCheck, LogOut, Loader2, Check, AlertCircle,
  Calendar, X, Eye, Clock, ChevronRight, Shield, ArrowUpDown, Bell, Users, FileDown, Trash2, Send, Megaphone,
  PlusCircle, Image, Upload, User, Menu, Moon, Sun, Briefcase
} from 'lucide-react';

function InstructorDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, role, userId, email, studentNumber, department } = useSelector((state) => state.auth);
  const { isDarkMode, toggleTheme } = useTheme();

  // Theme & Layout State
  const [activeTab, setActiveTab] = useState('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // States
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState({});

  const [pendingEvents, setPendingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [roleChangeRequests, setRoleChangeRequests] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [selectedCourseForApps, setSelectedCourseForApps] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [selectedCourseForAnnouncements, setSelectedCourseForAnnouncements] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState('');

  const [enrollForm, setEnrollForm] = useState({ courseId: '', studentEmail: '' });
  const [courseForm, setCourseForm] = useState({ title: '', code: '', description: '', credit: 3, semester: '', capacity: 30 });
  const [courseImage, setCourseImage] = useState(null);

  // Modals & Simple UI States
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({
    courses: true, submissions: false, enrolling: false, grading: {}, events: false, apps: false, announcements: false, students: false, role: false
  });

  // Initial Fetches
  useEffect(() => {
    fetchCourses();
    fetchEvents();
    fetchRoleChangeRequests();
  }, []);

  useEffect(() => {
    if (activeTab === 'applications' && courses.length > 0 && !selectedCourseForApps) setSelectedCourseForApps(courses[0].id);
    if (activeTab === 'announcements' && courses.length > 0 && !selectedCourseForAnnouncements) setSelectedCourseForAnnouncements(courses[0].id);
    if (activeTab === 'enrolledStudents' && courses.length > 0 && !selectedCourseForStudents) setSelectedCourseForStudents(courses[0].id);
  }, [activeTab, courses]);

  // Load contents when tab or course changes for those tabs
  useEffect(() => {
    if (activeTab === 'applications' && selectedCourseForApps) fetchPendingApplications();
  }, [selectedCourseForApps, activeTab]);

  useEffect(() => {
    if (activeTab === 'announcements' && selectedCourseForAnnouncements) fetchAnnouncementsList();
  }, [selectedCourseForAnnouncements, activeTab]);

  useEffect(() => {
    if (activeTab === 'enrolledStudents' && selectedCourseForStudents) fetchEnrolledStudentsList();
  }, [selectedCourseForStudents, activeTab]);

  useEffect(() => {
    if (activeTab === 'applications' && courses.length > 0 && !selectedCourseForApps) setSelectedCourseForApps(courses[0].id);
    if (activeTab === 'announcements' && courses.length > 0 && !selectedCourseForAnnouncements) setSelectedCourseForAnnouncements(courses[0].id);
    if (activeTab === 'enrolledStudents' && courses.length > 0 && !selectedCourseForStudents) setSelectedCourseForStudents(courses[0].id);
  }, [activeTab, courses]);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // API Calls
  const fetchCourses = async () => {
    try {
      const data = await getInstructorCourses();
      setCourses(data || []);
      if (data?.length > 0) {
        setSelectedCourse(data[0].id);
        setEnrollForm(prev => ({ ...prev, courseId: data[0].id }));
      }
    } catch { setErrors(prev => ({ ...prev, courses: 'Dersler yüklenemedi' })); }
    finally { setLoading(prev => ({ ...prev, courses: false })); }
  };

  const fetchPendingApplications = async () => {
    if (!selectedCourseForApps) return;
    setLoading(prev => ({ ...prev, apps: true }));
    try { setPendingApplications((await getPendingApplications(selectedCourseForApps)) || []); } catch { setPendingApplications([]); }
    finally { setLoading(prev => ({ ...prev, apps: false })); }
  };

  const handleApproveApplication = async (appId) => {
    try { await approveApplication(selectedCourseForApps, appId); fetchPendingApplications(); showSuccess('Başvuru onaylandı'); }
    catch (e) { alert(e?.response?.data?.message || 'Hata'); }
  };

  const handleRejectApplication = async (appId) => {
    try { await rejectApplication(selectedCourseForApps, appId); fetchPendingApplications(); showSuccess('Başvuru reddedildi'); }
    catch (e) { alert(e?.response?.data?.message || 'Hata'); }
  };

  const fetchAnnouncementsList = async () => {
    if (!selectedCourseForAnnouncements) return;
    setLoading(prev => ({ ...prev, announcements: true }));
    try { setAnnouncements((await getAnnouncements(selectedCourseForAnnouncements)) || []); } catch { setAnnouncements([]); }
    finally { setLoading(prev => ({ ...prev, announcements: false })); }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!selectedCourseForAnnouncements || !newAnnouncement.title || !newAnnouncement.content) return;
    try {
      await createAnnouncement(selectedCourseForAnnouncements, newAnnouncement);
      setNewAnnouncement({ title: '', content: '' });
      fetchAnnouncementsList();
      showSuccess('Duyuru oluşturuldu');
    } catch (e) { alert('Hata'); }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Silmek istediğinize emin misiniz?")) return;
    try { await deleteAnnouncement(selectedCourseForAnnouncements, id); fetchAnnouncementsList(); showSuccess('Silindi'); }
    catch (e) { alert('Hata'); }
  };

  const fetchEnrolledStudentsList = async () => {
    if (!selectedCourseForStudents) return;
    setLoading(prev => ({ ...prev, students: true }));
    try { setEnrolledStudents((await getEnrolledStudents(selectedCourseForStudents)) || []); } catch { setEnrolledStudents([]); }
    finally { setLoading(prev => ({ ...prev, students: false })); }
  };

  const fetchEvents = async () => {
    setLoading(prev => ({ ...prev, events: true }));
    try {
      const pendingRes = await academicianService.getPendingEvents().catch(() => ({ data: [] }));
      setPendingEvents(pendingRes.data || []);
    } catch { console.error('Hata'); }
    finally { setLoading(prev => ({ ...prev, events: false })); }
  };

  const fetchRoleChangeRequests = async () => {
    setLoading(prev => ({ ...prev, role: true }));
    try {
      const res = await academicianService.getPendingRoleChangeRequests();
      setRoleChangeRequests(res.data || []);
    } catch { } finally { setLoading(prev => ({ ...prev, role: false })); }
  };

  const handleApproveEvent = async (id) => {
    try { await academicianService.approveEvent(id); showSuccess('Olay onaylandı'); fetchEvents(); }
    catch (e) { alert(e?.response?.data?.message || 'Hata'); }
  };

  const handleRejectEvent = async (id) => {
    try { await academicianService.rejectEvent(id); showSuccess('Olay reddedildi'); fetchEvents(); }
    catch (e) { alert(e?.response?.data?.message || 'Hata'); }
  };

  const handleApproveRoleChange = async (id) => {
    try { await academicianService.approveRoleChangeRequest(id); showSuccess('Görev onaylandı'); fetchRoleChangeRequests(); }
    catch (e) { alert('Hata'); }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.title || !courseForm.code) return;
    try {
      await createCourse({ ...courseForm, instructorId: userId }, courseImage);
      showSuccess('Ders başarıyla oluşturuldu');
      setCourseForm({ title: '', code: '', description: '', credit: 3, semester: '', capacity: 30 });
      fetchCourses();
    } catch (e) { alert('Ders oluşturulamadı'); }
  };

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  // Layout Setup
  const menuItems = [
    { id: 'profile', label: 'Profil Karşılama', icon: User, type: 'general' },
    { id: 'overview', label: 'Dersler & Yönetim', icon: BookOpen, type: 'academic' },
    { id: 'applications', label: 'Ders Başvuruları', icon: Send, type: 'academic' },
    { id: 'enrolledStudents', label: 'Kayıtlı Öğrenciler', icon: Users, type: 'academic' },
    { id: 'announcements', label: 'Duyurular', icon: Megaphone, type: 'academic' },
    { id: 'createCourse', label: 'Yeni Ders Oluştur', icon: PlusCircle, type: 'academic' },
    { id: 'pendingEvents', label: 'Kulüp Etkinlik Onayları', icon: Calendar, count: pendingEvents.length, type: 'admin' },
    { id: 'roleRequests', label: 'Görev Talepleri', icon: Shield, count: roleChangeRequests.length, type: 'admin' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col md:flex-row">
      {/* Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 shadow-lg">
          <Check className="w-5 h-5" /> <span>{successMessage}</span>
        </div>
      )}

      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 relative">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300">
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">Danışman Paneli</span>
        <button onClick={toggleTheme} className="p-2 text-slate-600 dark:text-slate-300">
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 transition-transform duration-300 ease-in-out transform overflow-y-auto ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 hidden md:flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex flex-col">
            <span className="font-bold text-xl text-emerald-600 dark:text-emerald-400">EduConnect</span>
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1 mt-1"><Briefcase className="w-3 h-3" /> Danışman & Eğitmen</span>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex-1 py-4 px-3 space-y-6">
          <div className="space-y-1">
            {menuItems.filter(m => m.type === 'general').map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                <item.icon className="w-5 h-5" /> <span className="flex-1 text-left">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <div className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-2">Akademik Panel</div>
            {menuItems.filter(m => m.type === 'academic').map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                <item.icon className="w-5 h-5" /> <span className="flex-1 text-left">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <div className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-2">Danışman Paneli</div>
            {menuItems.filter(m => m.type === 'admin').map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                <item.icon className="w-5 h-5" /> <span className="flex-1 text-left">{item.label}</span>
                {item.count > 0 && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === item.id ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>{item.count}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" /> <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Danışman Profili</h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm max-w-2xl">
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center border-b border-slate-100 dark:border-slate-800 pb-8 mb-8">
                <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-3xl font-bold">
                  {user?.[0]?.toUpperCase() || 'E'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user || 'Eğitmen'}</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">{email || 'egitmen@university.edu'}</p>
                  <span className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-full mt-3">
                    Eğitmen & Danışman
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Sicil Numarası</p>
                  <p className="font-medium text-slate-900 dark:text-slate-200">{studentNumber || 'ACAD-001'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Fakülte / Bölüm</p>
                  <p className="font-medium text-slate-900 dark:text-slate-200">{department || 'Mühendislik Fakültesi'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OVERVIEW / COURSES */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Derslerim</h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 overflow-hidden">
              {loading.courses ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div> :
                courses.length === 0 ? <p className="text-slate-500 dark:text-slate-400 text-center py-8">Henüz dersiniz yok</p> : (
                  <div className="grid gap-4">
                    {courses.map((course, i) => (
                      <div key={i} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-200">{course.name || course.title} ({course.code})</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{course.credit} Kredi • Kapasite: {course.capacity || 30}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* PENDING EVENTS */}
        {activeTab === 'pendingEvents' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
              Kulüp Etkinlik Onayları
              <span className="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 text-lg px-3 py-1 rounded-full">{pendingEvents.length}</span>
            </h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {loading.events ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div> :
                pendingEvents.length === 0 ? <p className="text-slate-500 dark:text-slate-400 text-center py-8">Bekleyen etkinlik onayı yok</p> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pendingEvents.map((evt, i) => (
                      <div key={i} className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-slate-200">{evt.title || evt.eventName}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kulüp: {evt.clubName} • Tarih: {new Date(evt.eventTime || evt.date).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveEvent(evt.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Onayla</button>
                          <button onClick={() => handleRejectEvent(evt.id)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm">Reddet</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* APPLICATIONS */}
        {activeTab === 'applications' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Ders Başvuruları</h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden p-6 mb-6">
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Ders Seçin</label>
              <select value={selectedCourseForApps} onChange={e => setSelectedCourseForApps(e.target.value)} className="w-full md:w-1/2 p-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white">
                {courses.map(c => <option key={c.id} value={c.id}>{c.name || c.title}</option>)}
              </select>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {loading.apps ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div> :
                pendingApplications.length === 0 ? <p className="text-slate-500 dark:text-slate-400 text-center py-8">Bekleyen başvuru yok</p> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pendingApplications.map((app, i) => (
                      <div key={i} className="p-4 flex flex-col md:flex-row justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-200">{app.studentName || app.student?.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{app.studentEmail || app.student?.email} • {app.studentNumber || app.student?.studentNumber}</p>
                        </div>
                        <div className="flex gap-2 mt-4 md:mt-0">
                          <button onClick={() => handleApproveApplication(app.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Onayla</button>
                          <button onClick={() => handleRejectApplication(app.id)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm">Reddet</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ENROLLED STUDENTS */}
        {activeTab === 'enrolledStudents' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Kayıtlı Öğrenciler</h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden p-6 mb-6">
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Ders Seçin</label>
              <select value={selectedCourseForStudents} onChange={e => setSelectedCourseForStudents(e.target.value)} className="w-full md:w-1/2 p-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white">
                {courses.map(c => <option key={c.id} value={c.id}>{c.name || c.title}</option>)}
              </select>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {loading.students ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div> :
                enrolledStudents.length === 0 ? <p className="text-slate-500 dark:text-slate-400 text-center py-8">Kayıtlı öğrenci yok</p> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {enrolledStudents.map((student, i) => (
                      <div key={i} className="p-4 flex flex-col md:flex-row justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-200">{student.name || student.fullName || student.studentName}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{student.email} • {student.studentNumber || student.student_number || 'No yok'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Duyurular</h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden p-6 mb-6">
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Ders Seçin</label>
              <select value={selectedCourseForAnnouncements} onChange={e => setSelectedCourseForAnnouncements(e.target.value)} className="w-full md:w-1/2 p-2 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white mb-6">
                {courses.map(c => <option key={c.id} value={c.id}>{c.name || c.title}</option>)}
              </select>

              <form onSubmit={handleCreateAnnouncement} className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-200">Yeni Duyuru</h3>
                <div><input required placeholder="Duyuru Başlığı" value={newAnnouncement.title} onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-3 dark:bg-slate-800 dark:text-white" /></div>
                <div><textarea required placeholder="İçerik..." value={newAnnouncement.content} onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-3 dark:bg-slate-800 dark:text-white h-24" /></div>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Yayınla</button>
              </form>
            </div>

            <div className="grid gap-4">
              {loading.announcements ? <div className="py-4 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div> :
                announcements.map((ann, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 relative">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{ann.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-2">{ann.content}</p>
                    <button onClick={() => handleDeleteAnnouncement(ann.id)} className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* MORE TABS LIKE APPLICATIONS, CREATE COURSE CAN GO HERE IN THE SAME FORMAT */}
        {activeTab === 'createCourse' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Yeni Ders Oluştur</h1>
            <form onSubmit={handleCreateCourse} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 max-w-xl">
              <div className="space-y-4">
                <div><label className="text-sm text-slate-500 dark:text-slate-400">Ders Adı</label><input required value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 dark:bg-slate-800 dark:text-white" /></div>
                <div><label className="text-sm text-slate-500 dark:text-slate-400">Ders Kodu</label><input required value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 dark:bg-slate-800 dark:text-white" /></div>
                <div><label className="text-sm text-slate-500 dark:text-slate-400">Açıklama</label><textarea value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 dark:bg-slate-800 dark:text-white" /></div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg text-sm">Oluştur</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default InstructorDashboard;
