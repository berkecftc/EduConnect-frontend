import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../api/authService';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('student');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    studentNumber: '',
    department: '',
    title: ''
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Fotoğraf boyutu en fazla 5MB olmalıdır.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Lütfen geçerli bir resim dosyası seçin.');
        return;
      }

      setPhotoFile(file);
      setError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (userType === 'student') {
        await authService.registerStudent({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          studentNumber: formData.studentNumber,
          department: formData.department
        });
      } else {
        const formDataToSend = new FormData();
        const requestData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          title: formData.title,
          department: formData.department
        };

        formDataToSend.append('request', new Blob([JSON.stringify(requestData)], {
          type: 'application/json'
        }));

        if (photoFile) {
          formDataToSend.append('idCardImage', photoFile);
        }

        await authService.registerAcademician(formDataToSend);
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
    <div className={`register-container ${userType === 'academician' ? 'academic-mode' : ''}`}>
      {/* Visual Side */}
      <div className="register-visual-side">
        <div className="visual-content">
          <div className="brand-header">
            <h1 className="brand-title">EduConnect</h1>
            <p className="brand-slogan">
              {userType === 'student' ? 'Öğrenci misin?' : 'Akademisyen misiniz?'}
            </p>
          </div>

          <div className="hero-ornament">
            <div className={`ornament-circle circle-1 ${userType}`}></div>
            <div className={`ornament-circle circle-2 ${userType}`}></div>
            <div className="ornament-glass">
              <div className="glass-content">
                <h3>{userType === 'student' ? 'Kampüse Katıl' : 'Bilgi Paylaş'}</h3>
                <p>
                  {userType === 'student'
                    ? 'Kulüplere katıl, etkinlikleri kaçırma ve sosyalleş.'
                    : 'Öğrencilerinizle etkileşime geçin ve etkinlikler düzenleyin.'}
                </p>
              </div>
            </div>
          </div>

          <div className="feature-pills">
            <div className="pill">✨ Aktif Topluluk</div>
            <div className="pill">📚 Akademik Gelişim</div>
            <div className="pill">🎓 Kariyer Fırsatları</div>
          </div>
        </div>

        <div className="bg-gradient-overlay"></div>
        <div className="bg-pattern"></div>
      </div>

      {/* Form Side */}
      <div className="register-form-side">
        <div className="form-wrapper">
          <div className="form-header">
            <h2>Kayıt Ol</h2>
            <p>Aramıza katılmak için bilgilerinizi eksiksiz doldurun</p>
          </div>

          <div className="user-type-toggle-premium">
            <button
              type="button"
              onClick={() => setUserType('student')}
              className={`toggle-btn ${userType === 'student' ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 14L21 9L12 4L3 9L12 14Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 14L12 22" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 9V16" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 9V16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Öğrenci</span>
            </button>
            <button
              type="button"
              onClick={() => setUserType('academician')}
              className={`toggle-btn ${userType === 'academician' ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Akademisyen</span>
            </button>
          </div>

          {success && (
            <div className="success-alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>
                {userType === 'academician'
                  ? 'Başvuru alındı! Onay bekleniyor.'
                  : 'Kayıt başarılı! Yönlendiriliyorsunuz...'}
              </span>
            </div>
          )}

          {error && (
            <div className="error-alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="premium-form">
            <div className="form-row">
              <div className="input-group">
                <div className="input-field">
                  <input
                    name="firstName"
                    type="text"
                    required
                    placeholder="Ad"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="input-group">
                <div className="input-field">
                  <input
                    name="lastName"
                    type="text"
                    required
                    placeholder="Soyad"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <div className="input-field">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" />
                  <path d="M22 6L12 13L2 6" />
                </svg>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder={userType === 'student' ? "ogrenci@edu.com" : "akademisyen@edu.com"}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <div className="input-field">
                  {userType === 'student' ? (
                    <input
                      name="studentNumber"
                      type="text"
                      required
                      placeholder="Okul No"
                      value={formData.studentNumber}
                      onChange={handleChange}
                    />
                  ) : (
                    <input
                      name="title"
                      type="text"
                      required
                      placeholder="Unvan (Dr.)"
                      value={formData.title}
                      onChange={handleChange}
                    />
                  )}
                </div>
              </div>
              <div className="input-group">
                <div className="input-field">
                  <input
                    name="department"
                    type="text"
                    required
                    placeholder="Bölüm (CENG)"
                    value={formData.department}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <div className="input-field">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7C7 4.79 8.79 3 11 3H13C15.21 3 17 4.79 17 7V11" />
                </svg>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Şifre"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {userType === 'academician' && (
              <div className="photo-upload-area">
                {!photoPreview ? (
                  <label className="upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden-input"
                    />
                    <div className="upload-content">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15V19C21 19.53 20.79 20.04 20.41 20.41C20.04 20.79 19.53 21 19 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V15" />
                        <path d="M17 8L12 3L7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>Kimlik Fotoğrafı Yükle</span>
                    </div>
                  </label>
                ) : (
                  <div className="preview-area">
                    <img src={photoPreview} alt="Preview" />
                    <button type="button" onClick={removePhoto} className="remove-btn">
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className={`btn-primary ${userType === 'academician' ? 'btn-academic' : ''}`}
              disabled={loading}
            >
              {loading ? 'İşlem Yapılıyor...' : (userType === 'student' ? 'Kayıt Ol' : 'Başvuru Yap')}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Zaten hesabınız var mı? <Link to="/login" className="highlight-link">Giriş Yapın</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}