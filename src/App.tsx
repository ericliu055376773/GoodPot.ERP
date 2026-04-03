import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, 
  ShieldUser, 
  Package, 
  LogOut, 
  ChevronLeft, 
  Receipt, 
  Building2,
  TrendingUp,
  Briefcase,
  CalendarDays,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Tag,
  CheckCircle2,
  Camera,
  ChevronRight,
  Layers,
  X,
  Menu, 
  ArrowUpDown,
  Smartphone,
  Monitor,
  Maximize,
  Bell,
  PieChart,
  Settings,
  Edit2,
  ShoppingCart,
  RefreshCcw,
  TrendingDown,
  Minus,
  ChevronDown,
  Search
} from 'lucide-react';

// ==========================================
//  Firebase 雲端資料庫設定 (Canvas 環境自動適應版)
// ==========================================
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyAc0LGsLeEBcJ3fOj08NwAWbZL0d3GKHrA",
  authDomain: "ypxerp.firebaseapp.com",
  projectId: "ypxerp",
  storageBucket: "ypxerp.firebasestorage.app",
  messagingSenderId: "684981995411",
  appId: "1:684981995411:web:a32310ced01fc8ca964a66",
  measurementId: "G-MFJ8WW5707"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'hotpot-erp-system'; 

// 系統預設商品目錄
const initialProducts = [
  '純喫茶 綠茶 650ml',
  '茶裏王 日式無糖綠',
  '統一麵 肉燥風味',
  '義美小泡芙 巧克力',
  '義美鮮奶 946ml',
  '光泉全脂鮮乳'
];

// 預設異常原因
const initialAbnormalReasons = [
  '商品外包裝嚴重破損',
  '實際到貨數量短少',
  '送來了錯誤的品項',
  '商品已過期或即將到期',
  '商品內容物有變質或異物'
];

// 預設退貨補償商品清單
const initialCompensationProducts = [
  '高麗菜',
  '沙朗牛肉片',
  '梅花豬肉片',
  '綜合火鍋料',
  '湯底包'
];

