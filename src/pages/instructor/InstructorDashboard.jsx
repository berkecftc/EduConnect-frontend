import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { getInstructorCourses, enrollStudentToCourse } from '../../api/courseService';
import { getCourseSubmissions, gradeSubmission } from '../../api/assignmentService';
import academicianService from '../../api/academicianService';
import {
  GraduationCap, BookOpen, UserPlus, ClipboardCheck, LogOut, Loader2, Check, AlertCircle,
  Calendar, X, Eye, Clock, ChevronRight
} from 'lucide-react';

function InstructorDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, role } = useSelector((state) => state.auth);
  console.log("User Role:", role);

  const [activeTab, setActiveTab] = useState('overview');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState({});

  // Bekleyen etkinlikler state
  const [pendingEvents, setPendingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState('PENDING');
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventSearchTerm, setEventSearchTerm] = useState('');

  const [enrollForm, setEnrollForm] = useState({
    courseId: '',
    studentEmail: '',
  });

  const [loading, setLoading] = useState({
    courses: true,
    submissions: false,
    enrolling: false,
    grading: {},
  });

  const [errors, setErrors] = useState({
    courses: null,
    submissions: null,
    enroll: null,
  });

  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (activeTab === 'pendingEvents') {
      fetchEvents();
    }
  }, [activeTab]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchCourses = async () => {
    try {
      const data = await getInstructorCourses();
      setCourses(data);
      if (data.length > 0) {
        setSelectedCourse(data[0].id);
        setEnrollForm(prev => ({ ...prev, courseId: data[0].id }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, courses: 'Dersler yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, courses: false }));
    }
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const [pendingRes, allRes] = await Promise.all([
        academicianService.getPendingEvents().catch(() => ({ data: [] })),
        academicianService.getAdvisorEvents().catch(() => ({ data: [] }))
      ]);
      setPendingEvents(pendingRes.data || []);
      setAllEvents(allRes.data || []);
    } catch (error) {
      console.error('Etkinlikler yüklenirken hata:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleApproveEvent = async (eventId) => {
    if (!window.confirm("Bu etkinliği onaylamak istiyor musunuz?")) return;
    try {
      await academicianService.approveEvent(eventId);
      setSuccessMessage("Etkinlik başarıyla onaylandı!");
      fetchEvents();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Onaylanırken hata oluştu.";
      if (typeof msg === 'string' && msg.includes('danışman')) {
        alert("Bu kulübün danışmanı değilsiniz.");
      } else {
        alert("Etkinlik onaylanırken hata: " + msg);
      }
    }
  };

  const handleRejectEvent = async (eventId) => {
    if (!window.confirm("Bu etkinliği REDDETMEK istediğinize emin misiniz?")) return;
    try {
      await academicianService.rejectEvent(eventId);
      setSuccessMessage("Etkinlik reddedildi.");
      fetchEvents();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || "Reddedilirken hata oluştu.";
      if (typeof msg === 'string' && msg.includes('danışman')) {
        alert("Bu kulübün danışmanı değilsiniz.");
      } else {
        alert("Etkinlik reddedilirken hata: " + msg);
      }
    }
  };

  const fetchSubmissions = async () => {
    if (!selectedCourse) return;

    setLoading(prev => ({ ...prev, submissions: true }));
    setErrors(prev => ({ ...prev, submissions: null }));

    try {
      const data = await getCourseSubmissions(selectedCourse);
      setSubmissions(data);
      const initialGrades = {};
      data.forEach(sub => {
        initialGrades[sub.id] = sub.grade || '';
      });
      setGrades(initialGrades);
    } catch (error) {
      setErrors(prev => ({ ...prev, submissions: 'Teslimler yüklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, submissions: false }));
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!enrollForm.courseId || !enrollForm.studentEmail) return;

    setLoading(prev => ({ ...prev, enrolling: true }));
    setErrors(prev => ({ ...prev, enroll: null }));
    setSuccessMessage('');

    try {
      await enrollStudentToCourse(enrollForm.courseId, { email: enrollForm.studentEmail });
      setSuccessMessage('Öğrenci başarıyla kursa eklendi!');
      setEnrollForm(prev => ({ ...prev, studentEmail: '' }));
    } catch (error) {
      setErrors(prev => ({ ...prev, enroll: error.response?.data?.message || 'Öğrenci eklenemedi' }));
    } finally {
      setLoading(prev => ({ ...prev, enrolling: false }));
    }
  };

  const handleGradeSubmission = async (submissionId) => {
    const grade = grades[submissionId];
    if (!grade && grade !== 0) return;

    setLoading(prev => ({ ...prev, grading: { ...prev.grading, [submissionId]: true } }));

    try {
      await gradeSubmission(submissionId, { grade: Number(grade) });
      setSuccessMessage('Not başarıyla verildi!');
      setSubmissions(prev => prev.map(sub => sub.id === submissionId ? { ...sub, grade: Number(grade), graded: true } : sub));
    } catch (error) {
      alert('Not verilemedi: ' + (error.response?.data?.message || 'Bir hata oluştu'));
    } finally {
      setLoading(prev => ({ ...prev, grading: { ...prev.grading, [submissionId]: false } }));
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const parseDate = (item) => {
    if (!item) return null;
    const raw = item.eventTime || item.date || item.eventDate || item.startDate || item.startTime || item.time || item.createdDate;
    if (!raw) return null;
    if (Array.isArray(raw)) {
      return new Date(raw[0], raw[1] - 1, raw[2], raw[3] || 0, raw[4] || 0);
    }
    if (typeof raw === 'number') {
      return new Date(raw);
    }
    return new Date(raw);
  };

  const getFilteredEvents = () => {
    const now = new Date();
    let events = [];

    if (eventFilter === 'PENDING') {
      events = pendingEvents;
    } else {
      events = allEvents.filter(event => {
        const eventDate = parseDate(event);
        const isValidDate = eventDate && !isNaN(eventDate.getTime());
        const status = event.status ? event.status.trim() : '';

        switch (eventFilter) {
          case 'APPROVED':
            return (status === 'ACTIVE' || status === 'APPROVED') && isValidDate && eventDate > now;
          case 'PAST':
            return (status === 'ACTIVE' || status === 'APPROVED') && (!isValidDate || eventDate <= now);
          case 'REJECTED':
            return status === 'REJECTED';
          default:
            return true;
        }
      });
    }

    // Arama filtresi
    if (eventSearchTerm.trim()) {
      const lowerTerm = eventSearchTerm.toLowerCase();
      events = events.filter(event =>
        (event.title || event.eventName || '').toLowerCase().includes(lowerTerm) ||
        (event.clubName || '').toLowerCase().includes(lowerTerm) ||
        (event.location || '').toLowerCase().includes(lowerTerm)
      );
    }

    return events;
  };

  const CardLoader = () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
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

  const filteredEvents = getFilteredEvents();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-emerald-900 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <header className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 shadow-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-white to-emerald-200 bg-clip-text text-transparent">
                  Danışman Paneli
                </h1>
                <p className="text-emerald-200/70 mt-1">Hoş geldin, {user}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="group flex items-center gap-2 px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-300 transition-all duration-300 hover:scale-105"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'overview'
              ? 'bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/10'}`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Dersler & Öğrenciler</span>
          </button>
          <button
            onClick={() => setActiveTab('pendingEvents')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'pendingEvents'
              ? 'bg-linear-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
              : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/10'}`}
          >
            <Calendar className="w-4 h-4" />
            <span>Bekleyen Etkinlikler</span>
            {pendingEvents.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500/80 text-white text-xs font-bold animate-pulse">
                {pendingEvents.length}
              </span>
            )}
          </button>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-3 animate-pulse">
            <Check className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-300">{successMessage}</span>
          </div>
        )}

        {/* ===================== DERSLER & ÖĞRENCİLER ===================== */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-500 hover:bg-white/15">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Derslerim</h2>
                  <span className="ml-auto px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium">
                    {courses.length}
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {loading.courses ? <CardLoader /> :
                    errors.courses ? <div className="text-red-400 text-center py-4">{errors.courses}</div> :
                      courses.length === 0 ? <EmptyState message="Henüz ders yok" /> : (
                        <div className="space-y-3">
                          {courses.map((course, index) => (
                            <div key={course.id || index} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                              <h3 className="font-medium text-white">{course.name || course.title}</h3>
                              <p className="text-sm text-emerald-200/60 mt-1">{course.studentCount || 0} öğrenci kayıtlı</p>
                              <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs">Aktif</span>
                            </div>
                          ))}
                        </div>
                      )}
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl transition-all duration-500 hover:bg-white/15">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Öğrenci Ekle</h2>
                </div>
                {loading.courses ? <CardLoader /> : courses.length === 0 ? (
                  <EmptyState message="Önce ders oluşturmanız gerekiyor" />
                ) : (
                  <form onSubmit={handleEnrollStudent} className="space-y-4">
                    <div>
                      <label className="block text-sm text-emerald-200/70 mb-2">Ders Seçin</label>
                      <select
                        value={enrollForm.courseId}
                        onChange={(e) => setEnrollForm(prev => ({ ...prev, courseId: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                      >
                        {courses.map((course) => (
                          <option key={course.id} value={course.id} className="bg-slate-800">{course.name || course.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-emerald-200/70 mb-2">Öğrenci Email</label>
                      <input
                        type="email"
                        placeholder="ornek@email.com"
                        value={enrollForm.studentEmail}
                        onChange={(e) => setEnrollForm(prev => ({ ...prev, studentEmail: e.target.value }))}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                    {errors.enroll && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {errors.enroll}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading.enrolling}
                      className="w-full py-3 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading.enrolling ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                      {loading.enrolling ? 'Ekleniyor...' : 'Öğrenci Ekle'}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-xl bg-linear-to-br from-orange-500 to-pink-600 shadow-lg shadow-orange-500/30">
                  <ClipboardCheck className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">Teslimler & Not Verme</h2>
              </div>

              {loading.courses ? <CardLoader /> : courses.length === 0 ? (
                <EmptyState message="Henüz ders yok" />
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                    >
                      {courses.map((course) => (
                        <option key={course.id} value={course.id} className="bg-slate-800">{course.name || course.title}</option>
                      ))}
                    </select>
                    <button
                      onClick={fetchSubmissions}
                      disabled={loading.submissions}
                      className="px-6 py-3 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading.submissions ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                      {loading.submissions ? 'Yükleniyor...' : 'Teslimleri Getir'}
                    </button>
                  </div>

                  {errors.submissions && (
                    <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      {errors.submissions}
                    </div>
                  )}

                  {submissions.length === 0 ? (
                    <EmptyState message="Teslimleri görmek için yukarıdan bir ders seçin ve 'Teslimleri Getir' butonuna tıklayın" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-4 text-emerald-200/70 font-medium">Öğrenci</th>
                            <th className="text-left py-3 px-4 text-emerald-200/70 font-medium">Ödev</th>
                            <th className="text-left py-3 px-4 text-emerald-200/70 font-medium">Teslim Tarihi</th>
                            <th className="text-left py-3 px-4 text-emerald-200/70 font-medium">Durum</th>
                            <th className="text-left py-3 px-4 text-emerald-200/70 font-medium">Not Ver</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.map((submission) => (
                            <tr key={submission.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-4 px-4 text-white">{submission.studentName || submission.studentEmail}</td>
                              <td className="py-4 px-4 text-white">{submission.assignmentTitle}</td>
                              <td className="py-4 px-4 text-emerald-200/60">{new Date(submission.submittedAt || submission.submissionDate).toLocaleDateString('tr-TR')}</td>
                              <td className="py-4 px-4">
                                <span className={`px-2 py-1 rounded-md text-xs ${submission.graded ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                  {submission.graded ? `Not: ${submission.grade}` : 'Bekliyor'}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={grades[submission.id] || ''}
                                    onChange={(e) => setGrades(prev => ({ ...prev, [submission.id]: e.target.value }))}
                                    placeholder="0-100"
                                    className="w-20 px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white text-center focus:outline-none focus:border-emerald-500/50"
                                  />
                                  <button
                                    onClick={() => handleGradeSubmission(submission.id)}
                                    disabled={loading.grading[submission.id]}
                                    className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 transition-all disabled:opacity-50"
                                  >
                                    {loading.grading[submission.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kaydet'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* ===================== BEKLEYEN ETKİNLİKLER ===================== */}
        {activeTab === 'pendingEvents' && (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-white/5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Etkinlik Yönetimi</h2>
                    <p className="text-sm text-emerald-200/60 mt-0.5">Danışmanı olduğunuz kulüplerin etkinliklerini yönetin</p>
                  </div>
                </div>

                {/* Arama */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Etkinlik ara..."
                    value={eventSearchTerm}
                    onChange={(e) => setEventSearchTerm(e.target.value)}
                    className="pl-4 pr-4 py-2 rounded-xl border w-64 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-white/5 border-white/20 text-slate-200 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Filtreler */}
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  { label: '⏳ Bekleyen', value: 'PENDING', count: pendingEvents.length },
                  { label: '📅 Onaylanan', value: 'APPROVED' },
                  { label: '🕒 Geçmiş', value: 'PAST' },
                  { label: '❌ Reddedilen', value: 'REJECTED' },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setEventFilter(filter.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${eventFilter === filter.value
                      ? 'bg-linear-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                      : 'bg-slate-700/60 text-slate-200 hover:bg-slate-600/70 border border-slate-600/50'
                      }`}
                  >
                    {filter.label}
                    {filter.count !== undefined && filter.count > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs">{filter.count}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Etkinlik Listesi */}
            {eventsLoading ? (
              <CardLoader />
            ) : filteredEvents.length === 0 ? (
              <EmptyState message={eventFilter === 'PENDING' ? "Bekleyen etkinlik bulunmuyor." : "Bu kategoride etkinlik yok."} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-linear-to-r from-amber-600 to-orange-600">
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Etkinlik</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Kulüp</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Tarih & Konum</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Durum</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredEvents.map((event, index) => (
                      <tr key={event.id || index} className="hover:bg-white/5 transition-all duration-300">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {event.imageUrl ? (
                              <img src={event.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                                🎉
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-white">{event.title || event.eventName}</p>
                              <p className="text-xs text-gray-400">{event.description?.substring(0, 60) || ''}{event.description?.length > 60 ? '...' : ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-emerald-300 text-sm font-medium">{event.clubName || 'Bilinmiyor'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-slate-200 text-sm">{parseDate(event)?.toLocaleDateString('tr-TR') || 'Tarih Yok'}</p>
                            <p className="text-xs text-gray-500">{event.location || 'Online'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${(event.status === 'ACTIVE' || event.status === 'APPROVED')
                              ? (parseDate(event) && parseDate(event) < new Date() ? 'bg-gray-500/20 text-gray-300' : 'bg-emerald-500/20 text-emerald-300')
                              : event.status === 'PENDING'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                            {event.status === 'ACTIVE' || event.status === 'APPROVED'
                              ? (parseDate(event) && parseDate(event) < new Date() ? 'GEÇMİŞ' : 'ONAYLI')
                              : event.status === 'PENDING' ? 'BEKLİYOR' : 'REDDEDİLDİ'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {event.status === 'PENDING' ? (
                              <>
                                <button
                                  onClick={() => handleApproveEvent(event.id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm transition-all flex items-center gap-1 hover:scale-105"
                                >
                                  <Check className="w-4 h-4" /> Onayla
                                </button>
                                <button
                                  onClick={() => handleRejectEvent(event.id)}
                                  className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm transition-all flex items-center gap-1 hover:scale-105"
                                >
                                  <X className="w-4 h-4" /> Reddet
                                </button>
                              </>
                            ) : (
                              <span className="text-sm text-gray-500">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default InstructorDashboard;
