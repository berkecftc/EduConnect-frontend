# EduConnect Frontend — Teknik Analiz Raporu

> **Tarih:** Nisan 2026  
> **Kapsam:** `EduConnect-frontend` projesinin kaynak kodu tam analizi  
> **Proje Konumu:** `/Users/berkeciftci/Desktop/EduConnect-frontend`

---

## 1. Genel Bakış

**EduConnect**, üniversite ekosistemini tek bir dijital platformda birleştirmeyi hedefleyen, çok rollü bir eğitim yönetim uygulamasıdır. Öğrenciler, akademisyenler, kulüp yetkilileri ve sistem yöneticilerine ayrı iş akışları sunan bu platform; **ders yönetimi, ödev takibi, kulüp yönetimi, etkinlik deneyimi, sosyal blog/forum ve oyunlaştırma** bileşenlerini bünyesinde barındırmaktadır.

Frontend, **React 19 + Vite 7** tabanlı bir SPA (Single Page Application) mimarisiyle geliştirilmiş olup modern web geliştirme pratikleri ve bileşen odaklı tasarım prensiplerine uygun şekilde inşa edilmiştir.

---

## 2. Teknoloji Yığını (Technology Stack)

| Katman | Teknoloji | Versiyon | Amaç |
|--------|-----------|----------|------|
| UI Kütüphanesi | React | 19.2.0 | Bileşen tabanlı arayüz geliştirme |
| Build Aracı | Vite | 7.2.4 | Geliştirme sunucusu ve üretim bundle'ı |
| State Yönetimi | Redux Toolkit | 2.11.0 | Uygulama geneli durum yönetimi |
| HTTP İstemcisi | Axios | 1.13.2 | REST API iletişimi ve interceptor yönetimi |
| Routing | React Router DOM | 7.10.0 | SPA yönlendirme ve korumalı rotalar |
| Stil | Tailwind CSS | 4.1.17 | Utility-first CSS framework |
| JWT İşleme | jwt-decode | 4.0.0 | Token ayrıştırma ve kullanıcı bilgisi çıkarımı |
| İkon Kütüphanesi | Lucide React | 0.561.0 | SVG ikon seti |
| Paket Yöneticisi | npm (ES Modules) | — | Modül yönetimi |

### 2.1 Bağımlılık Analizi

`package.json` incelendiğinde bağımlılıklar iki kategoriye ayrılmaktadır:

**Production Dependencies (5 paket):**
```json
{
  "@reduxjs/toolkit": "^2.11.0",
  "axios": "^1.13.2",
  "jwt-decode": "^4.0.0",
  "lucide-react": "^0.561.0",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-redux": "^9.2.0",
  "react-router-dom": "^7.10.0"
}
```

**Dev Dependencies:** `@vitejs/plugin-react`, `tailwindcss v4`, `eslint`, `autoprefixer`, `postcss`

### 2.2 Build Sistemi

Proje `"type": "module"` ile ECMAScript modül sistemi kullanmaktadır. Vite, hafıza içi (in-memory) modül derleme ve HMR (Hot Module Replacement) sayesinde geliştirme döngüsünü önemli ölçüde hızlandırmaktadır.

---

## 3. Proje Klasör Yapısı

```
EduConnect-frontend/
├── public/                         # Statik varlıklar
├── src/
│   ├── api/                        # Servis katmanı (API çağrıları)
│   │   ├── axiosConfig.js          # Merkezi HTTP istemci (interceptors)
│   │   ├── authService.js          # Kayıt işlemleri (multipart/form-data)
│   │   ├── userService.js          # Profil yönetimi
│   │   ├── courseService.js        # Ders CRUD, başvuru, duyuru
│   │   ├── assignmentService.js    # Ödev ve dosya işlemleri
│   │   ├── clubService.js          # Kulüp üyelik ve yönetim
│   │   ├── eventService.js         # Etkinlik oluşturma ve katılım
│   │   ├── postService.js          # Blog/forum CRUD, beğeni, yorum
│   │   ├── adminService.js         # Sistem yöneticisi işlemleri
│   │   ├── academicianService.js   # Akademisyen özelleştirmeleri
│   │   └── gamificationService.js  # Puan ve liderlik tablosu
│   ├── components/
│   │   ├── ProtectedRoute.jsx      # RBAC yetki denetim bileşeni
│   │   └── profile/
│   │       └── UserProfileTab.jsx  # Profil görüntüleme/güncelleme (17.9 KB)
│   ├── context/
│   │   └── ThemeContext.jsx        # Karanlık/açık mod bağlamı
│   ├── pages/
│   │   ├── auth/                   # Login, Register, ForgotPassword, ResetPassword
│   │   │   └── admin/
│   │   │       └── AdminDashboard.jsx   # Admin paneli (21 KB)
│   │   ├── student/
│   │   │   └── StudentDashboard.jsx    # Öğrenci paneli (806 satır, 44.6 KB)
│   │   ├── instructor/
│   │   │   └── InstructorDashboard.jsx # Akademisyen paneli (~1300 satır, 52.7 KB)
│   │   ├── clubofficial/
│   │   │   └── ClubOfficialDashboard.jsx # Kulüp yetkilisi (1017 satır, 58.8 KB)
│   │   ├── club/
│   │   │   └── ClubList.jsx        # Kulüp arama/listeleme
│   │   ├── post/
│   │   │   ├── PostList.jsx        # Sayfalı blog listesi (22 KB)
│   │   │   ├── PostDetail.jsx      # Post detay (18.4 KB)
│   │   │   ├── PostCreate.jsx      # Post oluşturma (11.4 KB)
│   │   │   ├── PostEdit.jsx        # Post düzenleme (12.3 KB)
│   │   │   └── CommentSection.jsx  # Yorum bileşeni (14.8 KB)
│   │   └── gamification/
│   │       └── Leaderboard.jsx     # Liderlik tablosu (168 satır)
│   ├── store/
│   │   ├── store.js                # Redux Store konfigürasyonu
│   │   └── slices/
│   │       └── authSlice.js        # Kimlik doğrulama state yönetimi
│   ├── utils/                      # Yardımcı fonksiyonlar
│   ├── assets/                     # Görsel varlıklar
│   ├── App.jsx                     # Merkezi rota tanımları (127 satır)
│   ├── main.jsx                    # Uygulama giriş noktası
│   ├── index.css                   # Global CSS değişkenleri (3.9 KB)
│   └── App.css
├── index.html                      # SPA kök HTML şablonu
├── vite.config.js                  # Vite yapılandırması
├── package.json                    # Proje bağımlılıkları
└── eslint.config.js                # ESLint kuralları
```

