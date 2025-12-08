import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../api/authService';

export default function Register() {
  const navigate = useNavigate();
  
  // Form verileri (Backend DTO'su ile eşleşmeli)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    studentNumber: '', // Eğer backend'de 'studentId' ise burayı değiştirin
    department: ''
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
      await authService.registerStudent(formData);
      setSuccess(true);
      
      // 2 saniye sonra Login sayfasına yönlendir
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      // Backend'den gelen hata mesajını veya genel hatayı göster
      setError(err.response?.data?.message || 'Kayıt işlemi başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Öğrenci Kaydı
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            EduConnect dünyasına katılın
          </p>
        </div>

        {/* Başarı Mesajı */}
        {success && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
            Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...
          </div>
        )}

        {/* Hata Mesajı */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="sr-only">Ad</label>
                <input
                  name="firstName"
                  type="text"
                  required
                  className="relative block w-full rounded border border-gray-300 px-3 py-2 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Ad"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="sr-only">Soyad</label>
                <input
                  name="lastName"
                  type="text"
                  required
                  className="relative block w-full rounded border border-gray-300 px-3 py-2 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="Soyad"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="sr-only">E-Posta</label>
              <input
                name="email"
                type="email"
                required
                className="relative block w-full rounded border border-gray-300 px-3 py-2 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Öğrenci E-Posta Adresi"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="sr-only">Okul Numarası</label>
                    <input
                        name="studentNumber"
                        type="text"
                        required
                        className="relative block w-full rounded border border-gray-300 px-3 py-2 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        placeholder="Okul No"
                        value={formData.studentNumber}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="sr-only">Bölüm</label>
                    <input
                        name="department"
                        type="text"
                        required
                        className="relative block w-full rounded border border-gray-300 px-3 py-2 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        placeholder="Bölüm (Örn: CENG)"
                        value={formData.department}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div>
              <label className="sr-only">Şifre</label>
              <input
                name="password"
                type="password"
                required
                className="relative block w-full rounded border border-gray-300 px-3 py-2 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Şifre"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
            >
              {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <p className="text-gray-600">
            Zaten hesabın var mı?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}