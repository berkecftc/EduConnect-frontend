import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../api/authService';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  
  // Kullanıcı Tipi: 'student' veya 'academician'
  const [userType, setUserType] = useState('student');

  // Form verileri (Her iki tip için ortak ve özel alanlar bir arada)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    studentNumber: '', // Sadece Öğrenci
    department: '',    // Her İkisi
    title: ''          // Sadece Akademisyen (Örn: Prof. Dr.)
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (userType === 'student') {
        // Öğrenci Kaydı
        await authService.registerStudent({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
            studentNumber: formData.studentNumber,
            department: formData.department
        });
      } else {
        // Akademisyen Başvurusu
        await authService.registerAcademician({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
            title: formData.title,
            department: formData.department
        });
      }

      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Kayıt işlemi başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* Animated Background */}
      <div className="animated-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Floating Particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`
          }}></div>
        ))}
      </div>

      {/* Register Card */}
      <div className="register-card">
        <div className="register-card-inner">
          
          {/* Logo/Header Section */}
          <div className="register-header">
            <div className="logo-container">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 8V14M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <h2 className="register-title">
              <span className="title-gradient">EduConnect</span>
            </h2>
            <p className="register-subtitle">
              {userType === 'student' ? 'Öğrenci olarak aramıza katılın' : 'Akademisyen başvurusu oluşturun'}
            </p>
          </div>

          {/* User Type Toggle */}
          <div className="user-type-toggle">
            <button
              type="button"
              onClick={() => setUserType('student')}
              className={`toggle-button ${userType === 'student' ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 14L21 9L12 4L3 9L12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 14L12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M21 9V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M3 9V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Öğrenci</span>
            </button>
            <button
              type="button"
              onClick={() => setUserType('academician')}
              className={`toggle-button ${userType === 'academician' ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Akademisyen</span>
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="success-message">
              <svg className="success-icon" viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>
                {userType === 'academician' 
                  ? 'Başvurunuz alındı! Admin onayından sonra giriş yapabilirsiniz.' 
                  : 'Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...'}
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <svg className="error-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="register-form">
            {/* Name Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Ad</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <input
                    name="firstName"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Adınız"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Soyad</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <input
                    name="lastName"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Soyadınız"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">E-Posta</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <input
                  name="email"
                  type="email"
                  required
                  className="form-input"
                  placeholder={userType === 'student' ? "ogrenci@edu.com" : "akademisyen@edu.com"}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Dynamic Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{userType === 'student' ? 'Okul No' : 'Unvan'}</label>
                <div className="input-wrapper">
                  {userType === 'student' ? (
                    <>
                      <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <input
                        name="studentNumber"
                        type="text"
                        required
                        className="form-input"
                        placeholder="123456"
                        value={formData.studentNumber}
                        onChange={handleChange}
                      />
                    </>
                  ) : (
                    <>
                      <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <input
                        name="title"
                        type="text"
                        required
                        className="form-input"
                        placeholder="Dr. / Prof. Dr."
                        value={formData.title}
                        onChange={handleChange}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Bölüm</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M12 14L21 9L12 4L3 9L12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 14L12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M21 9V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M3 9V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <input
                    name="department"
                    type="text"
                    required
                    className="form-input"
                    placeholder="CENG"
                    value={formData.department}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Şifre</label>
              <div className="input-wrapper">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7C7 4.79086 8.79086 3 11 3H13C15.2091 3 17 4.79086 17 7V11" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <input
                  name="password"
                  type="password"
                  required
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`submit-button ${userType === 'academician' ? 'academician' : ''}`}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  İşlem yapılıyor...
                </>
              ) : (
                <>
                  <span>{userType === 'student' ? 'Kayıt Ol' : 'Başvuru Yap'}</span>
                  <svg className="button-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="register-footer">
            Zaten hesabın var mı? 
            <Link to="/login" className="login-link">Giriş Yap</Link>
          </p>
        </div>
      </div>
    </div>
  );
}