---

## 4. Mimari Tasarım

### 4.1 Katmanlı Uygulama Mimarisi

```
┌──────────────────────────────────────────────────────┐
│                  Görünüm Katmanı (View)               │
│         React Bileşenleri (JSX) + Tailwind CSS        │
├──────────────────────────────────────────────────────┤
│                 Durum Katmanı (State)                 │
│     Redux Toolkit (auth)  +  React Context (tema)    │
│           +  useState (bileşen-yerel veriler)         │
├──────────────────────────────────────────────────────┤
│                 Servis Katmanı (API)                  │
│    11 Service Modülü  +  Axios Interceptors           │
├──────────────────────────────────────────────────────┤
│                  Ağ Katmanı (Network)                 │
│    REST API → Spring Boot Backend (Gateway)           │
│         Base URL: http://localhost:8080/api           │
└──────────────────────────────────────────────────────┘
```

### 4.2 Uygulama Giriş Noktası — `main.jsx`

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>       {/* Redux global state kapsayıcısı */}
      <ThemeProvider>              {/* Dark/Light mod bağlamı */}
        <BrowserRouter>            {/* HTML5 History API tabanlı routing */}
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
```

Uygulama dört katmanlı bir Provider sarmalayıcısı ile başlatılmaktadır. `React.StrictMode`, geliştirme aşamasında iki kez render ederek olası yan etkileri (side effects) tespit etmektedir.

### 4.3 Provider Sıralamasının Önemi

Provider'ların iç içe geçme sırası kritiktir:
1. `Provider (Redux)` en dışta → Tüm bileşenler store'a erişebilir
2. `ThemeProvider` içte → Redux'tan bağımsız, kendi context'i
3. `BrowserRouter` en içte → Link ve navigate hook'larına erişim

---

## 5. Kimlik Doğrulama ve Yetkilendirme Sistemi

### 5.1 JWT Tabanlı Kimlik Doğrulama

Uygulama, JSON Web Token (JWT) standardını kullanmaktadır. Kimlik doğrulama akışı:

```
Kullanıcı → POST /api/auth/login → Backend JWT üretir
         ← { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
         → localStorage'a kaydedilir
         → jwtDecode() ile payload çıkarılır
         → Redux auth state güncellenir
```

**Token Çözümleme (Decoding):**

```js
// authSlice.js
const decodeToken = (token) => {
  if (!token) return null;
  try {
    return jwtDecode(token);
    // Örnek payload: { sub: "user@edu.tr", roles: ["ROLE_STUDENT"], userId: "uuid", exp: 1234567 }
  } catch (error) {
    return null; // Geçersiz/bozuk token
  }
};
```

**Token'dan Çıkarılan Veriler:**

| JWT Claim | Redux State Alanı | Açıklama |
|-----------|-------------------|----------|
| `sub` | `state.auth.user` | Kullanıcı adı veya e-posta |
| `roles` | `state.auth.role` | Kullanıcı rol listesi (dizi) |
| `userId` | `state.auth.userId` | Kullanıcı UUID'si |

**Sayfa Yenileme Kalıcılığı:**  
`initialState` tanımında `localStorage`'dan token okunarak store başlatılır; bu sayede sayfa yenilense dahi oturum korunur:

```js
const tokenFromStorage = localStorage.getItem('token');
const decodedData = decodeToken(tokenFromStorage);

const initialState = {
  user: decodedData?.sub || null,
  role: decodedData?.roles || null,
  token: tokenFromStorage || null,
  userId: decodedData?.userId || null,
  status: 'idle',
  error: null,
};
```

### 5.2 Axios Interceptors — Merkezi HTTP Yönetimi

`axiosConfig.js`, tek bir merkezi Axios instance tanımlayarak tüm API çağrılarını yönetmektedir:

```js
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});
```

**Request Interceptor (İstek Araya Giren):**

Her API isteği gönderilmeden önce otomatik olarak devreye girer:

```js
api.interceptors.request.use((config) => {
  // 1. Token ekle
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // 2. FormData tespiti: Content-Type başlığını kaldır
  // Tarayıcı otomatik 'multipart/form-data; boundary=...' ekler
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});
```

**Response Interceptor (Yanıt Araya Giren):**

HTTP 401 hatalarında oturum otomatik sonlandırılır:

```js
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;

      // Auth sayfalarında döngüsel yönlendirmeyi önle
      if (['/register', '/login', '/forgot-password', '/reset-password'].includes(currentPath)) {
        return Promise.reject(error);
      }

      // Oturumu temizle ve login'e yönlendir
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 5.3 Rol Tabanlı Erişim Denetimi — RBAC

`ProtectedRoute.jsx`, deklaratif güvenlik katmanı sağlayan yüksek dereceli (higher-order) bir bileşendir:

