import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getPost, deletePost } from '../../api/postService';
import { Loader2, ChevronLeft, Edit3, Trash2, Megaphone, BookOpen, HelpCircle, Clock, AlertTriangle, Home } from 'lucide-react';

const CATEGORY_MAP = {
    DUYURU: { label: 'Duyuru', color: 'from-rose-500 to-pink-600', bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30', icon: Megaphone },
    DERS_NOTU: { label: 'Ders Notu', color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30', icon: BookOpen },
    SORU: { label: 'Soru', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', icon: HelpCircle },
};

const STATUS_MAP = {
    PENDING: { label: 'İnceleniyor', bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
    PUBLISHED: { label: 'Yayında', bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
    REJECTED: { label: 'Reddedildi', bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
};

function PostDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userId, role } = useSelector((state) => state.auth);

    const getDashboardPath = () => {
        if (role?.includes('ROLE_CLUB_OFFICIAL')) return '/clubofficial/dashboard';
        return '/student/dashboard';
    };

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchPost();
    }, [id]);

    const fetchPost = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPost(id);
            setPost(data);
        } catch (err) {
            if (err.response?.status === 404) {
                setError('Gönderi bulunamadı');
            } else {
                setError(err.response?.data?.message || 'Gönderi yüklenirken bir hata oluştu');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deletePost(id);
            navigate('/posts', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Gönderi silinirken bir hata oluştu');
            setShowDeleteModal(false);
        } finally {
            setDeleting(false);
        }
    };

    const isAuthor = post && userId && post.authorId === userId;
    const catInfo = post ? (CATEGORY_MAP[post.category] || CATEGORY_MAP['DUYURU']) : null;
    const statusInfo = post ? (STATUS_MAP[post.status] || STATUS_MAP['PENDING']) : null;

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('tr-TR', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            });
        } catch { return ''; }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="relative z-10 p-4 md:p-8 max-w-4xl mx-auto">
                {/* Navigation buttons */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate(getDashboardPath())}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-white/20 border border-slate-200 text-slate-900 transition-all duration-300"
                    >
                        <Home className="w-4 h-4" />
                        Panele Dön
                    </button>
                    <button
                        onClick={() => navigate('/posts')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-white/20 border border-slate-200 text-slate-900 transition-all duration-300"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Postlara Dön
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                    </div>
                ) : error ? (
                    <div className=" bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <p className="text-red-300 text-lg">{error}</p>
                        <button
                            onClick={() => navigate('/posts')}
                            className="mt-4 px-4 py-2 bg-white hover:bg-white/20 rounded-xl text-slate-900 border border-slate-200 transition-all"
                        >
                            Postlara Geri Dön
                        </button>
                    </div>
                ) : post ? (
                    <article className=" bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Category gradient bar */}
                        <div className={`h-2 bg-linear-to-r ${catInfo.color}`} />

                        <div className="p-6 md:p-8">
                            {/* Status banner for PENDING */}
                            {post.status === 'PENDING' && (
                                <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                    <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                                    <p className="text-amber-300 text-sm">
                                        Bu gönderi moderasyon sürecinde inceleniyor. Onaylandıktan sonra herkese görünür olacak.
                                    </p>
                                </div>
                            )}

                            {post.status === 'REJECTED' && (
                                <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                                    <p className="text-red-300 text-sm">
                                        Bu gönderi moderasyon tarafından reddedildi.
                                    </p>
                                </div>
                            )}

                            {/* Meta info */}
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                {/* Category badge */}
                                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${catInfo.bg} ${catInfo.text} border ${catInfo.border}`}>
                                    <catInfo.icon className="w-3.5 h-3.5" />
                                    {catInfo.label}
                                </span>
                                {/* Status badge */}
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusInfo.bg} ${statusInfo.text} border ${statusInfo.border}`}>
                                    {statusInfo.label}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 leading-tight">
                                {post.title}
                            </h1>

                            {/* Date info */}
                            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-slate-500/80">
                                <span>📅 {formatDate(post.createdAt)}</span>
                                {post.updatedAt && (
                                    <span>✏️ Güncellenme: {formatDate(post.updatedAt)}</span>
                                )}
                            </div>

                            {/* Author info */}
                            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-200">
                                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-slate-900 font-bold text-sm shadow-lg">
                                    {(post.authorName || 'A').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-slate-900 font-medium text-sm">{post.authorName || 'Anonim'}</p>
                                    {post.authorDepartment && (
                                        <p className="text-slate-500/80 text-xs">🎓 {post.authorDepartment}</p>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base">
                                {post.content}
                            </div>

                            {/* Author actions */}
                            {isAuthor && (
                                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-200">
                                    <button
                                        onClick={() => navigate(`/posts/${post.id}/edit`)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-300 transition-all duration-300 hover:scale-105"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Düzenle
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-300 transition-all duration-300 hover:scale-105"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Sil
                                    </button>
                                </div>
                            )}
                        </div>
                    </article>
                ) : null}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className=" bg-white/90 border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 rounded-xl bg-red-500/20">
                                    <Trash2 className="w-6 h-6 text-red-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900">Gönderiyi Sil</h3>
                            </div>
                            <p className="text-slate-500 mb-6">
                                Bu gönderiyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={deleting}
                                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-white/20 border border-slate-200 text-slate-900 transition-all"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 transition-all disabled:opacity-50"
                                >
                                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    {deleting ? 'Siliniyor...' : 'Evet, Sil'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PostDetail;
