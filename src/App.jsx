import { Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Şimdilik boş dashboard */}
      <Route path="/dashboard" element={<h1 className="text-3xl p-10">Hoşgeldiniz! (Dashboard)</h1>} />
    </Routes>
  );
}

export default App;