```jsx
export default function ProtectedRoute({ children, allowedRoles }) {
  const { role, token } = useSelector((state) => state.auth);

  // Oturum yoksa login'e yönlendir
  if (!token) return <Navigate to="/login" replace />;

  // Yetkisiz rol → genel dashboard'a at
  if (allowedRoles && !allowedRoles.some(r => role.includes(r)))
    return <Navigate to="/dashboard" replace />;

  return children;
}
```

**Sistemdeki Roller ve Yetki Matrisi:**

| Rol | Açıklama | Özel Dashboard | Paylaşılan Rotalar |
|-----|----------|----------------|-------------------|
| `ROLE_ADMIN` | Sistem yöneticisi | `/admin/dashboard` | — |
| `ROLE_STUDENT` | Öğrenci | `/student/dashboard` | `/clubs`, `/posts/*`, `/leaderboard` |
| `ROLE_INSTRUCTOR` | Akademisyen | `/instructor/dashboard` | — |
| `ROLE_ACADEMICIAN` | Akademisyen (alias) | `/instructor/dashboard` | — |
| `ROLE_CLUB_OFFICIAL` | Kulüp yetkilisi | `/clubofficial/dashboard` | `/clubs`, `/posts/*`, `/leaderboard` |

---

## 6. Durum Yönetimi (State Management)

### 6.1 Redux Toolkit Store Mimarisi

```js
// store.js
export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Gelecekte eklenecekler: clubReducer, eventReducer, notificationReducer...
  },
});
```

**Tasarım Kararı:** Mevcut mimari tek bir slice (`auth`) kullanmaktadır. Diğer domain'ler (kurslar, ödevler, kulüpler) için Redux kullanılmamış; bu veriler doğrudan ilgili bileşenlerin `useState` hook'unda tutulmaktadır. Bu karar şu gerekçelere dayanmaktadır:
- Dashboard verileri yalnızca o dashboard'da kullanılır (gerçek anlamda global değildir)
- Bileşen lifecycle'ına bağlı verilerde Redux overkill yaratır
- Kod basitliği korunur

### 6.2 Auth Slice — Asenkron İşlem Yönetimi

```js
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Login failed');
    }
  }
);
```

**Durum Makinesi (State Machine):**

```
idle → [loginUser.pending] → loading
                           → [loginUser.fulfilled] → succeeded
                           → [loginUser.rejected]  → failed
```

### 6.3 React Context API — Tema Yönetimi

```jsx
// ThemeContext.jsx — Lazy initializer ile akıllı başlatma
const [isDarkMode, setIsDarkMode] = useState(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';              // 1. Kaydedilmiş tercih
    return window.matchMedia('(prefers-color-scheme: dark)').matches; // 2. OS tercihi
  }
  return false; // 3. Varsayılan: açık mod
});

useEffect(() => {
  const root = window.document.documentElement;
  if (isDarkMode) {
    root.classList.add('dark');      // Tailwind dark: modifier için
    localStorage.setItem('theme', 'dark');
  } else {
    root.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}, [isDarkMode]);
```

Tailwind CSS v4'ün `dark:` modifier sistemi, HTML kök elemanına (`<html>`) eklenen `.dark` sınıfına dayanmaktadır. Bu yaklaşım, component bazında tema yönetimini ortadan kaldırarak global CSS geçişleri sağlar.

---

## 7. API Servis Katmanı — Detaylı Analiz

11 servis modülünün tamamı `axiosConfig.js`'den export edilen `api` instance'ı üzerinden iletişim kurmaktadır.

### 7.1 `authService.js` — Kayıt İşlemleri

Öğrenci ve akademisyen kayıtları `multipart/form-data` formatında gerçekleştirilmektedir. Bu yaklaşım, kimlik bilgilerini (JSON) ve kimlik belgesi dosyasını (File) tek HTTP isteğinde iletmektedir:

```js
registerStudent: async (data) => {
  // FormData içeriği:
  // - "request" parçası: JSON Blob (ad, soyad, email, öğrenci no, bölüm)
  // - "studentDocument" parçası: Kimlik belgesi dosyası (File)
  const response = await api.post('/auth/request/student-account', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}
```

> **Geliştirme Notu:** Servis dosyalarında kapsamlı `console.log` ve `console.error` bloklarıyla hata ayıklama kolaylaştırılmıştır. Bu yaklaşım, geliştirme sürecinde API uyumsuzluklarının hızla tespit edilmesine katkı sağlamıştır.

### 7.2 `courseService.js` — Ders Yönetimi (110 satır)

Ders oluşturma işlemi, ders JSON verisi ve kapak fotoğrafını birleştiren `FormData` kullanır:

```js
export const createCourse = async (courseData, file) => {
  const formData = new FormData();
  // JSON'ı Blob olarak ekle: backend @RequestPart("course") ile uyumlu
  formData.append('course', new Blob([JSON.stringify(courseData)], { type: 'application/json' }));
  if (file) formData.append('file', file);
  return (await api.post('/courses', formData)).data;
};
```

**Endpoint Grupları:**

| Grup | HTTP Metodu | Endpoint | Açıklama |
|------|------------|----------|----------|
| Listeleme | GET | `/courses` | Tüm dersler |
| Kişisel | GET | `/courses/my-courses` | Öğrenci kayıtlı dersler |
| Akademisyen | GET | `/courses/instructor/me/courses` | Akademisyen dersleri |
| Başvuru | POST | `/courses/{id}/apply` | Derse başvur |
| Onay | PUT | `/courses/applications/{id}/approve` | Başvuruyu onayla |
| Red | PUT | `/courses/applications/{id}/reject` | Başvuruyu reddet |
| Duyuru | POST/GET/DELETE | `/courses/{id}/announcements` | Duyuru CRUD |
| Dosya | GET | `/courses/files/download` | Blob indirme |
| Öğrenciler | GET | `/courses/{id}/enrolled-students` | Kayıtlı öğrenciler |

