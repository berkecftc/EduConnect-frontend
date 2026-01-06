import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../store/slices/authSlice';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './Login.css';
import AdminButton from '../../components/ui/AdminButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (location.state?.isAdminLogin) {
      setIsAdminMode(true);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const resultAction = await dispatch(loginUser({ email, password }));
    
    if (loginUser.fulfilled.match(resultAction)) {
      const data = resultAction.payload;

      if (data && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('username', data.username);
        
        const roles = Array.from(data.roles || []);
        const role = roles[0];
        localStorage.setItem('role', role);

        if (role === 'ROLE_ADMIN' && isAdminMode) {
          navigate('/admin/dashboard');
        } else if (role === 'ROLE_ADMIN' && !isAdminMode) {
          alert('Admin hesabı ile normal giriş yapamazsınız. Lütfen yönetici girişi kullanın.');
          localStorage.clear();
          setPassword('');
        } else if (role !== 'ROLE_ADMIN' && isAdminMode) {
          alert('Bu hesap yönetici hesabı değil. Normal giriş sayfasını kullanın.');
          localStorage.clear();
          setPassword('');
        } else {
          if (role === 'ROLE_STUDENT') {
            navigate('/student/dashboard');
          } else if (role === 'ROLE_INSTRUCTOR' || role === 'ROLE_ACADEMICIAN') {
            navigate('/instructor/dashboard');
          } else if (role === 'ROLE_CLUB_OFFICIAL') {
            navigate('/clubofficial/dashboard');
          } else {
            navigate('/dashboard');
          }
        }
      }
    } else {
      setPassword('');
    }
  };

  return (
    <div className={`login-container ${isAdminMode ? 'admin-mode' : ''}`}>
      {/* Left Side - Visual & Info */}
      <div className="login-visual-side">
        <div className="visual-content">
          <div className="brand-header">
            <h1 className="brand-title">EduConnect</h1>
            <p className="brand-slogan">Eğitimin Geleceği Burada</p>
          </div>

          <div className="hero-ornament">
            <div className="ornament-circle circle-1"></div>
            <div className="ornament-circle circle-2"></div>
            <div className="ornament-glass">
              <div className="glass-content">
                <h3>Hoş Geldiniz</h3>
                <p>Öğrenci, öğretmen ve kulüplerin buluşma noktası.</p>
              </div>
            </div>
          </div>
          
          <div className="feature-pills">
            <div className="pill">🚀 Hızlı Erişim</div>
            <div className="pill">🤝 Kolay İletişim</div>
            <div className="pill">📅 Etkinlik Yönetimi</div>
          </div>
        </div>
        
        {/* Background Elements */}
        <div className="bg-gradient-overlay"></div>
        <div className="bg-pattern"></div>
      </div>

      {/* Right Side - Form */}
      <div className="login-form-side">
        <div className="form-wrapper">
          <div className="form-header">
            <div className="form-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>{isAdminMode ? 'Yönetici Girişi' : 'Giriş Yap'}</h2>
            <p>{isAdminMode ? 'Yönetim paneline erişim' : 'Hesabınıza erişmek için bilgilerinizi girin'}</p>
          </div>

          {error && (
            <div className="error-alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{typeof error === 'object' ? 'Giriş başarısız' : error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="premium-form">
            <div className="input-group">
              <label>E-Posta Adresi</label>
              <div className="input-field">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"/>
                  <path d="M22 6L12 13L2 6"/>
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

            <div className="input-group">
              <label>Şifre</label>
              <div className="input-field">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7C7 4.79 8.79 3 11 3H13C15.21 3 17 4.79 17 7V11"/>
                </svg>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="form-actions">
               {/* Forgot password link could go here */}
            </div>

            <button 
              type="submit" 
              className={`btn-primary ${status === 'loading' ? 'loading' : ''}`}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

          <div className="form-footer">
            {isAdminMode ? (
              <p onClick={() => {
                setIsAdminMode(false);
                navigate('/login', { state: {} });
              }} className="link-text">
                ← Öğrenci Girişine Dön
              </p>
            ) : (
              <p>
                Hesabınız yok mu? <Link to="/register" className="highlight-link">Hemen Kayıt Olun</Link>
              </p>
            )}
          </div>
        </div>
        
        {!isAdminMode && <div className="admin-toggle-wrapper"><AdminButton /></div>}
      </div>
    </div>
  );
}