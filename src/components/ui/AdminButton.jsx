import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react'; // İkon için (npm install lucide-react)

export default function AdminButton() {
  return (
    <Link 
      to="/login" 
      state={{ isAdminLogin: true }} // Login sayfasına "Ben adminim" sinyali gönderir
      className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full bg-gray-800 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:bg-gray-700 hover:scale-105 z-50 opacity-50 hover:opacity-100"
    >
      <ShieldCheck size={16} />
      Yönetici Girişi
    </Link>
  );
}