**FCFS (First-Come, First-Served) Başvuru Sistemi:**  
Başvurular sıralı bekletilmekte; akademisyen onayı ile sıraya göre kabul yapılmaktadır.

### 7.3 `assignmentService.js` — Ödev Yönetimi (91 satır)

Öğrenci kimliği JWT'ye ek olarak özel bir HTTP başlığıyla iletilmektedir:

```js
export const getMyAssignments = async () => {
  const userId = localStorage.getItem('userId');
  return (await api.get('/assignments/my-assignments', {
    headers: userId ? { 'X-Authenticated-User-Id': userId } : {},
  })).data;
};
```

Bu tasarım, backend'in çok katmanlı kimlik doğrulama yapmasına olanak tanır.

**Tam Ödev İş Akışı:**

```
1. Akademisyen: createAssignment(, dosya)
   └── POST /assignments (multipart: JSON + dosya)

2. Öğrenci: getMyAssignments()
   └── GET /assignments/my-assignments [X-Authenticated-User-Id]

3. Öğrenci: submitAssignment(assignmentId, file)
   └── POST /assignments/{id}/submit (multipart: dosya) [X-Authenticated-User-Id]

4. Akademisyen: getAssignmentSubmissions(assignmentId)
   └── GET /assignments/{id}/submissions

5. Akademisyen: gradeSubmission(submissionId, { grade, feedback })
   └── PUT /assignments/submissions/{id}/grade

6. Öğrenci: Not dashboard'da görüntülenir
```

### 7.4 `eventService.js` — Etkinlik Yönetimi (180 satır)

Etkinlik oluşturma işlemi için Axios yerine **doğrudan Fetch API** kullanılmaktadır:

```js
export const createEvent = async (formData) => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:8080/api/events/manage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Content-Type kasıtlı olarak belirtilmemiş
      // Tarayıcı multipart/form-data; boundary=... otomatik ekler
    },
    body: formData,
  });
  if (!response.ok) throw new Error((await response.json()).message);
  return await response.json();
};
```

**Önbellek Engelleme (Cache Busting):**  
Bazı kritik GET isteklerine timestamp parametresi eklenerek önbellekten stale veri gelmesi önlenmektedir:

```js
params: { _t: Date.now() }
headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
```

**Etkinlik Aktörleri:**

| Aktör | İşlev |
|-------|-------|
| Kulüp Yetkilisi | Etkinlik oluşturma, QR doğrulama, kayıtlı katılımcılar |
| Öğrenci | Etkinliğe katılım isteği, kendi isteklerini görme, kayıtlar |
| Kulüp Yetkilisi | Katılım isteklerini onaylama/reddetme |

### 7.5 `clubService.js` — Kulüp Ekosistemi (94 satır)

**Dört Aktör Mimarisi:**

```
Genel Kullanıcı
└── getAllClubs() → GET /clubs

Öğrenci
├── getMyMemberships() → GET /clubs/my-memberships
├── sendMembershipRequest(clubId) → POST /clubs/{id}/membership-requests
├── getMyMembershipRequests() → GET /clubs/my-membership-requests
└── cancelMembershipRequest(clubId) → DELETE /clubs/{id}/membership-requests

Kulüp Başkanı
├── getPendingMembershipRequests(clubId) → GET /clubs/{id}/membership-requests/pending
├── getPendingMembershipRequestCount(clubId) → GET /clubs/{id}/membership-requests/pending/count
├── approveMembershipRequest(clubId, requestId) → PUT /clubs/{id}/membership-requests/{rid}/approve
└── rejectMembershipRequest(clubId, requestId) → PUT /clubs/{id}/membership-requests/{rid}/reject

Kulüp Yetkilisi
├── getMyManagedClubs() → GET /clubs/my-managed-clubs
├── getClubBoardMembers(clubId) → GET /clubs/{id}/board-members
├── createRoleChangeRequest(clubId, data) → POST /clubs/{id}/role-change-requests
├── getClubRoleChangeRequests(clubId) → GET /clubs/{id}/role-change-requests
└── removeMemberRole(clubId, studentId) → DELETE /clubs/{id}/members/{sid}/role
```

### 7.6 `postService.js` — Sosyal Platform (98 satır)

Tam CRUD + sosyal etkileşim özellikleri:

```js
// Server-side pagination
export const getPosts = async (page = 0, size = 10, sort = 'createdAt,desc') =>
  (await api.get('/posts', { params: { page, size, sort } })).data;

// Sosyal etkileşimler
export const toggleLike   = (postId) => api.post(`/posts/${postId}/likes`).then(r => r.data);
export const getLikeCount = (postId) => api.get(`/posts/${postId}/likes/count`).then(r => r.data);
export const getLikeStatus = (postId) => api.get(`/posts/${postId}/likes/status`).then(r => r.data);

// Yorumlar
export const addComment    = (postId, content) => api.post(`/posts/${postId}/comments`, { content });
export const getComments   = (postId) => api.get(`/posts/${postId}/comments`);
export const updateComment = (commentId, content) => api.put(`/posts/comments/${commentId}`, { content });
export const deleteComment = (commentId) => api.delete(`/posts/comments/${commentId}`);

// İç içe yanıtlar
export const addReply  = (commentId, content) => api.post(`/posts/comments/${commentId}/replies`, { content });
export const getReplies = (commentId) => api.get(`/posts/comments/${commentId}/replies`);

// Yer işareti (Bookmark)
export const toggleSave  = (postId) => api.post(`/posts/${postId}/bookmark`);
export const getSavedPosts = (page = 0, size = 10) => api.get('/posts/saved', { params: { page, size } });
export const getSaveStatus = (postId) => api.get(`/posts/${postId}/save/status`);
```