export default function App() {
  const [fbUser, setFbUser] = useState(null);
  
  // 來自 Firebase 的即時資料
  const [usersDb, setUsersDb] = useState([]);
  const [ordersDb, setOrdersDb] = useState([]);
  const [inventoryDb, setInventoryDb] = useState({});
  const [systemOptions, setSystemOptions] = useState({ categories: [], units: [], reorderUnits: [], vendorOrder: [], trackingProducts: initialProducts, abnormalReasons: initialAbnormalReasons, compensationProducts: initialCompensationProducts }); 
  const [compensationsDb, setCompensationsDb] = useState([]); 
  const [expiryRecords, setExpiryRecords] = useState([]);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [selectedVendor, setSelectedVendor] = useState(null);

  const [authForm, setAuthForm] = useState({ selectedStore: '', password: '' });
  const [regForm, setRegForm] = useState({ branchName: '', password: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  const [viewMode, setViewMode] = useState('auto'); 

  // 自訂彈跳視窗狀態 
  const [uiState, setUiState] = useState({ alert: null, confirm: null, showAdminLogin: false });
  const showAlert = (msg) => setUiState(prev => ({ ...prev, alert: msg }));
  const showConfirm = (msg, onConfirm) => setUiState(prev => ({ ...prev, confirm: { message: msg, onConfirm } }));

  // 取出雲端同步的系統設定
  const trackingProducts = systemOptions?.trackingProducts || initialProducts;
  const dynamicAbnormalReasons = systemOptions?.abnormalReasons || initialAbnormalReasons;

  // ==========================================
  //  連線 Firebase 並即時監聽資料
  // ==========================================
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { 
        console.error('Auth Error:', err); 
      }
    };
    initAuth();
    
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => { setFbUser(u); });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!fbUser) return;
    
    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'hotpot_users'), 
      (snap) => setUsersDb(snap.docs.map(d => d.data())),
      (error) => console.error("Error fetching users:", error)
    );
    
    const unsubOrders = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'hotpot_orders'), 
      (snap) => {
        const fetchedOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setOrdersDb(fetchedOrders.sort((a, b) => b.timestamp - a.timestamp));
      },
      (error) => console.error("Error fetching orders:", error)
    );
    
    const unsubInv = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'hotpot_inventory'), 
      (snap) => {
        const inv = {};
        snap.docs.forEach(d => inv[d.id] = d.data());
        setInventoryDb(inv);
      },
      (error) => console.error("Error fetching inventory:", error)
    );
    
    const unsubCompensations = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'hotpot_compensations'), 
      (snap) => {
        const fetchedComps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCompensationsDb(fetchedComps.sort((a, b) => b.timestamp - a.timestamp));
      },
      (error) => console.error("Error fetching compensations:", error)
    );

    const unsubOptions = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_system', 'options'), 
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (!data.abnormalReasons) data.abnormalReasons = initialAbnormalReasons;
          if (!data.compensationProducts) data.compensationProducts = initialCompensationProducts;
          setSystemOptions(data);
        } else {
          const initOpts = { categories: [], units: ['件', '箱', '包', '公斤', '台斤', '盒'], reorderUnits: [], vendorOrder: [], trackingProducts: initialProducts, abnormalReasons: initialAbnormalReasons, compensationProducts: initialCompensationProducts };
          setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_system', 'options'), initOpts);
          setSystemOptions(initOpts);
        }
      },
      (error) => console.error("Error fetching options:", error)
    );

    return () => { unsubUsers(); unsubOrders(); unsubInv(); unsubCompensations(); unsubOptions(); };
  }, [fbUser]);

  const dynamicVendors = useMemo(() => {
    const categories = new Set();
    ordersDb.forEach(o => {
        const cat = o.id.split('-')[1];
        if (cat) categories.add(cat);
    });
    return Array.from(categories).map(c => ({ id: c, name: c }));
  }, [ordersDb]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!/^\d{6}$/.test(regForm.password)) {
      setAuthError('門店密碼必須為 6 位數字');
      return;
    }
    if (usersDb.some(u => u.password === regForm.password)) {
      setAuthError('此密碼已被使用，請更換一個密碼');
      return;
    }
    if (usersDb.some(u => u.branchName === regForm.branchName)) {
      setAuthError('此門市名稱已存在');
      return;
    }
    try {
      const newId = `store_${Date.now()}`;
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_users', newId), {
        username: newId,
        branchName: regForm.branchName,
        password: regForm.password,
        role: 'store'
      });
      showAlert('門店註冊成功！請直接登入');
      setIsRegistering(false);
      setRegForm({ branchName: '', password: '' });
    } catch (error) {
      console.error('Registration Error:', error);
      setAuthError('註冊失敗，請確認網路連線');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authForm.selectedStore) { setAuthError('請選擇門市'); return; }

    const user = usersDb.find(u => u.branchName === authForm.selectedStore);
    if (user && user.password === authForm.password) {
      setCurrentUser({ id: user.username, role: 'store', name: user.branchName, username: user.username });
      setCurrentView('store_dashboard');
      setAuthError('');
      setAuthForm({ selectedStore: '', password: '' });
    } else {
      setAuthError('密碼錯誤，請重新輸入');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setSelectedVendor(null);
    setAuthForm({ selectedStore: '', password: '' });
  };

  const handleVerifySuccess = async (orderId) => {
    const order = ordersDb.find(o => o.id === orderId);
    if (!order) return;
    try {
      const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_orders', orderId);
      await updateDoc(orderRef, { status: 'received' });

      const branchName = order.branchName;
      const branchInv = inventoryDb[branchName]?.settings || {};
      const newSettings = { ...branchInv };

      order.items.forEach(item => {
         const currentStock = parseFloat(newSettings[item.id]?.currentStock) || 0;
         const addedStock = parseFloat(item.orderQty || item.quantity) || 0; 
         newSettings[item.id] = { ...newSettings[item.id], currentStock: currentStock + addedStock };
      });
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_inventory', branchName), { settings: newSettings }, { merge: true });
      showAlert('核對無誤！庫存數量已自動同步至點貨系統。');
    } catch (error) {
      console.error('更新失敗:', error);
      showAlert('寫入雲端失敗，請聯絡管理員確認資料庫權限！');
    }
  };

  const handleSubmitAbnormalCloud = async (orderId, reportForm) => {
    try {
      const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_orders', orderId);
      await updateDoc(orderRef, { 
        status: 'abnormal', 
        abnormalReason: reportForm.reason, 
        abnormalItem: reportForm.item, 
        abnormalPhoto: reportForm.photo || null, 
        abnormalTime: Date.now() 
      });
      showAlert('已將異常通報及照片上傳至總部雲端！');
    } catch(err) {
      console.error(err);
      showAlert('通報失敗，請確認網路連線！');
    }
  };

  const handleResolveAbnormal = (orderId) => {
    showConfirm('確定異常狀況已排除？\n按下確認後，該單將標記為「已接收」並自動將數量同步入庫。', async () => {
      try {
        const order = ordersDb.find(o => o.id === orderId);
        if (!order) return;
        const orderRef = doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_orders', orderId);
        await updateDoc(orderRef, { 
          status: 'received',
          abnormalResolved: true,
          abnormalResolvedTime: Date.now()
        });

        const branchName = order.branchName;
        const branchInv = inventoryDb[branchName]?.settings || {};
        const newSettings = { ...branchInv };

        order.items.forEach(item => {
           const currentStock = parseFloat(newSettings[item.id]?.currentStock) || 0;
           const addedStock = parseFloat(item.orderQty || item.quantity) || 0; 
           newSettings[item.id] = { ...newSettings[item.id], currentStock: currentStock + addedStock };
        });
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_inventory', branchName), { settings: newSettings }, { merge: true });
        showAlert('異常已修復！庫存數量已自動同步至點貨系統。');
      } catch (error) {
        console.error('修復失敗:', error);
        showAlert('寫入雲端失敗，請確認網路連線！');
      }
    });
  };

  const storePendingCount = currentUser?.role === 'store' ? ordersDb.filter(o => (o.branchUsername === currentUser?.username || o.branchName === currentUser?.name) && o.status !== 'received' && o.status !== 'abnormal').length : 0;
  const storeExpiringCount = currentUser?.role === 'store' ? expiryRecords.filter(r => {
    if (r.storeId !== currentUser?.id) return false;
    const daysLeft = Math.ceil((new Date(r.expiryDate).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
    return daysLeft <= 14;
  }).length : 0;
  const storeAbnormalCount = currentUser?.role === 'store' ? ordersDb.filter(o => (o.branchUsername === currentUser?.username || o.branchName === currentUser?.name) && o.status === 'abnormal').length : 0;
  const storeCompensationCount = currentUser?.role === 'store' ? compensationsDb.filter(c => c.storeId === currentUser?.username && c.status === 'pending').length : 0;
  
  const adminAbnormalCount = currentUser?.role === 'admin' ? ordersDb.filter(o => o.status === 'abnormal').length : 0;
  const adminCompensationCount = currentUser?.role === 'admin' ? compensationsDb.filter(c => c.status === 'pending').length : 0;

  const LayoutToggler = () => (
    <div className={`fixed ${currentUser ? 'bottom-28' : 'bottom-6'} left-1/2 -translate-x-1/2 bg-[#1A1D21]/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-[#2C3137] rounded-full p-1.5 flex items-center gap-1 z-[90] transition-all`}>
      <button onClick={() => setViewMode('mobile')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'mobile' ? 'bg-[#F05A42] text-white shadow-sm' : 'text-[#9CA3AF] hover:bg-[#2C3137] hover:text-white'}`}><Smartphone size={16} /> <span className="hidden sm:inline">手機尺寸</span></button>
      <button onClick={() => setViewMode('auto')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'auto' ? 'bg-[#10B981] text-white shadow-sm' : 'text-[#9CA3AF] hover:bg-[#2C3137] hover:text-white'}`}><Maximize size={16} /> <span className="hidden sm:inline">自動適應</span></button>
      <button onClick={() => setViewMode('desktop')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'desktop' ? 'bg-[#2C3137] text-white shadow-sm' : 'text-[#9CA3AF] hover:bg-[#2C3137] hover:text-white'}`}><Monitor size={16} /> <span className="hidden sm:inline">電腦尺寸</span></button>
    </div>
  );

  // --- 登入畫面 ---
  if (currentView === 'login' || currentView === 'register') {
    const storeUsers = usersDb.filter(u => u.role !== 'admin');
    return (
      <div className={`min-h-screen font-sans text-[#1A1D21] bg-[#E5E8EB] ${viewMode === 'desktop' ? 'overflow-x-auto' : ''}`}>
        <div className={`relative overflow-hidden min-h-screen flex items-center justify-center transition-all duration-300 bg-[#F2F4F7] mx-auto p-4 ${viewMode === 'mobile' ? 'max-w-[430px] shadow-2xl border-x border-[#D1D5DB]' : viewMode === 'desktop' ? 'min-w-[1200px]' : 'w-full'}`}>
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FFD5CC] rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob"></div>
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#E5E8EB] rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] bg-[#FFE9E5] rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-4000"></div>

          {uiState.showAdminLogin && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-[#FFFFFF] rounded-[2rem] p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-[#1A1D21] mb-4 text-center">總公司後台登入</h3>
                {authError && <div className="text-[#EF4444] text-sm text-center font-bold mb-4">{authError}</div>}
                <input type="password" autoFocus className="w-full px-5 py-3.5 bg-[#F2F4F7] border-2 border-[#E5E8EB] rounded-2xl mb-4 focus:ring-4 focus:ring-[#F05A42]/20 focus:border-[#F05A42] outline-none font-bold text-center tracking-widest text-lg" placeholder="請輸入後台密碼"
                  onChange={e => {
                    if (e.target.value === '0204') {
                      setCurrentUser({ id: 'admin', role: 'admin', name: '總管理處', username: 'admin' });
                      setCurrentView('admin_vendors'); 
                      setAuthError(''); setUiState(prev => ({ ...prev, showAdminLogin: false }));
                    } else if (e.target.value.length >= 4) { setAuthError('密碼錯誤'); } else { setAuthError(''); }
                  }}
                />
                <button onClick={() => { setUiState(prev => ({ ...prev, showAdminLogin: false })); setAuthError(''); }} className="w-full bg-[#F2F4F7] hover:bg-[#E5E8EB] text-[#6B7280] py-3.5 rounded-2xl font-black transition-colors">取消</button>
              </div>
            </div>
          )}

          <div className="bg-[#FFFFFF]/90 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md border border-[#E5E8EB] relative z-10">
            <div className="text-center mb-8">
              <div onClick={() => { setUiState(prev => ({ ...prev, showAdminLogin: true })); setAuthError(''); }} className="bg-gradient-to-tr from-[#F05A42] to-[#FF9C8A] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md cursor-pointer hover:scale-105 transition-transform" title="點擊登入總公司">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1A1D21]">智慧進貨 ERP</h1>
              <p className="text-sm text-[#6B7280] mt-2 font-medium">{isRegistering ? '請填寫資料註冊新門店' : '與點貨系統資料同步連線中'}</p>
            </div>

            {authError && !uiState.showAdminLogin && <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] p-3 rounded-2xl mb-6 text-sm text-center font-bold animate-in fade-in zoom-in duration-300">{authError}</div>}

            {isRegistering ? (
              <form onSubmit={handleRegister} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-2 ml-1">門店名稱</label>
                  <input type="text" required className="w-full px-5 py-3.5 bg-[#FFFFFF] border-2 border-[#E5E8EB] rounded-2xl focus:ring-4 focus:ring-[#F05A42]/20 focus:border-[#F05A42] outline-none transition-all text-[#1A1D21] font-semibold" value={regForm.branchName} onChange={e => setRegForm({...regForm, branchName: e.target.value})} placeholder="請輸入您的門店名稱" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-2 ml-1">設定門店密碼 (需為 6 位數字)</label>
                  <input type="password" required maxLength={6} pattern="\d{6}" className="w-full px-5 py-3.5 bg-[#FFFFFF] border-2 border-[#E5E8EB] rounded-2xl focus:ring-4 focus:ring-[#F05A42]/20 focus:border-[#F05A42] outline-none transition-all text-[#1A1D21] font-semibold tracking-widest" value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value.replace(/\D/g, '')})} placeholder="例如: 123456" />
                </div>
                <button type="submit" className="w-full bg-[#1A1D21] text-white py-4 px-4 rounded-2xl hover:bg-[#111418] shadow-md transition-all font-bold mt-8 active:scale-95">完成註冊</button>
                <div className="text-center mt-4"><button type="button" onClick={() => { setIsRegistering(false); setAuthError(''); }} className="text-sm font-bold text-[#F05A42] hover:text-[#D94A34]">返回登入</button></div>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-2 ml-1">選擇註冊門店</label>
                  <div className="relative">
                    <select required className="w-full px-5 py-3.5 bg-[#FFFFFF] border-2 border-[#E5E8EB] rounded-2xl focus:ring-4 focus:ring-[#F05A42]/20 focus:border-[#F05A42] outline-none transition-all text-[#1A1D21] font-bold appearance-none cursor-pointer" value={authForm.selectedStore} onChange={e => setAuthForm({...authForm, selectedStore: e.target.value})}>
                      <option value="" disabled>請選擇門店名稱...</option>
                      {storeUsers.map(u => <option key={u.username} value={u.branchName}>{u.branchName}</option>)}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-[#9CA3AF] pointer-events-none" size={20} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-2 ml-1">輸入門店密碼</label>
                  <input type="password" required className="w-full px-5 py-3.5 bg-[#FFFFFF] border-2 border-[#E5E8EB] rounded-2xl focus:ring-4 focus:ring-[#F05A42]/20 focus:border-[#F05A42] outline-none transition-all text-[#1A1D21] font-semibold tracking-widest" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} placeholder="請輸入對應的 6 位密碼" />
                </div>
                <button type="submit" className="w-full bg-[#1A1D21] text-white py-4 px-4 rounded-2xl hover:bg-[#111418] shadow-md transition-all font-bold mt-8 active:scale-95">門市登入</button>
                <div className="text-center mt-4"><button type="button" onClick={() => { setIsRegistering(true); setAuthError(''); }} className="text-sm font-bold text-[#6B7280] hover:text-[#1A1D21]">還沒有門店帳號？ <span className="text-[#F05A42]">立即註冊</span></button></div>
              </form>
            )}
          </div>
        </div>
        <LayoutToggler />
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans text-[#1A1D21] bg-[#E5E8EB] ${viewMode === 'desktop' ? 'overflow-x-auto' : ''}`}>
      <div className={`flex flex-col min-h-screen mx-auto transition-all duration-300 relative bg-[#F2F4F7] ${viewMode === 'mobile' ? 'max-w-[430px] shadow-2xl border-x border-[#D1D5DB]' : viewMode === 'desktop' ? 'min-w-[1200px]' : 'w-full'}`}>
        
        {uiState.alert && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#FFFFFF] rounded-[2rem] p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-[#1A1D21] mb-6 text-center">{uiState.alert}</h3>
              <button onClick={() => setUiState(prev => ({ ...prev, alert: null }))} className="w-full bg-[#F05A42] text-white py-3.5 rounded-2xl font-black active:scale-95 transition-all">確認</button>
            </div>
          </div>
        )}
        {uiState.confirm && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#FFFFFF] rounded-[2rem] p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-[#1A1D21] mb-6 text-center whitespace-pre-wrap">{uiState.confirm.message}</h3>
              <div className="flex gap-3">
                <button onClick={() => setUiState(prev => ({ ...prev, confirm: null }))} className="flex-1 bg-[#F2F4F7] text-[#6B7280] hover:bg-[#E5E8EB] py-3.5 rounded-2xl font-black active:scale-95 transition-all">取消</button>
                <button onClick={() => { uiState.confirm.onConfirm(); setUiState(prev => ({ ...prev, confirm: null })); }} className="flex-1 bg-[#EF4444] text-white hover:bg-[#DC2626] py-3.5 rounded-2xl font-black active:scale-95 transition-all">確認</button>
              </div>
            </div>
          </div>
        )}

        <header className="bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E5E8EB] px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            {currentUser?.role === 'admin' && (
              <button onClick={() => setCurrentView('admin_settings')} className="p-2.5 bg-[#FFFFFF] text-[#6B7280] hover:text-[#F05A42] hover:bg-[#F2F4F7] rounded-2xl transition-all shadow-sm border border-[#E5E8EB] active:scale-95" title="系統設定"><Settings size={20} /></button>
            )}
            <div className={`p-2.5 rounded-2xl shadow-sm ${currentUser.role === 'admin' ? 'bg-gradient-to-br from-[#2C3137] to-[#111418] text-white' : 'bg-gradient-to-br from-[#F05A42] to-[#D94A34] text-white'}`}>
              {currentUser.role === 'admin' ? <ShieldUser size={20} className="sm:w-5 sm:h-5" /> : <Store size={20} className="sm:w-5 sm:h-5" />}
            </div>
            <div>
              <h1 className="font-bold text-[#1A1D21] text-base sm:text-lg tracking-tight leading-tight">{currentUser.name}</h1>
              <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#F2F4F7] text-[#6B7280] inline-block mt-0.5 border border-[#E5E8EB]">{currentUser.role === 'admin' ? '總部管理後臺' : '門市進貨終端'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {currentUser?.role === 'store' && (
              <div className="flex items-center gap-2 mr-1 sm:mr-3 border-r border-[#E5E8EB] pr-3 sm:pr-5 overflow-x-auto whitespace-nowrap hide-scrollbar">
                <button onClick={() => { setCurrentView('store_dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-sm transition-all shadow-sm shrink-0 ${storePendingCount > 0 ? 'bg-[#FEF2F2] text-[#F05A42] border border-[#FECACA] animate-pulse' : 'bg-[#FFFFFF] border border-[#E5E8EB] text-[#9CA3AF]'}`}><Bell size={16} /><span className="hidden sm:inline">進貨通知</span>{storePendingCount > 0 && <span className="bg-[#F05A42] text-white text-[10px] px-1.5 py-0.5 rounded-full ml-0.5">{storePendingCount}</span>}</button>
                <button onClick={() => { setCurrentView('store_abnormal'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-sm transition-all shadow-sm shrink-0 ${storeAbnormalCount > 0 ? 'bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA] animate-pulse' : 'bg-[#FFFFFF] border border-[#E5E8EB] text-[#9CA3AF]'}`}><AlertTriangle size={16} /><span className="hidden sm:inline">異常通知</span>{storeAbnormalCount > 0 && <span className="bg-[#EF4444] text-white text-[10px] px-1.5 py-0.5 rounded-full ml-0.5">{storeAbnormalCount}</span>}</button>
                <button onClick={() => { setCurrentView('store_compensation'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-sm transition-all shadow-sm shrink-0 ${storeCompensationCount > 0 ? 'bg-[#FAF5FF] text-[#8B5CF6] border border-[#E9D5FF] animate-pulse' : 'bg-[#FFFFFF] border border-[#E5E8EB] text-[#9CA3AF]'}`}><RefreshCcw size={16} /><span className="hidden sm:inline">退貨補償</span>{storeCompensationCount > 0 && <span className="bg-[#8B5CF6] text-white text-[10px] px-1.5 py-0.5 rounded-full ml-0.5">{storeCompensationCount}</span>}</button>
                <button onClick={() => { setCurrentView('store_expiry'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-sm transition-all shadow-sm shrink-0 ${storeExpiringCount > 0 ? 'bg-[#FFFBEB] text-[#F59E0B] border border-[#FDE68A] animate-pulse' : 'bg-[#FFFFFF] border border-[#E5E8EB] text-[#9CA3AF]'}`}><Clock size={16} /><span className="hidden sm:inline">即期通知</span>{storeExpiringCount > 0 && <span className="bg-[#F59E0B] text-white text-[10px] px-1.5 py-0.5 rounded-full ml-0.5">{storeExpiringCount}</span>}</button>
              </div>
            )}

            <a 
              href="https://ypx-erp-5-0.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#10B981] hover:bg-[#ECFDF5] transition-all text-sm font-bold p-2 px-3 rounded-xl active:scale-95 shrink-0"
              title="前往點貨 ERP 系統"
            >
              <ShoppingCart size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">點貨系統</span>
            </a>

            <button onClick={handleLogout} className="flex items-center gap-1.5 text-[#6B7280] hover:text-[#1A1D21] hover:bg-[#F2F4F7] transition-all text-sm font-bold p-2 px-3 rounded-xl active:scale-95 shrink-0"><LogOut size={16} strokeWidth={2.5} /><span className="hidden sm:inline">登出</span></button>
          </div>
        </header>

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 w-full mx-auto pb-32 ${viewMode === 'auto' ? 'max-w-7xl' : ''}`}>
          
          {/* 門市端視圖 */}
          {currentView === 'store_dashboard' && <StoreDashboard currentUser={currentUser} vendors={dynamicVendors} orders={ordersDb} onSelectVendor={(v) => { setSelectedVendor(v); setCurrentView('store_vendor_detail'); }} />}
          {currentView === 'store_abnormal' && <StoreAbnormalOverview currentUser={currentUser} orders={ordersDb} onResolveAbnormal={handleResolveAbnormal} />}
          {currentView === 'store_compensation' && <StoreCompensationOverview currentUser={currentUser} vendors={dynamicVendors} systemOptions={systemOptions} compensations={compensationsDb} db={db} appId={appId} showAlert={showAlert} showConfirm={showConfirm} />}
          {currentView === 'store_expiry' && <StoreExpiryTracker currentUser={currentUser} products={trackingProducts} expiryRecords={expiryRecords} setExpiryRecords={setExpiryRecords} />}
          {currentView === 'store_vendor_detail' && <StoreVendorDetail currentUser={currentUser} vendor={selectedVendor} orders={ordersDb} abnormalReasons={dynamicAbnormalReasons} onVerifySuccess={handleVerifySuccess} onSubmitAbnormal={handleSubmitAbnormalCloud} onResolveAbnormal={handleResolveAbnormal} onBack={() => { setSelectedVendor(null); setCurrentView('store_dashboard'); }} />}

          {/* 總部端視圖切換 */}
          {currentView === 'admin_vendors' && <AdminVendorOverview orders={ordersDb} vendors={dynamicVendors} systemOptions={systemOptions} users={usersDb} db={db} appId={appId} showAlert={showAlert} showConfirm={showConfirm} />}
          {currentView === 'admin_expiry' && <AdminExpiryOverview expiryRecords={expiryRecords} users={usersDb} />}
          {currentView === 'admin_dashboard' && <AdminDashboard users={usersDb} orders={ordersDb} systemOptions={systemOptions} db={db} appId={appId} showAlert={showAlert} showConfirm={showConfirm} />}
          {currentView === 'admin_charts' && <AdminChartsOverview users={usersDb} orders={ordersDb} />}
          {currentView === 'admin_price_trends' && <AdminPriceTrends orders={ordersDb} users={usersDb} />}
          {currentView === 'admin_settings' && <AdminSettings systemOptions={systemOptions} db={db} appId={appId} showAlert={showAlert} showConfirm={showConfirm} onBack={() => setCurrentView('admin_vendors')} initialProducts={initialProducts} initialAbnormalReasons={initialAbnormalReasons} initialCompensationProducts={initialCompensationProducts} />}
          {currentView === 'admin_abnormal' && <AdminAbnormalOverview orders={ordersDb} users={usersDb} />}
          {currentView === 'admin_compensation' && <AdminCompensationOverview compensations={compensationsDb} users={usersDb} db={db} appId={appId} showAlert={showAlert} showConfirm={showConfirm} />}

        </main>
        
        {/* 門市專屬底部導覽列 (深色質感) */}
        {currentUser?.role === 'store' && (
          <div className="sticky bottom-0 left-0 w-full bg-[#1A1D21]/95 backdrop-blur-xl border-t border-[#2C3137] flex justify-around items-center pb-5 pt-3 px-2 sm:px-6 shadow-[0_-8px_30px_rgba(0,0,0,0.2)] z-40 rounded-t-[2.5rem] mt-auto overflow-x-auto hide-scrollbar">
            <button onClick={() => setCurrentView('store_dashboard')} className={`shrink-0 flex flex-col items-center gap-1.5 transition-all px-2 ${currentView === 'store_dashboard' || currentView === 'store_vendor_detail' ? 'text-[#F05A42] scale-105' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}><div className={`p-2 rounded-2xl ${currentView === 'store_dashboard' || currentView === 'store_vendor_detail' ? 'bg-[#2C3137]' : 'bg-transparent'}`}><Briefcase size={22} strokeWidth={currentView === 'store_dashboard' || currentView === 'store_vendor_detail' ? 2.5 : 2} /></div><span className="text-[10px] sm:text-[11px] font-black tracking-wider whitespace-nowrap">各廠商分類</span></button>
            <button onClick={() => setCurrentView('store_abnormal')} className={`shrink-0 flex flex-col items-center gap-1.5 transition-all px-2 relative ${currentView === 'store_abnormal' ? 'text-[#EF4444] scale-105' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}><div className={`p-2 rounded-2xl ${currentView === 'store_abnormal' ? 'bg-[#2C3137]' : 'bg-transparent'}`}><AlertTriangle size={22} strokeWidth={currentView === 'store_abnormal' ? 2.5 : 2} className={storeAbnormalCount > 0 ? 'animate-pulse text-[#EF4444]' : ''} /></div>{storeAbnormalCount > 0 && <span className="absolute top-0 right-1 sm:right-2 bg-[#EF4444] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#1A1D21] shadow-sm">{storeAbnormalCount}</span>}<span className="text-[10px] sm:text-[11px] font-black tracking-wider whitespace-nowrap">異常通知</span></button>
            <button onClick={() => setCurrentView('store_compensation')} className={`shrink-0 flex flex-col items-center gap-1.5 transition-all px-2 relative ${currentView === 'store_compensation' ? 'text-[#8B5CF6] scale-105' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}><div className={`p-2 rounded-2xl ${currentView === 'store_compensation' ? 'bg-[#2C3137]' : 'bg-transparent'}`}><RefreshCcw size={22} strokeWidth={currentView === 'store_compensation' ? 2.5 : 2} className={storeCompensationCount > 0 ? 'animate-pulse text-[#8B5CF6]' : ''} /></div>{storeCompensationCount > 0 && <span className="absolute top-0 right-1 sm:right-2 bg-[#8B5CF6] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#1A1D21] shadow-sm">{storeCompensationCount}</span>}<span className="text-[10px] sm:text-[11px] font-black tracking-wider whitespace-nowrap">退貨補償</span></button>
            <button onClick={() => setCurrentView('store_expiry')} className={`shrink-0 flex flex-col items-center gap-1.5 transition-all px-2 relative ${currentView === 'store_expiry' ? 'text-[#F59E0B] scale-105' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}><div className={`p-2 rounded-2xl ${currentView === 'store_expiry' ? 'bg-[#2C3137]' : 'bg-transparent'}`}><Clock size={22} strokeWidth={currentView === 'store_expiry' ? 2.5 : 2} className={storeExpiringCount > 0 ? 'animate-pulse' : ''} /></div>{storeExpiringCount > 0 && <span className="absolute top-0 right-1 sm:right-2 bg-[#F59E0B] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#1A1D21] shadow-sm">{storeExpiringCount}</span>}<span className="text-[10px] sm:text-[11px] font-black tracking-wider whitespace-nowrap">即期通知</span></button>
          </div>
        )}

        {/* 總部專屬底部導覽列 (深色質感) */}
        {currentUser?.role === 'admin' && (
          <div className="sticky bottom-0 left-0 w-full bg-[#1A1D21]/95 backdrop-blur-xl border-t border-[#2C3137] flex justify-between sm:justify-around items-center pb-5 pt-3 px-2 sm:px-6 shadow-[0_-8px_30px_rgba(0,0,0,0.2)] z-40 rounded-t-[2.5rem] mt-auto overflow-x-auto hide-scrollbar">
            <button onClick={() => setCurrentView('admin_vendors')} className={`shrink-0 flex flex-col items-center gap-1 transition-all px-2 ${currentView === 'admin_vendors' || currentView === 'admin_settings' ? 'text-[#F05A42] scale-105' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}><div className={`p-2 rounded-2xl ${currentView === 'admin_vendors' || currentView === 'admin_settings' ? 'bg-[#2C3137]' : 'bg-transparent'}`}><Layers size={22} strokeWidth={currentView === 'admin_vendors' || currentView === 'admin_settings' ? 2.5 : 2} /></div><span className="text-[10px] sm:text-[11px] font-black tracking-wider whitespace-nowrap">各廠商分類</span></button>
            <button onClick={() => setCurrentView('admin_abnormal')} className={`shrink-0 flex flex-col items-center gap-1 transition-all px-2 relative ${currentView === 'admin_abnormal' ? 'text-[#EF4444] scale-105' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}><div className={`p-2 rounded-2xl ${currentView === 'admin_abnormal' ? 'bg-[#2C3137]' : 'bg-transparent'}`}><AlertTriangle size={22} strokeWidth={currentView === 'admin_abnormal' ? 2.5 : 2} className={adminAbnormalCount > 0 ? 'animate-pulse text-[#EF4444]' : ''} /></div>{adminAbnormalCount > 0 && <span className="absolute top-0 right-0 sm:right-1 bg-[#EF4444] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#1A1D21] shadow-sm">{adminAbnormalCount}</span>}<span className="text-[10px] sm:text-[11px] font-black tracking-wider whitespace-nowrap">異常通報</span></button>
            <button onClick={() => setCurrentView('admin_compensation')} className={`shrink-0 flex flex-col items-center gap-1 transition-all px-2 relative ${currentView === 'admin_compensation' ? 'text-[#8B5CF6] scale-105' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}><div className={`p-2 rounded-2xl ${currentView === 'admin_compensation' ? 'bg-[#2C3137]' : 'bg-transparent'}`}><RefreshCcw size={22} strokeWidth={currentView === 'admin_compensation' ? 2.5 : 2} className={adminCompensationCount > 0 ? 'animate-pulse text-[#8B5CF6]' : ''} /></div>{adminCompensationCount > 0 && <span className="absolute top-0 right-0 sm:right-1 bg-[#8B5CF6] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#1A1D21] shadow-sm">{adminCompensationCount}</span>}<span className="text-[10px] sm:text-[11px] font-black tracking-wider whitespace-nowrap">退貨補償</span></button>
            <button onClick={() => setCurrentView('admin_expiry')} className={`shrink-0 flex flex-col items-center gap-1 transition-all px-2 ${currentView === 'admin_expiry' ? 'text-[#F59E0B] scale-105' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}><div className={`p-2 rounded-2xl ${currentView === 'admin_expiry' ? 'bg-[#2C3137]' : 'bg-transparent'}`}><CalendarDays size={22} strokeWidth={currentView === 'admin_expiry' ? 2.5 : 2} /></div><span className="text-[10px] sm:text-[11px] font-black tracking-wider whitespace-nowrap">食材有效期線</span></button>
            <button onClick={() => setCurrentView('admin_dashboard')} className={`shrink-0 flex flex-col items-center gap-1 transition-all px-2 ${currentView === 'admin_dashboard' ? 'text-white scale-105' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}><div className={`p-2 rounded-2xl ${currentView === 'admin_dashboard' ? 'bg-[#2C3137]' : 'bg-transparent'}`}><Store size={22} strokeWidth={currentView === 'admin_dashboard' ? 2.5 : 2} /></div><span className="text-[10px] sm:text-[11px] font-black tracking-wider whitespace-nowrap">各店叫貨額</span></button>
            <button onClick={() => setCurrentView('admin_charts')} className={`shrink-0 flex flex-col items-center gap-1 transition-all px-2 ${currentView === 'admin_charts' ? 'text-[#10B981] scale-105' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}><div className={`p-2 rounded-2xl ${currentView === 'admin_charts' ? 'bg-[#2C3137]' : 'bg-transparent'}`}><PieChart size={22} strokeWidth={currentView === 'admin_charts' ? 2.5 : 2} /></div><span className="text-[10px] sm:text-[11px] font-black tracking-wider whitespace-nowrap">圖表分析</span></button>
            <button onClick={() => setCurrentView('admin_price_trends')} className={`shrink-0 flex flex-col items-center gap-1 transition-all px-2 ${currentView === 'admin_price_trends' ? 'text-[#3B82F6] scale-105' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}><div className={`p-2 rounded-2xl ${currentView === 'admin_price_trends' ? 'bg-[#2C3137]' : 'bg-transparent'}`}><TrendingUp size={22} strokeWidth={currentView === 'admin_price_trends' ? 2.5 : 2} /></div><span className="text-[10px] sm:text-[11px] font-black tracking-wider whitespace-nowrap">上漲降價</span></button>
          </div>
        )}

      </div>
      <LayoutToggler />
    </div>
  );
}

// ==========================================
// 總部設定：商品進貨單位管理 & 效期追蹤商品管理 & 異常原因管理
// ==========================================
function AdminSettings({ systemOptions, db, appId, showAlert, showConfirm, onBack, initialProducts, initialAbnormalReasons, initialCompensationProducts }) {
  const [newUnitInput, setNewUnitInput] = useState('');
  
  const [newProductInput, setNewProductInput] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editProductValue, setEditProductValue] = useState('');

  const [newReasonInput, setNewReasonInput] = useState('');
  const [editingReason, setEditingReason] = useState(null);
  const [editReasonValue, setEditReasonValue] = useState('');

  const [newCompProductInput, setNewCompProductInput] = useState('');
  const [editingCompProduct, setEditingCompProduct] = useState(null);
  const [editCompProductValue, setEditCompProductValue] = useState('');

  const trackingProducts = systemOptions?.trackingProducts || initialProducts;
  const abnormalReasons = systemOptions?.abnormalReasons || initialAbnormalReasons;
  const compensationProducts = systemOptions?.compensationProducts || initialCompensationProducts || [];
  
  const handleAddUnit = async () => {
    const val = newUnitInput.trim();
    if(!val) return;
    const updatedOptions = { ...systemOptions, units: [...(systemOptions.units || []), val] };
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_system', 'options'), updatedOptions, { merge: true });
      setNewUnitInput('');
    } catch (e) { showAlert('新增單位失敗'); }
  };

  const handleRemoveUnit = (uToRemove) => {
    showConfirm(`確定要刪除單位選項嗎？`, async () => {
      const updatedOptions = { 
        ...systemOptions, 
        units: (systemOptions.units || []).filter(u => {
          const uName = typeof u === 'string' ? u : u.name;
          const targetName = typeof uToRemove === 'string' ? uToRemove : uToRemove.name;
          return uName !== targetName;
        }) 
      };
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_system', 'options'), updatedOptions, { merge: true });
      } catch (e) { showAlert('刪除單位失敗'); }
    });
  };

  const handleAddProduct = async () => {
    const val = newProductInput.trim();
    if(!val) return;
    if(trackingProducts.includes(val)) { showAlert('此商品已存在清單中'); return; }
    const updatedOptions = { ...systemOptions, trackingProducts: [...trackingProducts, val] };
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_system', 'options'), updatedOptions, { merge: true });
      setNewProductInput('');
    } catch (e) { showAlert('新增商品失敗'); }
  };

  const handleRemoveProduct = (pToRemove) => {
    showConfirm(`確定要刪除「${pToRemove}」嗎？\n(這不會刪除門市已建立的追蹤紀錄)`, async () => {
      const updatedOptions = { ...systemOptions, trackingProducts: trackingProducts.filter(p => p !== pToRemove) };
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_system', 'options'), updatedOptions, { merge: true });
      } catch (e) { showAlert('刪除商品失敗'); }
    });
  };

  const handleSaveEditProduct = async (oldName) => {
    const val = editProductValue.trim();
    if (!val || val === oldName) { setEditingProduct(null); return; }
    const updatedProducts = trackingProducts.map(p => p === oldName ? val : p);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_system', 'options'), { ...systemOptions, trackingProducts: updatedProducts }, { merge: true });
      setEditingProduct(null);
    } catch(e) { showAlert('修改商品名稱失敗'); }
  };

  // 異常原因管理功能
  const handleAddReason = async () => {
    const val = newReasonInput.trim();
    if(!val) return;
    if(abnormalReasons.includes(val)) { showAlert('此原因已存在清單中'); return; }
    const updatedOptions = { ...systemOptions, abnormalReasons: [...abnormalReasons, val] };
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_system', 'options'), updatedOptions, { merge: true });
      setNewReasonInput('');
    } catch (e) { showAlert('新增原因失敗'); }
  };

  const handleRemoveReason = (rToRemove) => {
    showConfirm(`確定要刪除「${rToRemove}」嗎？`, async () => {
      const updatedOptions = { ...systemOptions, abnormalReasons: abnormalReasons.filter(r => r !== rToRemove) };
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_system', 'options'), updatedOptions, { merge: true });
      } catch (e) { showAlert('刪除原因失敗'); }
    });
  };

  const handleSaveEditReason = async (oldReason) => {
    const val = editReasonValue.trim();
    if (!val || val === oldReason) { setEditingReason(null); return; }
    const updatedReasons = abnormalReasons.map(r => r === oldReason ? val : r);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_system', 'options'), { ...systemOptions, abnormalReasons: updatedReasons }, { merge: true });
      setEditingReason(null);
    } catch(e) { showAlert('修改異常原因失敗'); }
  };

  // 退貨補償商品清單管理功能
  const handleAddCompProduct = async () => {
    const val = newCompProductInput.trim();
    if(!val) return;
    if(compensationProducts.includes(val)) { showAlert('此商品已存在清單中'); return; }
    const updatedOptions = { ...systemOptions, compensationProducts: [...compensationProducts, val] };
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_system', 'options'), updatedOptions, { merge: true });
      setNewCompProductInput('');
    } catch (e) { showAlert('新增退貨商品失敗'); }
  };

  const handleRemoveCompProduct = (pToRemove) => {
    showConfirm(`確定要刪除「${pToRemove}」嗎？\n(這不會影響過去的退換貨紀錄)`, async () => {
      const updatedOptions = { ...systemOptions, compensationProducts: compensationProducts.filter(p => p !== pToRemove) };
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_system', 'options'), updatedOptions, { merge: true });
      } catch (e) { showAlert('刪除退貨商品失敗'); }
    });
  };

  const handleSaveEditCompProduct = async (oldName) => {
    const val = editCompProductValue.trim();
    if (!val || val === oldName) { setEditingCompProduct(null); return; }
    const updatedProducts = compensationProducts.map(p => p === oldName ? val : p);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_system', 'options'), { ...systemOptions, compensationProducts: updatedProducts }, { merge: true });
      setEditingCompProduct(null);
    } catch(e) { showAlert('修改退貨商品名稱失敗'); }
  };

  return (
    <div className="animate-in slide-in-from-right-8 duration-500">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1D21] mb-2 tracking-tight">系統設定</h2>
          <p className="text-[#6B7280] font-bold">管理商品進貨單位與全域系統參數。</p>
        </div>
        <button onClick={onBack} className="flex items-center justify-center gap-2 text-[#6B7280] font-bold hover:text-[#1A1D21] transition-colors bg-[#FFFFFF] px-5 py-3 rounded-2xl shadow-sm border border-[#E5E8EB] active:scale-95">
          <ChevronLeft size={20} />返回
        </button>
      </div>

      {/* 新增：退貨補償商品清單管理 */}
      <div className="bg-[#FFFFFF] rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent p-7 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-[#FAF5FF] rounded-xl"><RefreshCcw className="text-[#8B5CF6]" size={24} /></div>
          <div>
            <h3 className="font-black text-[#1A1D21] text-xl">退貨補償商品清單管理</h3>
            <p className="text-sm font-bold text-[#6B7280] mt-1">設定門市端「退貨補償」的商品下拉選單</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input type="text" value={newCompProductInput} onChange={(e) => setNewCompProductInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCompProduct()} placeholder="新增可退換的商品名稱..." className="flex-1 px-5 py-3.5 bg-[#FFFFFF] border border-[#E5E8EB] rounded-xl focus:ring-2 focus:ring-[#8B5CF6] outline-none font-bold text-[#1A1D21] shadow-inner" />
          <button onClick={handleAddCompProduct} className="px-6 py-3.5 bg-[#8B5CF6] text-white font-bold rounded-xl hover:bg-[#7C3AED] transition-colors shadow-sm active:scale-95 whitespace-nowrap">新增商品</button>
        </div>
        <div className="flex flex-col gap-3">
          {compensationProducts.map((p, i) => (
            <div key={i} className="bg-[#FFFFFF] border border-[#E5E8EB] px-5 py-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-3 transition-colors hover:border-[#8B5CF6]/30">
              {editingCompProduct === p ? (
                <div className="flex items-center gap-3 w-full">
                   <input autoFocus value={editCompProductValue} onChange={e => setEditCompProductValue(e.target.value)} className="flex-1 px-4 py-2 bg-[#FAF5FF]/50 border border-[#E9D5FF] focus:ring-2 focus:ring-[#8B5CF6] rounded-lg outline-none font-bold text-[#5B21B6] shadow-inner" />
                   <button onClick={() => handleSaveEditCompProduct(p)} className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-bold text-sm shadow-sm transition-colors whitespace-nowrap">儲存</button>
                   <button onClick={() => setEditingCompProduct(null)} className="px-4 py-2 bg-[#E5E8EB] hover:bg-[#D1D5DB] text-[#1A1D21] rounded-lg font-bold text-sm transition-colors whitespace-nowrap">取消</button>
                </div>
              ) : (
                <>
                  <span className="font-bold text-[#1A1D21] text-lg">{p}</span>
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => { setEditingCompProduct(p); setEditCompProductValue(p); }} className="p-2.5 bg-[#F2F4F7] text-[#6B7280] hover:text-[#8B5CF6] hover:bg-[#FAF5FF] rounded-xl transition-colors shadow-sm" title="編輯名稱"><Edit2 size={18} /></button>
                    <button onClick={() => handleRemoveCompProduct(p)} className="p-2.5 bg-[#F2F4F7] text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-colors shadow-sm" title="刪除商品"><Trash2 size={18} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {compensationProducts.length === 0 && <span className="text-[#6B7280] text-sm font-bold mt-2 text-center py-6 border-2 border-dashed border-[#E5E8EB] rounded-xl">目前尚無退貨商品選單</span>}
        </div>
      </div>

      {/* 異常通報原因管理 (卡片) */}
      <div className="bg-[#FFFFFF] rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent p-7 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-[#FEF2F2] rounded-xl"><AlertTriangle className="text-[#EF4444]" size={24} /></div>
          <div>
            <h3 className="font-black text-[#1A1D21] text-xl">異常通報原因管理</h3>
            <p className="text-sm font-bold text-[#6B7280] mt-1">設定門市端「回報異常狀況」的下拉選單內容</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input type="text" value={newReasonInput} onChange={(e) => setNewReasonInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddReason()} placeholder="新增異常原因，例如：包裝破損、數量不符..." className="flex-1 px-5 py-3.5 bg-[#FFFFFF] border border-[#E5E8EB] rounded-xl focus:ring-2 focus:ring-[#EF4444] outline-none font-bold text-[#1A1D21] shadow-inner" />
          <button onClick={handleAddReason} className="px-6 py-3.5 bg-[#EF4444] text-white font-bold rounded-xl hover:bg-[#DC2626] transition-colors shadow-sm active:scale-95 whitespace-nowrap">新增原因</button>
        </div>
        <div className="flex flex-col gap-3">
          {abnormalReasons.map((r, i) => (
            <div key={i} className="bg-[#FFFFFF] border border-[#E5E8EB] px-5 py-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-3 transition-colors hover:border-[#EF4444]/30">
              {editingReason === r ? (
                <div className="flex items-center gap-3 w-full">
                   <input autoFocus value={editReasonValue} onChange={e => setEditReasonValue(e.target.value)} className="flex-1 px-4 py-2 bg-[#FEF2F2]/50 border border-[#FECACA] focus:ring-2 focus:ring-[#EF4444] rounded-lg outline-none font-bold text-[#991B1B] shadow-inner" />
                   <button onClick={() => handleSaveEditReason(r)} className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-bold text-sm shadow-sm transition-colors whitespace-nowrap">儲存</button>
                   <button onClick={() => setEditingReason(null)} className="px-4 py-2 bg-[#E5E8EB] hover:bg-[#D1D5DB] text-[#1A1D21] rounded-lg font-bold text-sm transition-colors whitespace-nowrap">取消</button>
                </div>
              ) : (
                <>
                  <span className="font-bold text-[#1A1D21] text-lg">{r}</span>
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => { setEditingReason(r); setEditReasonValue(r); }} className="p-2.5 bg-[#F2F4F7] text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-colors shadow-sm" title="編輯原因"><Edit2 size={18} /></button>
                    <button onClick={() => handleRemoveReason(r)} className="p-2.5 bg-[#F2F4F7] text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-colors shadow-sm" title="刪除原因"><Trash2 size={18} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {abnormalReasons.length === 0 && <span className="text-[#6B7280] text-sm font-bold mt-2 text-center py-6 border-2 border-dashed border-[#E5E8EB] rounded-xl">目前尚無異常原因選單</span>}
        </div>
      </div>

      {/* 原本的：商品進貨單位管理 */}
      <div className="bg-[#FFFFFF] rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent p-7 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-[#F2F4F7] rounded-xl"><Package className="text-[#2C3137]" size={24} /></div>
          <div>
            <h3 className="font-black text-[#1A1D21] text-xl">商品進貨單位管理</h3>
            <p className="text-sm font-bold text-[#6B7280] mt-1">此處新增的單位將可於單據明細中使用</p>
          </div>
        </div>
        <div className="flex gap-3 mb-6">
          <input type="text" value={newUnitInput} onChange={(e) => setNewUnitInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()} placeholder="輸入新單位，例如: 克、包、籃..." className="flex-1 px-5 py-3.5 bg-[#FFFFFF] border border-[#E5E8EB] rounded-xl focus:ring-2 focus:ring-[#F05A42] outline-none font-bold text-[#1A1D21] shadow-inner" />
          <button onClick={handleAddUnit} className="px-6 py-3.5 bg-[#2C3137] text-white font-bold rounded-xl hover:bg-[#111418] transition-colors shadow-sm active:scale-95 whitespace-nowrap">新增單位</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(systemOptions?.units || []).map((u, i) => {
            const uName = typeof u === 'string' ? u : u.name;
            return (
              <span key={i} className="bg-[#FFFFFF] border border-[#E5E8EB] text-[#1A1D21] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                {uName}
                <button onClick={() => handleRemoveUnit(u)} className="text-[#6B7280] hover:text-[#EF4444] transition-colors p-1 bg-[#F2F4F7] rounded-full"><X size={14} strokeWidth={3} /></button>
              </span>
            );
          })}
          {(!systemOptions?.units || systemOptions.units.length === 0) && <span className="text-[#6B7280] text-sm font-bold mt-1">目前無自訂單位</span>}
        </div>
      </div>

      {/* 原本的：效期追蹤商品管理 */}
      <div className="bg-[#FFFFFF] rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent p-7 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-[#FFFBEB] rounded-xl"><CalendarDays className="text-[#F59E0B]" size={24} /></div>
          <div>
            <h3 className="font-black text-[#1A1D21] text-xl">效期追蹤商品管理</h3>
            <p className="text-sm font-bold text-[#6B7280] mt-1">設定門市端「即期通知」可供選擇的預設商品清單</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input type="text" value={newProductInput} onChange={(e) => setNewProductInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddProduct()} placeholder="新增需追蹤的商品名稱..." className="flex-1 px-5 py-3.5 bg-[#FFFFFF] border border-[#E5E8EB] rounded-xl focus:ring-2 focus:ring-[#F59E0B] outline-none font-bold text-[#1A1D21] shadow-inner" />
          <button onClick={handleAddProduct} className="px-6 py-3.5 bg-[#F59E0B] text-white font-bold rounded-xl hover:bg-[#D97706] transition-colors shadow-sm active:scale-95 whitespace-nowrap">新增商品</button>
        </div>
        <div className="flex flex-col gap-3">
          {trackingProducts.map((p, i) => (
            <div key={i} className="bg-[#FFFFFF] border border-[#E5E8EB] px-5 py-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-3 transition-colors hover:border-[#F59E0B]/30">
              {editingProduct === p ? (
                <div className="flex items-center gap-3 w-full">
                   <input autoFocus value={editProductValue} onChange={e => setEditProductValue(e.target.value)} className="flex-1 px-4 py-2 bg-[#FFFBEB]/50 border border-[#FDE68A] focus:ring-2 focus:ring-[#F59E0B] rounded-lg outline-none font-bold text-[#D97706] shadow-inner" />
                   <button onClick={() => handleSaveEditProduct(p)} className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-bold text-sm shadow-sm transition-colors whitespace-nowrap">儲存</button>
                   <button onClick={() => setEditingProduct(null)} className="px-4 py-2 bg-[#E5E8EB] hover:bg-[#D1D5DB] text-[#1A1D21] rounded-lg font-bold text-sm transition-colors whitespace-nowrap">取消</button>
                </div>
              ) : (
                <>
                  <span className="font-bold text-[#1A1D21] text-lg">{p}</span>
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => { setEditingProduct(p); setEditProductValue(p); }} className="p-2.5 bg-[#F2F4F7] text-[#6B7280] hover:text-[#F59E0B] hover:bg-[#FFFBEB] rounded-xl transition-colors shadow-sm" title="編輯名稱"><Edit2 size={18} /></button>
                    <button onClick={() => handleRemoveProduct(p)} className="p-2.5 bg-[#F2F4F7] text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-colors shadow-sm" title="刪除商品"><Trash2 size={18} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {trackingProducts.length === 0 && <span className="text-[#6B7280] text-sm font-bold mt-2 text-center py-6 border-2 border-dashed border-[#E5E8EB] rounded-xl">目前尚無預設商品清單</span>}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 前臺：門市總覽 (各廠商分類)
// ==========================================
function StoreDashboard({ currentUser, vendors, orders, onSelectVendor }) {
  const [expandedVendor, setExpandedVendor] = useState(null);

  const storeOrders = useMemo(() => orders.filter(o => o.branchUsername === currentUser.username || o.branchName === currentUser.name), [currentUser, orders]);

  const vendorStats = useMemo(() => {
    return vendors.map(vendor => {
      const vOrders = storeOrders.filter(o => o.id.includes(`-${vendor.id}-`) && o.status !== 'received');
      return { ...vendor, orderCount: vOrders.length };
    }).filter(v => v.orderCount > 0); 
  }, [vendors, storeOrders]);

  // 取得最近 20 筆已接收的單據，並依照廠商分類
  const recentReceived = useMemo(() => storeOrders.filter(o => o.status === 'received').sort((a,b) => b.timestamp - a.timestamp).slice(0, 20), [storeOrders]);
  
  const groupedReceivedOrders = useMemo(() => {
    const groups = {};
    recentReceived.forEach(o => {
      const vName = o.id.split('-')[1] || '其他分類';
      if (!groups[vName]) groups[vName] = [];
      groups[vName].push(o);
    });
    return groups;
  }, [recentReceived]);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1D21] tracking-tight">雲端進貨單明細 (來自點貨系統)</h2>
          <p className="text-sm sm:text-base text-[#6B7280] mt-1 font-medium">當點貨系統發送叫貨單後，將即時顯示於下方</p>
        </div>
        
        <a href="https://ypx-erp-5-0.vercel.app/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[#10B981] hover:bg-[#059669] text-white px-6 py-3.5 rounded-2xl font-black shadow-sm transition-all active:scale-95">
          <ShoppingCart size={20} />
          前往建立新叫貨單
        </a>
      </div>

      {vendorStats.length === 0 ? (
         <div className="text-center py-20 text-[#9CA3AF] font-bold border-2 border-dashed border-[#E5E8EB] rounded-[2rem] bg-[#FFFFFF]">
            目前沒有來自點貨系統的待接收單據
         </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {vendorStats.map(vendor => (
            <button key={vendor.id} onClick={() => onSelectVendor(vendor)} className="group bg-[#FFFFFF] p-7 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent hover:shadow-[0_8px_30px_rgba(240,90,66,0.15)] active:scale-[0.98] transition-all duration-300 text-left flex flex-col h-full relative">
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="p-4 bg-[#F2F4F7] rounded-2xl group-hover:bg-[#FFF2F0] transition-colors shadow-inner text-[#F05A42]">
                  <Briefcase size={28} strokeWidth={1.5} />
                </div>
                <span className="bg-[#FEF2F2] border border-[#FECACA] text-[#EF4444] text-xs px-3.5 py-1.5 rounded-full font-bold animate-pulse shadow-sm">
                  {vendor.orderCount} 筆待核對
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#1A1D21] mb-2 group-hover:text-[#F05A42] transition-colors">{vendor.name}</h3>
              <p className="text-xs sm:text-sm text-[#6B7280] mb-8 font-medium">點擊進入點收與核對作業</p>
              
              <div className="pt-5 border-t-2 border-[#F2F4F7] flex justify-between items-center w-full mt-auto">
                <span className="text-[#9CA3AF] text-xs font-bold uppercase tracking-widest">點收狀態</span>
                <span className="text-sm font-black text-[#F05A42] flex items-center gap-1 group-hover:translate-x-1 transition-transform">前往核對 <ChevronLeft size={16} className="rotate-180" /></span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 最近已入庫紀錄，風琴式分類小卡顯示 */}
      {Object.keys(groupedReceivedOrders).length > 0 && (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-xl font-black text-[#1A1D21] mb-5 flex items-center gap-2">
            <CheckCircle2 className="text-[#10B981]" /> 最近已入庫紀錄 (依廠商分類)
          </h3>
          <div className="space-y-4">
            {Object.entries(groupedReceivedOrders).map(([vName, vOrders]) => {
              const isExpanded = expandedVendor === vName;
              return (
                <div key={vName} className={`bg-[#FFFFFF] rounded-[2rem] shadow-sm border border-[#E5E8EB] overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-md border-[#10B981]/30' : 'hover:border-[#9CA3AF]/50'}`}>
                   <button onClick={() => setExpandedVendor(isExpanded ? null : vName)} className="w-full p-5 sm:p-6 flex justify-between items-center hover:bg-[#F2F4F7]/50 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className={`p-3 rounded-2xl transition-colors ${isExpanded ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#F2F4F7] text-[#9CA3AF]'}`}>
                           <Briefcase size={24} />
                         </div>
                         <h4 className="font-black text-[#1A1D21] text-xl">{vName}</h4>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className={`text-sm font-bold px-3 py-1.5 rounded-lg hidden sm:block ${isExpanded ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#F2F4F7] text-[#6B7280]'}`}>
                            共 {vOrders.length} 筆已入庫
                         </span>
                         <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#F2F4F7] text-[#9CA3AF]'}`}>
                            <ChevronDown className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                         </div>
                      </div>
                   </button>
                   
                   {isExpanded && (
                     <div className="p-5 sm:p-6 pt-0 border-t border-[#F2F4F7] bg-[#F2F4F7]/20">
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                         {vOrders.map(order => {
                           const totalQty = order.items?.reduce((sum, it) => sum + (parseFloat(it.orderQty || it.quantity) || 0), 0) || 0;
                           const uniqueUnits = [...new Set(order.items?.map(it => it.unit || '件'))];
                           const unitText = uniqueUnits.length === 1 ? uniqueUnits[0] : '件(等)';

                           return (
                             <div key={order.id} className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E5E8EB] flex flex-col gap-3 opacity-90 hover:opacity-100 transition-opacity shadow-sm">
                                <div className="flex justify-between items-start">
                                   <div>
                                      <span className="text-[10px] font-bold text-[#6B7280] bg-[#F2F4F7] px-2 py-1 rounded-md mb-1.5 inline-block tracking-widest">{order.date}</span>
                                      <span className="font-black text-[#1A1D21] text-base block">{order.id}</span>
                                   </div>
                                   <span className="text-xs font-bold text-[#10B981] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-1 rounded-lg flex items-center gap-1 shrink-0">
                                     <CheckCircle2 size={12} /> 已入庫
                                   </span>
                                </div>
                                <div className="pt-2 border-t border-[#F2F4F7] flex justify-between items-end">
                                   <span className="text-xs font-bold text-[#9CA3AF]">進貨總量</span>
                                   <span className="font-black text-[#1A1D21] text-lg">{totalQty} <span className="text-sm font-bold text-[#6B7280]">{unitText}</span></span>
                                </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 前臺：門市異常通報總覽 
// ==========================================
function StoreAbnormalOverview({ currentUser, orders, onResolveAbnormal }) {
  const abnormalOrders = orders.filter(o => (o.branchUsername === currentUser.username || o.branchName === currentUser.name) && o.status === 'abnormal').sort((a, b) => (b.abnormalTime || b.timestamp) - (a.abnormalTime || a.timestamp));

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1D21] tracking-tight mb-2">異常通報追蹤</h2>
        <p className="text-sm sm:text-base text-[#6B7280] font-bold">檢視本店<span className="text-[#EF4444]">尚未排除</span>的異常單據，修復完成後請點擊確認。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {abnormalOrders.length === 0 ? (
          <div className="col-span-full text-center py-20 text-[#9CA3AF] font-bold text-lg border-2 border-dashed border-[#E5E8EB] rounded-[2rem] bg-[#FFFFFF]">
            太棒了！目前門店無任何待處理的異常通報。
          </div>
        ) : (
          abnormalOrders.map(order => {
            const vendorName = order.id.split('-')[1] || '其他廠商';
            const dateStr = order.abnormalTime ? new Date(order.abnormalTime).toLocaleString('zh-TW', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : order.date;

            return (
              <div key={order.id} className="bg-[#FFFFFF] rounded-[2rem] p-6 shadow-sm border-[2px] border-[#FECACA] flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 bg-[#EF4444] text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm tracking-widest">
                  待處理
                </div>
                <div className="flex justify-between items-start pt-2">
                   <div className="flex items-center gap-4">
                      <div className="p-3.5 bg-[#FEF2F2] text-[#EF4444] rounded-2xl shadow-inner"><AlertTriangle size={28} /></div>
                      <div>
                        <span className="bg-[#1A1D21] text-white text-[11px] font-black px-2.5 py-1 rounded-md mb-1.5 inline-block tracking-widest">單號 {order.id}</span>
                        <h3 className="font-black text-[#1A1D21] text-xl">{vendorName}</h3>
                      </div>
                   </div>
                </div>
                <div className="flex items-center text-xs font-bold text-[#9CA3AF] gap-1.5 mt-1">
                  <Clock size={14} /> 通報時間：{dateStr}
                </div>
                
                <div className="bg-[#FEF2F2] p-5 rounded-2xl border border-[#FECACA]/50 mt-2 flex-1">
                  <p className="font-black text-[#1A1D21] mb-2 flex items-center gap-2"><Tag size={16} className="text-[#EF4444]"/> {order.abnormalItem}</p>
                  <p className="font-bold text-[#EF4444] text-sm leading-relaxed">原因：{order.abnormalReason}</p>
                </div>
                
                {order.abnormalPhoto && (
                  <div className="mt-2 rounded-2xl overflow-hidden border-2 border-[#FECACA]">
                    <img src={order.abnormalPhoto} alt="異常照片" className="w-full h-32 object-cover hover:h-64 transition-all duration-300 cursor-pointer" title="點擊預覽" />
                  </div>
                )}
                
                <div className="border-t border-[#FECACA] pt-4 mt-2">
                  <button onClick={() => onResolveAbnormal(order.id)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[1.25rem] bg-[#10B981] text-white hover:bg-[#059669] font-black active:scale-95 shadow-md transition-all">
                    <CheckCircle2 size={20} /> 異常已排除，修復完成並入庫
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}

// ==========================================
// 前臺：門市退貨補償申請面板 
// ==========================================
function StoreCompensationOverview({ currentUser, vendors, systemOptions, compensations, db, appId, showAlert, showConfirm }) {
  const [form, setForm] = useState({ vendor: '', productName: '', quantity: '', unit: '件' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const storeCompensations = compensations.filter(c => c.storeId === currentUser.username);
  
  const pendingComps = storeCompensations.filter(c => c.status === 'pending');
  const completedComps = storeCompensations.filter(c => c.status === 'completed');

  // 取得後台統一管理的退貨商品清單
  const compProducts = systemOptions?.compensationProducts || [];

  const handleSubmit = async () => {
    if (!form.vendor || !form.productName || !form.quantity || !form.unit) {
      showAlert('請完整填寫退貨補償的所有欄位。');
      return;
    }
    setIsSubmitting(true);
    try {
      const newId = `C${Date.now()}`;
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_compensations', newId), {
        id: newId,
        storeId: currentUser.username,
        branchName: currentUser.name,
        vendor: form.vendor,
        productName: form.productName,
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        status: 'pending',
        timestamp: Date.now()
      });
      showAlert(' 退貨補償申請已送出！總部處理後會在此頁面通知。');
      setForm({ vendor: '', productName: '', quantity: '', unit: '件' });
    } catch (error) {
      console.error(error);
      showAlert('申請失敗，請確認網路連線。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = (compId) => {
    showConfirm('確定已收到補償並處理完畢嗎？\n按下確認後，此單將標記為「已完成」，並與總部同步。', async () => {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_compensations', compId), {
          status: 'completed',
          completedTime: Date.now()
        });
        showAlert(' 已成功將此單標記為補償完畢！');
      } catch (error) {
        console.error(error);
        showAlert('系統更新失敗，請確認網路連線。');
      }
    });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1D21] tracking-tight mb-2">商品退貨補償申請</h2>
        <p className="text-sm sm:text-base text-[#6B7280] font-bold">向總部提出退換貨或補償需求，即時追蹤處理進度。</p>
      </div>

      <div className="bg-[#FFFFFF] rounded-[2.5rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent mb-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3.5 bg-[#FAF5FF] text-[#8B5CF6] rounded-2xl shadow-inner"><RefreshCcw size={28} strokeWidth={2} /></div>
          <h3 className="text-xl font-black text-[#1A1D21]">新增一筆退換貨申請</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 items-end bg-[#F2F4F7]/50 p-6 rounded-[2rem] border border-[#E5E8EB]">
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-2 ml-1">1. 廠商</label>
            <select value={form.vendor} onChange={(e) => setForm({...form, vendor: e.target.value})} className="w-full bg-[#FFFFFF] border border-[#E5E8EB] rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#8B5CF6] font-bold text-[#1A1D21] shadow-sm cursor-pointer">
              <option value="" disabled>選擇廠商...</option>
              {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-2 ml-1">2. 商品名稱</label>
            <select 
              value={form.productName} 
              onChange={(e) => setForm({...form, productName: e.target.value})} 
              className="w-full bg-[#FFFFFF] border border-[#E5E8EB] rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#8B5CF6] font-bold text-[#1A1D21] shadow-sm cursor-pointer"
            >
              <option value="" disabled>請選擇要退換的商品...</option>
              {compProducts.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-2 ml-1">3. 數量</label>
            <div className="flex bg-[#FFFFFF] border border-[#E5E8EB] rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-[#8B5CF6]">
              <input type="number" min="0" step="0.5" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} placeholder="數字" className="w-full px-4 py-3.5 outline-none font-black text-[#8B5CF6] bg-transparent text-center" />
              <select value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})} className="bg-[#F2F4F7] px-3 font-bold text-[#1A1D21] outline-none cursor-pointer border-l border-[#E5E8EB]">
                {(systemOptions?.units || []).map((u, i) => {
                   const uName = typeof u === 'string' ? u : u.name;
                   return <option key={i} value={uName}>{uName}</option>;
                })}
              </select>
            </div>
          </div>
          <div className="lg:col-span-1 mt-4 lg:mt-0">
            <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white py-3.5 px-4 rounded-2xl font-black shadow-md transition-all active:scale-95 disabled:bg-[#D1D5DB] disabled:scale-100 whitespace-nowrap">
              {isSubmitting ? '送出中...' : '送出申請'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 待處理 */}
        <div>
          <h3 className="font-black text-[#8B5CF6] text-xl mb-4 flex items-center gap-2"><Clock size={20} /> 處理中 ({pendingComps.length})</h3>
          <div className="space-y-4">
            {pendingComps.length === 0 ? <div className="text-center py-8 text-[#9CA3AF] font-bold border-2 border-dashed border-[#E5E8EB] rounded-2xl">無待處理申請</div> : 
              pendingComps.map(c => (
                <div key={c.id} className="bg-white p-6 rounded-[1.5rem] border-2 border-[#E9D5FF] shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="absolute top-0 right-0 bg-[#8B5CF6] text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm tracking-widest">
                    等待完成
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black text-[#8B5CF6] bg-[#FAF5FF] border border-[#E9D5FF] px-2 py-1 rounded-md mb-2 inline-block tracking-widest">{c.vendor}</span>
                      <div className="font-black text-xl text-[#1A1D21] mt-1">{c.productName}</div>
                      <div className="text-xs font-bold text-[#9CA3AF] mt-1.5 flex items-center gap-1.5"><Clock size={14}/> 申請時間：{new Date(c.timestamp).toLocaleString('zh-TW', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-[#8B5CF6] block">{c.quantity} <span className="text-sm text-[#9CA3AF]">{c.unit}</span></span>
                    </div>
                  </div>

                  <button onClick={() => handleResolve(c.id)} className="mt-1 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#10B981] text-white hover:bg-[#059669] font-black shadow-sm active:scale-95 transition-all">
                    <CheckCircle2 size={18} /> 已補償完
                  </button>
                </div>
              ))
            }
          </div>
        </div>

        {/* 已完成 */}
        <div>
          <h3 className="font-black text-[#10B981] text-xl mb-4 flex items-center gap-2"><CheckCircle2 size={20} /> 已補償完畢 ({completedComps.length})</h3>
          <div className="space-y-4">
            {completedComps.length === 0 ? <div className="text-center py-8 text-[#9CA3AF] font-bold border-2 border-dashed border-[#E5E8EB] rounded-2xl">無歷史紀錄</div> : 
              completedComps.map(c => (
                <div key={c.id} className="bg-[#ECFDF5]/50 p-5 rounded-2xl border border-[#A7F3D0] shadow-sm flex items-center justify-between opacity-80 hover:opacity-100 transition-opacity">
                  <div>
                    <span className="text-[10px] font-black text-[#064E3B] bg-[#D1FAE5] px-2 py-1 rounded-md mb-2 inline-block tracking-widest">{c.vendor}</span>
                    <div className="font-bold text-lg text-[#064E3B] line-through decoration-[#10B981]/50">{c.productName}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-[#10B981]">{c.quantity} <span className="text-sm">{c.unit}</span></span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}


// ==========================================
// 前臺：效期追蹤 (獨立分頁)
// ==========================================
function StoreExpiryTracker({ currentUser, products, expiryRecords, setExpiryRecords }) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const storeRecords = useMemo(() => {
    return expiryRecords.filter(r => r.storeId === currentUser.id).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [expiryRecords, currentUser.id]);

  const handleAddTracker = () => {
    if (!selectedProduct || !expiryDate) return;
    setExpiryRecords([...expiryRecords, { id: `exp_${Date.now()}`, storeId: currentUser.id, productName: selectedProduct, expiryDate }]);
    setSelectedProduct(''); setExpiryDate('');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#FFFFFF] rounded-[2.5rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent mb-8 relative">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3.5 bg-[#FFFBEB] text-[#F59E0B] rounded-2xl shadow-inner border border-white"><CalendarDays size={28} strokeWidth={2} /></div>
          <div><h3 className="text-2xl font-black text-[#1A1D21] tracking-tight">效期追蹤與預警</h3><p className="text-sm text-[#6B7280] mt-1 font-bold">建立商品到期日追蹤，快到期將自動亮起黃燈</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end mb-10 bg-[#F2F4F7]/60 p-6 rounded-[2rem] border border-[#E5E8EB] shadow-inner">
          <div className="md:col-span-6"><label className="block text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-2 ml-2">1. 選擇商品</label><select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full bg-[#FFFFFF] border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:border-[#F05A42] font-bold shadow-sm"><option value="" disabled>請選擇要追蹤的商品...</option>{products.map(p => (<option key={p} value={p}>{p}</option>))}</select></div>
          <div className="md:col-span-4"><label className="block text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-2 ml-2">2. 有效日期</label><input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full bg-[#FFFFFF] border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:border-[#F05A42] font-bold shadow-sm" /></div>
          <div className="md:col-span-2"><button onClick={handleAddTracker} disabled={!selectedProduct || !expiryDate} className="w-full bg-[#1A1D21] text-white flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-bold shadow-md active:scale-95 disabled:bg-[#D1D5DB]"><Plus size={20} />追蹤</button></div>
        </div>
        <div className="space-y-5">
          {storeRecords.length === 0 ? <div className="text-center py-12 text-[#9CA3AF] font-bold border-2 border-dashed border-[#E5E8EB] rounded-[2rem] bg-[#FFFFFF]">目前無追蹤中的商品</div> : 
            storeRecords.map(record => {
              const daysLeft = Math.ceil((new Date(record.expiryDate).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
              const isWarning = daysLeft <= 14;
              return (
                <div key={record.id} className={`relative overflow-hidden rounded-[2rem] p-6 border-[2px] flex justify-between items-center transition-all ${isWarning ? 'bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] border-[#FDE68A]' : 'bg-[#FFFFFF] border-[#F2F4F7] shadow-sm'}`}>
                  <div><div className={`font-black text-xl mb-2 ${isWarning ? 'text-[#92400E]' : 'text-[#1A1D21]'}`}>{record.productName}</div><div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-bold shadow-sm ${isWarning ? 'bg-[#FDE68A] text-[#92400E]' : 'bg-[#F2F4F7] text-[#6B7280]'}`}><Clock size={16} />到期日：{record.expiryDate}</div></div>
                  <div className="text-right flex items-baseline gap-1"><span className={`text-4xl font-black ${isWarning ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>{Math.abs(daysLeft)}</span><span className={`text-xl font-bold ${isWarning ? 'text-[#F59E0B]' : 'text-[#34D399]'}`}>天</span><button onClick={() => setExpiryRecords(expiryRecords.filter(r => r.id !== record.id))} className="ml-4 p-3 bg-white/60 hover:bg-white rounded-2xl text-[#9CA3AF] hover:text-[#EF4444] shadow-sm"><Trash2 size={22} /></button></div>
                </div>
              );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 前臺：單據核對頁面 (新增拍照自動壓縮功能)
// ==========================================
function StoreVendorDetail({ currentUser, vendor, orders, abnormalReasons, onVerifySuccess, onSubmitAbnormal, onResolveAbnormal, onBack }) {
  const vendorOrders = useMemo(() => {
    return orders.filter(o => (o.branchUsername === currentUser.username || o.branchName === currentUser.name) && o.id.includes(`-${vendor.id}-`) && o.status !== 'received');
  }, [currentUser, vendor, orders]);

  const [reportingOrderId, setReportingOrderId] = useState(null);
  const [reportForm, setReportForm] = useState({ item: '', reason: '', photo: null });

  // 拍照自動化壓縮技術：防止記憶體爆滿
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; // 限制最大寬度為 800px (非常省空間)
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 將圖片壓縮成 JPEG 格式，品質設定為 0.7，大幅降低檔案大小
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setReportForm(prev => ({ ...prev, photo: compressedBase64 }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="animate-in slide-in-from-right-8 fade-in duration-500">
      <button onClick={onBack} className="group flex items-center gap-2 text-[#6B7280] hover:text-[#1A1D21] mb-6 font-bold py-2.5 px-4 rounded-2xl hover:bg-[#FFFFFF] active:scale-95 text-sm"><ChevronLeft size={20} strokeWidth={3} />返回列表</button>
      <div className="bg-[#FFFFFF] rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent mb-10 flex items-center gap-5">
        <div className="p-4 bg-[#F2F4F7] text-[#F05A42] rounded-[1.5rem]"><Briefcase size={32} /></div>
        <div><h2 className="text-3xl font-black text-[#1A1D21]">{vendor.name}</h2><p className="text-sm text-[#6B7280] mt-2 font-bold bg-[#F2F4F7] inline-block px-4 py-1.5 rounded-xl">共 {vendorOrders.length} 筆待核對</p></div>
      </div>

      <div className="space-y-8">
        {vendorOrders.map(order => (
          <div key={order.id} className="bg-[#FFFFFF] rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent overflow-hidden relative">
            <div className="bg-[#F2F4F7]/40 border-b-2 border-[#F2F4F7] px-8 py-5 flex justify-between items-center">
              <div className="flex items-center gap-4"><div className="p-2.5 bg-white rounded-xl shadow-sm text-[#9CA3AF]"><Receipt size={22} /></div><div className="flex items-baseline gap-3"><span className="text-xs font-bold text-[#9CA3AF] uppercase">點貨單號</span><span className="font-black text-[#1A1D21] text-base font-mono">{order.id}</span></div></div>
              <div className="text-right"><span className="font-bold text-[#1A1D21] text-sm bg-white px-3 py-1 rounded-lg shadow-sm border border-[#E5E8EB]">{order.date}</span></div>
            </div>
            
            <div className="p-8 pb-4">
              <div className="flex mb-5 text-xs font-bold text-[#9CA3AF] uppercase border-b-2 border-[#F2F4F7] pb-3"><div className="flex-1 pl-2">商品名稱</div><div className="w-24 text-right pr-2">進貨數量</div></div>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center text-sm pb-4 hover:bg-[#F2F4F7]/60 p-2.5 rounded-2xl transition-colors">
                    <div className="flex-1 font-bold text-[#1A1D21] pl-2 text-base">{item.name}</div>
                    <div className="w-24 text-right font-black text-[#111418] text-lg pr-2">{item.orderQty || item.quantity} <span className="text-sm font-bold text-[#9CA3AF]">件</span></div>
                  </div>
                ))}
              </div>
            </div>

            {order.status === 'abnormal' ? (
              <div className="bg-[#FEF2F2] px-8 py-5 border-t-[3px] border-[#FECACA] flex flex-col gap-4 text-[#EF4444]">
                <div className="flex items-center gap-4">
                  <AlertTriangle size={24} strokeWidth={2.5} />
                  <div><span className="font-black text-lg block">此單已通報異常</span><span className="text-sm font-bold">原因：{order.abnormalReason} ({order.abnormalItem})</span></div>
                </div>
                <div className="border-t border-[#FECACA] pt-4 mt-2">
                  <button onClick={() => onResolveAbnormal(order.id)} className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 rounded-[1.25rem] bg-[#10B981] text-white hover:bg-[#059669] font-black active:scale-95 shadow-md transition-all">
                    <CheckCircle2 size={20} /> 異常已排除，修復完成並入庫
                  </button>
                </div>
              </div>
            ) : reportingOrderId !== order.id ? (
              <div className="bg-[#F2F4F7]/60 px-8 py-5 border-t-2 border-[#E5E8EB] flex gap-4">
                <button onClick={() => { setReportingOrderId(order.id); setReportForm({ item: '', reason: '', photo: null }); }} className="w-1/3 flex items-center justify-center gap-2 py-3.5 rounded-[1.25rem] text-[#EF4444] border-2 border-[#EF4444]/20 bg-white hover:bg-[#FEF2F2] font-black active:scale-95"><AlertTriangle size={20} /> 異常</button>
                <button onClick={() => onVerifySuccess(order.id)} className="w-2/3 flex items-center justify-center gap-2 py-3.5 rounded-[1.25rem] bg-[#10B981] text-white hover:bg-[#059669] font-black active:scale-95 shadow-md"><CheckCircle2 size={20} /> 核對無誤，同步庫存</button>
              </div>
            ) : (
              <div className="bg-[#FEF2F2] px-8 py-6 border-t-[3px] border-[#FECACA]">
                <h4 className="font-black text-[#991B1B] mb-5 flex items-center gap-2"><AlertTriangle size={20} /> 回報異常狀況</h4>
                
                <div className="space-y-4">
                  <select value={reportForm.item} onChange={(e) => setReportForm({...reportForm, item: e.target.value})} className="w-full bg-white border border-[#FECACA] rounded-2xl px-4 py-3 font-bold text-[#991B1B]"><option value="" disabled>請選擇異常商品...</option>{order.items.map(i => <option key={i.name} value={i.name}>{i.name}</option>)}</select>
                  <select value={reportForm.reason} onChange={(e) => setReportForm({...reportForm, reason: e.target.value})} className="w-full bg-white border border-[#FECACA] rounded-2xl px-4 py-3 font-bold text-[#991B1B]"><option value="" disabled>請選擇原因...</option>{abnormalReasons.map(r => <option key={r} value={r}>{r}</option>)}</select>
                  
                  {/* 新增拍照 / 上傳功能區塊 */}
                  <div className="flex flex-col gap-3 mt-2">
                    <label className="text-sm font-bold text-[#991B1B] flex items-center gap-2">
                      <Camera size={18} /> 附上現場照片 (選填)
                    </label>
                    {reportForm.photo ? (
                      <div className="relative inline-block self-start">
                        <img src={reportForm.photo} alt="預覽" className="h-32 w-auto rounded-xl border-2 border-[#FECACA] object-cover shadow-sm" />
                        <button onClick={() => setReportForm({...reportForm, photo: null})} className="absolute -top-2 -right-2 bg-[#EF4444] text-white rounded-full p-1 shadow-md hover:bg-[#DC2626] transition-colors" title="移除照片">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full sm:w-1/2 h-32 border-2 border-dashed border-[#FECACA] rounded-xl cursor-pointer hover:bg-[#FEE2E2]/80 transition-colors bg-white">
                        <Camera size={32} className="text-[#FCA5A5] mb-2" />
                        <span className="text-sm font-bold text-[#EF4444]">點擊拍照 / 上傳照片</span>
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                      </label>
                    )}
                  </div>

                </div>

                <div className="flex gap-4 mt-6">
                  <button onClick={() => setReportingOrderId(null)} className="w-1/3 py-3.5 rounded-2xl bg-white border border-[#FECACA] text-[#EF4444] font-black hover:bg-[#FEE2E2]">取消</button>
                  <button onClick={() => { onSubmitAbnormal(order.id, reportForm); setReportingOrderId(null); }} disabled={!reportForm.item || !reportForm.reason} className="w-2/3 py-3.5 rounded-2xl bg-[#EF4444] text-white font-black disabled:bg-[#FECACA] shadow-md">送出異常通報</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 總部 Tab 1：各廠商分類 (依門店風琴式分類 + 全域總覽)
// ==========================================
function AdminVendorOverview({ orders, vendors, systemOptions, users, db, appId, showAlert, showConfirm }) {
  const [activeVendor, setActiveVendor] = useState(null); // 可為 string(全域) 或 object(特定門市)
  const [expandedStore, setExpandedStore] = useState(null); // 控制風琴式展開的門店
  const stores = users.filter(u => u.role !== 'admin');
  
  if (activeVendor) {
    const isStoreSpecific = typeof activeVendor === 'object';
    const vendorName = isStoreSpecific ? activeVendor.vendorName : activeVendor;
    
    let vOrders = orders.filter(o => o.id.includes(`-${vendorName}-`));
    if (isStoreSpecific && activeVendor.storeUsername) {
       vOrders = vOrders.filter(o => o.branchUsername === activeVendor.storeUsername || o.branchName === activeVendor.storeName);
    }
    
    return (
      <div className="animate-in slide-in-from-right-8 duration-500">
        <button onClick={() => setActiveVendor(null)} className="flex items-center gap-2 text-[#6B7280] font-bold hover:text-[#1A1D21] transition-colors mb-6">
          <ChevronLeft size={20} />返回廠商總覽
        </button>

        <div className="bg-[#FFFFFF] rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent mb-10 flex items-center gap-5">
          <div className="p-4 bg-[#F2F4F7] text-[#F05A42] rounded-3xl"><Layers size={32} /></div>
          <div>
            <h2 className="text-3xl font-black text-[#1A1D21]">
               {isStoreSpecific ? `${activeVendor.storeName} - ${vendorName}` : vendorName}
            </h2>
            <p className="text-[#6B7280] font-bold mt-1">單據明細：共 {vOrders.length} 筆</p>
          </div>
        </div>

        <div className="space-y-6">
          {vOrders.map(order => (
            <AdminOrderDetail key={order.id} order={order} systemOptions={systemOptions} db={db} appId={appId} showAlert={showAlert} showConfirm={showConfirm} />
          ))}
          {vOrders.length === 0 && <div className="text-center py-12 text-[#9CA3AF] font-bold border-2 border-dashed border-[#E5E8EB] rounded-[2rem] bg-[#FFFFFF]">目前無此廠商單據</div>}
        </div>
      </div>
    )
  }

  // 計算全域(所有門店)的廠商統計資料
  const globalVendorStats = vendors.map(v => {
    const vOrders = orders.filter(o => o.id.includes(`-${v.id}-`));
    const totalAmt = vOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    return { ...v, orderCount: vOrders.length, totalAmount: totalAmt };
  });

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
         <h2 className="text-3xl font-extrabold text-[#1A1D21] mb-2 tracking-tight">各廠商分類總覽</h2>
         <p className="text-[#6B7280] font-bold">利用下方風琴式選單分類各門店單據，或查看全域加總。</p>
      </div>

      {/* 依門店分類：風琴式 UI 設計 */}
      <div className="mb-12">
        <h3 className="text-xl font-black text-[#1A1D21] mb-5 flex items-center gap-2">
          <Store className="text-[#3B82F6]" /> 依門店分類檢視 (風琴式展開)
        </h3>
        <div className="space-y-4">
          {stores.map(store => {
            const isExpanded = expandedStore === store.username;
            const storeOrders = orders.filter(o => o.branchUsername === store.username || o.branchName === store.branchName);
            // 計算該單一門店的廠商統計資料
            const storeVendorStats = vendors.map(v => {
              const vOrders = storeOrders.filter(o => o.id.includes(`-${v.id}-`));
              return { ...v, orderCount: vOrders.length, totalAmount: vOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) };
            }).filter(v => v.orderCount > 0);

            return (
               <div key={store.username} className={`bg-[#FFFFFF] rounded-[2rem] shadow-sm border border-[#E5E8EB] overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-md border-[#3B82F6]/30' : 'hover:border-[#9CA3AF]/50'}`}>
                  <button onClick={() => setExpandedStore(isExpanded ? null : store.username)} className="w-full p-5 sm:p-6 flex justify-between items-center hover:bg-[#F2F4F7]/50 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl transition-colors ${isExpanded ? 'bg-[#3B82F6] text-white' : 'bg-[#F2F4F7] text-[#6B7280]'}`}>
                           {store.branchName.charAt(0)}
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-[#1A1D21]">{store.branchName}</h3>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className={`text-sm font-bold px-3 py-1.5 rounded-lg hidden sm:block ${isExpanded ? 'bg-[#EFF6FF] text-[#3B82F6]' : 'bg-[#F2F4F7] text-[#6B7280]'}`}>
                           共 {storeVendorStats.length} 個分類有叫貨
                        </span>
                        <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-[#EFF6FF] text-[#3B82F6]' : 'bg-[#F2F4F7] text-[#9CA3AF]'}`}>
                           <ChevronDown className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                     </div>
                  </button>
                  {isExpanded && (
                     <div className="p-5 sm:p-6 pt-0 border-t border-[#F2F4F7] bg-[#F2F4F7]/20">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
                           {storeVendorStats.map(vendor => (
                              <button
                                key={vendor.id}
                                onClick={() => setActiveVendor({ vendorName: vendor.name, storeUsername: store.username, storeName: store.branchName })}
                                className="group bg-[#FFFFFF] p-5 rounded-[1.5rem] shadow-sm border border-[#E5E8EB] hover:shadow-md hover:border-[#F05A42]/30 active:scale-[0.98] transition-all text-left flex flex-col h-full"
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="p-3 bg-[#F2F4F7] rounded-xl group-hover:bg-[#FFF2F0] transition-colors text-[#F05A42]">
                                    <Layers size={20} />
                                  </div>
                                  <h4 className="font-black text-[#1A1D21] group-hover:text-[#F05A42] transition-colors">{vendor.name}</h4>
                                </div>
                                <div className="mt-auto space-y-2 pt-3 border-t border-[#F2F4F7]">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#6B7280] font-bold">單據數</span>
                                    <span className="text-[#1A1D21] font-black">{vendor.orderCount} 筆</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-[#6B7280] font-bold">採購金額</span>
                                    <span className="text-[#F05A42] font-black">${vendor.totalAmount.toLocaleString()}</span>
                                  </div>
                                </div>
                              </button>
                           ))}
                           {storeVendorStats.length === 0 && <div className="col-span-full text-center text-[#9CA3AF] font-bold py-8 border-2 border-dashed border-[#E5E8EB] rounded-2xl">此門市尚無單據</div>}
                        </div>
                     </div>
                  )}
               </div>
            )
          })}
        </div>
      </div>

      {/* 全域廠商總覽 */}
      <div>
         <h3 className="text-xl font-black text-[#1A1D21] mb-5 flex items-center gap-2 border-t border-[#E5E8EB] pt-8">
           <Layers className="text-[#F05A42]" /> 全域各廠商總覽 (包含所有分店)
         </h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {globalVendorStats.map(vendor => (
             <button
               key={vendor.id}
               onClick={() => setActiveVendor(vendor.name)} // 字串代表全域
               className="group bg-[#FFFFFF] p-7 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent hover:shadow-[0_8px_30px_rgba(240,90,66,0.15)] active:scale-[0.98] transition-all duration-300 text-left flex flex-col h-full relative"
             >
               <div className="flex items-center gap-4 mb-4">
                 <div className="p-4 bg-[#F2F4F7] rounded-2xl group-hover:bg-[#FFF2F0] transition-colors shadow-inner text-[#F05A42]">
                   <Layers size={28} />
                 </div>
                 <h3 className="text-xl font-black text-[#1A1D21] group-hover:text-[#F05A42] transition-colors">{vendor.name}</h3>
               </div>
               
               <div className="mt-auto space-y-3 pt-4 border-t border-[#F2F4F7]">
                 <div className="flex justify-between items-center">
                   <span className="text-[#6B7280] text-xs font-bold uppercase tracking-widest">總計單據數</span>
                   <span className="text-[#1A1D21] font-black text-lg">{vendor.orderCount} 筆</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[#6B7280] text-xs font-bold uppercase tracking-widest">總計採購金額</span>
                   <span className="text-[#F05A42] font-black text-xl">${vendor.totalAmount.toLocaleString()}</span>
                 </div>
               </div>
             </button>
           ))}
         </div>
      </div>
    </div>
  );
}

// ==========================================
// 總部 Tab 2：食材有效期線 (所有門店即期清單)
// ==========================================
function AdminExpiryOverview({ expiryRecords, users }) {
  const stores = users.filter(u => u.role !== 'admin');
  
  const storeColorMap = useMemo(() => {
    const map = {};
    const palettes = [
      { bg: 'bg-[#FFF5F3]', border: 'border-[#FFDCD3]', tag: 'bg-[#F05A42]', textMain: 'text-[#992E1B]', textSub: 'text-[#F05A42]' }, 
      { bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', tag: 'bg-[#3B82F6]', textMain: 'text-[#1E3A8A]', textSub: 'text-[#2563EB]' }, 
      { bg: 'bg-[#ECFDF5]', border: 'border-[#A7F3D0]', tag: 'bg-[#10B981]', textMain: 'text-[#064E3B]', textSub: 'text-[#059669]' }, 
      { bg: 'bg-[#F8FAFC]', border: 'border-[#E5E8EB]', tag: 'bg-[#4B5563]', textMain: 'text-[#111827]', textSub: 'text-[#6B7280]' }, 
      { bg: 'bg-[#FAF5FF]', border: 'border-[#E9D5FF]', tag: 'bg-[#8B5CF6]', textMain: 'text-[#4C1D95]', textSub: 'text-[#7C3AED]' }, 
      { bg: 'bg-[#FFFBEB]', border: 'border-[#FDE68A]', tag: 'bg-[#F59E0B]', textMain: 'text-[#78350F]', textSub: 'text-[#D97706]' }  
    ];
    stores.forEach((store, index) => {
      map[store.username] = palettes[index % palettes.length];
    });
    return map;
  }, [stores]);

  const allRecords = useMemo(() => {
    return expiryRecords.map(r => {
      const store = stores.find(u => u.username === r.storeId);
      const daysLeft = Math.ceil((new Date(r.expiryDate).getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
      return { ...r, branchName: store ? store.branchName : '未知門市', daysLeft };
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [expiryRecords, stores]);

  const urgentRecords = allRecords.filter(r => r.daysLeft <= 14);
  const normalRecords = allRecords.filter(r => r.daysLeft > 14);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8"><h2 className="text-3xl font-extrabold text-[#1A1D21] mb-2 tracking-tight">各門市食材即期線</h2><p className="text-[#6B7280] font-bold">自動抓取各店回報之追蹤紀錄，14天內即期品自動警示，<span className="text-[#F05A42]">並以專屬顏色區分各分店</span>。</p></div>

      <div className="bg-[#FFFFFF] rounded-[2.5rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent relative">
        <h3 className="font-black text-[#F59E0B] text-xl mb-6 flex items-center gap-2">
          <AlertTriangle /> 即期警示 (剩餘14天內)
        </h3>
        <div className="space-y-4 mb-10">
          {urgentRecords.length === 0 ? <div className="text-[#9CA3AF] font-bold">目前無即期警示</div> : 
            urgentRecords.map(r => {
              const theme = storeColorMap[r.storeId] || { bg: 'bg-[#F2F4F7]', border: 'border-[#E5E8EB]', tag: 'bg-[#6B7280]', textMain: 'text-[#1A1D21]', textSub: 'text-[#6B7280]' };
              return (
                <div key={r.id} className={`relative overflow-hidden rounded-[2rem] p-5 border-[2px] flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${theme.bg} ${theme.border} shadow-sm transition-all hover:shadow-md`}>
                  <div>
                    <span className={`${theme.tag} text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg mb-2.5 inline-block shadow-sm tracking-widest`}>{r.branchName}</span>
                    <div className={`font-black text-xl mb-1.5 ${theme.textMain}`}>{r.productName}</div>
                    <div className={`text-sm font-bold ${theme.textSub} flex items-center gap-1.5`}><Clock size={14} strokeWidth={2.5}/>到期日：{r.expiryDate}</div>
                  </div>
                  <div className="text-left sm:text-right flex items-baseline gap-1.5 mt-2 sm:mt-0">
                    <span className={`text-xs font-bold ${theme.textSub} mr-2`}>剩餘</span>
                    <span className={`text-4xl font-black text-[#EF4444] animate-pulse`}>{r.daysLeft}</span>
                    <span className="text-xl font-bold text-[#EF4444]">天</span>
                  </div>
                </div>
              );
            })
          }
        </div>

        <h3 className="font-black text-[#10B981] text-xl mb-6 flex items-center gap-2">
          <CalendarDays /> 安全追蹤中 (超過14天)
        </h3>
        <div className="space-y-4">
          {normalRecords.length === 0 ? <div className="text-[#9CA3AF] font-bold">無安全追蹤紀錄</div> : 
            normalRecords.map(r => {
              const theme = storeColorMap[r.storeId] || { bg: 'bg-[#F2F4F7]', border: 'border-[#E5E8EB]', tag: 'bg-[#6B7280]', textMain: 'text-[#1A1D21]', textSub: 'text-[#6B7280]' };
              return (
                <div key={r.id} className={`relative overflow-hidden rounded-[2rem] p-5 border-[2px] flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${theme.bg} ${theme.border} opacity-80 hover:opacity-100 shadow-sm transition-all`}>
                  <div>
                    <span className={`${theme.tag} text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg mb-2.5 inline-block shadow-sm tracking-widest`}>{r.branchName}</span>
                    <div className={`font-black text-lg mb-1.5 ${theme.textMain}`}>{r.productName}</div>
                    <div className={`text-sm font-bold ${theme.textSub} flex items-center gap-1.5`}><Clock size={14} strokeWidth={2.5}/>到期日：{r.expiryDate}</div>
                  </div>
                  <div className="text-left sm:text-right flex items-baseline gap-1.5 mt-2 sm:mt-0">
                    <span className={`text-xs font-bold ${theme.textSub} mr-2`}>剩餘</span>
                    <span className={`text-2xl font-black ${theme.textMain}`}>{r.daysLeft}</span>
                    <span className={`text-base font-bold ${theme.textMain}`}>天</span>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 總部 Tab 3：各門店總叫貨金額 
// ==========================================
function AdminDashboard({ users, orders, systemOptions, db, appId, showAlert, showConfirm }) {
  const [adminView, setAdminView] = useState('overview'); 
  const [activeStore, setActiveStore] = useState(null);
  
  const stores = users.filter(u => u.role !== 'admin');
  
  if (adminView === 'store_orders') return <AdminStoreOrders store={activeStore} orders={orders} onBack={() => setAdminView('overview')} systemOptions={systemOptions} db={db} appId={appId} showAlert={showAlert} showConfirm={showConfirm} />;
  if (adminView === 'store_passwords') return <AdminStorePasswords users={users} onBack={() => setAdminView('overview')} />;

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1A1D21] mb-2 tracking-tight">各門店總叫貨金額</h2>
          <p className="text-[#6B7280] font-bold">點選門市以檢視其『各廠商分類總額』，再點選即可看『進貨單明細』。</p>
        </div>
        
        <a 
          href="https://ypx-erp-5-0.vercel.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[#2C3137] hover:bg-[#1A1D21] text-white px-6 py-3.5 rounded-2xl font-black shadow-sm transition-all active:scale-95"
        >
          <ShoppingCart size={20} />
          進入點貨 ERP 前台
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#FFFFFF] p-7 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent flex flex-col justify-center relative overflow-hidden group">
          <div className="flex items-center gap-5"><div className="p-4 bg-[#F2F4F7] text-[#2C3137] rounded-2xl"><Store size={28} /></div><div><div className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mb-1">連線門市數</div><div className="text-3xl font-black text-[#1A1D21]">{stores.length} 間</div></div></div>
        </div>
        <div 
          onClick={() => setAdminView('store_passwords')}
          className="bg-[#FFFFFF] p-7 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent flex flex-col justify-center relative overflow-hidden group cursor-pointer hover:shadow-[0_8px_30px_rgba(240,90,66,0.15)] transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#F2F4F7] text-[#2C3137] rounded-2xl group-hover:bg-[#F05A42] group-hover:text-white transition-colors"><ShieldUser size={28} /></div>
            <div>
              <div className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mb-1">門店帳密管理</div>
              <div className="text-xl font-black text-[#1A1D21] group-hover:text-[#F05A42] transition-colors">查詢門店密碼</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#FFFFFF] rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent overflow-hidden">
        <div className="px-7 py-6 border-b-2 border-[#F2F4F7] bg-[#FFFFFF] flex items-center justify-between">
          <div className="flex items-center gap-4"><div className="p-2.5 bg-[#F2F4F7] rounded-xl"><Building2 className="text-[#2C3137]" size={20} /></div><h3 className="font-black text-[#1A1D21] text-lg">各門市最新單據與叫貨總額</h3></div>
        </div>
        <div className="divide-y-2 divide-[#F2F4F7]">
          {stores.map(store => {
            const storeOrders = orders.filter(o => o.branchUsername === store.username || o.branchName === store.branchName);
            const pendingCount = storeOrders.filter(o => o.status !== 'received').length;
            const totalAmt = storeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
            
            return (
              <div 
                key={store.username} 
                onClick={() => { setActiveStore(store); setAdminView('store_orders'); }} 
                className="p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-[#F2F4F7]/60 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-[#F2F4F7] flex items-center justify-center text-[#6B7280] font-black text-2xl border border-transparent group-hover:bg-white transition-colors">{store.branchName.charAt(0)}</div>
                  <div>
                    <h4 className="font-black text-[#1A1D21] text-2xl group-hover:text-[#F05A42] transition-colors">{store.branchName}</h4>
                    {pendingCount > 0 && <span className="text-xs font-bold bg-[#FEF2F2] text-[#EF4444] px-2 py-1 rounded-md mt-1 inline-block animate-pulse">{pendingCount} 筆待核對</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto mt-2 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-none border-[#E5E8EB]">
                  <div className="text-left lg:text-right">
                    <span className="block text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-1">該店總叫貨金額</span>
                    <span className="font-black text-[#F05A42] text-2xl">${totalAmt.toLocaleString()}</span>
                  </div>
                  <ChevronRight className="text-[#9CA3AF] group-hover:translate-x-1 transition-transform ml-2" size={24} />
                </div>
              </div>
            );
          })}
          {stores.length === 0 && <div className="p-10 text-center text-[#9CA3AF] font-bold">尚無門店資料</div>}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 總部 Tab 4：圖表分析 (各門店圓餅圖)
// ==========================================
function AdminChartsOverview({ users, orders }) {
  const stores = users.filter(u => u.role !== 'admin');
  
  const chartData = useMemo(() => {
    let data = stores.map(store => {
      const storeOrders = orders.filter(o => o.branchUsername === store.username || o.branchName === store.branchName);
      const totalAmt = storeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      return { name: store.branchName, value: totalAmt };
    }).filter(d => d.value > 0).sort((a,b) => b.value - a.value);
    return data;
  }, [stores, orders]);

  const totalAllStores = chartData.reduce((sum, d) => sum + d.value, 0);
  const colors = ['#F05A42', '#10B981', '#EF4444', '#2C3137', '#F59E0B', '#1A1D21', '#34D399', '#FCA5A5'];

  let currentPercent = 0;
  let gradientString = '';
  chartData.forEach((d, i) => {
    const percent = (d.value / totalAllStores) * 100;
    gradientString += `${colors[i % colors.length]} ${currentPercent}% ${currentPercent + percent}%, `;
    currentPercent += percent;
  });
  if (gradientString) gradientString = gradientString.slice(0, -2); 

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8"><h2 className="text-3xl font-extrabold text-[#1A1D21] mb-2 tracking-tight">各門店圓餅圖分析</h2><p className="text-[#6B7280] font-bold">各分店整體叫貨總額佔比分析，找出進貨大宗與分佈狀態。</p></div>

      <div className="bg-[#FFFFFF] rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent p-8">
        {chartData.length === 0 ? (
          <div className="text-center py-20 text-[#9CA3AF] font-bold border-2 border-dashed border-[#E5E8EB] rounded-[2rem] bg-[#FFFFFF]">
            目前尚無產生任何進貨金額數據可供分析
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="relative flex justify-center items-center">
              <div style={{ background: `conic-gradient(${gradientString})` }} className="w-64 h-64 sm:w-80 sm:h-80 rounded-full shadow-[inset_0_4px_10px_rgba(0,0,0,0.05),_0_10px_30px_rgba(240,90,66,0.1)]"></div>
              <div className="absolute w-40 h-40 sm:w-48 sm:h-48 bg-[#FFFFFF] rounded-full shadow-inner flex flex-col justify-center items-center">
                <span className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mb-1">全球總採購額</span>
                <span className="text-2xl sm:text-3xl font-black text-[#1A1D21]">${totalAllStores.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex-1 w-full space-y-4">
              <h3 className="font-black text-[#1A1D21] text-lg mb-4">門店採購佔比排行榜</h3>
              {chartData.map((d, i) => {
                const percent = ((d.value / totalAllStores) * 100).toFixed(1);
                return (
                  <div key={d.name} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[#E5E8EB] shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: colors[i % colors.length] }}></div>
                      <span className="font-black text-[#1A1D21] text-lg">{d.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-[#F05A42] text-lg block">${d.value.toLocaleString()}</span>
                      <span className="text-xs font-bold text-[#6B7280]">{percent}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 總部 Tab 5：異常通報監控面板 
// ==========================================
function AdminAbnormalOverview({ orders, users }) {
  const abnormalOrders = orders.filter(o => o.status === 'abnormal').sort((a, b) => (b.abnormalTime || b.timestamp) - (a.abnormalTime || a.timestamp));

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-[#1A1D21] mb-2 tracking-tight">門市異常通報總覽</h2>
        <p className="text-[#6B7280] font-bold">集中監控各分店目前<span className="text-[#EF4444]">尚未排除</span>的異常單據。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {abnormalOrders.length === 0 ? (
          <div className="col-span-full text-center py-20 text-[#9CA3AF] font-bold text-lg border-2 border-dashed border-[#E5E8EB] rounded-[2rem] bg-[#FFFFFF]">
            太棒了！目前全部分店皆無異常通報。
          </div>
        ) : (
          abnormalOrders.map(order => {
            const store = users.find(u => u.username === order.branchUsername || u.branchName === order.branchName);
            const vendorName = order.id.split('-')[1] || '其他廠商';
            const dateStr = order.abnormalTime ? new Date(order.abnormalTime).toLocaleString('zh-TW', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : order.date;

            return (
              <div key={order.id} className="bg-[#FFFFFF] rounded-[2rem] p-6 shadow-sm border-[2px] border-[#FECACA] flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 bg-[#EF4444] text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm tracking-widest">
                  待處理
                </div>
                <div className="flex justify-between items-start pt-2">
                   <div className="flex items-center gap-4">
                      <div className="p-3.5 bg-[#FEF2F2] text-[#EF4444] rounded-2xl shadow-inner"><AlertTriangle size={28} /></div>
                      <div>
                        <span className="bg-[#1A1D21] text-white text-[11px] font-black px-2.5 py-1 rounded-md mb-1.5 inline-block tracking-widest">{store?.branchName || order.branchName || '未知門店'}</span>
                        <h3 className="font-black text-[#1A1D21] text-xl">{vendorName}</h3>
                      </div>
                   </div>
                </div>
                <div className="flex items-center text-xs font-bold text-[#9CA3AF] gap-1.5 mt-1">
                  <Clock size={14} /> 通報時間：{dateStr}
                </div>
                
                <div className="bg-[#FEF2F2] p-5 rounded-2xl border border-[#FECACA]/50 mt-2 flex-1">
                  <p className="font-black text-[#1A1D21] mb-2 flex items-center gap-2"><Tag size={16} className="text-[#EF4444]"/> {order.abnormalItem}</p>
                  <p className="font-bold text-[#EF4444] text-sm leading-relaxed">原因：{order.abnormalReason}</p>
                </div>
                
                {order.abnormalPhoto && (
                  <div className="mt-2 rounded-2xl overflow-hidden border-2 border-[#FECACA]">
                    <img src={order.abnormalPhoto} alt="異常照片" className="w-full h-32 object-cover hover:h-64 transition-all duration-300 cursor-pointer" title="點擊預覽" />
                  </div>
                )}
                
                <div className="mt-2 text-right">
                   <span className="text-[#9CA3AF] text-[10px] font-bold uppercase tracking-widest block">單號 {order.id}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}

// ==========================================
// 總部 Tab 6：總部退貨補償審核面板 
// ==========================================
function AdminCompensationOverview({ compensations, users, db, appId, showAlert, showConfirm }) {
  const pendingComps = compensations.filter(c => c.status === 'pending');
  const completedComps = compensations.filter(c => c.status === 'completed');

  const handleResolve = (compId) => {
    showConfirm('確定已處理完畢此退貨補償單嗎？', async () => {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_compensations', compId), {
          status: 'completed',
          completedTime: Date.now()
        });
        showAlert(' 已成功將此單標記為補償完畢！');
      } catch (e) {
        console.error(e);
        showAlert('系統更新失敗，請檢查網路連線。');
      }
    });
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-[#1A1D21] mb-2 tracking-tight">總部退貨補償審核</h2>
        <p className="text-[#6B7280] font-bold">集中管理各分店回報的退換貨及補償需求。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 待處理區域 */}
        <div>
          <h3 className="font-black text-[#8B5CF6] text-xl mb-4 flex items-center gap-2">
            <RefreshCcw size={20} /> 待處理補償單 ({pendingComps.length})
          </h3>
          <div className="space-y-4">
            {pendingComps.length === 0 ? <div className="text-center py-10 text-[#9CA3AF] font-bold border-2 border-dashed border-[#E5E8EB] rounded-3xl bg-white">太棒了！無待處理的退貨補償申請。</div> : 
              pendingComps.map(c => (
                <div key={c.id} className="bg-white p-6 rounded-[2rem] border-2 border-[#E9D5FF] shadow-sm flex flex-col gap-4 group hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#8B5CF6] text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm tracking-widest">
                    等待總部處理
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black text-white bg-[#1A1D21] px-2 py-1 rounded-md mb-2 inline-block tracking-widest mr-2">{c.branchName}</span>
                      <span className="text-[10px] font-black text-[#8B5CF6] bg-[#FAF5FF] border border-[#E9D5FF] px-2 py-1 rounded-md mb-2 inline-block tracking-widest">{c.vendor}</span>
                      <div className="font-black text-2xl text-[#1A1D21] mt-1">{c.productName}</div>
                      <div className="text-xs font-bold text-[#9CA3AF] mt-1.5 flex items-center gap-1.5"><Clock size={14}/> 申請時間：{new Date(c.timestamp).toLocaleString('zh-TW', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
                    </div>
                  </div>
                  
                  <div className="bg-[#FAF5FF] p-4 rounded-xl flex items-center justify-between border border-[#E9D5FF]/50">
                    <span className="text-sm font-bold text-[#6B7280]">需求數量</span>
                    <span className="text-2xl font-black text-[#8B5CF6]">{c.quantity} <span className="text-sm text-[#9CA3AF]">{c.unit}</span></span>
                  </div>

                  <button onClick={() => handleResolve(c.id)} className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#10B981] text-white hover:bg-[#059669] font-black shadow-sm active:scale-95 transition-all">
                    <CheckCircle2 size={18} /> 補償完畢
                  </button>
                </div>
              ))
            }
          </div>
        </div>

        {/* 已處理區域 */}
        <div>
          <h3 className="font-black text-[#10B981] text-xl mb-4 flex items-center gap-2">
            <CheckCircle2 size={20} /> 歷史已處理單據 ({completedComps.length})
          </h3>
          <div className="space-y-4">
            {completedComps.length === 0 ? <div className="text-center py-10 text-[#9CA3AF] font-bold border-2 border-dashed border-[#E5E8EB] rounded-3xl bg-white">尚無已完成的歷史紀錄。</div> : 
              completedComps.map(c => (
                <div key={c.id} className="bg-[#ECFDF5]/50 p-6 rounded-[2rem] border border-[#A7F3D0] shadow-sm flex flex-col gap-3 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black text-[#064E3B] bg-[#D1FAE5] px-2 py-1 rounded-md mb-2 inline-block tracking-widest mr-2">{c.branchName}</span>
                      <span className="text-[10px] font-black text-[#064E3B] bg-[#D1FAE5] px-2 py-1 rounded-md mb-2 inline-block tracking-widest">{c.vendor}</span>
                      <div className="font-bold text-xl text-[#064E3B] line-through decoration-[#10B981]/50">{c.productName}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-[#10B981] block">{c.quantity} <span className="text-sm">{c.unit}</span></span>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-[#10B981] mt-1 pt-3 border-t border-[#A7F3D0]/50 flex items-center gap-1.5">
                    <CheckCircle2 size={14}/> 完成於：{new Date(c.completedTime).toLocaleString('zh-TW', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
              ))
            }
          </div>
        </div>

      </div>
    </div>
  );
}


// ==========================================
// 後臺：門店密碼查詢視圖
// ==========================================
function AdminStorePasswords({ users, onBack }) {
  const stores = users.filter(u => u.role !== 'admin');

  return (
    <div className="animate-in slide-in-from-right-8 duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-[#6B7280] font-bold hover:text-[#1A1D21] transition-colors mb-6">
        <ChevronLeft size={20} />返回各店總覽
      </button>

      <div className="bg-[#FFFFFF] rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent mb-8 flex items-center gap-5">
        <div className="p-4 bg-[#F2F4F7] text-[#F05A42] rounded-3xl"><ShieldUser size={32} /></div>
        <div>
          <h2 className="text-3xl font-black text-[#1A1D21]">門店密碼查詢</h2>
          <p className="text-[#6B7280] font-bold mt-1">供總部查詢各門店登入密碼（請妥善保管）</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map(store => (
          <div key={store.username} className="bg-[#FFFFFF] p-6 rounded-[2rem] shadow-sm border border-[#E5E8EB] flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F2F4F7] flex items-center justify-center text-[#6B7280] font-black text-lg border border-transparent">
                {store.branchName.charAt(0)}
              </div>
              <div>
                <h3 className="font-black text-[#1A1D21] text-lg">{store.branchName}</h3>
              </div>
            </div>
            <div className="bg-[#F2F4F7] px-4 py-2 rounded-xl border border-[#E5E8EB] text-center">
              <span className="text-[#6B7280] text-[10px] font-bold uppercase tracking-widest block mb-0.5">登入密碼</span>
              <span className="font-black text-[#EF4444] text-lg tracking-widest">{store.password}</span>
            </div>
          </div>
        ))}
        {stores.length === 0 && (
          <div className="col-span-full text-center py-20 text-[#9CA3AF] font-bold text-lg border-2 border-dashed border-[#E5E8EB] rounded-[2.5rem] bg-[#FFFFFF]">
            目前尚無註冊的門店
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 總部：特定門市單據視圖
// ==========================================
function AdminStoreOrders({ store, orders, onBack, systemOptions, db, appId, showAlert, showConfirm }) {
  const [viewVendor, setViewVendor] = useState(null); 
  const [isSorting, setIsSorting] = useState(false); 
  const [draggedV, setDraggedV] = useState(null);
  const [dragOverV, setDragOverV] = useState(null);

  const storeOrders = orders.filter(o => o.branchUsername === store?.username || o.branchName === store?.branchName).sort((a,b) => b.timestamp - a.timestamp);
  const rawVendors = [...new Set(storeOrders.map(o => o.id.split('-')[1] || '其他分類'))];
  
  const globalOrder = systemOptions?.vendorOrder || [];
  const sortedVendors = rawVendors.sort((a, b) => {
    const idxA = globalOrder.indexOf(a);
    const idxB = globalOrder.indexOf(b);
    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const handleDrop = async (e, targetV) => {
    e.preventDefault();
    if (!draggedV || draggedV === targetV) return;

    let mergedOrder = [...new Set([...globalOrder, ...rawVendors])];
    const dragIdx = mergedOrder.indexOf(draggedV);
    const targetIdx = mergedOrder.indexOf(targetV);

    if (dragIdx !== -1 && targetIdx !== -1) {
      mergedOrder.splice(dragIdx, 1);
      mergedOrder.splice(targetIdx, 0, draggedV);
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_system', 'options'), { vendorOrder: mergedOrder }, { merge: true });
      } catch (err) {
        console.error("排序儲存失敗", err);
      }
    }
    setDraggedV(null);
    setDragOverV(null);
  };

  if (viewVendor) {
    const vOrders = storeOrders.filter(o => (o.id.split('-')[1] || '其他分類') === viewVendor);
    return (
      <div className="animate-in slide-in-from-right-8 duration-500">
        <button onClick={() => setViewVendor(null)} className="flex items-center gap-2 text-[#6B7280] mb-6 font-bold hover:text-[#1A1D21] transition-colors"><ChevronLeft size={20} />返回 {store?.branchName} 廠商分類</button>

        <div className="bg-[#FFFFFF] rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#F2F4F7] text-[#F05A42] rounded-3xl"><Briefcase size={32} /></div>
            <div>
              <h2 className="text-3xl font-black text-[#1A1D21]">{viewVendor}</h2>
              <p className="text-[#6B7280] font-bold mt-1">歷史單據紀錄：{vOrders.length} 筆</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {vOrders.map(order => (
            <AdminOrderDetail key={order.id} order={order} systemOptions={systemOptions} db={db} appId={appId} showAlert={showAlert} showConfirm={showConfirm} />
          ))}
          {vOrders.length === 0 && <div className="text-center py-12 text-[#9CA3AF] font-bold border-2 border-dashed border-[#E5E8EB] rounded-[2rem] bg-[#FFFFFF]">目前無此廠商單據</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-right-8 duration-500 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-[#6B7280] font-bold hover:text-[#1A1D21] transition-colors"><ChevronLeft size={20} />返回各店總覽</button>
        
        {sortedVendors.length > 1 && (
          <button 
            onClick={() => setIsSorting(!isSorting)} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black transition-all shadow-sm active:scale-95 text-sm ${isSorting ? 'bg-[#F05A42] text-white shadow-[#F05A42]/20 border-transparent' : 'bg-white text-[#1A1D21] border-[2px] border-[#E5E8EB] hover:border-[#F05A42] hover:text-[#F05A42]'}`}
          >
            <ArrowUpDown size={16} strokeWidth={3} /> {isSorting ? '完成排序並儲存' : '設定廠商排列順序'}
          </button>
        )}
      </div>

      <div className="bg-[#FFFFFF] rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent mb-8 flex items-center gap-5 relative overflow-hidden">
        {isSorting && <div className="absolute top-0 left-0 w-full h-1 bg-[#F05A42] animate-pulse"></div>}
        <div className="p-4 bg-[#F2F4F7] text-[#F05A42] rounded-3xl"><Store size={32} /></div>
        <div>
          <h2 className="text-3xl font-black text-[#1A1D21]">{store?.branchName}</h2>
          <p className="text-[#6B7280] font-bold mt-1">
            {isSorting ? '請拖曳下方卡片調整順序' : `共產生 ${sortedVendors.length} 個進貨廠商分類`}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
         {sortedVendors.map(v => {
            const vOrders = storeOrders.filter(o => (o.id.split('-')[1] || '其他分類') === v);
            const hasAbnormal = vOrders.some(o => o.status === 'abnormal' || (o.abnormalCategories && Object.keys(o.abnormalCategories).length > 0));
            const pendingCount = vOrders.filter(o => o.status !== 'received').length;
            const totalAmt = vOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

            if (isSorting) {
               return (
                 <div
                    key={v} draggable onDragStart={() => setDraggedV(v)} onDragOver={(e) => { e.preventDefault(); setDragOverV(v); }} onDrop={(e) => handleDrop(e, v)} onDragEnd={() => { setDraggedV(null); setDragOverV(null); }}
                    className={`flex items-center bg-[#FFFFFF] p-5 rounded-[2rem] shadow-sm border-[2px] transition-all cursor-grab active:cursor-grabbing ${draggedV === v ? 'opacity-40 scale-[0.98] border-dashed border-[#9CA3AF]' : 'border-transparent hover:border-[#E5E8EB]'} ${dragOverV === v && draggedV !== v ? 'border-t-[4px] border-t-[#F05A42]' : ''}`}
                 >
                   <div className="p-2 bg-[#F2F4F7] rounded-xl mr-4 text-[#9CA3AF]"><Menu size={20} /></div>
                   <h3 className="font-black text-[#1A1D21] text-xl flex-1">{v}</h3>
                 </div>
               )
            }

            return (
              <button
                key={v}
                onClick={() => setViewVendor(v)}
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#FFFFFF] p-6 rounded-[2rem] shadow-sm border border-[#E5E8EB] hover:shadow-md transition-all active:scale-[0.99] group text-left gap-4"
              >
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl transition-colors ${hasAbnormal ? 'bg-[#FEF2F2] text-[#EF4444]' : 'bg-[#F2F4F7] text-[#F05A42] group-hover:bg-[#FFF2F0]'}`}><Briefcase size={28} /></div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-[#1A1D21] mb-1 group-hover:text-[#F05A42] transition-colors">{v}</h3>
                    <p className="text-xs font-bold text-[#6B7280] tracking-widest uppercase">共計 {vOrders.length} 筆叫貨單</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-[#F2F4F7] sm:border-0">
                  {pendingCount > 0 && (
                    <span className="bg-[#FEF2F2] text-[#EF4444] text-xs font-black px-4 py-2 rounded-xl border border-[#FECACA] shadow-sm animate-pulse whitespace-nowrap">
                      {pendingCount} 筆待核對
                    </span>
                  )}
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest block mb-0.5">該分類進貨總額</span>
                    <span className="text-xl font-black text-[#111418]">${totalAmt.toLocaleString()}</span>
                  </div>
                  <div className="p-2 bg-[#F2F4F7] rounded-full group-hover:bg-[#F05A42] group-hover:text-white transition-colors text-[#9CA3AF] hidden sm:block">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </button>
            )
         })}
         {!isSorting && sortedVendors.length === 0 && <div className="text-center py-20 text-[#9CA3AF] font-bold text-lg border-2 border-dashed border-[#E5E8EB] rounded-[2.5rem] bg-[#FFFFFF]">此門店尚無進貨單據紀錄</div>}
      </div>
    </div>
  )
}

function AdminOrderDetail({ order, systemOptions, db, appId, showAlert, showConfirm }) {
  const [updating, setUpdating] = useState(false);

  if (!order) return null;
  // 檢查是否「目前」仍是異常狀態
  const isCurrentlyAbnormal = order.status === 'abnormal';
  // 檢查是否曾經有異常紀錄 (不管現在是否已修復)
  const hasAbnormalHistory = order.abnormalReason || isCurrentlyAbnormal || (order.abnormalCategories && Object.keys(order.abnormalCategories).length > 0);

  const handleUpdateItem = async (itemIdx, field, newValue) => {
    setUpdating(true);
    try {
      const updatedItems = [...order.items];

      if (field === 'price') {
        const numPrice = parseFloat(newValue) || 0;
        if (updatedItems[itemIdx].price === numPrice) { setUpdating(false); return; }
        updatedItems[itemIdx] = { ...updatedItems[itemIdx], price: numPrice };
      } else if (field === 'unit') {
        if (updatedItems[itemIdx].unit === newValue) { setUpdating(false); return; }
        updatedItems[itemIdx] = { ...updatedItems[itemIdx], unit: newValue };
      } else if (field === 'name') {
        if (updatedItems[itemIdx].name === newValue) { setUpdating(false); return; }
        updatedItems[itemIdx] = { ...updatedItems[itemIdx], name: newValue };
      } else if (field === 'quantity') {
        const qty = parseFloat(newValue) || 0;
        if ((updatedItems[itemIdx].orderQty || updatedItems[itemIdx].quantity) === qty) { setUpdating(false); return; }
        updatedItems[itemIdx] = { ...updatedItems[itemIdx], quantity: qty, orderQty: qty };
      }

      const newTotal = updatedItems.reduce((sum, it) => sum + ((it.orderQty || it.quantity || 0) * (it.price || 0)), 0);

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_orders', order.id), {
        items: updatedItems,
        totalAmount: newTotal
      });
    } catch (error) {
      console.error('更新失敗:', error);
      showAlert('更新失敗，請確認網路連線。');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddItem = async () => {
    setUpdating(true);
    try {
      const newItem = { 
        id: `M${Date.now().toString().slice(-4)}`, 
        name: '', 
        quantity: 1, 
        orderQty: 1, 
        unit: '件', 
        price: 0 
      };
      const updatedItems = [...order.items, newItem];
      const newTotal = updatedItems.reduce((sum, it) => sum + ((it.orderQty || it.quantity || 0) * (it.price || 0)), 0);

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_orders', order.id), {
        items: updatedItems,
        totalAmount: newTotal
      });
    } catch (error) {
      console.error('新增失敗:', error);
      showAlert('新增商品失敗，請確認網路連線。');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = (itemIdx) => {
    showConfirm('確定要刪除此商品嗎？', async () => {
      setUpdating(true);
      try {
        const updatedItems = order.items.filter((_, idx) => idx !== itemIdx);
        const newTotal = updatedItems.reduce((sum, it) => sum + ((it.orderQty || it.quantity || 0) * (it.price || 0)), 0);

        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'hotpot_orders', order.id), {
          items: updatedItems,
          totalAmount: newTotal
        });
        showAlert('已成功刪除商品。');
      } catch (error) {
        console.error('刪除失敗:', error);
        showAlert('刪除失敗，請確認網路連線。');
      } finally {
        setUpdating(false);
      }
    });
  };

  const totalAmount = order.totalAmount || order.items.reduce((sum, it) => sum + ((it.orderQty || it.quantity || 0) * (it.price || 0)), 0);

  return (
    <div className="bg-[#FFFFFF] rounded-[2.5rem] border border-[#E5E8EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
      {isCurrentlyAbnormal && <div className="absolute top-0 left-0 w-full h-3 bg-[#EF4444]"></div>}
      {order.abnormalResolved && <div className="absolute top-0 left-0 w-full h-3 bg-[#10B981]"></div>}
      
      <div className={`p-6 sm:p-8 border-b-2 border-[#F2F4F7] flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${isCurrentlyAbnormal ? 'bg-[#FEF2F2]/50' : order.abnormalResolved ? 'bg-[#ECFDF5]/50' : 'bg-[#F2F4F7]/40'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 bg-white rounded-xl shadow-sm border border-[#E5E8EB] ${order.abnormalResolved ? 'text-[#10B981]' : 'text-[#F05A42]'}`}><Receipt size={24} /></div>
          <div>
             <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest block mb-0.5">叫貨單號</span>
             <span className="font-black text-[#1A1D21] text-lg font-mono tracking-wide">{order.id}</span>
          </div>
        </div>
        <div className="text-left sm:text-right flex items-center sm:block gap-3">
           <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest sm:mb-1 block">建檔日期</span>
           <span className="bg-white text-[#111418] px-4 py-1.5 rounded-xl font-black shadow-sm border border-[#E5E8EB] text-sm">{order.date}</span>
        </div>
      </div>

      {hasAbnormalHistory && (
         <div className={`mx-6 sm:mx-8 mt-8 p-6 border-2 rounded-[2rem] ${order.abnormalResolved ? 'bg-[#ECFDF5] border-[#6EE7B7]' : 'bg-[#FEF2F2] border-[#FECACA]'}`}>
            <h4 className={`font-black mb-3 flex items-center gap-2 ${order.abnormalResolved ? 'text-[#064E3B]' : 'text-[#991B1B]'}`}>
               {order.abnormalResolved ? <CheckCircle2 /> : <AlertTriangle />} 
               {order.abnormalResolved ? '門市異常通報 (已排除)' : '門市異常通報'}
            </h4>
            
            {/* 顯示舊版異常記錄 (如果有) */}
            {Object.entries(order.abnormalCategories || {}).map(([cat, data]) => (
               <div key={cat} className="mb-4 last:mb-0">
                  <p className={`text-sm font-bold mb-2 inline-block px-3 py-1 rounded-lg ${order.abnormalResolved ? 'text-[#064E3B] bg-[#A7F3D0]/40' : 'text-[#991B1B] bg-[#FECACA]/40'}`}>分類：{cat}</p>
                  <p className="text-[#1A1D21] font-bold bg-white p-4 rounded-xl shadow-inner border border-[#E5E8EB] leading-relaxed">{data.remark || '未填寫原因'}</p>
                  {data.photo && <img src={data.photo} alt="異常相片" className="mt-3 w-64 rounded-xl border-[3px] border-white shadow-md" />}
               </div>
            ))}

            {/* 顯示新版進貨系統通報 */}
            {order.abnormalReason && (
               <div className="mt-2">
                  <p className={`font-bold bg-white p-4 rounded-xl shadow-inner border leading-relaxed ${order.abnormalResolved ? 'text-[#064E3B] border-[#A7F3D0]' : 'text-[#1A1D21] border-[#FECACA]'}`}>
                    原始通報：{order.abnormalReason} (異常商品：{order.abnormalItem})
                    {order.abnormalResolved && <span className="block mt-2 text-[#10B981]"> 門市已排除異常，並成功完成入庫作業。</span>}
                  </p>
                  
                  {/* 若有夾帶照片，則顯示照片 */}
                  {order.abnormalPhoto && (
                    <img src={order.abnormalPhoto} alt="門市上傳異常照片" className="mt-4 max-h-[300px] w-auto rounded-xl border-4 border-white shadow-md object-cover" />
                  )}
               </div>
            )}
         </div>
      )}

      <div className="p-6 sm:p-8 overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead>
             <tr className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest border-b-2 border-[#F2F4F7]">
                <th className="py-4 px-3 w-20">產品編號</th>
                <th className="py-4 px-3"><Layers className="inline w-3.5 h-3.5 mr-1 -mt-0.5"/> 商品名稱</th>
                <th className="py-4 px-3 text-center w-28">數量</th>
                <th className="py-4 px-3 text-left w-32">單位</th>
                <th className="py-4 px-3 text-right w-40">進貨單價 ($)</th>
                <th className="py-4 px-3 text-right w-32">總金額</th>
                <th className="py-4 px-3 text-center w-16">操作</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-[#F2F4F7]">
            {order.items.map((item, idx) => {
              const qty = item.orderQty || item.quantity || 0;
              const price = item.price || 0;
              const itemTotal = qty * price;
              const currentUnit = item.unit || '件';

              return (
                <tr key={idx} className="hover:bg-[#F2F4F7]/60 transition-colors group">
                   <td className="py-5 px-3 font-mono text-[#6B7280] text-sm tracking-wider">{item.id || `P${String(idx+1).padStart(3, '0')}`}</td>
                   <td className="py-5 px-3">
                     <input
                        type="text"
                        defaultValue={item.name}
                        onBlur={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-[#E5E8EB] rounded-xl focus:ring-2 focus:ring-[#F05A42] outline-none font-bold text-[#1A1D21] text-[17px] shadow-inner transition-all hover:border-[#F05A42]"
                        placeholder="請輸入名稱"
                     />
                   </td>
                   <td className="py-5 px-3">
                     <input
                        type="number"
                        min="0"
                        step="0.5"
                        defaultValue={qty}
                        onBlur={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-2.5 bg-white border border-[#E5E8EB] rounded-xl focus:ring-2 focus:ring-[#F05A42] outline-none text-center font-black text-[#F05A42] text-[17px] shadow-inner transition-all hover:border-[#F05A42]"
                     />
                   </td>
                   <td className="py-5 px-3 text-left">
                      <select
                         value={currentUnit}
                         onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                         className="w-full bg-white border border-[#E5E8EB] rounded-lg px-2 py-2 focus:ring-2 focus:ring-[#F05A42] outline-none font-bold text-[#1A1D21] text-sm shadow-inner cursor-pointer"
                      >
                         <option value={currentUnit}>{currentUnit}</option>
                         {(systemOptions?.units || []).map((u, i) => {
                            const uName = typeof u === 'string' ? u : u.name;
                            if (uName !== currentUnit) {
                               return <option key={`opt-${i}`} value={uName}>{uName}</option>;
                            }
                            return null;
                         })}
                      </select>
                   </td>
                   <td className="py-5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 relative">
                        <span className="text-[#6B7280] font-bold absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          defaultValue={price === 0 ? '' : price}
                          onBlur={(e) => handleUpdateItem(idx, 'price', e.target.value)}
                          className="w-full pl-7 pr-3 py-2.5 bg-white border border-[#E5E8EB] rounded-xl focus:ring-2 focus:ring-[#F05A42] outline-none text-right font-black text-[#1A1D21] text-[17px] shadow-inner transition-all hover:border-[#F05A42]"
                          placeholder="單價"
                        />
                      </div>
                   </td>
                   <td className="py-5 px-3 text-right font-black text-[#1A1D21] text-xl">${itemTotal.toLocaleString()}</td>
                   <td className="py-5 px-3 text-center">
                     <button onClick={() => handleRemoveItem(idx)} className="p-2 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-colors shadow-sm" title="刪除商品">
                       <Trash2 size={20} />
                     </button>
                   </td>
                </tr>
              );
            })}
            <tr className="border-t-[3px] border-dashed border-[#F2F4F7] hover:bg-[#F2F4F7]/30 transition-colors">
              <td colSpan="7" className="py-5 px-3 text-center">
                <button onClick={handleAddItem} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-[#F05A42] font-black hover:bg-[#FFF2F0] hover:shadow-md transition-all border-2 border-[#F05A42]/20 hover:border-[#F05A42] active:scale-95">
                  <Plus size={20} strokeWidth={3} /> 新增一筆進貨商品
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-[#F2F4F7]/60 p-6 sm:p-8 border-t-2 border-[#E5E8EB] flex flex-col sm:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-[1.5rem] shadow-sm border border-[#E5E8EB] w-full sm:w-auto justify-between">
           <span className="font-bold text-[#6B7280] uppercase tracking-widest text-sm">此單總金額</span>
           <div className="flex items-center gap-2">
             {updating && <span className="text-[10px] font-bold text-white bg-[#F05A42] animate-pulse px-2 py-0.5 rounded-md shadow-sm mr-2">儲存中</span>}
             <span className="text-3xl font-black text-[#F05A42] tracking-tighter">${totalAmount.toLocaleString()}</span>
           </div>
         </div>
         <div className="flex items-center gap-4 w-full sm:w-auto justify-between border-t border-[#E5E8EB] sm:border-0 pt-4 sm:pt-0">
           <span className="font-bold text-[#6B7280] uppercase tracking-widest text-xs hidden sm:block">當前核對狀態</span>
           <span className={`text-xl sm:text-2xl font-black tracking-tighter flex items-center gap-2 ${order.status === 'received' ? 'text-[#10B981]' : isCurrentlyAbnormal ? 'text-[#EF4444]' : 'text-[#F05A42]'}`}>
              {order.status === 'received' ? (
                 order.abnormalResolved ? <><CheckCircle2 /> 異常已排除並入庫</> : <><CheckCircle2 /> 門市已入庫</>
              ) : isCurrentlyAbnormal ? <><AlertTriangle /> 暫停處理中</> : <><Clock /> 等待門市核對</>}
           </span>
         </div>
      </div>
    </div>
  );
}

// ==========================================
// 總部 Tab 7：上漲降價 (風琴式商品趨勢與搜尋)
// ==========================================
function AdminPriceTrends({ orders, users }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStore, setExpandedStore] = useState(null);

  const stores = users.filter(u => u.role !== 'admin');

  // 計算每家門市的商品歷史價格趨勢
  const { storeSummary, globalSummary } = useMemo(() => {
    const map = {}; 
    const sortedOrders = [...orders].sort((a,b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    sortedOrders.forEach(order => {
       const sName = order.branchName || '未知門店';
       const vendor = order.id.split('-')[1] || '其他廠商';
       if (!map[sName]) map[sName] = {};
       
       (order.items || []).forEach(item => {
          const pName = item.name;
          if (!pName || typeof item.price !== 'number') return;
          
          const key = `${pName}_${vendor}`;
          if (!map[sName][key]) map[sName][key] = { productName: pName, vendor, history: [] };
          
          map[sName][key].history.push({ price: item.price, date: order.date });
       });
    });
    
    const sSummary = {};
    const gSummary = [];
    
    Object.keys(map).forEach(sName => {
       sSummary[sName] = [];
       Object.keys(map[sName]).forEach(key => {
          const data = map[sName][key];
          const hist = data.history;
          if (hist.length === 0) return;
          
          const latest = hist[hist.length - 1];
          let previousPrice = latest.price;
          // 往回找最近一次「不同」的價格，作為前次比價基準
          for (let i = hist.length - 2; i >= 0; i--) {
             if (hist[i].price !== latest.price) {
                previousPrice = hist[i].price;
                break;
             }
          }
          
          const diff = latest.price - previousPrice;
          let trend = 'flat';
          if (diff > 0) trend = 'up';
          if (diff < 0) trend = 'down';
          
          const itemData = {
             storeName: sName,
             productName: data.productName,
             vendor: data.vendor,
             latestPrice: latest.price,
             previousPrice,
             diff,
             trend,
             date: latest.date
          };
          
          sSummary[sName].push(itemData);
          gSummary.push(itemData);
       });
       // 將有漲跌變動的商品排在最上面
       sSummary[sName].sort((a,b) => (a.trend === 'flat' ? 1 : 0) - (b.trend === 'flat' ? 1 : 0));
    });
    
    return { storeSummary: sSummary, globalSummary: gSummary };
  }, [orders]);

  // 搜尋過濾功能
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return {};
    const term = searchTerm.toLowerCase();
    const filtered = globalSummary.filter(item => item.productName.toLowerCase().includes(term));
    
    const grouped = {};
    filtered.forEach(item => {
      if (!grouped[item.productName]) grouped[item.productName] = {};
      if (!grouped[item.productName][item.vendor]) grouped[item.productName][item.vendor] = [];
      grouped[item.productName][item.vendor].push(item);
    });
    return grouped;
  }, [searchTerm, globalSummary]);

  const toggleStore = (storeName) => {
    setExpandedStore(prev => prev === storeName ? null : storeName);
  };

  const TrendCard = ({ item, showStore }) => {
     const isUp = item.trend === 'up';
     const isDown = item.trend === 'down';
     const isFlat = item.trend === 'flat';
     
     return (
       <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E5E8EB] shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col relative overflow-hidden group hover:border-[#3B82F6]/50 transition-colors">
          {showStore && <div className="absolute top-0 right-0 bg-[#1A1D21] text-white text-[10px] font-black px-3 py-1.5 rounded-bl-xl tracking-widest z-10 shadow-sm">{item.storeName}</div>}
          
          <div className="flex justify-between items-start mb-4">
             <div>
                {!showStore && <span className="text-[10px] font-bold text-[#6B7280] bg-[#F2F4F7] border border-[#E5E8EB] px-2 py-1 rounded-md mb-2 inline-block tracking-widest">{item.vendor}</span>}
                <h4 className="font-black text-[#1A1D21] text-lg leading-tight w-[85%]">{item.productName}</h4>
             </div>
          </div>
          
          <div className="flex justify-between items-end mt-auto pt-3 border-t border-[#F2F4F7]">
             <div>
                <div className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold mb-0.5">最新進價</div>
                <div className="text-2xl font-black text-[#1A1D21]">${item.latestPrice}</div>
             </div>
             <div className="text-right">
                {isUp && <div className="flex items-center gap-1 text-[#EF4444] bg-[#FEF2F2] border border-[#FECACA] px-2.5 py-1 rounded-lg font-black text-sm shadow-sm"><TrendingUp size={16} strokeWidth={3}/> 漲 ${item.diff}</div>}
                {isDown && <div className="flex items-center gap-1 text-[#10B981] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 rounded-lg font-black text-sm shadow-sm"><TrendingDown size={16} strokeWidth={3}/> 降 ${Math.abs(item.diff)}</div>}
                {isFlat && <div className="flex items-center gap-1 text-[#6B7280] bg-[#F2F4F7] border border-[#E5E8EB] px-2.5 py-1 rounded-lg font-black text-sm shadow-sm"><Minus size={16} strokeWidth={3}/> 持平</div>}
                {!isFlat && <div className="text-[10px] text-[#9CA3AF] font-bold mt-1.5">前次 $ {item.previousPrice}</div>}
             </div>
          </div>
       </div>
     );
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-[#1A1D21] mb-2 tracking-tight">商品上漲降價追蹤</h2>
        <p className="text-[#6B7280] font-bold">查詢各門市商品近期的進貨價格趨勢，輸入商品名稱以比較各廠商報價。</p>
      </div>

      <div className="relative mb-8">
         <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="text-[#9CA3AF]" size={24} />
         </div>
         <input 
            type="text" 
            placeholder="搜尋商品名稱，比較各店與各廠商報價 (例如：板腱牛肉)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-12 py-4 bg-[#FFFFFF] border-[2px] border-transparent rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/20 outline-none font-black text-[#1A1D21] text-lg transition-all"
         />
         {searchTerm && (
           <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-5 flex items-center text-[#9CA3AF] hover:text-[#1A1D21] transition-colors">
              <X size={24} strokeWidth={3} />
           </button>
         )}
      </div>

      {searchTerm.trim() ? (
         <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
           {Object.keys(searchResults).length === 0 ? (
              <div className="text-center py-20 text-[#9CA3AF] font-bold border-2 border-dashed border-[#E5E8EB] rounded-[2.5rem] bg-[#FFFFFF]">
                 找不到符合「{searchTerm}」的商品進貨紀錄
              </div>
           ) : (
              Object.keys(searchResults).map(pName => (
                 <div key={pName} className="bg-[#FFFFFF] rounded-[2.5rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent">
                    <h3 className="text-2xl font-black text-[#1A1D21] mb-6 flex items-center gap-3">
                       <Tag className="text-[#3B82F6]" size={28} /> {pName}
                    </h3>
                    <div className="space-y-6">
                       {Object.keys(searchResults[pName]).map(vendor => (
                          <div key={vendor} className="bg-[#F2F4F7]/50 p-5 sm:p-6 rounded-[2rem] border border-[#E5E8EB]">
                             <h4 className="text-lg font-bold text-[#1A1D21] mb-4 flex items-center gap-2">
                                <Briefcase className="text-[#9CA3AF]" size={20}/> 廠商：{vendor}
                             </h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {searchResults[pName][vendor].map((item, idx) => (
                                   <TrendCard key={idx} item={item} showStore={true} />
                                ))}
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              ))
           )}
         </div>
      ) : (
         <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            {stores.length === 0 && <div className="text-center py-20 text-[#9CA3AF] font-bold border-2 border-dashed border-[#E5E8EB] rounded-[2.5rem] bg-[#FFFFFF]">目前無門市資料</div>}
            {stores.map(store => {
               const isExpanded = expandedStore === store.branchName;
               const items = storeSummary[store.branchName] || [];
               return (
                 <div key={store.username} className={`bg-[#FFFFFF] rounded-[2rem] shadow-sm border border-[#E5E8EB] overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-md border-[#3B82F6]/30' : 'hover:border-[#9CA3AF]/50'}`}>
                    <button onClick={() => toggleStore(store.branchName)} className="w-full p-5 sm:p-6 flex justify-between items-center hover:bg-[#F2F4F7]/50 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl transition-colors ${isExpanded ? 'bg-[#3B82F6] text-white' : 'bg-[#F2F4F7] text-[#6B7280]'}`}>
                             {store.branchName.charAt(0)}
                          </div>
                          <h3 className="text-xl sm:text-2xl font-black text-[#1A1D21]">{store.branchName}</h3>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className={`text-sm font-bold px-3 py-1.5 rounded-lg hidden sm:block ${isExpanded ? 'bg-[#EFF6FF] text-[#3B82F6]' : 'bg-[#F2F4F7] text-[#6B7280]'}`}>
                             共 {items.length} 項商品紀錄
                          </span>
                          <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-[#EFF6FF] text-[#3B82F6]' : 'bg-[#F2F4F7] text-[#9CA3AF]'}`}>
                             <ChevronDown className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                       </div>
                    </button>
                    {isExpanded && (
                       <div className="p-5 sm:p-6 pt-0 border-t border-[#F2F4F7] bg-[#F2F4F7]/20">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
                             {items.map((item, idx) => (
                                <TrendCard key={idx} item={item} showStore={false} />
                             ))}
                             {items.length === 0 && <div className="col-span-full text-center text-[#9CA3AF] font-bold py-10">目前該店尚無進貨紀錄</div>}
                          </div>
                       </div>
                    )}
                 </div>
               )
            })}
         </div>
      )}
    </div>
  )
}
