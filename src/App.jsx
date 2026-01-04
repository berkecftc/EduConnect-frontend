import { Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/auth/admin/AdminDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import ClubOfficialDashboard from './pages/clubofficial/ClubOfficialDashboard';
import ClubList from './pages/club/ClubList';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin Rotası */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Öğrenci Rotası */}
      <Route 
        path="/student/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Kulüpler Listesi (Öğrenciler için) */}
      <Route 
        path="/clubs" 
        element={
          <ProtectedRoute allowedRoles={['ROLE_STUDENT']}>
            <ClubList />
          </ProtectedRoute>
        } 
      />

      {/* Akademisyen Rotası */}
      <Route 
        path="/instructor/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['ROLE_INSTRUCTOR', 'ROLE_ACADEMICIAN']}>
            <InstructorDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Kulüp Yetkilisi Rotası */}
      <Route 
        path="/clubofficial/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['ROLE_CLUB_OFFICIAL']}>
            <ClubOfficialDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Şimdilik boş dashboard */}
      <Route path="/dashboard" element={<h1 className="text-3xl p-10">Hoşgeldiniz! (Dashboard)</h1>} />
    </Routes>
  );
}

export default App;