### 7.7 `adminService.js` — Sistem Yönetimi (110 satır)

```js
const adminService = {
  // 1. Akademisyen başvuru yönetimi
  getAcademicianRequests, approveAcademician, rejectAcademician,

  // 2. Öğrenci başvuru yönetimi
  getStudentRequests, approveStudent, rejectStudent,

  // 3. Kulüp Yetkilisi onayları
  getClubOfficialRequests, approveClubOfficial, rejectClubOfficial,

  // 4. Kulüp kurulumu ve yönetimi
  getClubCreationRequests, approveClubCreation, rejectClubCreation,
  getAllActiveClubs, deleteClub, getClubBoardMembers, changeClubPresident, updateClubLogo,

  // 5. Etkinlik moderasyonu
  getAllEvents, getEventRequests, approveEvent, rejectEvent,

  // 6. Kullanıcı yönetimi
  getAllUsers, deleteUser,

  // 7. Arşiv görünümleri
  getInactiveClubs, getInactiveStudents, getInactiveAcademicians,
};
```

### 7.8 `gamificationService.js` — Oyunlaştırma (9 satır)

```js
export const getLeaderboard = async (limit = 20) => {
  const response = await api.get('/gamification/leaderboard', { params: { limit } });
  return response.data;
};
```

---

## 8. Sayfa ve Bileşen Mimarisi

### 8.1 Tab Tabanlı Dashboard Mimarisi

Her rol için bağımsız bir "tek sayfa, tüm işlevler" mimarisi benimsenmiştir. Navigasyon, sayfa yenilemesi yapmadan `activeTab` state değişkeni ile yönetilmektedir:

```
Sidebar → activeTab state değişir → main content koşullu render
```

Bu yaklaşımın avantajları:
- Hız: Sekme geçişlerinde yeni HTTP isteği yoktur
- UX: Kullanıcı oturumu ve form durumları korunur
- DX: Tek bileşende test ve hata ayıklama kolaylığı

### 8.2 `StudentDashboard.jsx` (806 satır, 44.6 KB)

**Üç Katmanlı Veri Yükleme Stratejisi:**

```js
// Katman 1: Paralel yükleme (sayfa açılışında)
useEffect(() => {
  fetchCourses();        // GET /courses/my-courses
  fetchAssignments();    // GET /assignments/my-assignments
  fetchClubs();          // GET /clubs/my-memberships
  fetchEvents();         // GET /events/my-registrations
  fetchMembershipRequests();    // GET /clubs/my-membership-requests
  fetchParticipationRequests(); // GET /events/my-participation-requests
}, []);

// Katman 2: Bağımlı yükleme (kulüp verisi geldikten sonra)
useEffect(() => {
  if (!loading.clubs && clubs.length > 0) fetchClubEvents(); // Tüm kulüplerin etkinlikleri
}, [clubs, loading.clubs]);

// Katman 3: Lazy loading (yalnızca sekme açıldığında)
useEffect(() => {
  if (activeTab === 'courseApplications') {
    fetchAllCourses();      // GET /courses
    fetchMyApplications();  // GET /courses/my-applications
  }
}, [activeTab]);
```

**Ödev Teslim İş Akışı — Durum Makinesi:**

```
[Teslim Edilmedi]
  ├── Dosya seç → submitAssignment()
  └── [Teslim Edildi]
        ├── Dosyayı indir
        └── [Düzenleme Modu Kapalı]
              ├── "Düzenle" → Düzenleme modunu aç
              └── "Sil" → deleteAssignmentSubmission()
              └── [Düzenleme Modu Açık]
                    ├── Yeni dosya seç → submitAssignment() (güncelle)
                    └── "İptal" → Düzenleme modunu kapat
```

**Kurs Başvurusu Filtreleme:**

```js
const availableCourses = allCourses.filter(c =>
  !enrolledIds.includes(c.id) &&  // Kayıtlı olunan dersler çıkar
  !appliedIds.includes(c.id)       // Bekleyen başvurusu olanlar çıkar
);
```

**Granüler Yükleme Durumları:**

```js
const [loading, setLoading] = useState({
  courses: true, assignments: true, clubs: true, events: true,
  membershipRequests: true, participationRequests: true,
  clubEvents: true, allCourses: false, myApplications: false,
});
// Her bölüm bağımsız loading state'e sahip → bölgesel spinner
```

**Sidebar Menü Yapısı:**

```js
const menuItems = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'all_clubs', label: 'Tüm Kulüpler', icon: Search, path: '/clubs' },
  { id: 'posts', label: 'Blog', icon: MessageSquare, path: '/posts' },
  { id: 'leaderboard', label: 'Liderlik Tablosu', icon: Trophy, path: '/leaderboard' },
  { id: 'courses', label: 'Kurslarım', icon: BookOpen, count: courses.length },
  { id: 'courseApplications', label: 'Ders Başvurusu', icon: GraduationCap },
  { id: 'assignments', label: 'Ödevlerim', icon: ClipboardList, count: validAssignments.length },
  { id: 'clubs', label: 'Kulüplerim', icon: Users, count: clubs.length },
  { id: 'events', label: 'Etkinliklerim', icon: Calendar },
  { id: 'clubEvents', label: 'Kulüp Etkinlikleri', icon: CalendarPlus },
  { id: 'requests', label: 'Üyelik İsteklerim', icon: Send },
];
```

