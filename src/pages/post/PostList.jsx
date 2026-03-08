import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getPosts, getPost } from '../../api/postService';
import { Loader2, Plus, ArrowLeft, ArrowRight, Megaphone, BookOpen, HelpCircle, FileText, Home, AlertTriangle, Clock, X } from 'lucide-react';

const CATEGORY_MAP = {
    DUYURU: { label: 'Duyuru', color: 'from-rose-500 to-pink-600', bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30' },
    DERS_NOTU: { label: 'Ders Notu', color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
    SORU: { label: 'Soru', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
};

const CATEGORIES = ['ALL', 'DUYURU', 'DERS_NOTU', 'SORU'];

function PostList() {
    const navigate = useNavigate();
    const { role } = useSelector((state) => state.auth);

    const getDashboardPath = () => {
        if (role?.includes('ROLE_CLUB_OFFICIAL')) return '/clubofficial/dashboard';
        return '/student/dashboard';
    };
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState('ALL');

    // Kullanıcının kendi postlarının durum takibi
    const [myPostStatuses, setMyPostStatuses] = useState([]);
    const [dismissedAlerts, setDismissedAlerts] = useState([]);

    const PAGE_SIZE = 9;

    useEffect(() => {
        fetchPosts();
        checkMyPostStatuses();
    }, [page]);

    const fetchPosts = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPosts(page, PAGE_SIZE);
            setPosts(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (err) {
            setError(err.response?.data?.message || 'Postlar yüklenirken bir hata oluştu');
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
                        statusResults.push({
                            id: post.id,
                            title: post.title,
                            status: post.status,
                        });
                    }
                    validIds.push(postId);
                } catch {
                    // Post silinmiş veya erişilemiyorsa listeden çıkar
                }
            }

            // Artık var olmayan postları localStorage'dan temizle
            localStorage.setItem('myPostIds', JSON.stringify(validIds));
            setMyPostStatuses(statusResults);
        } catch {
            // Sessizce geç
        }
    };

    const handleDismissAlert = (postId) => {
        setDismissedAlerts(prev => [...prev, postId]);
    };

    const visibleAlerts = myPostStatuses.filter(p => !dismissedAlerts.includes(p.id));
    const rejectedAlerts = visibleAlerts.filter(p => p.status === 'REJECTED');
    const pendingAlerts = visibleAlerts.filter(p => p.status === 'PENDING');

    const filteredPosts = selectedCategory === 'ALL'
        ? posts
        : posts.filter(post => post.category === selectedCategory);

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
        try {
            return new Date(dateStr).toLocaleDateString('tr-TR', {
                year: 'numeric', month: 'long', day: 'numeric',
            });
        } catch { return ''; }
    };

    const truncateContent = (content, maxLen = 120) => {
        if (!content) return '';
        if (content.length <= maxLen) return content;
        return content.substring(0, maxLen) + '...';
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <header className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-8 shadow-2xl">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(getDashboardPath())}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-300"
                            >
                                <Home className="w-4 h-4" />
                                <span className="text-sm">Panele Dön</span>
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold bg-linear-to-r from-white to-blue-200 bg-clip-text text-transparent">
                                    Postlar
                                </h1>
                                <p className="text-slate-400 mt-1">{totalElements} gönderi bulundu</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/posts/new')}
                            className="group flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/30"
                        >
                            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                            <span>Yeni Post</span>
                        </button>
                    </div>

                    {/* Category Filters */}
                    <div className="flex flex-wrap gap-2 mt-5">
                        {CATEGORIES.map((cat) => {
                            const isActive = selectedCategory === cat;
                            const catInfo = CATEGORY_MAP[cat];
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border ${isActive
                                        ? cat === 'ALL'
                                            ? 'bg-white/20 border-white/40 text-white'
                                            : `${catInfo.bg} ${catInfo.border} ${catInfo.text}`
                                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80'
                                        }`}
                                >
                                    {cat === 'ALL' ? <FileText className="w-4 h-4" /> : getCategoryIcon(cat)}
                                    {cat === 'ALL' ? 'Tümü' : catInfo.label}
                                </button>
                            );
                        })}
                    </div>
                </header>

                {/* Reddedilen Post Uyarıları */}
                {rejectedAlerts.length > 0 && (
                    <div className="space-y-3 mb-6">
                        {rejectedAlerts.map((post) => (
                            <div
                                key={post.id}
                                className="flex items-center gap-3 p-4 rounded-2xl backdrop-blur-xl bg-red-500/10 border border-red-500/20 shadow-lg"
                            >
                                <div className="p-2 rounded-xl bg-red-500/20 shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-red-300 font-medium text-sm">Gönderiniz reddedildi</p>
                                    <p className="text-red-300/70 text-xs mt-0.5 truncate">
                                        &quot;{post.title}&quot; başlıklı gönderiniz moderasyon tarafından reddedildi.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate(`/posts/${post.id}`)}
                                    className="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs transition-all"
                                >
                                    Detay
                                </button>
                                <button
                                    onClick={() => handleDismissAlert(post.id)}
                                    className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-red-300/60 hover:text-red-300 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bekleyen Post Bilgilendirmesi */}
                {pendingAlerts.length > 0 && (
                    <div className="space-y-3 mb-6">
                        {pendingAlerts.map((post) => (
                            <div
                                key={post.id}
                                className="flex items-center gap-3 p-4 rounded-2xl backdrop-blur-xl bg-amber-500/10 border border-amber-500/20 shadow-lg"
                            >
                                <div className="p-2 rounded-xl bg-amber-500/20 shrink-0">
                                    <Clock className="w-5 h-5 text-amber-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-amber-300 font-medium text-sm">Gönderiniz inceleniyor</p>
                                    <p className="text-amber-300/70 text-xs mt-0.5 truncate">
                                        &quot;{post.title}&quot; başlıklı gönderiniz moderasyon sürecinde. Onaylandıktan sonra yayınlanacak.
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDismissAlert(post.id)}
                                    className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-amber-300/60 hover:text-amber-300 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
                        <p className="text-red-300">{error}</p>
                        <button onClick={fetchPosts} className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-300 border border-red-500/30 transition-all">
                            Tekrar Dene
                        </button>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                            <FileText className="w-10 h-10 text-blue-300/50" />
                        </div>
                        <p className="text-slate-400 text-lg">Henüz gönderi yok</p>
                        <p className="text-slate-500 mt-2">İlk gönderiyi oluşturmak için &quot;Yeni Post&quot; butonuna tıklayın.</p>
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
                                        className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:bg-white/15 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer"
                                    >
                                        {/* Category gradient bar */}
                                        <div className={`h-1.5 bg-linear-to-r ${catInfo.color}`} />

                                        <div className="p-5">
                                            {/* Category badge + date */}
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium ${catInfo.bg} ${catInfo.text} border ${catInfo.border}`}>
                                                    {getCategoryIcon(post.category)}
                                                    {catInfo.label}
                                                </span>
                                                <span className="text-xs text-slate-400/80">
                                                    {formatDate(post.createdAt)}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-200 transition-colors">
                                                {post.title}
                                            </h3>

                                            {/* Content preview */}
                                            <p className="text-sm text-slate-400 leading-relaxed">
                                                {truncateContent(post.content)}
                                            </p>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-400">
                                                        ✍️ {post.authorName || 'Anonim'}
                                                    </span>
                                                    {post.authorDepartment && (
                                                        <span className="text-xs text-slate-500">
                                                            🎓 {post.authorDepartment}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-blue-300 group-hover:text-blue-200 transition-colors">
                                                    Devamını oku →
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-8">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Önceki
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPage(i)}
                                            className={`w-10 h-10 rounded-xl text-sm font-medium transition-all duration-300 ${i === page
                                                ? 'bg-linear-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                                                : 'bg-white/5 text-white/60 hover:bg-white/15 hover:text-white'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
                                >
                                    Sonraki
                                    <ArrowRight className="w-4 h-4" />
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
