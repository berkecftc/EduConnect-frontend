import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Sadece belirli role sahip kullanıcıları içeri alır
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, token } = useSelector((state) => state.auth);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Eğer allowedRoles tanımlıysa ve kullanıcının rolü bunlardan biri değilse
  if (allowedRoles && !allowedRoles.some(r => role.includes(r))) {
     // Yetkisiz erişim sayfasına veya dashboard'a at
     return <Navigate to="/dashboard" replace />;
  }

  return children;
}