### 8.3 `ClubOfficialDashboard.jsx` (1017 satır, 58.8 KB)

**Çift Kimlik Mimarisi (Dual-Identity Architecture):**

Kulüp yetkilisi aynı anda iki kimliği taşır:
1. **Yönetici kimliği:** Kulüp yönetimi, etkinlik oluşturma, üyelik onaylama
2. **Öğrenci kimliği:** Kendi ders kayıtları, ödevler, diğer kulüp üyelikleri

Bu iki kimlik için kullanılan API servisleri tamamen örtüşmez; bileşen her ikisini paralel yönetir.

**Rol Etiketi Çözümleme:**

```js
const getRoleLabel = (role) => {
  switch(role) {
    case 'ROLE_CLUB_OFFICIAL':   return 'Kulüp Başkanı';
    case 'ROLE_VICE_PRESIDENT':  return 'Başkan Yardımcısı';
    case 'ROLE_SECRETARY':       return 'Sekreter';
    case 'ROLE_TREASURER':       return 'Sayman';
    case 'ROLE_BOARD_MEMBER':    return 'Yönetim Kurulu Üyesi';
    default:                     return role || 'Kulüp Üyesi';
  }
};
```

**Bağımlı Seçimli Yükleme:**

```js
// Kulüp seçimi değiştiğinde ilgili veriler yeniden çekilir
useEffect(() => {
  if (selectedClubId) {
    fetchBoardMembers(selectedClubId);      // Yönetim kurulu
    fetchPendingRequests(selectedClubId);   // Bekleyen üyelik istekleri
    fetchPendingCount(selectedClubId);      // Bekleyen sayısı (badge için)
    fetchRoleChangeRequests(selectedClubId); // Görev değişikliği talepleri
  }
}, [selectedClubId]);
```

**Üç Segmentli Sidebar:**

```
Genel     → Profil, Tüm Kulüpler, Blog, Liderlik Tablosu
Yönetici  → Kulüp Yönetimi, Etkinlikler, Üyelik İstekleri (kırmızı badge), Katılım Talepleri
Öğrenci   → Kurslarım, Ders Başvurusu, Ödevlerim, Üye Olunan Kulüpler
```

### 8.4 `InstructorDashboard.jsx` (~1300 satır, 52.7 KB)

**İşlev Kapsamı:**

| Modül | İşlevler |
|-------|----------|
| Ders Yönetimi | Oluşturma (görsel + JSON), düzenleme, kapasit yönetimi |
| Başvuru Yönetimi | FCFS sıralı onay/red, gerekçe girişi |
| Duyuru Yönetimi | Duyuru oluşturma, listeleme, silme |
| Öğrenci Takibi | Kayıtlı öğrenci listesi, detay görüntüleme |
| Ödev Yönetimi | Ödev oluşturma/silme, teslim listeleme |
| Not Verme | Teslim bazlı not ve geri bildirim girişi |

Not verme arayüzü, öğrenci ismi ve numarasını görüntüleyerek UUID yerine anlaşılır kimlik bilgisi sunar.

### 8.5 `AdminDashboard.jsx` (21 KB)

**Moderasyon İş Akışları:**

```
Yeni Kullanıcı → Başvuru → Admin İnceleme → Onay/Red → Rol Atama
Yeni Kulüp    → Kurma Talebi → Admin Onayı → ROLE_CLUB_OFFICIAL Atama
Yeni Etkinlik → Kulüp Yetkilisi Oluşturur → Admin Onayı → Yayınlama
```

**Yönetim Kategorileri:**
- Başvuru yönetimi (3 kullanıcı tipi)
- Kulüp yaşam döngüsü (kurma → aktif → arşiv)
- Etkinlik moderasyonu
- Kullanıcı yönetimi (listeleme, silme)
- Logo güncelleme ve başkan değiştirme
- Arşiv görünümleri

---

## 9. Sosyal Platform Bileşenleri

### 9.1 `PostList.jsx` (22 KB)

- Server-side pagination ile sayfalı listeleme
- Beğeni ve kaydetme durum gösterimi
- Sıralama özelliği (`createdAt,desc` varsayılan)

### 9.2 `PostDetail.jsx` (18.4 KB)

- Tek post detay görünümü
- `CommentSection` bileşeni entegrasyonu
- Beğeni toggle ve sayaç

### 9.3 `CommentSection.jsx` (14.8 KB)

Bağımsız bileşen olarak ayrıştırılmış yorum sistemi:
- Yorum CRUD işlemleri
- İç içe yanıt (nested reply) zinciri
- Anlık liste güncellemesi
- Kullanıcı sahipliği kontrolü (kendi yorumunu düzenleme/silme)

### 9.4 `PostCreate.jsx` / `PostEdit.jsx`

Bağımsız sayfalarda çalışan form bileşenleri; rota korumalı (ProtectedRoute).

---

## 10. Oyunlaştırma — Liderlik Tablosu

`Leaderboard.jsx` (168 satır) sıralama görselliğini renk ve ikonlarla zenginleştirir:

**Görsel Sıralama Sistemi:**

| Sıra | Arka Plan | İkon | Rozet |
|------|-----------|------|-------|
| 1. | Altın sarısı (`yellow-*`) | `Trophy` | Altın sarısı halka |
| 2. | Gümüş (`slate-*`) | `Medal` | Gümüş halka |
| 3. | Bronz (`amber-*`) | `Medal` | Bronz halka |
| 4+. | Mavi (`blue-*`) | Numara | Mavi halka |

**Aktif Seri (Streak) Gösterimi:**

