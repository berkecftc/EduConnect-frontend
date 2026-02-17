import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import './ResetPassword.css';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setStatus('error');
            setMessage('Şifreler eşleşmiyor.');
            return;
        }

        if (newPassword.length < 6) {
            setStatus('error');
            setMessage('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            await api.post('/auth/reset-password', {
                token,
                newPassword,
                confirmPassword
            });
            setStatus('success');
            setMessage('Şifreniz başarıyla sıfırlandı! Giriş sayfasına yönlendiriliyorsunuz...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            setStatus('error');
            const errorMsg = error.response?.data?.message
                || error.response?.data
                || 'Bir hata oluştu. Bağlantı süresi dolmuş olabilir.';
            setMessage(typeof errorMsg === 'string' ? errorMsg : 'Bir hata oluştu. Lütfen tekrar deneyin.');
        }
    };

    if (!token) {
        return (
            <div className="rp-container">
                <div className="rp-form-side rp-full-width">
                    <div className="rp-form-wrapper">
                        <div className="rp-form-header">
                            <div className="rp-form-logo-icon rp-logo-error">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <h2>Geçersiz Bağlantı</h2>
                            <p>Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.</p>
                        </div>
                        <div className="rp-form-footer">
                            <Link to="/forgot-password" className="rp-back-link">Yeni Bağlantı Talep Et →</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rp-container">
            {/* Left Side - Visual & Info */}
            <div className="rp-visual-side">
                <div className="rp-visual-content">
                    <div className="rp-brand-header">
                        <h1 className="rp-brand-title">EduConnect</h1>
                        <p className="rp-brand-slogan">Eğitimin Geleceği Burada</p>
                    </div>

                    <div className="rp-hero-ornament">
                        <div className="rp-ornament-circle rp-circle-1"></div>
                        <div className="rp-ornament-circle rp-circle-2"></div>
                        <div className="rp-ornament-glass">
                            <div className="rp-glass-content">
                                <h3>Yeni Şifre Belirleme</h3>
                                <p>Güvenli bir şifre belirleyerek hesabınıza yeniden erişim sağlayın.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rp-bg-gradient-overlay"></div>
                <div className="rp-bg-pattern"></div>
            </div>

            {/* Right Side - Form */}
            <div className="rp-form-side">
                <div className="rp-form-wrapper">
                    <div className="rp-form-header">
                        <div className="rp-form-logo-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7C7 4.79 8.79 3 11 3H13C15.21 3 17 4.79 17 7V11" />
                            </svg>
                        </div>
                        <h2>Yeni Şifre Belirle</h2>
                        <p>Hesabınız için yeni bir şifre oluşturun.</p>
                    </div>

                    {message && (
                        <div className={`rp-alert ${status === 'success' ? 'rp-alert-success' : 'rp-alert-error'}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {status === 'success' ? (
                                    <>
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </>
                                ) : (
                                    <>
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </>
                                )}
                            </svg>
                            <span>{message}</span>
                        </div>
                    )}

                    {status !== 'success' && (
                        <form onSubmit={handleSubmit} className="rp-form">
                            <div className="rp-input-group">
                                <label>Yeni Şifre</label>
                                <div className="rp-input-field">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7C7 4.79 8.79 3 11 3H13C15.21 3 17 4.79 17 7V11" />
                                    </svg>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="rp-input-group">
                                <label>Yeni Şifre (Tekrar)</label>
                                <div className="rp-input-field">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`rp-btn-primary ${status === 'loading' ? 'loading' : ''}`}
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? 'Şifre Sıfırlanıyor...' : 'Şifremi Sıfırla'}
                            </button>
                        </form>
                    )}

                    <div className="rp-form-footer">
                        <p>
                            <Link to="/login" className="rp-back-link">← Giriş Sayfasına Dön</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
