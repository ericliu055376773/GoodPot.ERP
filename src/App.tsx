import React, { useState, useMemo } from 'react';
import {
  Store,
  ShieldUser,
  Package,
  LogOut,
  ChevronLeft,
  Receipt,
  Users,
  Building2,
  TrendingUp,
  CreditCard,
  Briefcase,
  CalendarDays,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Tag,
  CheckCircle2,
  Camera,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';

// --- 初始測試資料 ---
const initialUsers = [
  { id: 'admin1', password: 'admin', role: 'admin', name: '合夥人' },
  { id: 'store1', password: '123', role: 'store', name: '台北車站門市' },
  { id: 'store2', password: '456', role: 'store', name: '信義威秀門市' },
];

const initialVendors = [
  { id: 'v1', name: '統一企業股份有限公司' },
  { id: 'v2', name: '義美食品股份有限公司' },
  { id: 'v3', name: '光泉牧場股份有限公司' },
];

const initialOrders = [
  {
    id: 'PO-20260310-01',
    storeId: 'store1',
    vendorId: 'v1',
    date: '2026-03-10',
    items: [
      { name: '純喫茶 綠茶 650ml', quantity: 50, price: 20 },
      { name: '茶裏王 日式無糖綠', quantity: 30, price: 25 },
    ],
    totalAmount: 1750,
  },
  {
    id: 'PO-20260311-02',
    storeId: 'store1',
    vendorId: 'v2',
    date: '2026-03-11',
    items: [{ name: '義美小泡芙 巧克力', quantity: 40, price: 30 }],
    totalAmount: 1200,
  },
];

// 系統預設商品目錄 (供下拉選單使用)
const initialProducts = [
  '純喫茶 綠茶 650ml',
  '茶裏王 日式無糖綠',
  '統一麵 肉燥風味',
  '義美小泡芙 巧克力',
  '義美鮮奶 946ml',
  '光泉全脂鮮乳',
];

// 預設的效期追蹤紀錄 (測試用)
const initialExpiryRecords = [
  {
    id: 'exp1',
    storeId: 'store1',
    productName: '義美鮮奶 946ml',
    expiryDate: '2026-03-15',
  },
  {
    id: 'exp2',
    storeId: 'store1',
    productName: '純喫茶 綠茶 650ml',
    expiryDate: '2026-04-30',
  },
];

// 新增：系統預設異常原因
const initialAbnormalReasons = [
  '商品外包裝嚴重破損',
  '實際到貨數量短少',
  '送來了錯誤的品項',
  '商品已過期或即將到期',
  '商品內容物有變質或異物',
];

export default function App() {
  const [users, setUsers] = useState(initialUsers);
  const [vendors] = useState(initialVendors);
  const [orders] = useState(initialOrders);

  const [products, setProducts] = useState(initialProducts);
  const [expiryRecords, setExpiryRecords] = useState(initialExpiryRecords);

  // 異常原因狀態與進貨單核對狀態
  const [abnormalReasons, setAbnormalReasons] = useState(
    initialAbnormalReasons
  );
  const [orderStatuses, setOrderStatuses] = useState({}); // 記錄每筆單據的狀態 { orderId: 'verified' | 'abnormal' }
  const [abnormalRecords, setAbnormalRecords] = useState([]); // 記錄所有異常通報明細

  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [selectedVendor, setSelectedVendor] = useState(null);

  const [authForm, setAuthForm] = useState({ password: '', name: '' });
  const [authError, setAuthError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find((u) => u.password === authForm.password);
    if (user) {
      setCurrentUser(user);
      setCurrentView(
        user.role === 'admin' ? 'admin_dashboard' : 'store_dashboard'
      );
      setAuthError('');
      setAuthForm({ password: '', name: '' });
    } else {
      setAuthError('登入碼錯誤，請重新輸入');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (users.some((u) => u.password === authForm.password)) {
      setAuthError('此登入碼已被使用，請更換一組');
      return;
    }
    const newUser = {
      id: `store${Date.now()}`,
      password: authForm.password,
      role: 'store',
      name: authForm.name || '新門市',
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setCurrentView('store_dashboard');
    setAuthError('');
    setAuthForm({ password: '', name: '' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setSelectedVendor(null);
  };

  // --- 登入畫面 (奶油色系擬態風) ---
  if (currentView === 'login' || currentView === 'register') {
    return (
      <div className="min-h-screen bg-[#F3EFEA] flex items-center justify-center p-4 relative overflow-hidden font-sans text-[#473D35]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E8D8C8] rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#EBDCC2] rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] bg-[#F0E4D4] rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-4000"></div>

        <div className="bg-[#FDFCF9]/90 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-[10px_10px_30px_rgba(212,204,195,0.6),-10px_-10px_30px_rgba(255,255,255,0.9)] w-full max-w-md border-2 border-white relative z-10">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-tr from-[#C2956E] to-[#E3BE9D] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[4px_4px_15px_rgba(194,149,110,0.4)]">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#473D35]">
              是好鍋進貨系統
            </h1>
            <p className="text-sm text-[#968A7E] mt-2 font-medium">
              {currentView === 'login'
                ? '歡迎回來，請登入您的帳號'
                : '建立您的專屬門市帳號'}
            </p>
          </div>

          {authError && (
            <div className="bg-[#FCF0EC] border border-[#F2D1C4] text-[#D16A54] p-3 rounded-2xl mb-6 text-sm text-center font-bold animate-in fade-in zoom-in duration-300">
              {authError}
            </div>
          )}

          <form
            onSubmit={currentView === 'login' ? handleLogin : handleRegister}
            className="space-y-5"
          >
            {currentView === 'register' && (
              <div>
                <label className="block text-xs font-bold text-[#968A7E] uppercase tracking-widest mb-2 ml-1">
                  門市名稱
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-5 py-3.5 bg-[#FDFCF9] border-2 border-[#E8E2D9] rounded-2xl focus:ring-4 focus:ring-[#C2956E]/20 focus:border-[#C2956E] outline-none transition-all text-[#473D35] font-semibold"
                  value={authForm.name}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, name: e.target.value })
                  }
                  placeholder="例如：台北車站門市"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-[#968A7E] uppercase tracking-widest mb-2 ml-1">
                {currentView === 'login'
                  ? '專屬登入碼'
                  : '設定專屬登入碼 (密碼)'}
              </label>
              <input
                type="password"
                required
                className="w-full px-5 py-3.5 bg-[#FDFCF9] border-2 border-[#E8E2D9] rounded-2xl focus:ring-4 focus:ring-[#C2956E]/20 focus:border-[#C2956E] outline-none transition-all text-[#473D35] font-semibold"
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm({ ...authForm, password: e.target.value })
                }
                placeholder={
                  currentView === 'login'
                    ? '請輸入門市登入碼'
                    : '請設定一組不重複的密碼'
                }
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#665547] text-white py-4 px-4 rounded-2xl hover:bg-[#524438] hover:shadow-[0_8px_20px_rgba(102,85,71,0.3)] transition-all font-bold mt-8 active:scale-[0.98]"
            >
              {currentView === 'login' ? '快速登入' : '註冊門市'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium">
            {currentView === 'login' ? (
              <p className="text-[#968A7E]">
                還沒有帳號？{' '}
                <button
                  onClick={() => {
                    setCurrentView('register');
                    setAuthError('');
                  }}
                  className="text-[#C2956E] hover:text-[#A67E5B] hover:underline transition-colors font-bold"
                >
                  立即註冊
                </button>
              </p>
            ) : (
              <p className="text-[#968A7E]">
                已有帳號？{' '}
                <button
                  onClick={() => {
                    setCurrentView('login');
                    setAuthError('');
                  }}
                  className="text-[#C2956E] hover:text-[#A67E5B] hover:underline transition-colors font-bold"
                >
                  返回登入
                </button>
              </p>
            )}
          </div>

          {currentView === 'login' && (
            <div className="mt-8 pt-6 border-t border-[#E8E2D9] text-[11px] text-[#B3A698] font-semibold">
              <p className="mb-2 text-[#968A7E]">快速測試登入碼：</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#F3EFEA]/80 p-2.5 rounded-xl text-center border border-[#E8E2D9]">
                  站前店: <strong className="text-[#C2956E]">123</strong>
                </div>
                <div className="bg-[#F3EFEA]/80 p-2.5 rounded-xl text-center border border-[#E8E2D9]">
                  威秀店: <strong className="text-[#C2956E]">456</strong>
                </div>
                <div className="bg-[#F3EFEA]/80 p-2.5 rounded-xl text-center border border-[#E8E2D9]">
                  後臺: <strong className="text-[#C2956E]">admin</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3EFEA] flex flex-col font-sans text-[#473D35]">
      {/* 頂部導覽列 */}
      <header className="bg-[#FDFCF9]/80 backdrop-blur-md border-b border-[#E8E2D9] px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_2px_5px_rgba(0,0,0,0.05)] ${
              currentUser?.role === 'admin'
                ? 'bg-gradient-to-br from-[#8C7A6B] to-[#665547] text-white'
                : 'bg-gradient-to-br from-[#C2956E] to-[#A67E5B] text-white'
            }`}
          >
            {currentUser?.role === 'admin' ? (
              <ShieldUser size={20} className="sm:w-5 sm:h-5" />
            ) : (
              <Store size={20} className="sm:w-5 sm:h-5" />
            )}
          </div>
          <div>
            <h1 className="font-bold text-[#473D35] text-base sm:text-lg tracking-tight leading-tight">
              {currentUser?.name}
            </h1>
            <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#F3EFEA] text-[#968A7E] inline-block mt-0.5 border border-[#E8E2D9]">
              {currentUser?.role === 'admin' ? '總部管理後臺' : '門市進貨終端'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {currentUser && currentUser.role === 'store' && (
            <button
              onClick={() => setCurrentView('store_abnormal_list')}
              className="relative p-2 rounded-xl text-[#D16A54] hover:bg-[#FFF4F0] transition-all border border-transparent hover:border-[#F2D1C4] active:scale-95"
              title="異常通報紀錄"
            >
              {/* 加入 animate-pulse 讓三角形圖示閃爍 */}
              <AlertTriangle
                size={22}
                strokeWidth={2.5}
                className={
                  abnormalRecords.filter((r) => r.storeId === currentUser.id)
                    .length > 0
                    ? 'animate-pulse'
                    : ''
                }
              />
              {abnormalRecords.filter((r) => r.storeId === currentUser.id)
                .length > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 animate-ping rounded-full bg-[#D16A54] opacity-40"></span>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D16A54] text-[10px] font-bold text-white shadow-sm border border-white">
                    {
                      abnormalRecords.filter(
                        (r) => r.storeId === currentUser.id
                      ).length
                    }
                  </span>
                </>
              )}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[#968A7E] hover:text-[#665547] hover:bg-[#F3EFEA] transition-all text-sm font-bold p-2 px-3 rounded-xl active:scale-95"
          >
            <LogOut size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">登出</span>
          </button>
        </div>
      </header>

      {/* 主要內容區 */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-12">
        {currentView === 'store_dashboard' && (
          <StoreDashboard
            currentUser={currentUser}
            vendors={vendors}
            orders={orders}
            products={products}
            expiryRecords={expiryRecords}
            setExpiryRecords={setExpiryRecords}
            onSelectVendor={(v) => {
              setSelectedVendor(v);
              setCurrentView('store_vendor_detail');
            }}
          />
        )}
        {currentView === 'store_vendor_detail' && (
          <StoreVendorDetail
            currentUser={currentUser}
            vendor={selectedVendor}
            orders={orders}
            abnormalReasons={abnormalReasons}
            orderStatuses={orderStatuses}
            setOrderStatuses={setOrderStatuses}
            onAddAbnormalRecord={(record) =>
              setAbnormalRecords([...abnormalRecords, record])
            }
            onResolveAbnormal={(orderId) => {
              setOrderStatuses((prev) => ({ ...prev, [orderId]: 'verified' }));
              setAbnormalRecords((prev) =>
                prev.filter((r) => r.orderId !== orderId)
              );
            }}
            onBack={() => {
              setSelectedVendor(null);
              setCurrentView('store_dashboard');
            }}
          />
        )}
        {currentView === 'store_abnormal_list' && (
          <StoreAbnormalList
            currentUser={currentUser}
            abnormalRecords={abnormalRecords}
            vendors={vendors}
            onResolveAbnormal={(orderId) => {
              setOrderStatuses((prev) => ({ ...prev, [orderId]: 'verified' }));
              setAbnormalRecords((prev) =>
                prev.filter((r) => r.orderId !== orderId)
              );
            }}
            onBack={() => setCurrentView('store_dashboard')}
          />
        )}
        {currentView === 'admin_dashboard' && (
          <AdminDashboard
            users={users}
            vendors={vendors}
            orders={orders}
            products={products}
            setProducts={setProducts}
            abnormalReasons={abnormalReasons}
            setAbnormalReasons={setAbnormalReasons}
          />
        )}
      </main>
    </div>
  );
}

// ==========================================
// 前臺：門市總覽
// ==========================================
function StoreDashboard({
  currentUser,
  vendors,
  orders,
  products,
  expiryRecords,
  setExpiryRecords,
  onSelectVendor,
}) {
  const vendorStats = useMemo(() => {
    if (!currentUser) return [];
    const storeOrders = orders.filter((o) => o.storeId === currentUser.id);
    return vendors.map((vendor) => {
      const vOrders = storeOrders.filter((o) => o.vendorId === vendor.id);
      return { ...vendor, orderCount: vOrders.length };
    });
  }, [currentUser, vendors, orders]);

  return (
    <div className="animate-in fade-in duration-500">
      {/* --- 商品效期檢查與追蹤卡片區塊 --- */}
      <StoreExpiryTracker
        currentUser={currentUser}
        products={products}
        expiryRecords={expiryRecords}
        setExpiryRecords={setExpiryRecords}
      />

      {/* 英雄區塊 (柔和卡片風格) */}
      <div className="mt-12 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#473D35] tracking-tight">
            廠商分類進貨明細
          </h2>
          <p className="text-sm sm:text-base text-[#968A7E] mt-1 font-medium">
            請選擇下方廠商以核對歷史進貨單
          </p>
        </div>
      </div>

      {/* 奶油色系擬態卡片網格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {vendorStats.map((vendor) => (
          <button
            key={vendor.id}
            onClick={() => onSelectVendor(vendor)}
            className="group bg-[#FDFCF9] p-7 rounded-[2.5rem] shadow-[8px_8px_24px_rgba(212,204,195,0.6),-8px_-8px_24px_rgba(255,255,255,0.8)] border-[2px] border-white hover:shadow-[4px_4px_12px_rgba(212,204,195,0.4),-4px_-4px_12px_rgba(255,255,255,0.9)] active:shadow-[inset_4px_4px_8px_rgba(212,204,195,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] active:scale-[0.98] transition-all duration-300 text-left flex flex-col h-full overflow-hidden relative"
          >
            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className="p-4 bg-[#F3EFEA] rounded-2xl group-hover:bg-[#EAE2D8] transition-colors duration-300 shadow-inner">
                <Briefcase
                  size={28}
                  className="text-[#B3A698] group-hover:text-[#C2956E] sm:w-8 sm:h-8 w-7 h-7"
                  strokeWidth={1.5}
                />
              </div>
              <span className="bg-[#F3EFEA] border border-white text-[#968A7E] text-xs px-3.5 py-1.5 rounded-full font-bold tracking-wide shadow-sm">
                {vendor.orderCount} 筆單據
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-[#473D35] mb-2 group-hover:text-[#C2956E] transition-colors">
              {vendor.name}
            </h3>
            <p className="text-xs sm:text-sm text-[#968A7E] mb-8 flex-1 font-medium">
              點擊進入點收與核對作業
            </p>

            <div className="pt-5 border-t-2 border-[#F3EFEA] flex justify-between items-center w-full mt-auto">
              <span className="text-[#B3A698] text-xs sm:text-sm font-bold uppercase tracking-widest">
                點收狀態
              </span>
              <span className="text-sm font-black text-[#C2956E] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                前往核對 <ChevronLeft size={16} className="rotate-180" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 前臺：商品效期追蹤管理
// ==========================================
function StoreExpiryTracker({
  currentUser,
  products,
  expiryRecords,
  setExpiryRecords,
}) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const storeRecords = useMemo(() => {
    if (!currentUser) return [];
    return expiryRecords
      .filter((r) => r.storeId === currentUser.id)
      .sort(
        (a, b) =>
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      );
  }, [expiryRecords, currentUser]);

  const handleAddTracker = () => {
    if (!selectedProduct || !expiryDate || !currentUser) return;
    const newRecord = {
      id: `exp_${Date.now()}`,
      storeId: currentUser.id,
      productName: selectedProduct,
      expiryDate: expiryDate,
    };
    setExpiryRecords([...expiryRecords, newRecord]);
    setSelectedProduct('');
    setExpiryDate('');
  };

  const handleRemoveTracker = (id) => {
    setExpiryRecords(expiryRecords.filter((r) => r.id !== id));
  };

  return (
    <div className="bg-[#FDFCF9] rounded-[2.5rem] p-6 sm:p-8 shadow-[8px_8px_24px_rgba(212,204,195,0.6),-8px_-8px_24px_rgba(255,255,255,0.8)] border-[2px] border-white mb-8 relative">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3.5 bg-[#F3EFEA] text-[#C2956E] rounded-2xl shadow-inner border border-white">
          <CalendarDays size={28} strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-[#473D35] tracking-tight">
            效期追蹤與預警
          </h3>
          <p className="text-sm text-[#968A7E] mt-1 font-bold">
            建立商品到期日追蹤，系統將以醒目卡片提示剩餘天數
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end mb-10 bg-[#F3EFEA]/60 p-6 rounded-[2rem] border border-[#E8E2D9] shadow-inner">
        <div className="md:col-span-6">
          <label className="block text-xs font-bold text-[#968A7E] uppercase tracking-widest mb-2 ml-2">
            1. 選擇商品名稱
          </label>
          <div className="relative">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-[#FDFCF9] border-2 border-white rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-[#C2956E]/20 focus:border-[#C2956E] transition-all text-[#473D35] font-bold appearance-none cursor-pointer shadow-[2px_2px_8px_rgba(212,204,195,0.3)]"
            >
              <option value="" disabled>
                請選擇要追蹤的商品...
              </option>
              {products.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-[#968A7E]">
              <ChevronLeft size={20} className="-rotate-90" />
            </div>
          </div>
        </div>

        <div className="md:col-span-4">
          <label className="block text-xs font-bold text-[#968A7E] uppercase tracking-widest mb-2 ml-2">
            2. 設定有效日期
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full bg-[#FDFCF9] border-2 border-white rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-[#C2956E]/20 focus:border-[#C2956E] transition-all text-[#473D35] font-bold shadow-[2px_2px_8px_rgba(212,204,195,0.3)]"
          />
        </div>

        <div className="md:col-span-2">
          <button
            onClick={handleAddTracker}
            disabled={!selectedProduct || !expiryDate}
            className="w-full bg-[#665547] text-white flex items-center justify-center gap-2 py-4 px-4 rounded-2xl hover:bg-[#524438] disabled:bg-[#D4CCC2] disabled:text-[#968A7E] disabled:cursor-not-allowed transition-all font-bold shadow-[4px_4px_12px_rgba(102,85,71,0.3)] active:scale-95"
          >
            <Plus size={20} />
            追蹤
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {storeRecords.length === 0 ? (
          <div className="text-center py-12 text-[#B3A698] font-bold border-2 border-dashed border-[#E8E2D9] rounded-[2rem] bg-[#FDFCF9]">
            目前無追蹤中的商品
          </div>
        ) : (
          storeRecords.map((record) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const exp = new Date(record.expiryDate);
            exp.setHours(0, 0, 0, 0);
            const daysLeft = Math.ceil(
              (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            const isWarning = daysLeft <= 14;

            return (
              <div
                key={record.id}
                className={`relative overflow-hidden rounded-[2rem] p-6 sm:p-8 border-[2px] flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all group ${
                  isWarning
                    ? 'bg-gradient-to-r from-[#FFF4F0] to-[#FFECE6] border-[#F2D1C4] shadow-[6px_6px_15px_rgba(230,190,180,0.4),-6px_-6px_15px_rgba(255,255,255,0.9)]'
                    : 'bg-[#FDFCF9] border-white shadow-[6px_6px_15px_rgba(212,204,195,0.4),-6px_-6px_15px_rgba(255,255,255,0.9)] hover:shadow-[4px_4px_10px_rgba(212,204,195,0.3)]'
                }`}
              >
                <div className="flex-1 pl-2 sm:pl-0">
                  <div className="flex items-center gap-3 mb-2.5">
                    {isWarning ? (
                      <div className="bg-[#FFE2DA] p-2 rounded-xl text-[#D16A54]">
                        <AlertTriangle
                          size={24}
                          className="animate-pulse"
                          strokeWidth={2.5}
                        />
                      </div>
                    ) : (
                      <div className="bg-[#F3EFEA] p-2 rounded-xl text-[#968A7E]">
                        <Package size={24} strokeWidth={2.5} />
                      </div>
                    )}
                    <div
                      className={`font-black text-xl sm:text-2xl tracking-tight ${
                        isWarning ? 'text-[#8A4637]' : 'text-[#473D35]'
                      }`}
                    >
                      {record.productName}
                    </div>
                  </div>
                  <div
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-bold shadow-sm ${
                      isWarning
                        ? 'bg-[#FFDCD2] text-[#A64C3B] border border-[#F2C2B6]'
                        : 'bg-[#F3EFEA] text-[#968A7E] border border-white'
                    }`}
                  >
                    <Clock size={16} strokeWidth={2.5} />
                    到期日：{record.expiryDate}
                  </div>
                </div>

                <div className="flex justify-end items-center border-t-2 sm:border-t-0 sm:border-l-2 border-dashed border-[#E8E2D9] pt-5 sm:pt-0 sm:pl-10 sm:ml-4 pr-14 sm:pr-16 relative">
                  <div className="text-right">
                    <div
                      className={`text-xs font-black uppercase tracking-widest mb-1 ${
                        isWarning ? 'text-[#D16A54]' : 'text-[#B3A698]'
                      }`}
                    >
                      {daysLeft < 0 ? '已過期天數' : '剩餘天數'}
                    </div>
                    <div className="flex items-baseline justify-end gap-1">
                      <span
                        className={`text-[3.5rem] sm:text-[4.5rem] font-black tracking-tighter leading-none drop-shadow-sm ${
                          isWarning ? 'text-[#D16A54]' : 'text-[#809977]'
                        }`}
                      >
                        {Math.abs(daysLeft)}
                      </span>
                      <span
                        className={`text-xl font-bold ${
                          isWarning ? 'text-[#E89E8E]' : 'text-[#A5BA9E]'
                        }`}
                      >
                        天
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveTracker(record.id)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-white/60 hover:bg-white rounded-2xl text-[#B3A698] hover:text-[#D16A54] hover:shadow-md transition-all shadow-sm border border-white active:scale-95"
                    title="移除追蹤"
                  >
                    <Trash2 size={22} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==========================================
// 前臺：單一廠商進貨單明細
// ==========================================
function StoreVendorDetail({
  currentUser,
  vendor,
  orders,
  abnormalReasons,
  orderStatuses,
  setOrderStatuses,
  onAddAbnormalRecord,
  onResolveAbnormal,
  onBack,
}) {
  const vendorOrders = useMemo(() => {
    if (!currentUser || !vendor) return [];
    return orders.filter(
      (o) => o.storeId === currentUser.id && o.vendorId === vendor.id
    );
  }, [currentUser, vendor, orders]);

  const [reportingOrderId, setReportingOrderId] = useState(null);
  const [reportForm, setReportForm] = useState({
    item: '',
    reason: '',
    photoName: null,
  });

  const handleOpenReport = (orderId) => {
    setReportingOrderId(orderId);
    setReportForm({ item: '', reason: '', photoName: null });
  };

  const handleSubmitReport = (orderId) => {
    if (!reportForm.item || !reportForm.reason || !currentUser || !vendor)
      return;
    setOrderStatuses({ ...orderStatuses, [orderId]: 'abnormal' });

    onAddAbnormalRecord({
      id: `abn_${Date.now()}`,
      storeId: currentUser.id,
      vendorId: vendor.id,
      orderId: orderId,
      date: new Date().toLocaleDateString(),
      item: reportForm.item,
      reason: reportForm.reason,
      photoName: reportForm.photoName,
    });

    setReportingOrderId(null);
  };

  const handleVerifySuccess = (orderId) => {
    setOrderStatuses({ ...orderStatuses, [orderId]: 'verified' });
  };

  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setReportForm({ ...reportForm, photoName: e.target.files[0].name });
    }
  };

  return (
    <div className="animate-in slide-in-from-right-8 fade-in duration-500">
      <button
        onClick={onBack}
        className="group flex items-center gap-2 text-[#968A7E] hover:text-[#665547] mb-6 font-bold transition-all py-2.5 -ml-2 px-4 rounded-2xl hover:bg-[#FDFCF9] hover:shadow-sm border border-transparent hover:border-white active:scale-95 text-sm"
      >
        <ChevronLeft
          size={20}
          strokeWidth={3}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span>返回廠商列表</span>
      </button>

      <div className="bg-[#FDFCF9] rounded-[2.5rem] p-6 sm:p-8 shadow-[8px_8px_24px_rgba(212,204,195,0.6),-8px_-8px_24px_rgba(255,255,255,0.8)] border-[2px] border-white mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-5 w-full sm:w-auto">
          <div className="p-4 bg-[#F3EFEA] text-[#C2956E] rounded-[1.5rem] border border-white shadow-inner">
            <Briefcase size={32} className="sm:w-10 sm:h-10" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#473D35] tracking-tight">
              {vendor?.name}
            </h2>
            <p className="text-sm text-[#968A7E] mt-2 font-bold bg-[#F3EFEA] inline-block px-4 py-1.5 rounded-xl border border-white shadow-sm">
              共 {vendorOrders.length} 筆待核對單據
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {vendorOrders.length === 0 ? (
          <div className="text-center py-16 text-[#B3A698] bg-[#FDFCF9] rounded-[2.5rem] border-2 border-dashed border-[#E8E2D9]">
            <Receipt
              size={48}
              className="mx-auto mb-4 opacity-40"
              strokeWidth={1.5}
            />
            <p className="font-bold text-lg">目前尚無進貨單據</p>
          </div>
        ) : (
          vendorOrders.map((order) => {
            const currentStatus = orderStatuses[order.id];

            return (
              <div
                key={order.id}
                className="bg-[#FDFCF9] rounded-[2.5rem] shadow-[6px_6px_20px_rgba(212,204,195,0.5),-6px_-6px_20px_rgba(255,255,255,0.9)] border-[2px] border-white overflow-hidden relative"
              >
                <div className="bg-[#F3EFEA]/40 border-b-2 border-[#F3EFEA] px-6 sm:px-8 py-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-[#E8E2D9] text-[#B3A698]">
                      <Receipt size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-3">
                      <span className="text-xs font-bold text-[#B3A698] uppercase tracking-widest">
                        單號
                      </span>
                      <span className="font-black text-[#473D35] text-base font-mono bg-white px-3 py-1 rounded-lg border border-[#E8E2D9] shadow-sm">
                        {order.id}
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex items-center sm:block pl-[4rem] sm:pl-0">
                    <span className="text-xs font-bold text-[#B3A698] uppercase tracking-widest mr-3 sm:mr-0 sm:block sm:mb-1">
                      進貨日期
                    </span>
                    <span className="font-bold text-[#665547] text-sm bg-white sm:bg-transparent px-3 py-1 sm:p-0 rounded-lg sm:rounded-none border border-[#E8E2D9] sm:border-transparent">
                      {order.date}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 pb-4">
                  <div className="hidden sm:flex mb-5 text-xs font-bold text-[#B3A698] uppercase tracking-widest border-b-2 border-[#F3EFEA] pb-3">
                    <div className="flex-1 pl-2">商品名稱</div>
                    <div className="w-24 text-right pr-2">進貨數量</div>
                  </div>
                  <div className="space-y-4 sm:space-y-3">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center text-sm border-b-2 border-[#F3EFEA] sm:border-0 pb-4 sm:pb-0 last:border-0 last:pb-0 hover:bg-[#F3EFEA]/30 sm:p-2.5 rounded-2xl transition-colors"
                      >
                        <div className="flex-1 font-bold text-[#473D35] mb-2.5 sm:mb-0 text-base sm:text-sm pl-0 sm:pl-2">
                          {item.name}
                        </div>
                        <div className="flex justify-between sm:justify-end items-center w-full sm:w-auto bg-[#F3EFEA]/50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                          <div className="text-[#968A7E] sm:hidden text-xs font-bold uppercase tracking-widest">
                            進貨數量
                          </div>
                          <div className="flex items-center font-mono text-base">
                            <div className="w-auto sm:w-24 text-right font-black text-[#665547] pr-0 sm:pr-2">
                              {item.quantity}{' '}
                              <span className="text-sm font-bold text-[#B3A698] ml-1">
                                件
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!currentStatus && reportingOrderId !== order.id && (
                  <div className="bg-[#F3EFEA]/60 px-5 sm:px-8 py-5 border-t-2 border-[#E8E2D9] flex gap-4">
                    <button
                      onClick={() => handleOpenReport(order.id)}
                      className="w-1/2 flex items-center justify-center gap-2 py-3.5 rounded-[1.25rem] text-[#D16A54] border-2 border-[#D16A54]/20 bg-white hover:bg-[#FFF4F0] font-black transition-colors shadow-sm active:scale-95"
                    >
                      <AlertTriangle size={20} strokeWidth={2.5} /> 商品異常
                    </button>
                    <button
                      onClick={() => handleVerifySuccess(order.id)}
                      className="w-1/2 flex items-center justify-center gap-2 py-3.5 rounded-[1.25rem] bg-[#809977] text-white hover:bg-[#6b8262] font-black shadow-[0_4px_12px_rgba(128,153,119,0.3)] transition-all active:scale-95"
                    >
                      <CheckCircle2 size={20} strokeWidth={2.5} /> 核對正確
                    </button>
                  </div>
                )}

                {reportingOrderId === order.id && (
                  <div className="bg-[#FFF4F0] px-6 sm:px-8 py-6 border-t-[3px] border-[#F2D1C4] animate-in fade-in slide-in-from-top-2 duration-300">
                    <h4 className="font-black text-[#8A4637] mb-5 flex items-center gap-2">
                      <AlertTriangle size={20} /> 回報商品異常狀況
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#D16A54] uppercase tracking-widest mb-1.5 ml-1">
                          選擇發生異常的商品
                        </label>
                        <select
                          value={reportForm.item}
                          onChange={(e) =>
                            setReportForm({
                              ...reportForm,
                              item: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-[#F2D1C4] rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-[#D16A54]/20 focus:border-[#D16A54] text-[#8A4637] font-bold shadow-sm"
                        >
                          <option value="" disabled>
                            請選擇異常商品...
                          </option>
                          {order.items.map((i) => (
                            <option key={i.name} value={i.name}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#D16A54] uppercase tracking-widest mb-1.5 ml-1">
                          選擇異常原因
                        </label>
                        <select
                          value={reportForm.reason}
                          onChange={(e) =>
                            setReportForm({
                              ...reportForm,
                              reason: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-[#F2D1C4] rounded-2xl px-4 py-3 outline-none focus:ring-4 focus:ring-[#D16A54]/20 focus:border-[#D16A54] text-[#8A4637] font-bold shadow-sm"
                        >
                          <option value="" disabled>
                            請選擇原因...
                          </option>
                          {abnormalReasons.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#D16A54] uppercase tracking-widest mb-1.5 ml-1">
                          佐證照片
                        </label>
                        <label className="flex flex-col items-center justify-center w-full py-5 border-2 border-dashed border-[#F2D1C4] rounded-2xl bg-white/50 text-[#D16A54] cursor-pointer hover:bg-white hover:border-[#D16A54] transition-all group shadow-sm">
                          <Camera
                            size={28}
                            className="mb-2 opacity-70 group-hover:opacity-100 transition-opacity"
                          />
                          <span className="font-bold text-sm">
                            點擊開啟相機拍攝 / 上傳照片
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handlePhotoUpload}
                          />
                        </label>
                        {reportForm.photoName && (
                          <div className="mt-2 text-sm font-bold text-[#809977] flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#A5BA9E] inline-flex">
                            <CheckCircle2 size={16} /> 已夾帶：
                            {reportForm.photoName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() => setReportingOrderId(null)}
                        className="w-1/3 py-3.5 rounded-2xl bg-white border border-[#F2D1C4] text-[#D16A54] font-black hover:bg-[#FFE2DA] transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleSubmitReport(order.id)}
                        disabled={!reportForm.item || !reportForm.reason}
                        className="w-2/3 py-3.5 rounded-2xl bg-[#D16A54] text-white font-black shadow-[0_4px_12px_rgba(209,106,84,0.3)] hover:bg-[#BA5945] disabled:bg-[#F2D1C4] disabled:shadow-none transition-all"
                      >
                        送出異常通報
                      </button>
                    </div>
                  </div>
                )}

                {currentStatus === 'verified' && (
                  <div className="bg-[#F4F7F3] px-6 sm:px-8 py-5 border-t-[3px] border-[#A5BA9E] flex items-center justify-center gap-2 text-[#6b8262]">
                    <CheckCircle2 size={24} strokeWidth={2.5} />
                    <span className="font-black text-lg">
                      本單已完成點收核對無誤
                    </span>
                  </div>
                )}

                {currentStatus === 'abnormal' && (
                  <div className="bg-[#FFF4F0] px-6 sm:px-8 py-5 border-t-[3px] border-[#F2D1C4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-[#D16A54]">
                      <AlertTriangle size={24} strokeWidth={2.5} />
                      <span className="font-black text-lg">
                        此單已通報異常，待總部處理
                      </span>
                    </div>
                    <button
                      onClick={() => onResolveAbnormal(order.id)}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border-2 border-[#809977]/30 text-[#809977] rounded-xl font-black hover:bg-[#809977] hover:text-white transition-all shadow-sm active:scale-95 w-full sm:w-auto"
                    >
                      <CheckCircle2 size={18} strokeWidth={2.5} /> 異常已排除
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==========================================
// 前臺：商品異常通報紀錄頁面
// ==========================================
function StoreAbnormalList({
  currentUser,
  abnormalRecords,
  vendors,
  onResolveAbnormal,
  onBack,
}) {
  const storeRecords = useMemo(() => {
    if (!currentUser) return [];
    return abnormalRecords
      .filter((r) => r.storeId === currentUser.id)
      .reverse();
  }, [abnormalRecords, currentUser]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={onBack}
        className="group flex items-center gap-2 text-[#968A7E] hover:text-[#665547] mb-6 font-bold transition-all py-2.5 -ml-2 px-4 rounded-2xl hover:bg-[#FDFCF9] hover:shadow-sm border border-transparent hover:border-white active:scale-95 text-sm"
      >
        <ChevronLeft
          size={20}
          strokeWidth={3}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span>返回前臺總覽</span>
      </button>

      <div className="bg-[#FDFCF9] rounded-[2.5rem] p-6 sm:p-8 shadow-[8px_8px_24px_rgba(212,204,195,0.6),-8px_-8px_24px_rgba(255,255,255,0.8)] border-[2px] border-white mb-8 border-t-[6px] border-t-[#D16A54]">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3.5 bg-[#FFF4F0] text-[#D16A54] rounded-2xl shadow-inner border border-white">
            <AlertTriangle size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#473D35] tracking-tight">
              異常通報紀錄
            </h2>
            <p className="text-sm text-[#968A7E] mt-1 font-bold">
              檢視您已提交的所有商品異常狀態
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {storeRecords.length === 0 ? (
          <div className="text-center py-16 text-[#B3A698] bg-[#FDFCF9] rounded-[2.5rem] border-2 border-dashed border-[#E8E2D9]">
            <CheckCircle2
              size={48}
              className="mx-auto mb-4 opacity-40"
              strokeWidth={1.5}
            />
            <p className="font-bold text-lg">
              目前沒有任何異常通報紀錄，太棒了！
            </p>
          </div>
        ) : (
          storeRecords.map((record) => {
            const vendorName =
              vendors.find((v) => v.id === record.vendorId)?.name || '未知廠商';
            return (
              <div
                key={record.id}
                className="bg-[#FDFCF9] rounded-[2rem] shadow-[6px_6px_20px_rgba(212,204,195,0.5),-6px_-6px_20px_rgba(255,255,255,0.9)] border-[2px] border-white p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-2.5 h-full bg-[#D16A54]"></div>

                <div className="flex-1 pl-4 sm:pl-2 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                    <span className="bg-[#FFF4F0] text-[#D16A54] border border-[#F2D1C4] text-xs px-3 py-1 rounded-lg font-black tracking-widest inline-block w-fit">
                      {record.date}
                    </span>
                    <span className="text-[#968A7E] font-bold text-sm bg-[#F3EFEA] px-3 py-1 rounded-lg inline-block w-fit">
                      單號: {record.orderId}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-[#473D35] mb-1">
                    {record.item}
                  </h3>
                  <p className="text-sm font-bold text-[#8C7A6B] mb-4">
                    {vendorName}
                  </p>

                  <div className="bg-[#FFF4F0]/60 p-4 rounded-2xl border border-[#F2D1C4]/50">
                    <div className="text-xs font-bold text-[#D16A54] uppercase tracking-widest mb-1">
                      通報原因
                    </div>
                    <div className="font-black text-[#8A4637]">
                      {record.reason}
                    </div>

                    {record.photoName && (
                      <div className="mt-3 text-xs font-bold text-[#968A7E] flex items-center gap-1.5 bg-white w-fit px-3 py-1.5 rounded-lg border border-[#E8E2D9]">
                        <Camera size={14} /> 附圖：{record.photoName}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => onResolveAbnormal(record.orderId)}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border-2 border-[#809977]/30 text-[#809977] rounded-xl font-black hover:bg-[#809977] hover:text-white transition-all shadow-sm active:scale-95 w-full sm:w-auto"
                    >
                      <CheckCircle2 size={18} strokeWidth={2.5} /> 標記為已修復
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==========================================
// 後臺：總部管理儀表板
// ==========================================
function AdminDashboard({
  users,
  vendors,
  orders,
  products,
  setProducts,
  abnormalReasons,
  setAbnormalReasons,
}) {
  const [adminView, setAdminView] = useState('overview');
  const [activeStore, setActiveStore] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);

  const [newProductName, setNewProductName] = useState('');
  const [newReason, setNewReason] = useState('');

  if (adminView === 'store_orders') {
    return (
      <AdminStoreOrders
        store={activeStore}
        vendors={vendors}
        orders={orders}
        onSelectOrder={(order) => {
          setActiveOrder(order);
          setAdminView('order_detail');
        }}
        onBack={() => {
          setActiveStore(null);
          setAdminView('overview');
        }}
      />
    );
  }

  if (adminView === 'order_detail') {
    return (
      <AdminOrderDetail
        order={activeOrder}
        vendor={vendors.find((v) => v.id === activeOrder?.vendorId)}
        onBack={() => {
          setActiveOrder(null);
          setAdminView('store_orders');
        }}
      />
    );
  }

  const stores = users.filter((u) => u.role === 'store');
  const totalSystemAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  const handleAddProduct = () => {
    if (newProductName.trim() && !products.includes(newProductName.trim())) {
      setProducts([...products, newProductName.trim()]);
      setNewProductName('');
    }
  };

  const handleAddReason = () => {
    if (newReason.trim() && !abnormalReasons.includes(newReason.trim())) {
      setAbnormalReasons([newReason.trim(), ...abnormalReasons]);
      setNewReason('');
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#473D35] mb-2 tracking-tight">
          是好鍋進貨總攬
        </h2>
        <p className="text-sm sm:text-base text-[#968A7E] font-bold">
          即時檢視所有門市與管理全域設定
        </p>
      </div>

      <div className="bg-[#FDFCF9] rounded-[2.5rem] p-6 sm:p-8 shadow-[8px_8px_24px_rgba(212,204,195,0.6),-8px_-8px_24px_rgba(255,255,255,0.8)] border-[2px] border-white mb-8 border-t-[6px] border-t-[#D16A54]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3.5 bg-[#FFF4F0] text-[#D16A54] rounded-2xl shadow-inner border border-white">
            <ClipboardList size={28} strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#473D35]">
              商品異常原因管理
            </h3>
            <p className="text-sm text-[#968A7E] font-bold mt-1">
              手動新增異常原因，選單將同步至所有前臺門市
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddReason()}
            placeholder="手動輸入原因，例如：包裝擠壓變形"
            className="flex-1 bg-[#F3EFEA]/50 border-2 border-white rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-[#D16A54]/20 focus:border-[#D16A54] transition-all text-[#473D35] font-bold shadow-inner"
          />
          <button
            onClick={handleAddReason}
            disabled={!newReason.trim()}
            className="bg-[#D16A54] text-white px-8 py-4 rounded-2xl hover:bg-[#BA5945] disabled:bg-[#D4CCC2] disabled:text-[#968A7E] disabled:cursor-not-allowed transition-colors font-bold shadow-[4px_4px_12px_rgba(209,106,84,0.3)] flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} strokeWidth={2.5} />
            新增原因
          </button>
        </div>

        <div className="bg-[#F3EFEA]/50 p-6 rounded-[2rem] border-2 border-[#E8E2D9] shadow-inner">
          <div className="text-xs font-bold text-[#B3A698] uppercase tracking-widest mb-4">
            目前可選異常原因清單 ({abnormalReasons.length})
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            {abnormalReasons.map((r, idx) => (
              <span
                key={idx}
                className="bg-[#FDFCF9] border border-[#E8E2D9] px-4 py-2.5 rounded-xl text-sm font-bold text-[#8A4637] shadow-sm flex items-center gap-2.5"
              >
                <div className="w-2 h-2 rounded-full bg-[#D16A54]"></div>
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#FDFCF9] rounded-[2.5rem] p-6 sm:p-8 shadow-[8px_8px_24px_rgba(212,204,195,0.6),-8px_-8px_24px_rgba(255,255,255,0.8)] border-[2px] border-white mb-8 border-t-[6px] border-t-[#C2956E]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3.5 bg-[#F3EFEA] text-[#C2956E] rounded-2xl shadow-inner border border-white">
            <Tag size={28} strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#473D35]">
              商品目錄管理
            </h3>
            <p className="text-sm text-[#968A7E] font-bold mt-1">
              建立公版商品，供前臺門市追蹤效期
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddProduct()}
            placeholder="輸入新商品名稱，例如：統一多多 300ml"
            className="flex-1 bg-[#F3EFEA]/50 border-2 border-white rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-[#C2956E]/20 focus:border-[#C2956E] transition-all text-[#473D35] font-bold shadow-inner"
          />
          <button
            onClick={handleAddProduct}
            disabled={!newProductName.trim()}
            className="bg-[#665547] text-white px-8 py-4 rounded-2xl hover:bg-[#524438] disabled:bg-[#D4CCC2] disabled:text-[#968A7E] disabled:cursor-not-allowed transition-colors font-bold shadow-[4px_4px_12px_rgba(102,85,71,0.3)] flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} strokeWidth={2.5} />
            新增至目錄
          </button>
        </div>

        <div className="bg-[#F3EFEA]/50 p-6 rounded-[2rem] border-2 border-[#E8E2D9] shadow-inner">
          <div className="text-xs font-bold text-[#B3A698] uppercase tracking-widest mb-4">
            目前公版商品清單 ({products.length})
          </div>
          <div className="flex flex-wrap gap-3">
            {products.map((p, idx) => (
              <span
                key={idx}
                className="bg-[#FDFCF9] border border-[#E8E2D9] px-4 py-2.5 rounded-xl text-sm font-bold text-[#665547] shadow-sm flex items-center gap-2.5"
              >
                <div className="w-2 h-2 rounded-full bg-[#C2956E]"></div>
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#FDFCF9] p-7 rounded-[2.5rem] shadow-[6px_6px_20px_rgba(212,204,195,0.5),-6px_-6px_20px_rgba(255,255,255,0.9)] border-[2px] border-white flex flex-col justify-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-5 relative z-10">
            <div className="p-4 bg-[#F3EFEA] text-[#8C7A6B] rounded-2xl shadow-inner border border-white">
              <Store size={28} className="sm:w-8 sm:h-8" strokeWidth={2} />
            </div>
            <div>
              <div className="text-[#968A7E] text-xs sm:text-sm font-bold uppercase tracking-widest mb-1">
                營運門市數
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#473D35] tracking-tight">
                {stores.length}{' '}
                <span className="text-base text-[#B3A698] font-bold">間</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#FDFCF9] p-7 rounded-[2.5rem] shadow-[6px_6px_20px_rgba(212,204,195,0.5),-6px_-6px_20px_rgba(255,255,255,0.9)] border-[2px] border-white flex flex-col justify-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="flex items-center gap-5 relative z-10">
            <div className="p-4 bg-[#F3EFEA] text-[#8C7A6B] rounded-2xl shadow-inner border border-white">
              <Briefcase size={28} className="sm:w-8 sm:h-8" strokeWidth={2} />
            </div>
            <div>
              <div className="text-[#968A7E] text-xs sm:text-sm font-bold uppercase tracking-widest mb-1">
                合作供應商
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#473D35] tracking-tight">
                {vendors.length}{' '}
                <span className="text-base text-[#B3A698] font-bold">家</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#5C4D40] to-[#3B3028] p-7 rounded-[2.5rem] shadow-[6px_6px_20px_rgba(92,77,64,0.4)] border-2 border-[#665547] flex flex-col justify-center relative overflow-hidden group sm:col-span-2 md:col-span-1">
          <div className="absolute -right-4 -top-4 bg-white/5 w-32 h-32 rounded-full blur-xl"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="p-4 bg-[#8C7A6B]/30 text-[#E3BE9D] rounded-2xl backdrop-blur-sm border border-white/10">
              <CreditCard size={28} className="sm:w-8 sm:h-8" strokeWidth={2} />
            </div>
            <div>
              <div className="text-[#B3A698] text-xs sm:text-sm font-bold uppercase tracking-widest mb-1">
                全系統進貨總額
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tighter">
                <span className="text-[#E3BE9D] mr-1">$</span>
                {totalSystemAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#FDFCF9] rounded-[2.5rem] shadow-[8px_8px_24px_rgba(212,204,195,0.6),-8px_-8px_24px_rgba(255,255,255,0.8)] border-[2px] border-white overflow-hidden">
        <div className="px-7 py-6 border-b-2 border-[#F3EFEA] bg-[#FDFCF9] flex items-center gap-4">
          <div className="p-2.5 bg-[#F3EFEA] rounded-xl shadow-inner border border-white">
            <Users className="text-[#8C7A6B]" size={20} strokeWidth={2.5} />
          </div>
          <h3 className="font-black text-[#473D35] text-lg sm:text-xl tracking-tight">
            各門市進貨概況 (點選查看單據)
          </h3>
        </div>
        <div className="divide-y-2 divide-[#F3EFEA]">
          {stores.map((store) => {
            const storeOrders = orders.filter((o) => o.storeId === store.id);
            const storeTotal = storeOrders.reduce(
              (sum, o) => sum + o.totalAmount,
              0
            );
            return (
              <div
                key={store.id}
                onClick={() => {
                  setActiveStore(store);
                  setAdminView('store_orders');
                }}
                className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:bg-[#F3EFEA]/60 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-5 border-b-2 sm:border-0 border-[#F3EFEA] pb-5 sm:pb-0 w-full sm:w-auto">
                  <div className="w-12 h-12 rounded-2xl bg-[#F3EFEA] flex items-center justify-center text-[#968A7E] font-black text-lg border border-white shadow-sm group-hover:bg-[#EAE2D8] transition-colors">
                    {store.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-[#473D35] text-xl group-hover:text-[#C2956E] transition-colors">
                      {store.name}
                    </h4>
                    <p className="text-xs font-bold text-[#B3A698] uppercase tracking-widest mt-1.5 bg-white inline-block px-2.5 py-1 rounded-lg border border-[#E8E2D9] shadow-sm">
                      登入碼: {store.password}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10 bg-[#F3EFEA]/50 sm:bg-transparent p-4 sm:p-0 rounded-2xl sm:rounded-none w-full sm:w-auto">
                  <div className="text-left sm:text-center">
                    <span className="block text-[10px] sm:text-xs font-bold text-[#968A7E] uppercase tracking-widest mb-1">
                      單據數量
                    </span>
                    <span className="font-black text-[#665547] text-lg">
                      {storeOrders.length}{' '}
                      <span className="text-sm text-[#B3A698] font-bold">
                        筆
                      </span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] sm:text-xs font-bold text-[#968A7E] uppercase tracking-widest mb-1">
                      累計金額
                    </span>
                    <span className="font-black text-[#473D35] text-2xl sm:text-3xl tracking-tighter">
                      <span className="text-base text-[#C2956E] mr-1">$</span>
                      {storeTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="hidden sm:flex text-[#B3A698] group-hover:text-[#C2956E] group-hover:translate-x-1 transition-all">
                    <ChevronRight size={24} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AdminStoreOrders({ store, vendors, orders, onSelectOrder, onBack }) {
  const storeOrders = useMemo(() => {
    if (!store) return [];
    return orders.filter((o) => o.storeId === store.id);
  }, [orders, store]);

  const storeTotal = storeOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="animate-in slide-in-from-right-8 fade-in duration-500">
      <button
        onClick={onBack}
        className="group flex items-center gap-2 text-[#968A7E] hover:text-[#665547] mb-6 font-bold transition-all py-2.5 -ml-2 px-4 rounded-2xl hover:bg-[#FDFCF9] hover:shadow-sm border border-transparent hover:border-white active:scale-95 text-sm"
      >
        <ChevronLeft
          size={20}
          strokeWidth={3}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span>返回是好鍋進貨總攬</span>
      </button>

      <div className="bg-[#FDFCF9] rounded-[2.5rem] p-6 sm:p-8 shadow-[8px_8px_24px_rgba(212,204,195,0.6),-8px_-8px_24px_rgba(255,255,255,0.8)] border-[2px] border-white mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-5 w-full sm:w-auto">
          <div className="p-4 bg-[#F3EFEA] text-[#C2956E] rounded-[1.5rem] border border-white shadow-inner">
            <Store size={32} className="sm:w-10 sm:h-10" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#473D35] tracking-tight">
              {store?.name}
            </h2>
            <p className="text-sm text-[#968A7E] mt-2 font-bold bg-[#F3EFEA] inline-block px-4 py-1.5 rounded-xl border border-white shadow-sm">
              共 {storeOrders.length} 筆進貨單據
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <div className="text-[#968A7E] text-xs sm:text-sm mb-1 font-bold tracking-widest uppercase">
            此門市累計進貨總額
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#473D35] tracking-tighter">
            <span className="text-xl font-bold text-[#C2956E] mr-1">$</span>
            {storeTotal.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {storeOrders.length === 0 ? (
          <div className="col-span-full text-center py-16 text-[#B3A698] bg-[#FDFCF9] rounded-[2.5rem] border-2 border-dashed border-[#E8E2D9]">
            <Receipt
              size={48}
              className="mx-auto mb-4 opacity-40"
              strokeWidth={1.5}
            />
            <p className="font-bold text-lg">該門市目前尚無進貨單據</p>
          </div>
        ) : (
          storeOrders.map((order) => {
            const vendor = vendors.find((v) => v.id === order.vendorId);
            return (
              <button
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className="group bg-[#FDFCF9] p-7 rounded-[2.5rem] shadow-[8px_8px_24px_rgba(212,204,195,0.6),-8px_-8px_24px_rgba(255,255,255,0.8)] border-[2px] border-white hover:shadow-[4px_4px_12px_rgba(212,204,195,0.4),-4px_-4px_12px_rgba(255,255,255,0.9)] active:shadow-[inset_4px_4px_8px_rgba(212,204,195,0.4),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] active:scale-[0.98] transition-all duration-300 text-left flex flex-col h-full overflow-hidden relative"
              >
                <div className="flex items-start justify-between mb-5 relative z-10">
                  <div className="p-3.5 bg-[#F3EFEA] rounded-2xl group-hover:bg-[#EAE2D8] transition-colors duration-300 shadow-inner text-[#B3A698] group-hover:text-[#C2956E]">
                    <Briefcase size={28} strokeWidth={2} />
                  </div>
                  <span className="bg-[#FFF4F0] border border-[#F2D1C4] text-[#D16A54] text-xs px-3.5 py-1.5 rounded-full font-black tracking-widest shadow-sm">
                    {order.date}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-[#473D35] mb-2 group-hover:text-[#C2956E] transition-colors">
                  {vendor?.name || '未知廠商'}
                </h3>
                <p className="text-xs sm:text-sm text-[#B3A698] mb-8 font-bold tracking-widest uppercase">
                  單號: {order.id}
                </p>

                <div className="pt-5 border-t-2 border-[#F3EFEA] flex justify-between items-end w-full mt-auto">
                  <span className="text-[#968A7E] text-xs sm:text-sm font-bold uppercase tracking-widest">
                    單據總金額
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#473D35] group-hover:text-[#C2956E] transition-colors">
                    <span className="text-sm font-bold text-[#C2956E] mr-0.5">
                      $
                    </span>
                    {order.totalAmount.toLocaleString()}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function AdminOrderDetail({ order, vendor, onBack }) {
  if (!order) return null;

  return (
    <div className="animate-in slide-in-from-right-8 fade-in duration-500">
      <button
        onClick={onBack}
        className="group flex items-center gap-2 text-[#968A7E] hover:text-[#665547] mb-6 font-bold transition-all py-2.5 -ml-2 px-4 rounded-2xl hover:bg-[#FDFCF9] hover:shadow-sm border border-transparent hover:border-white active:scale-95 text-sm"
      >
        <ChevronLeft
          size={20}
          strokeWidth={3}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span>返回門市單據列表</span>
      </button>

      <div className="bg-[#FDFCF9] rounded-[2.5rem] shadow-[6px_6px_20px_rgba(212,204,195,0.5),-6px_-6px_20px_rgba(255,255,255,0.9)] border-[2px] border-white overflow-hidden relative">
        <div className="bg-[#F3EFEA]/40 border-b-2 border-[#F3EFEA] px-6 sm:px-8 py-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-[1.25rem] shadow-sm border border-[#E8E2D9] text-[#C2956E]">
              <Receipt size={28} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-black text-[#473D35] text-xl mb-1">
                {vendor?.name || '未知廠商'}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#B3A698] uppercase tracking-widest">
                  單號
                </span>
                <span className="font-black text-[#665547] text-sm font-mono">
                  {order.id}
                </span>
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right flex items-center sm:block pl-[4.5rem] sm:pl-0">
            <span className="text-xs font-bold text-[#B3A698] uppercase tracking-widest mr-3 sm:mr-0 sm:block sm:mb-1">
              進貨日期
            </span>
            <span className="bg-[#FFF4F0] text-[#D16A54] border border-[#F2D1C4] text-sm px-3 py-1.5 rounded-xl font-black tracking-widest inline-block">
              {order.date}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 pb-4">
          <div className="hidden sm:flex mb-5 text-xs font-bold text-[#B3A698] uppercase tracking-widest border-b-2 border-[#F3EFEA] pb-3">
            <div className="flex-1 pl-2">商品名稱</div>
            <div className="w-24 text-right">單位價錢</div>
            <div className="w-24 text-right">進貨數量</div>
            <div className="w-32 text-right pr-2">小計</div>
          </div>
          <div className="space-y-4 sm:space-y-3">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center text-sm border-b-2 border-[#F3EFEA] sm:border-0 pb-4 sm:pb-0 last:border-0 last:pb-0 hover:bg-[#F3EFEA]/30 sm:p-2.5 rounded-2xl transition-colors"
              >
                <div className="flex-1 font-bold text-[#473D35] mb-2.5 sm:mb-0 text-base sm:text-sm pl-0 sm:pl-2">
                  {item.name}
                </div>
                <div className="flex justify-between sm:justify-end items-center w-full sm:w-auto bg-[#F3EFEA]/50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                  <div className="text-[#968A7E] sm:hidden text-xs font-bold uppercase tracking-widest">
                    單價 × 數量
                  </div>
                  <div className="flex items-center font-mono text-sm sm:text-base">
                    <div className="w-auto sm:w-24 text-right text-[#968A7E] font-bold">
                      ${item.price}
                    </div>
                    <div className="w-auto sm:w-24 text-right text-[#665547] px-3 sm:px-0 font-bold">
                      <span className="sm:hidden text-[#B3A698] mx-1">×</span>
                      {item.quantity}
                    </div>
                    <div className="w-auto sm:w-32 text-right font-black text-[#473D35] ml-2 sm:ml-0 pr-0 sm:pr-2">
                      <span className="sm:hidden text-[#B3A698] mr-2">=</span>$
                      {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#F3EFEA]/60 px-6 sm:px-8 py-6 border-t-2 border-[#E8E2D9] flex justify-end items-center gap-5">
          <span className="text-sm font-bold text-[#968A7E] uppercase tracking-widest">
            單據總金額
          </span>
          <span className="text-3xl sm:text-4xl font-black text-[#473D35] tracking-tighter">
            <span className="text-xl font-bold text-[#C2956E] mr-1">$</span>
            {order.totalAmount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