```jsx
<div className="inline-flex items-center gap-1.5 bg-orange-50 ...">
  <Flame className={`w-4 h-4 ${user.currentStreak > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-400'}`} />
  {user.currentStreak}
</div>
```

Aktif seri olan kullanıcılarda `animate-pulse` animasyonu devreye girer.

**Kullanıcı Kontrollü Filtreleme:**

```jsx
<form onSubmit={handleLimitChange}>
  <input type="number" min="1" max="100" value={inputLimit} />
  <button type="submit">Filtrele</button>
</form>
// Sunucudan yalnızca istenen sayıda kayıt çekilir
```

---

## 11. Kullanıcı Deneyimi Tasarımı

### 11.1 Karanlık/Açık Mod Desteği

Tailwind CSS `dark:` öneki ile her bileşen için iki tema tanımlanmıştır:

```jsx
// Her element için açık ve karanlık mod stilleri
className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100
           border-slate-200 dark:border-slate-800"
```

Tema geçişleri `transition-colors duration-200` ile yumuşatılmıştır.

### 11.2 Duyarlı (Responsive) Tasarım

**Mobil Sidebar Sistemi:**

```jsx
// Mobil: aside gizli (translateX(-100%))
// Menü açıldığında: translateX(0) → animasyonlu geçiş + overlay
<aside className={`
  fixed md:sticky top-0 left-0 h-screen w-64 ...
  transform transition-duration-300 ease-in-out
  ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
`}>

{/* Overlay (tıklandığında menüyü kapatır) */}
{isMobileMenuOpen && (
  <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
       onClick={() => setIsMobileMenuOpen(false)} />
)}
```

**Breakpoint Kullanımı:** Grid yapılar `md:grid-cols-*`, flex düzenlemeler `md:flex-row` ile masaüstü/mobil ayrımı yapar.

### 11.3 Yükleme Durumları

```jsx
// CardLoader: Spinner bileşeni
const CardLoader = () => (
  <div className="flex justify-center py-8">
    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
  </div>
);

// EmptyState: Boş veri durumu
const EmptyState = ({ message, icon: Icon = BookOpen }) => (
  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
    <Icon className="w-12 h-12 mb-4 opacity-50" />
    <p>{message}</p>
  </div>
);
```

### 11.4 Toast Bildirim Sistemi

```js
const showSuccess = (msg) => {
  setSuccessMessage(msg);
  setTimeout(() => setSuccessMessage(''), 3000); // 3 saniye sonra kaybolur
};
```

```jsx
{successMessage && (
  <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3
                  bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200
                  rounded-xl shadow-lg animate-in slide-in-from-top-2">
    <Check className="w-5 h-5" />
    <span>{successMessage}</span>
  </div>
)}
```

Tailwind v4'ün `animate-in slide-in-from-top-2` utility'si ile kayma animasyonu sağlanır.

### 11.5 Rozet (Badge) Sistemi

Sidebar'da bekleyen işlem sayıları dinamik rozetlerle gösterilir:

```jsx
{item.count !== undefined && item.count > 0 && (
  <span className={`px-2 py-0.5 rounded-full text-xs ${
    activeTab === item.id
      ? 'bg-blue-100 text-blue-700'
      : 'bg-red-100 text-red-600 font-bold'
  }`}>
    {item.count}
  </span>
)}
```

---

## 12. Dosya Yükleme ve İndirme Mimarisi

### 12.1 Yükleme Stratejileri

| Senaryo | Yöntem | Teknik Gerekçe |
|---------|--------|----------------|
| Öğrenci kaydı | Axios + FormData | JSON Blob + belge dosyası birlikte |
| Profil fotoğrafı | Axios + FormData | JSON Blob + görsel; interceptor Content-Type yönetir |
| Ders oluşturma | Axios + FormData | JSON Blob + kapak görseli; @RequestPart uyumlu |
| Ödev teslimi | Axios + FormData | `X-Authenticated-User-Id` başlığı ekleme kolaylığı |
| Etkinlik oluşturma | **Fetch API** | Axios boundary sorununu aşmak; Content-Type otomasyonu |

### 12.2 Blob Tabanlı Dosya İndirme

```js
const handleDownloadFile = async (fileUrl, fileName) => {
  const response = await api.get('/assignments/files/download', {
    params: { url: fileUrl },
    responseType: 'blob', // Binary yanıt
  });

  // Uzantı tespiti: dosya adında uzantı yoksa URL'den çıkar
  if (!finalName.includes('.') && fileUrl) {
    const originalName = fileUrl.split('?')[0].split('/').pop();
    const extIndex = originalName.lastIndexOf('.');
    if (extIndex !== -1) finalName += originalName.substring(extIndex);
  }

  // Programatik indirme tetikleme
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', finalName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url); // Bellek sızıntısını önle
};
```

---

## 13. Rota Yapısı ve Güvenlik

```
/                              → Login (varsayılan yönlendirme)
/login                         → Login sayfası
/register                      → Kayıt (Öğrenci + Akademisyen seçimi)
/forgot-password               → Parola sıfırlama isteği
/reset-password                → Token doğrulama + yeni parola

[ROLE_ADMIN]
└── /admin/dashboard

[ROLE_STUDENT]
└── /student/dashboard

[ROLE_INSTRUCTOR, ROLE_ACADEMICIAN]
└── /instructor/dashboard

[ROLE_CLUB_OFFICIAL]
└── /clubofficial/dashboard

[ROLE_STUDENT, ROLE_CLUB_OFFICIAL]
├── /clubs
├── /posts
├── /posts/new
├── /posts/:id
└── /posts/:id/edit

[Tüm kimliği doğrulanmış kullanıcılar]
└── /leaderboard
```

---

## 14. Paylaşılan Bileşenler

### 14.1 `UserProfileTab.jsx` (17.9 KB)

`StudentDashboard` ve `ClubOfficialDashboard` tarafından ortak kullanılan profil bileşeni:

- **Veri Kaynağı:** `GET /users/profile/{userId}/aggregated` (agregat API)
- **Düzenleme:** Ad, soyad, bölüm, biyografi (`PUT /users/profile/{userId}`)
- **Fotoğraf Yükleme:** Dosya tabanlı, FormData ile
- **Salt Okunur:** E-posta alanı düzenlenemez
- **Oyunlaştırma Metrikleri:** Toplam puan ve aktif seri gösterimi

Ortak bileşen kullanımı kod tekrarını önleyerek DRY (Don't Repeat Yourself) prensibine uyum sağlar.

---

## 15. Kritik Tasarım Kararları ve Gerekçeleri

| Karar | Uygulama | Gerekçe |
|-------|----------|---------|
| Rol bazlı izole dashboardlar | Her rol için ayrı büyük bileşen | Rol-specific iş mantığının karışmasını önler; bağımsız geliştirme ve test |
| Redux yalnızca `auth` için | Diğer veriler `useState`'te | Auth gerçekten global; diğer veriler bileşen lifecycle'ına bağlı, Redux overhead'i gereksiz |
| Axios interceptors | `axiosConfig.js`'de merkezi | 11 servise dağılmış token kodu tek noktada; bakım ve değişiklik kolaylığı |
| Context API tema için | `ThemeContext.jsx` | Basit boolean için Redux gereksiz; Context yeterli ve daha sade |
| Fetch API etkinlikte | `eventService.js` | Axios `Content-Type` yönetimi bazı multipart/form-data sınırlarında boundary sorununa yol açabilir |
| Granüler `loading` object | Nesne içinde alan bazlı | Bölgesel spinner; bir bölüm yüklenirken diğerleri çalışır |
| Lazy tab loading | `useEffect` + `activeTab` | Kullanılmayan sekmeler için gereksiz API isteği önlenir |
| `X-Authenticated-User-Id` header | Öğrenci servisleri | JWT'ye ek kimlik katmanı; backend çok katmanlı tanımlama yapabilir |
| Timestamp cache-busting | Kritik GET istekleri | Etkinlik/kayıt verilerinin stale önbellekten değil güncel backendden alınmasını garantiler |
| `window.matchMedia` OS tercihi | `ThemeContext` başlatma | İlk ziyarette kullanıcı OS temasını otomatik uygular; UX iyileştirme |

---

## 16. Proje Kapsamı ve Özellik Durumu

| Özellik Alanı | Durum | Notlar |
|---------------|-------|--------|
| JWT kimlik doğrulama | ✅ Tam | localStorage kalıcılığı, sayfa yenileme koruması |
| Rol tabanlı erişim (RBAC) | ✅ Tam | 5 rol, ProtectedRoute ile deklaratif güvenlik |
| Karanlık/Açık mod | ✅ Tam | OS tercihi + localStorage kalıcılığı |
| Öğrenci paneli | ✅ Tam | 9 sekme, tüm temel iş akışları |
| Akademisyen paneli | ✅ Tam | Ders, ödev, not, duyuru yönetimi |
| Kulüp yetkilisi paneli | ✅ Tam | Çift kimlik mimarisi |
| Sistem yöneticisi paneli | ✅ Tam | Tam moderasyon kapsamı |
| Ders yönetimi | ✅ Tam | CRUD, başvuru, duyuru, FCFS onay |
| Ödev yönetimi | ✅ Tam | Oluşturma, teslim, not, düzenleme, silme |
| Kulüp ekosistemi | ✅ Tam | Üyelik, yönetim kurulu, görev değişikliği |
| Etkinlik yönetimi | ✅ Tam | Oluşturma, katılım talebi, QR doğrulama |
| Blog/Forum platformu | ✅ Tam | Server-side pagination |
| Yorum sistemi | ✅ Tam | İç içe yanıt (nested replies) |
| Beğeni ve kaydetme | ✅ Tam | Toggle, sayaç, durum |
| Oyunlaştırma liderlik tablosu | ✅ Tam | Sıralama, puan, seri, limit filtresi |
| Profil yönetimi | ✅ Tam | Fotoğraf yükleme, alan düzenleme |
| Dosya yükleme/indirme | ✅ Tam | Blob indirme, uzantı tespiti |
| Mobil duyarlı tasarım | ✅ Tam | Sliding sidebar, responsive grid |
| Toast bildirimleri | ✅ Tam | 3 saniyelik otomatik kapanma |

---

## Özet

EduConnect Frontend, **React 19 ekosisteminin modern özelliklerini** (Concurrent Mode, StrictMode) ve **Redux Toolkit'in** gelişmiş state yönetimini birleştiren kapsamlı bir eğitim platformu uygulamasıdır.

**Mimari güçlü yönler:**
- Merkezi Axios interceptor ile tutarlı API iletişimi
- Deklaratif RBAC ile güvenli rota yönetimi
- Granüler yükleme durumları ile üstün UX
- Lazy loading ile performans optimizasyonu
- Çift kimlik mimarisi ile esnek kullanıcı deneyimi

**Ölçek:** 11 API servis modülü, 5+ bağımsız dashboard, 15+ sayfa bileşeni ve toplam ~200 KB kaynak kodu ile üniversite ekosisteminin tüm kritik iş süreçlerini kapsayan tam işlevli bir SPA uygulamasıdır.

---

*Bu belge, `EduConnect-frontend` projesinin tüm kaynak kodunun statik analizi yoluyla oluşturulmuştur.*
