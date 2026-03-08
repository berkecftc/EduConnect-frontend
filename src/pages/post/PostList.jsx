import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getPosts, getPost, toggleLike, toggleSave, getSavedPosts } from '../../api/postService';
import { Loader2, Plus, ArrowLeft, ArrowRight, Megaphone, BookOpen, HelpCircle, FileText, Home, AlertTriangle, Clock, X, Heart, MessageCircle, Bookmark } from 'lucide-react';

const CATEGORY_MAP = {
    DUYURU: { label: 'Duyuru', color: 'from-rose-500 to-pink-600', bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-500/30' },
    DERS_NOTU: { label: 'Ders Notu', color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-500/30' },
    SORU: { label: 'Soru', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-500/30' },
};

const CATEGORIES = ['ALL', 'DUYURU', 'DERS_NOTU', 'SORU'];

function PostList() {
    const navigate = useNavigate();
    const { role } = useSelector((state) => state.auth);

    const getDashboardPath = () => {
        if (role?.includes('ROLE_CLUB_OFFICIAL')) return '/clubofficial/dashboard';
        if (role?.includes('ROLE_ADMIN')) return '/admin/dashboard';
        if (role?.includes('ROLE_ACADEMICIAN')) return '/instructor/dashboard';
        return '/student/dashboard';
    };

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [showSavedOnly, setShowSavedOnly] = useState(false);

    const [myPostStatuses, setMyPostStatuses] = useState([]);
    const [dismissedAlerts, setDismissedAlerts] = useState([]);

    const PAGE_SIZE = 9;

    useEffect(() => {
        setPage(0);
    }, [showSavedOnly]);

    useEffect(() => {
        fetchPosts();
        checkMyPostStatuses();
    }, [page, showSavedOnly]); // Changed dependency

    const fetchPosts = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = showSavedOnly ? await getSavedPosts(page, PAGE_SIZE) : await getPosts(page, PAGE_SIZE);
            setPosts(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (err) {
            setError(err.response?.data?.message || 'Gönderiler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const checkMyPostStatuses = async () => {
        try {
            const myPostIds = JSON.parse(localStorage.getItem('myPostIds') || '[]');
            if (myPostIds.length === 0) return;

            const statusResults = [];
            const validIds = [];

            for (const postId of myPostIds) {
                try {
                    const post = await getPost(postId);
                    if (post.status === 'REJECTED' || post.status === 'PENDING') {
                        statusResults.push({ id: post.id, title: post.title, status: post.status });
                    }
                    validIds.push(postId);
                } catch { }
            }
            localStorage.setItem('myPostIds', JSON.stringify(validIds));
            setMyPostStatuses(statusResults);
        } catch { }
    };

    const handleDismissAlert = (postId) => {
        setDismissedAlerts(prev => [...prev, postId]);
    };

    const visibleAlerts = myPostStatuses.filter(p => !dismissedAlerts.includes(p.id));
    const rejectedAlerts = visibleAlerts.filter(p => p.status === 'REJECTED');
    const pendingAlerts = visibleAlerts.filter(p => p.status === 'PENDING');

    const filteredPosts = selectedCategory === 'ALL' ? posts : posts.filter(post => post.category === selectedCategory);

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'DUYURU': return <Megaphone className="w-4 h-4" />;
            case 'DERS_NOTU': return <BookOpen className="w-4 h-4" />;
            case 'SORU': return <HelpCircle className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try { return new Date(dateStr).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return ''; }
    };

    const truncateContent = (content, maxLen = 120) => {
        if (!content) return '';
        return content.length <= maxLen ? content : content.substring(0, maxLen) + '...';
    };

    const handleLike = async (e, postId) => {
        e.stopPropagation();
        try {
            await toggleLike(postId);
            setPosts(posts.map(post => {
                if (post.id === postId) {
                    const isLiked = !post.isLiked;
                    return { ...post, isLiked, likeCount: (post.likeCount || 0) + (isLiked ? 1 : -1) };
                }
                return post;
            }));
        } catch (err) {
            console.error('Like toggle failed', err);
        }
    };

    const handleSave = async (e, postId) => {
        e.stopPropagation();
        try {
            await toggleSave(postId);
            setPosts(posts.map(post => {
                if (post.id === postId) {
                    return { ...post, isSaved: !post.isSaved };
                }
                return post;
            }));
        } catch (err) {
            console.error('Save toggle failed', err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
            <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-8 shadow-sm transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(getDashboardPath())}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                <span className="text-sm">Ana Sayfa</span>
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    Öğrenci Forumu
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">{totalElements} gönderi bulundu</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/posts/new')}
                            className="group flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-blue-500/25"
                        >
                            <Plus className="w-5 h-5 transition-transform group-hover:scale-110" />
                            <span>Yeni Gönderi</span>
                        </button>
                    </div>

                    {/* Category Filters */}
                    <div className="flex flex-wrap gap-2 mt-6">
                        {CATEGORIES.map((cat) => {
                            const isActive = selectedCategory === cat;
                            const catInfo = CATEGORY_MAP[cat];
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${isActive
                                        ? cat === 'ALL'
                                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent'
                                            : `${catInfo.bg} ${catInfo.border} ${catInfo.text}`
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {cat === 'ALL' ? <FileText className="w-4 h-4" /> : getCategoryIcon(cat)}
                                    {cat === 'ALL' ? 'Tümü' : catInfo.label}
                                </button>
                            );
                        })}

                        {/* Saved Posts Toggle */}
                        <div className="md:ml-auto flex items-center pt-2 md:pt-0">
                            <button
                                onClick={() => setShowSavedOnly(!showSavedOnly)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${showSavedOnly
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                <Bookmark className={`w-4 h-4 ${showSavedOnly ? 'fill-current' : ''}`} />
                                Kaydedilenler
                            </button>
                        </div>
                    </div>
                </header>

                {/* Alerts */}
                {rejectedAlerts.length > 0 && (
                    <div className="space-y-3 mb-6">
                        {rejectedAlerts.map((post) => (
                            <div key={post.id} className="flex items-center gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 shadow-sm">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                <div className="flex-1">
                                    <p className="text-red-700 dark:text-red-300 font-medium text-sm">Gönderiniz reddedildi</p>
                                    <p className="text-red-600 dark:text-red-400/80 text-xs mt-0.5">&quot;{post.title}&quot; başlıklı gönderiniz moderasyon tarafından onaylanmadı.</p>
                                </div>
                                <button onClick={() => navigate(`/posts/${post.id}`)} className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-700 dark:text-red-300 text-xs transition-colors">Detay</button>
                                <button onClick={() => handleDismissAlert(post.id)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg"><X className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                )}
                {pendingAlerts.length > 0 && (
                    <div className="space-y-3 mb-6">
                        {pendingAlerts.map((post) => (
                            <div key={post.id} className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 shadow-sm">
                                <Clock className="w-6 h-6 text-amber-500" />
                                <div className="flex-1">
                                    <p className="text-amber-700 dark:text-amber-300 font-medium text-sm">Gönderiniz inceleniyor</p>
                                    <p className="text-amber-600 dark:text-amber-400/80 text-xs mt-0.5">&quot;{post.title}&quot; sürecinden geçiyor.</p>
                                </div>
                                <button onClick={() => handleDismissAlert(post.id)} className="p-1.5 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-lg"><X className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-8 text-center">
                        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                        <button onClick={fetchPosts} className="px-4 py-2 bg-red-100 lg:hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 rounded-xl text-red-700 dark:text-red-300 transition-colors">Tekrar Dene</button>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
                        <FileText className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Bu kategoride henüz gönderi yok</p>
                        <p className="text-slate-500 dark:text-slate-500 mt-2 text-sm">İlk gönderiyi oluşturmak için "Yeni Gönderi" butonuna tıklayabilirsiniz.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPosts.map((post) => {
                                const catInfo = CATEGORY_MAP[post.category] || CATEGORY_MAP['DUYURU'];
                                return (
                                    <div
                                        key={post.id}
                                        onClick={() => navigate(`/posts/${post.id}`)}
                                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col"
                                    >
                                        <div className={`h-1.5 bg-linear-to-r ${catInfo.color}`} />
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${catInfo.bg} ${catInfo.text}`}>
                                                    {getCategoryIcon(post.category)}
                                                    {catInfo.label}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(post.createdAt)}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {post.title}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6 flex-1 line-clamp-3">
                                                {truncateContent(post.content)}
                                            </p>
                                            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{post.authorName || 'Öğrenci'}</span>
                                                        {post.authorDepartment && <span className="text-xs text-slate-500 dark:text-slate-500">{post.authorDepartment}</span>}
                                                    </div>
                                                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:underline">Devamı →</span>
                                                </div>

                                                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={(e) => handleLike(e, post.id)}
                                                            className={`flex items-center gap-1.5 transition-colors ${post.isLiked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500 dark:hover:text-red-400'}`}
                                                        >
                                                            <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current text-red-500' : ''}`} />
                                                            <span className="text-xs font-medium">{post.likeCount || 0}</span>
                                                        </button>
                                                        <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                                                            <MessageCircle className="w-4 h-4" />
                                                            <span className="text-xs font-medium">{post.commentCount || 0}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleSave(e, post.id)}
                                                        className={`transition-colors flex items-center gap-1 ${post.isSaved ? 'text-blue-500 hover:text-blue-600' : 'hover:text-blue-500 dark:hover:text-blue-400'}`}
                                                    >
                                                        <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-current text-blue-500' : ''}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" /> Önceki
                                </button>
                                <div className="flex gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button key={i} onClick={() => setPage(i)} className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${i === page ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                                    Sonraki <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default PostList;
