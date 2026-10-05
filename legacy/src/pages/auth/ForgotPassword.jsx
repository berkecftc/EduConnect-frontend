import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import './ForgotPassword.css';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            await api.post('/auth/forgot-password', { email });
            setStatus('success');
            setMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
        } catch (error) {
            setStatus('error');
            const errorMsg = error.response?.data?.message
                || error.response?.data
                || 'Bir hata oluştu. Lütfen tekrar deneyin.';
            setMessage(typeof errorMsg === 'string' ? errorMsg : 'Bir hata oluştu. Lütfen tekrar deneyin.');
        }
    };

    return (
        <div className="forgot-password-container">
            {/* Left Side - Visual & Info */}
            <div className="fp-visual-side">
                <div className="fp-visual-content">
                    <div className="fp-brand-header">
                        <h1 className="fp-brand-title">EduConnect</h1>
                        <p className="fp-brand-slogan">Eğitimin Geleceği Burada</p>
                    </div>

                    <div className="fp-hero-ornament">
                        <div className="fp-ornament-circle fp-circle-1"></div>
                        <div className="fp-ornament-circle fp-circle-2"></div>
                        <div className="fp-ornament-glass">
                            <div className="fp-glass-content">
                                <h3>Şifrenizi mi Unuttunuz?</h3>
                                <p>Endişelenmeyin, e-posta adresinizi girerek şifrenizi sıfırlayabilirsiniz.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fp-bg-gradient-overlay"></div>
                <div className="fp-bg-pattern"></div>
            </div>

            {/* Right Side - Form */}
            <div className="fp-form-side">
                <div className="fp-form-wrapper">
                    <div className="fp-form-header">
                        <div className="fp-form-logo-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7C7 4.79 8.79 3 11 3H13C15.21 3 17 4.79 17 7V11" />
                            </svg>
                        </div>
                        <h2>Şifremi Unuttum</h2>
                        <p>Kayıtlı e-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.</p>
                    </div>

                    {message && (
                        <div className={`fp-alert ${status === 'success' ? 'fp-alert-success' : 'fp-alert-error'}`}>
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
                        <form onSubmit={handleSubmit} className="fp-form">
                            <div className="fp-input-group">
                                <label>E-Posta Adresi</label>
                                <div className="fp-input-field">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" />
                                        <path d="M22 6L12 13L2 6" />
                                    </svg>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ornek@edu.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`fp-btn-primary ${status === 'loading' ? 'loading' : ''}`}
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                            </button>
                        </form>
                    )}

                    <div className="fp-form-footer">
                        <p>
                            <Link to="/login" className="fp-back-link">← Giriş Sayfasına Dön</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
