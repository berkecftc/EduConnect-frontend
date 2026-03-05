import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { createPost } from '../../api/postService';
import { Loader2, ChevronLeft, Send, Megaphone, BookOpen, HelpCircle, Check, Home } from 'lucide-react';

const CATEGORIES = [
    { value: 'DUYURU', label: 'Duyuru', icon: Megaphone, color: 'from-rose-500 to-pink-600' },
    { value: 'DERS_NOTU', label: 'Ders Notu', icon: BookOpen, color: 'from-blue-500 to-cyan-600' },
    { value: 'SORU', label: 'Soru', icon: HelpCircle, color: 'from-amber-500 to-orange-600' },
];

function PostCreate() {
    const navigate = useNavigate();
    const { role } = useSelector((state) => state.auth);

    const getDashboardPath = () => {
        if (role?.includes('ROLE_CLUB_OFFICIAL')) return '/clubofficial/dashboard';
        return '/student/dashboard';
    };
    const [form, setForm] = useState({ title: '', content: '', category: 'DUYURU' });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

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
            const created = await createPost({
                title: form.title.trim(),
                content: form.content.trim(),
                category: form.category,
            });
            // Post ID'sini localStorage'a kaydet (durum takibi için)
            if (created?.id) {
                const myPosts = JSON.parse(localStorage.getItem('myPostIds') || '[]');
                if (!myPosts.includes(created.id)) {
                    myPosts.push(created.id);
                    localStorage.setItem('myPostIds', JSON.stringify(myPosts));
                }
            }
            setShowSuccess(true);
            setTimeout(() => {
                navigate('/posts');
            }, 2000);
        } catch (err) {
            setApiError(err.response?.data?.message || 'Gönderi oluşturulurken bir hata oluştu');
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

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 backdrop-blur-xl shadow-lg animate-fade-in">
                    <Check className="w-5 h-5" />
                    <span>Post oluşturuldu! Moderasyon sonrası yayınlanacak.</span>
                </div>
            )}

            <div className="relative z-10 p-4 md:p-8 max-w-3xl mx-auto">
                {/* Navigation buttons */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate(getDashboardPath())}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-300"
                    >
                        <Home className="w-4 h-4" />
                        Panele Dön
                    </button>
                    <button
                        onClick={() => navigate('/posts')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-300"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Postlara Dön
                    </button>
                </div>

                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="h-2 bg-linear-to-r from-indigo-500 to-purple-600" />

                    <div className="p-6 md:p-8">
                        <h1 className="text-2xl font-bold text-white mb-6">Yeni Gönderi Oluştur</h1>

                        {apiError && (
                            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                                {apiError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Category Selection */}
                            <div>
                                <label className="block text-sm font-medium text-purple-200/80 mb-3">Kategori</label>
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
                                                    ? `bg-linear-to-br ${cat.color} border-transparent text-white shadow-lg`
                                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
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
                                <label className="block text-sm font-medium text-purple-200/80 mb-2">Başlık</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    maxLength={255}
                                    placeholder="Gönderi başlığını yazın..."
                                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${errors.title ? 'border-red-500/50' : 'border-white/10'
                                        } text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all`}
                                />
                                <div className="flex justify-between mt-1">
                                    {errors.title && <p className="text-red-400 text-xs">{errors.title}</p>}
                                    <span className="text-xs text-purple-200/40 ml-auto">{form.title.length}/255</span>
                                </div>
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-sm font-medium text-purple-200/80 mb-2">İçerik</label>
                                <textarea
                                    value={form.content}
                                    onChange={(e) => handleChange('content', e.target.value)}
                                    rows={10}
                                    placeholder="Gönderi içeriğini yazın..."
                                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${errors.content ? 'border-red-500/50' : 'border-white/10'
                                        } text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-y min-h-[200px]`}
                                />
                                {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content}</p>}
                            </div>

                            {/* Info Banner */}
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                <span className="text-lg mt-0.5">ℹ️</span>
                                <p className="text-indigo-300 text-sm">
                                    Gönderiniz oluşturulduktan sonra moderasyon sürecinden geçecek. Onaylandıktan sonra herkes tarafından görüntülenebilir olacaktır.
                                </p>
                            </div>

                            {/* Submit */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => navigate('/posts')}
                                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    {submitting ? 'Gönderiliyor...' : 'Paylaş'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PostCreate;
