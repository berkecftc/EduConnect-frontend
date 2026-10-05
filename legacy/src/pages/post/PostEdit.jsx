import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getPost, updatePost } from '../../api/postService';
import { Loader2, ChevronLeft, Save, Megaphone, BookOpen, HelpCircle, Check, AlertTriangle, Home } from 'lucide-react';

const CATEGORIES = [
    { value: 'DUYURU', label: 'Duyuru', icon: Megaphone, color: 'from-rose-500 to-pink-600' },
    { value: 'DERS_NOTU', label: 'Ders Notu', icon: BookOpen, color: 'from-blue-500 to-cyan-600' },
    { value: 'SORU', label: 'Soru', icon: HelpCircle, color: 'from-amber-500 to-orange-600' },
];

function PostEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userId, role } = useSelector((state) => state.auth);

    const getDashboardPath = () => {
        if (role?.includes('ROLE_CLUB_OFFICIAL')) return '/clubofficial/dashboard';
        return '/student/dashboard';
    };

    const [form, setForm] = useState({ title: '', content: '', category: 'DUYURU' });
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        fetchPost();
    }, [id]);

    const fetchPost = async () => {
        setLoading(true);
        try {
            const data = await getPost(id);
            // Yazar kontrolü
            if (data.authorId !== userId) {
                navigate('/posts', { replace: true });
                return;
            }
            setForm({
                title: data.title || '',
                content: data.content || '',
                category: data.category || 'DUYURU',
            });
        } catch (err) {
            setApiError(err.response?.data?.message || 'Gönderi yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const validate = () => {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Başlık zorunludur';
        else if (form.title.length > 255) errs.title = 'Başlık en fazla 255 karakter olabilir';
        if (!form.content.trim()) errs.content = 'İçerik zorunludur';
        if (!form.category) errs.category = 'Kategori seçiniz';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        setApiError(null);
        try {
            await updatePost(id, {
                title: form.title.trim(),
                content: form.content.trim(),
                category: form.category,
            });
            setShowSuccess(true);
            setTimeout(() => {
                navigate(`/posts/${id}`);
            }, 2000);
        } catch (err) {
            if (err.response?.status === 403) {
                setApiError('Bu gönderiyi düzenleme yetkiniz yok');
            } else {
                setApiError(err.response?.data?.message || 'Gönderi güncellenirken bir hata oluştu');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300  shadow-lg">
                    <Check className="w-5 h-5" />
                    <span>Gönderi güncellendi! Tekrar moderasyona gönderildi.</span>
                </div>
            )}

            <div className="relative z-10 p-4 md:p-8 max-w-3xl mx-auto">
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
                        onClick={() => navigate(`/posts/${id}`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-white/20 border border-slate-200 text-slate-900 transition-all duration-300"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Gönderiye Dön
                    </button>
                </div>

                <div className=" bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="h-2 bg-linear-to-r from-blue-500 to-cyan-600" />

                    <div className="p-6 md:p-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-6">Gönderiyi Düzenle</h1>

                        {apiError && (
                            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                {apiError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Category Selection */}
                            <div>
                                <label className="block text-sm font-medium text-blue-600/80 mb-3">Kategori</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {CATEGORIES.map((cat) => {
                                        const isActive = form.category === cat.value;
                                        const Icon = cat.icon;
                                        return (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                onClick={() => handleChange('category', cat.value)}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${isActive
                                                    ? `bg-linear-to-br ${cat.color} border-transparent text-slate-900 shadow-lg`
                                                    : 'bg-white border-slate-200 text-slate-900/60 hover:bg-white hover:text-slate-900'
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="text-sm font-medium">{cat.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.category && <p className="text-red-400 text-xs mt-2">{errors.category}</p>}
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-blue-600/80 mb-2">Başlık</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    maxLength={255}
                                    placeholder="Gönderi başlığını yazın..."
                                    className={`w-full px-4 py-3 rounded-xl bg-white border ${errors.title ? 'border-red-500/50' : 'border-slate-200'
                                        } text-slate-900 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all`}
                                />
                                <div className="flex justify-between mt-1">
                                    {errors.title && <p className="text-red-400 text-xs">{errors.title}</p>}
                                    <span className="text-xs text-slate-500 ml-auto">{form.title.length}/255</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-sm font-medium text-blue-600/80 mb-2">İçerik</label>
                                <textarea
                                    value={form.content}
                                    onChange={(e) => handleChange('content', e.target.value)}
                                    rows={10}
                                    placeholder="Gönderi içeriğini yazın..."
                                    className={`w-full px-4 py-3 rounded-xl bg-white border ${errors.content ? 'border-red-500/50' : 'border-slate-200'
                                        } text-slate-900 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-y min-h-[200px]`}
                                />
                                {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content}</p>}
                            </div>

                            {/* Warning Banner */}
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <span className="text-lg mt-0.5">⚠️</span>
                                <p className="text-amber-300 text-sm">
                                    Gönderiyi güncelledikten sonra tekrar moderasyon sürecinden geçecektir. Bu sürede gönderi diğer kullanıcılara görünmeyecektir.
                                </p>
                            </div>

                            {/* Submit */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/posts/${id}`)}
                                    className="px-5 py-2.5 rounded-xl bg-white hover:bg-white/20 border border-slate-200 text-slate-900 transition-all"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 rounded-xl text-slate-900 font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PostEdit;
