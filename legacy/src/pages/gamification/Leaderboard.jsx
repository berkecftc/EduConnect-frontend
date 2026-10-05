import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Flame, AlertCircle, Loader2, Search, ArrowLeft } from 'lucide-react';
import { getLeaderboard } from '../../api/gamificationService';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(20);
  const [inputLimit, setInputLimit] = useState(20);

  useEffect(() => {
    fetchLeaderboard();
  }, [limit]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getLeaderboard(limit);
      setLeaderboard(data || []);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError(err.response.data?.message || 'Geçersiz limit değeri (1-100 arasında olmalıdır).');
      } else {
        setError('Liderlik tablosu yüklenirken bir hata oluştu.');
      }
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLimitChange = (e) => {
    e.preventDefault();
    const parsed = parseInt(inputLimit, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 100) {
      setError('Lütfen 1 ile 100 arasında bir sayı girin.');
      return;
    }
    setLimit(parsed);
  };

  const renderRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="font-bold text-slate-500">{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors" title="Geri Dön">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Liderlik Tablosu
            </h1>
          </div>
          
          <form onSubmit={handleLimitChange} className="flex items-center gap-2">
            <label htmlFor="limit" className="text-sm font-medium text-slate-600 dark:text-slate-400">Limit:</label>
            <input 
              id="limit"
              type="number"
              min="1"
              max="100"
              value={inputLimit}
              onChange={(e) => setInputLimit(e.target.value)}
              className="w-20 px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            />
            <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              Filtrele
            </button>
          </form>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="mt-4 text-slate-500 font-medium">Sıralama yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800/50 rounded-xl text-red-700 dark:text-red-400 shadow-sm">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400">
            <Trophy className="w-16 h-16 mb-4 opacity-30 text-slate-400" />
            <p className="text-lg font-medium">Henüz puan verisi yok.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">
                    <th className="p-4 font-semibold text-center w-20">Sıra</th>
                    <th className="p-4 font-semibold">Kullanıcı</th>
                    <th className="p-4 font-semibold text-right">Toplam Puan</th>
                    <th className="p-4 font-semibold text-center">Güncel Seri</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaderboard.map((user, index) => {
                    const isTop3 = user.rank <= 3;
                    return (
                      <tr 
                        key={user.userId + '-' + index} 
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          user.rank === 1 ? 'bg-yellow-50/50 dark:bg-yellow-900/10' :
                          user.rank === 2 ? 'bg-slate-50/50 dark:bg-slate-800/30' :
                          user.rank === 3 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''
                        }`}
                      >
                        <td className="p-4 align-middle">
                          <div className="flex justify-center items-center">
                            {renderRankIcon(user.rank)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border ${
                                user.rank === 1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50' :
                                user.rank === 2 ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600' :
                                user.rank === 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/50' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
                              }`}>
                              {(user.fullName || user.userId || 'U').substring(0, 2).toUpperCase()}
                            </div>
                            <span className={`font-medium ${isTop3 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                              {user.fullName || user.userId}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`font-bold ${isTop3 ? 'text-blue-600 dark:text-blue-400 text-lg' : 'text-slate-700 dark:text-slate-300 text-base'}`}>
                            {user.totalPoints.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4 text-center align-middle">
                          <div className="inline-flex items-center justify-center gap-1.5 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-800/50 px-3 py-1.5 rounded-full text-orange-600 dark:text-orange-400 font-semibold shadow-sm">
                            <Flame className={`w-4 h-4 ${user.currentStreak > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-400'}`} />
                            {user.currentStreak}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
