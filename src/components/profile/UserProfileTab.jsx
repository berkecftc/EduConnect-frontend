import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Trophy, Flame, Award, MessageSquare, Loader2, User, Edit2, Save, X, Upload } from 'lucide-react';
import { getUserProfileAggregated, updateUserProfile } from '../../api/userService';

function UserProfileTab() {
  const { user, role, email, studentNumber, department, userId } = useSelector((state) => state.auth);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', department: '', bio: ''
  });

  const fetchProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const data = await getUserProfileAggregated(userId);
      setProfileData(data);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Profil bilgileri alınırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const handleEditClick = () => {
    if (profileData) {
      setEditForm({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        department: profileData.department || '',
        bio: profileData.bio || ''
      });
      setProfileImageFile(null);
    }
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateUserProfile(userId, editForm, profileImageFile);
      await fetchProfile(); // Refresh
      setIsEditing(false);
    } catch (err) {
      alert('Profil güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Fallbacks for deterministic defaults
  const basicInfo = profileData || {};
  const {
    firstName,
    lastName,
    profileImageUrl,
    department: API_department,
    bio,
    profileCompletionPercentage = 0
  } = basicInfo;
  
  const gamification = profileData?.gamification || { points: 0, streak: 0, badges: [] };
  const recentPosts = profileData?.recentPosts || [];

  const displayName = firstName || lastName ? `${firstName || ''} ${lastName || ''}`.trim() : user;
  const displayDepartment = API_department || department || 'Bölüm belirtilmemiş';
  
  // Format role
  const getRoleLabel = () => {
    if (role?.includes('ROLE_STUDENT')) return 'Öğrenci';
    if (role?.includes('ROLE_INSTRUCTOR') || role?.includes('ROLE_ACADEMICIAN')) return 'Akademisyen';
    if (role?.includes('ROLE_CLUB_OFFICIAL')) return 'Kulüp Yetkilisi';
    return 'Kullanıcı';
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profilim</h1>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-4 text-sm font-medium">
          {error} (Mevcut oturum bilgileri ile devam ediliyor)
        </div>
      )}

      {/* 1. Temel Profil Bilgileri / Düzenleme */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm relative">
        <button
          onClick={isEditing ? () => setIsEditing(false) : handleEditClick}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors z-10"
          title={isEditing ? 'İptal' : 'Profili Düzenle'}
        >
          {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
        </button>

        {isEditing ? (
          <div className="space-y-4 pt-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Edit2 className="w-5 h-5 text-blue-500" /> Profili Düzenle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Adınız</label>
                <input type="text" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Soyadınız</label>
                <input type="text" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Profil Resmi Yükle (Opsiyonel)</label>
                <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-slate-50 dark:bg-slate-800">
                  <Upload className="w-5 h-5 text-slate-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {profileImageFile ? profileImageFile.name : 'Yeni bir fotoğraf seçin...'}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setProfileImageFile(e.target.files[0])} />
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Departman / Bölüm</label>
                <input type="text" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Hakkımda</label>
                <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} rows="4" className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 dark:bg-slate-800 dark:text-white"></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button disabled={saving} onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors">İptal</button>
              <button disabled={saving} onClick={handleSaveProfile} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
              <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl font-bold shrink-0 overflow-hidden border-4 border-white dark:border-slate-800 shadow-sm relative group">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (firstName?.[0] || user?.[0] || 'U').toUpperCase()
                )}
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white pr-8">{displayName}</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{email}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full border border-blue-200 dark:border-blue-800/50">
                    {getRoleLabel()}
                  </span>
                  {studentNumber && (
                    <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-full border border-slate-200 dark:border-slate-700">
                      No: {studentNumber}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="w-full md:w-48 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center border border-slate-100 dark:border-slate-700">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium">Profil Doluluğu</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${profileCompletionPercentage}%` }} 
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{profileCompletionPercentage}%</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5"><User className="w-4 h-4" /> Hakkımda</p>
                <p className="text-slate-900 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  {bio || 'Henüz bir biyografi eklenmemiş.'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Departman / Bölüm</p>
                <p className="text-slate-900 dark:text-slate-200 text-sm font-medium bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">{displayDepartment}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Gamification Kartı */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> 
              Başarılar & Rozetler
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <Trophy className="w-6 h-6 text-amber-500 mb-2" />
                <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {(gamification.points || gamification.totalPoints) ?? 0}
                </span>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-500 uppercase tracking-wider mt-1">Puan</span>
              </div>
              <div className="bg-orange-50 dark:bg-orange-500/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <Flame className="w-6 h-6 text-orange-500 mb-2" />
                <span className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  {(gamification.streak || gamification.currentStreak) ?? 0}
                </span>
                <span className="text-xs font-medium text-orange-600 dark:text-orange-500 uppercase tracking-wider mt-1">Gün Serisi</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-500" /> Kazanılan Rozetler
              </h4>
              {gamification.badges?.length > 0 ? (
                <div className="space-y-3">
                  {gamification.badges.map(badge => (
                    <div key={badge.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      {badge.imageUrl ? (
                        <img src={badge.imageUrl} alt={badge.name} className="w-10 h-10 object-contain drop-shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center text-purple-600">
                          <Award className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm text-slate-900 dark:text-slate-200">{badge.name}</div>
                        {badge.description && <div className="text-xs text-slate-500 dark:text-slate-400">{badge.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500 dark:text-slate-400 p-4 text-center bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                  Henüz kazanılmış bir rozet yok.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Son Paylaşımlar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden h-full flex flex-col">
            <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <MessageSquare className="w-5 h-5 text-blue-500" /> 
              Son Paylaşımlarım
            </h3>
            
            <div className="flex-1">
              {recentPosts?.length > 0 ? (
                <div className="space-y-4">
                  {recentPosts.map((post, i) => (
                    <div key={post.id || i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm text-slate-900 dark:text-slate-200">{post.authorName || displayName}</div>
                        <div className="text-xs text-slate-400">
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString('tr-TR') : ''}
                        </div>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 mb-3">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" /> {post.likeCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" /> {post.commentCount || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px]">
                  <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Henüz bir paylaşım yapmadınız.</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Forumda düşüncelerinizi paylaşmaya başlayın.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfileTab;
