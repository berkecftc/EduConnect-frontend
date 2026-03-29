import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { useTheme } from '../../context/ThemeContext';
import {
  getMyManagedClubs, getClubBoardMembers, getMyMemberships, getPendingMembershipRequests,
  getPendingMembershipRequestCount, approveMembershipRequest, rejectMembershipRequest,
  createRoleChangeRequest, getClubRoleChangeRequests, removeMemberRole,
  getMyMembershipRequests, cancelMembershipRequest
} from '../../api/clubService';
import {
  getMyEvents, getEventRegistrations, createEvent, verifyQrCode, getMyRegistrations,
  getAllMyPendingRequests, approveParticipationRequest, rejectParticipationRequest,
  getMyParticipationRequests, sendParticipationRequest, getClubEvents
} from '../../api/eventService';
import { getMyCourses, getAllCourses, applyToCourse, getMyApplications, getAnnouncements, downloadCourseFile } from '../../api/courseService';
import { getMyAssignments, downloadAssignmentFile, submitAssignment, deleteAssignmentSubmission } from '../../api/assignmentService';

import {
  Users, Calendar, LogOut, Loader2, Plus, QrCode, UserCheck, Crown, BookOpen,
  ClipboardList, Check, AlertCircle, X, UserPlus, Shield, Trash2, ArrowUpDown,
  Send, Image, CalendarPlus, Bell, FileDown, User, Menu, Moon, Sun, ChevronRight,
  Briefcase, GraduationCap, Upload, Clock, Search, MessageSquare
} from 'lucide-react';
import UserProfileTab from '../../components/profile/UserProfileTab';

function ClubOfficialDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, role, email, studentNumber, department } = useSelector((state) => state.auth);
  const { isDarkMode, toggleTheme } = useTheme();

  // Theme & Layout State
  const [activeTab, setActiveTab] = useState('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Official States
  const [managedClubs, setManagedClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [boardMembers, setBoardMembers] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [eventParticipationRequests, setEventParticipationRequests] = useState([]);
  const [roleChangeRequests, setRoleChangeRequests] = useState([]);

  // Modals & Forms
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [roleChangeForm, setRoleChangeForm] = useState({ studentNumber: '', requestedRole: 'ROLE_VICE_PRESIDENT' });
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', eventTime: '', location: '' });
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [qrCode, setQrCode] = useState('');

  // Student States
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [membershipRequests, setMembershipRequests] = useState([]);
  const [participationRequests, setParticipationRequests] = useState([]);
  const [clubEventsForStudent, setClubEventsForStudent] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [applyingCourse, setApplyingCourse] = useState({});

  const [loading, setLoading] = useState({
    managedClubs: true, boardMembers: false, myEvents: true, eventRegistrations: false,
    courses: true, assignments: true, clubs: true, events: true, creatingEvent: false,
    verifyingQr: false, pendingRequests: false, approvingRequest: false,
    eventParticipationRequests: true, roleChangeRequests: false, creatingRoleChange: false,
    removingRole: false, membershipRequests: true, participationRequests: true, clubEventsForStudent: true,
    allCourses: false, myApplications: false,
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [submitFiles, setSubmitFiles] = useState({});
  const [submitting, setSubmitting] = useState({});

  // Initial Fetches
  useEffect(() => {
    fetchManagedClubs();
    fetchMyEvents();
    fetchEventParticipationRequests();

    // Student side
    fetchCourses();
    fetchAssignments();
    fetchClubs();
    fetchEvents();
    fetchStudentMembershipRequests();
    fetchStudentParticipationRequests();
  }, []);

  useEffect(() => {
    if (activeTab === 'courseApplications') {
      fetchAllCoursesForApply();
      fetchMyApplicationsForStudent();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!loading.clubs && clubs.length > 0) fetchStudentClubEvents();
    else if (!loading.clubs) setLoading(prev => ({ ...prev, clubEventsForStudent: false }));
  }, [clubs, loading.clubs]);

  useEffect(() => {
    if (selectedClubId) {
      fetchBoardMembers(selectedClubId);
      fetchPendingRequests(selectedClubId);
      fetchPendingCount(selectedClubId);
      fetchRoleChangeRequests(selectedClubId);
    }
  }, [selectedClubId]);

  useEffect(() => {
    if (selectedEventId) fetchEventRegistrations(selectedEventId);
  }, [selectedEventId]);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // --- OFFICIAL FUNCTIONS ---
  const fetchManagedClubs = async () => {
    try {
      const response = await getMyManagedClubs();
      const clubList = response || [];
      setManagedClubs(clubList);
      if (clubList.length > 0 && !selectedClubId) {
        setSelectedClubId(clubList[0].id || clubList[0].clubId);
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, managedClubs: 'Kulüpler yüklenemedi' }));
    } finally { setLoading(prev => ({ ...prev, managedClubs: false })); }
  };

  const fetchBoardMembers = async (clubId) => {
    setLoading(prev => ({ ...prev, boardMembers: true }));
    try {
      setBoardMembers((await getClubBoardMembers(clubId)) || []);
    } catch { setErrors(prev => ({ ...prev, boardMembers: 'Yönetim kurulu yüklenemedi' })); }
    finally { setLoading(prev => ({ ...prev, boardMembers: false })); }
  };

  const fetchMyEvents = async () => {
    try { setMyEvents((await getMyEvents()) || []); }
    catch { setErrors(prev => ({ ...prev, myEvents: 'Etkinlikler yüklenemedi' })); }
    finally { setLoading(prev => ({ ...prev, myEvents: false })); }
  };

  const fetchEventRegistrations = async (eventId) => {
    setLoading(prev => ({ ...prev, eventRegistrations: true }));
    try { setEventRegistrations((await getEventRegistrations(eventId)) || []); }
    catch { setErrors(prev => ({ ...prev, eventRegistrations: 'Kayıtlar yüklenemedi' })); }
    finally { setLoading(prev => ({ ...prev, eventRegistrations: false })); }
  };

  const fetchPendingRequests = async (clubId) => {
    setLoading(prev => ({ ...prev, pendingRequests: true }));
    try { setPendingRequests((await getPendingMembershipRequests(clubId)) || []); }
    catch { setErrors(prev => ({ ...prev, pendingRequests: 'Üyelik istekleri yüklenemedi' })); }
    finally { setLoading(prev => ({ ...prev, pendingRequests: false })); }
  };

  const fetchPendingCount = async (clubId) => {
    try { setPendingCount((await getPendingMembershipRequestCount(clubId))?.count || 0); }
    catch (e) { console.error(e); }
  };

  const handleApproveRequest = async (requestId) => {
    if (!selectedClubId) return;
    setLoading(prev => ({ ...prev, approvingRequest: true }));
    try {
      await approveMembershipRequest(selectedClubId, requestId);
      showSuccess('Üyelik isteği onaylandı!');
      fetchPendingRequests(selectedClubId);
      fetchPendingCount(selectedClubId);
    } catch (e) { alert('Hata: ' + e?.response?.data?.message); }
    finally { setLoading(prev => ({ ...prev, approvingRequest: false })); }
  };

  const handleRejectRequest = async (requestId) => {
    if (!selectedClubId) return;
    setLoading(prev => ({ ...prev, approvingRequest: true }));
    try {
      await rejectMembershipRequest(selectedClubId, requestId);
      showSuccess('Üyelik isteği reddedildi!');
      fetchPendingRequests(selectedClubId);
      fetchPendingCount(selectedClubId);
    } catch (e) { alert('Hata: ' + e?.response?.data?.message); }
    finally { setLoading(prev => ({ ...prev, approvingRequest: false })); }
  };

  const fetchEventParticipationRequests = async () => {
    try { setEventParticipationRequests((await getAllMyPendingRequests()) || []); }
    catch { setErrors(prev => ({ ...prev, eventParticipationRequests: 'İstekler yüklenemedi' })); }
    finally { setLoading(prev => ({ ...prev, eventParticipationRequests: false })); }
  };

  const handleApproveParticipationRequest = async (requestId) => {
    setLoading(prev => ({ ...prev, approvingRequest: true }));
    try {
      await approveParticipationRequest(requestId);
      showSuccess('Katılım isteği onaylandı!');
      fetchEventParticipationRequests();
      if (selectedEventId) fetchEventRegistrations(selectedEventId);
    } catch (e) { alert('Hata: ' + e?.response?.data?.message); }
    finally { setLoading(prev => ({ ...prev, approvingRequest: false })); }
  };

  const handleRejectParticipationRequest = async (requestId) => {
    setLoading(prev => ({ ...prev, approvingRequest: true }));
    try {
      await rejectParticipationRequest(requestId);
      showSuccess('Katılım isteği reddedildi');
      fetchEventParticipationRequests();
      if (selectedEventId) fetchEventRegistrations(selectedEventId);
    } catch (e) { alert('Hata: ' + e?.response?.data?.message); }
    finally { setLoading(prev => ({ ...prev, approvingRequest: false })); }
  };

  const fetchRoleChangeRequests = async (clubId) => {
    setLoading(prev => ({ ...prev, roleChangeRequests: true }));
    try { setRoleChangeRequests((await getClubRoleChangeRequests(clubId)) || []); }
    catch { setErrors(prev => ({ ...prev, roleChangeRequests: 'Talepler yüklenemedi' })); }
    finally { setLoading(prev => ({ ...prev, roleChangeRequests: false })); }
  };

  // --- STUDENT FUNCTIONS ---
  const fetchCourses = async () => {
    try {
      const data = await getMyCourses();
      setCourses(data || []);
    } catch { setErrors(prev => ({ ...prev, courses: 'Hata' })); }
    finally { setLoading(prev => ({ ...prev, courses: false })); }
  };

  const fetchAssignments = async () => {
    try {
      const data = await getMyAssignments();
      setAssignments(data || []);
    } catch { setErrors(prev => ({ ...prev, assignments: 'Hata' })); }
    finally { setLoading(prev => ({ ...prev, assignments: false })); }
  };

  const fetchClubs = async () => {
    try { setClubs((await getMyMemberships()) || []); }
    catch { setErrors(prev => ({ ...prev, clubs: 'Hata' })); }
    finally { setLoading(prev => ({ ...prev, clubs: false })); }
  };

  const fetchEvents = async () => {
    try { setEvents((await getMyRegistrations()) || []); }
    catch { setErrors(prev => ({ ...prev, events: 'Hata' })); }
    finally { setLoading(prev => ({ ...prev, events: false })); }
  };

  const fetchStudentMembershipRequests = async () => {
    try { setMembershipRequests((await getMyMembershipRequests()) || []); }
    catch { setErrors(prev => ({ ...prev, membershipRequests: 'Hata' })); }
    finally { setLoading(prev => ({ ...prev, membershipRequests: false })); }
  };

  const fetchStudentParticipationRequests = async () => {
    try { setParticipationRequests((await getMyParticipationRequests()) || []); }
    catch { setErrors(prev => ({ ...prev, participationRequests: 'Hata' })); }
    finally { setLoading(prev => ({ ...prev, participationRequests: false })); }
  };

  const fetchStudentClubEvents = async () => {
    if (clubs.length === 0) return setLoading(prev => ({ ...prev, clubEventsForStudent: false }));
    try {
      const promises = clubs.map(async (m) => {
        const cId = m.club?.id || m.clubId;
        if (!cId) return [];
        try {
          const evts = await getClubEvents(cId);
          return evts.map(e => ({ ...e, clubName: m.club?.name || m.clubName }));
        } catch { return []; }
      });
      const allEvts = (await Promise.all(promises)).flat();
      const reqIds = participationRequests.map(r => r.event?.id || r.eventId);
      const regIds = events.map(e => e.event?.id || e.eventId || e.id);
      const excIds = [...reqIds, ...regIds];
      setClubEventsForStudent(allEvts.filter(e => !excIds.includes(e.id)));
    } catch { setErrors(prev => ({ ...prev, clubEventsForStudent: 'Hata' })); }
    finally { setLoading(prev => ({ ...prev, clubEventsForStudent: false })); }
  };

  // Course Application Functions
  const fetchAllCoursesForApply = async () => {
    setLoading(prev => ({ ...prev, allCourses: true }));
    try { setAllCourses((await getAllCourses()) || []); }
    catch { setAllCourses([]); }
    finally { setLoading(prev => ({ ...prev, allCourses: false })); }
  };

  const fetchMyApplicationsForStudent = async () => {
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
      fetchMyApplicationsForStudent();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data || 'Başvuru yapılamadı';
      alert(typeof msg === 'string' ? msg : 'Başvuru yapılamadı');
    } finally {
      setApplyingCourse(prev => ({ ...prev, [courseId]: false }));
    }
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

  // --- UI COMPONENTS ---
  const CardLoader = () => <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;
  const EmptyState = ({ msg, Icon = BookOpen }) => (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
      <Icon className="w-12 h-12 mb-4 opacity-50" />
      <p>{msg}</p>
    </div>
  );

  const menuItems = [
    { id: 'profile', label: 'Profil Karşılama', icon: User, type: 'general' },
    { id: 'all_clubs', label: 'Tüm Kulüpler', icon: Search, type: 'general', path: '/clubs' },
    { id: 'posts', label: 'Öğrenci Forumu (Blog)', icon: MessageSquare, type: 'general', path: '/posts' },

    // Official Tools
    { id: 'managed_clubs', label: 'Yönetilen Kulüp', icon: Crown, type: 'official' },
    { id: 'my_events', label: 'Kulüp Etkinlikleri', icon: Calendar, type: 'official' },
    { id: 'pending_requests', label: 'Bekleyen İstekler', icon: UserCheck, count: pendingCount, type: 'official' },
    { id: 'event_requests', label: 'Etkinlik Katılım', icon: UserPlus, count: eventParticipationRequests.length, type: 'official' },

    // Student Tools
    { id: 'courses', label: 'Kurslarım', icon: BookOpen, type: 'student' },
    { id: 'courseApplications', label: 'Ders Başvurusu', icon: GraduationCap, type: 'student' },
    { id: 'assignments', label: 'Ödevlerim', icon: ClipboardList, type: 'student' },
    { id: 'clubs', label: 'Üye Olduğum Kulüpler', icon: Users, type: 'student' }
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
        <span className="font-bold text-lg text-blue-600 dark:text-blue-400">Yetkili Paneli</span>
        <button onClick={toggleTheme} className="p-2 text-slate-600 dark:text-slate-300">
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
        flex flex-col z-50 transition-transform duration-300 ease-in-out transform overflow-y-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 hidden md:flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex flex-col">
            <span className="font-bold text-xl text-blue-600 dark:text-blue-400">EduConnect</span>
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1 mt-1"><Briefcase className="w-3 h-3" /> Kulüp Yetkilisi</span>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex-1 py-4 px-3 space-y-6">

          {/* General Section */}
          <div className="space-y-1">
            {menuItems.filter(m => m.type === 'general').map(item => (
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Official Section */}
          <div className="space-y-1">
            <div className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
              Yönetici Paneli
            </div>
            {menuItems.filter(m => m.type === 'official').map(item => (
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === item.id ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-bold'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Student Section */}
          <div className="space-y-1">
            <div className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
              Öğrenci Paneli
            </div>
            {menuItems.filter(m => m.type === 'student').map(item => (
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            ))}
          </div>

        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900">
          <button onClick={() => { dispatch(logout()); navigate('/login'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <UserProfileTab />
        )}

        {/* MANAGED CLUBS */}
        {activeTab === 'managed_clubs' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Yönetilen Kulüpler</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Crown className="text-indigo-500 w-5 h-5" /> Kulübüm</h2>
                {loading.managedClubs ? <CardLoader /> :
                  managedClubs.length === 0 ? <EmptyState msg="Yönettiğiniz kulüp yok." icon={Shield} /> : (
                    <div className="space-y-4">
                      {managedClubs.map((club, i) => (
                        <div key={i} className={`p-4 rounded-xl border-2 transition-colors cursor-pointer ${selectedClubId === (club.id || club.clubId) ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5 dark:border-indigo-500/50' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`} onClick={() => setSelectedClubId(club.id || club.clubId)}>
                          <h3 className="font-bold text-slate-900 dark:text-slate-100">{club.name || club.clubName}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{club.description || club.clubDescription}</p>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="text-indigo-500 w-5 h-5" /> Yönetim Kurulu</h2>
                {loading.boardMembers ? <CardLoader /> :
                  !selectedClubId ? <EmptyState msg="Lütfen bir kulüp seçin" icon={Shield} /> :
                    boardMembers.length === 0 ? <EmptyState msg="Yönetim kurulu üyesi yok" icon={Users} /> : (
                      <div className="space-y-3">
                        {boardMembers.map((member, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-200">{member.firstName} {member.lastName}</p>
                              <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 px-2 py-0.5 rounded-full">{member.role}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
              </div>
            </div>
          </div>
        )}

        {/* PENDING REQUESTS */}
        {activeTab === 'pending_requests' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
              Bekleyen Üyelik İstekleri
              <span className="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 text-lg px-3 py-1 rounded-full">{pendingCount}</span>
            </h1>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {loading.pendingRequests ? <CardLoader /> :
                pendingRequests.length === 0 ? <EmptyState msg="Bekleyen üyelik talebi yok." icon={UserCheck} /> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pendingRequests.map((req, i) => (
                      <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-slate-900 dark:text-slate-200">{req.studentName} {req.studentSurname}</h3>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{req.studentNumber}</span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{req.department}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleApproveRequest(req.id)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors">Onayla</button>
                          <button onClick={() => handleRejectRequest(req.id)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm transition-colors">Reddet</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* EVENT REQUESTS */}
        {activeTab === 'event_requests' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Etkinlik Katılım Talepleri</h1>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {loading.eventParticipationRequests ? <CardLoader /> :
                eventParticipationRequests.length === 0 ? <EmptyState msg="Bekleyen katılım talebi yok." icon={UserPlus} /> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {eventParticipationRequests.map((req, i) => (
                      <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 dark:text-slate-200">{req.studentName} {req.studentSurname}</h3>
                          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Etkinlik: {req.eventTitle}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(req.requestDate).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleApproveParticipationRequest(req.id)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors">Kabul Et</button>
                          <button onClick={() => handleRejectParticipationRequest(req.id)} className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-sm transition-colors">Reddet</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* COURSES (STUDENT VIEW) */}
        {activeTab === 'courses' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Kayıtlı Kurslarım</h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {loading.courses ? <CardLoader /> :
                courses.length === 0 ? <EmptyState msg="Kayıtlı kursunuz yok" icon={BookOpen} /> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {courses.map((course, i) => (
                      <div key={i} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div>
                          <h3 className="font-medium text-slate-900 dark:text-slate-200">{course.name || course.title}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{course.instructor || course.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* COURSE APPLICATIONS */}
        {activeTab === 'courseApplications' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Ders Başvurusu</h1>

            {/* Mevcut Dersler */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-500" /> Mevcut Dersler
                </h2>
              </div>
              {loading.allCourses ? <CardLoader /> :
                allCourses.length === 0 ? <EmptyState msg="Mevcut ders bulunamadı" icon={BookOpen} /> : (() => {
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
                myApplications.length === 0 ? <EmptyState msg="Henüz başvurunuz yok" icon={Send} /> : (
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

        {/* ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Ödevlerim</h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {loading.assignments ? <CardLoader /> :
                assignments.length === 0 ? <EmptyState msg="Aktif ödev bulunmuyor" icon={ClipboardList} /> : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {assignments.map((assignment, i) => {
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

        {/* CLUBS (STUDENT VIEW) */}
        {activeTab === 'clubs' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Üye Olduğum Kulüpler</h1>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              {loading.clubs ? <CardLoader /> :
                clubs.length === 0 ? <EmptyState msg="Herhangi bir kulübe üye değilsiniz" icon={Users} /> : (
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

      </main>
    </div>
  );
}

export default ClubOfficialDashboard;
