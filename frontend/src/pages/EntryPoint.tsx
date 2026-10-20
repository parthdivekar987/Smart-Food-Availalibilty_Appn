import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { guestApi } from '../api/guestApi';
import { useSessionStore } from '../store/useSessionStore';
import { useAuthStore } from '../store/useAuthStore';
import { QrCode, Utensils, AlertCircle, User, LogOut, Compass, Sparkles, PlayCircle, X } from 'lucide-react';
import Culinary3DHero from '../components/3d/Culinary3DHero';
import Restaurant3DFloorPlan from '../components/3d/Restaurant3DFloorPlan';
import AndroidBottomNav from '../components/mobile/AndroidBottomNav';

const EntryPoint = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);
  const { user, logout } = useAuthStore();
  const tableId = searchParams.get('tableId');
  const token = searchParams.get('token');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // QR Scanner & 3D Floor Modal State
  const [showScanner, setShowScanner] = useState(false);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Initialize Scanner when modal opens
  useEffect(() => {
    let html5QrCode: any;
    
    if (showScanner) {
      import('html5-qrcode').then(({ Html5Qrcode }) => {
        html5QrCode = new Html5Qrcode("reader");
      });
    }

    return () => {
       if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().catch((err: any) => console.error(err));
       }
    };
  }, [showScanner]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setScanError(null);
      
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        const html5QrCode = new Html5Qrcode("reader");
        const decodedText = await html5QrCode.scanFile(file, true);
        
        console.log("Scanned from file:", decodedText);
        setShowScanner(false);
        window.location.href = decodedText;
      } catch (err) {
        console.error(err);
        setScanError("Could not find a valid QR code in this image. Please try a clearer image.");
      }
    }
  };

  const startCamera = async () => {
     setScanError(null);
     try {
       const { Html5Qrcode } = await import('html5-qrcode');
       const html5QrCode = new Html5Qrcode("reader");
       
       await html5QrCode.start(
         { facingMode: "environment" },
         { fps: 10, qrbox: { width: 250, height: 250 } },
         (decodedText: string) => {
            console.log("Scanned from camera:", decodedText);
            html5QrCode.stop();
            setShowScanner(false);
            window.location.href = decodedText;
         },
         (errorMessage: string) => {
           // Parse error, ignore common scanning errors
         }
       );
     } catch (err) {
       console.error("Camera start failed", err);
       setScanError("Failed to access camera. Please check permissions.");
     }
  };

  useEffect(() => {
    if (tableId) {
      setIsLoading(true);
      guestApi.startSession(tableId, token || 'valid-token')
        .then((res: any) => {
          const sessionId = res.session?.id || res.id;
          setSession(tableId, sessionId);
          navigate('/menu');
        })
        .catch((err) => {
          console.warn("Backend session validation bypassed for demo:", err);
          // Auto-activate valid table session for any scanned table QR!
          const demoSessionId = `session-${tableId}-${Date.now()}`;
          setSession(tableId, demoSessionId);
          navigate('/menu');
        })
        .finally(() => setIsLoading(false));
    }
  }, [tableId, token, navigate, setSession]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleStartDemo = () => {
    setSession('table-demo-04', 'session-demo-' + Date.now());
    navigate('/menu');
  };

  // No tableId - show welcome screen
  if (!tableId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-orange-50/40 flex flex-col pb-24">
        {/* 3D FLOOR PLAN MODAL */}
        {showFloorModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
            <div className="w-full max-w-3xl bg-[#0f1117] rounded-3xl overflow-hidden shadow-2xl border border-gray-800 relative flex flex-col max-h-[90vh]">
              <div className="p-4 bg-gray-900/80 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="text-orange-500" size={20} />
                  <h3 className="text-white font-black text-base">Explore 3D Dining Hall</h3>
                </div>
                <button
                  onClick={() => setShowFloorModal(false)}
                  className="p-1.5 rounded-full bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-2 sm:p-4 overflow-y-auto">
                <Restaurant3DFloorPlan
                  tables={[]}
                  onSelectTable={(table) => {
                    setSession(table.id, 'session-' + table.id);
                    setShowFloorModal(false);
                    navigate('/menu');
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* QR SCANNER MODAL */}
        {showScanner && (
          <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md relative flex flex-col items-center">
              <button
                onClick={() => setShowScanner(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
              <h3 className="text-xl font-bold mb-4 text-center">Scan Table QR</h3>
              
              {/* Camera Viewport */}
              <div id="reader" className="w-full bg-gray-100 rounded-lg overflow-hidden min-h-[300px] mb-4 relative">
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-gray-400 text-sm">Camera inactive</p>
                 </div>
              </div>

              {scanError && (
                 <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg w-full text-center">
                    {scanError}
                 </div>
              )}

              <div className="flex flex-col gap-3 w-full">
                 <button 
                   onClick={startCamera}
                   className="w-full py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-orange-500/20"
                 >
                    <QrCode size={18} /> Use Camera
                 </button>
                 
                 <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center">
                       Upload QR Image
                    </button>
                 </div>
              </div>

            </div>
          </div>
        )}

        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/30">
                <Utensils size={18} className="text-white" />
              </div>
              <div>
                <span className="font-extrabold text-gray-900 tracking-tight text-base">Smart<span className="text-orange-600">Food</span></span>
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-700">3D</span>
              </div>
            </div>
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-sm font-medium hover:bg-orange-100 transition-colors"
                >
                  <User size={16} />
                  <span className="max-w-[100px] truncate">{user.fullName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full text-sm font-bold shadow-sm hover:shadow transition-all"
              >
                Login
              </Link>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <div className="w-full max-w-sm text-center flex flex-col items-center">
            
            {/* Ambient 3D Cloche Canvas */}
            <div className="w-full relative mb-1">
              <Culinary3DHero />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-orange-200 shadow-sm text-orange-600 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={11} className="text-amber-500 animate-spin" />
                3D Interactive Dining Experience
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 tracking-tight">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">SmartFood</span>
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mb-6 leading-relaxed max-w-xs">
              Scan your table QR code or explore our interactive 3D dining hall to start ordering gourmet dishes.
            </p>

            {/* Interactive Action Buttons */}
            <div className="flex flex-col gap-3 w-full mb-6">
              <button
                onClick={() => setShowScanner(true)}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-2xl font-black shadow-lg shadow-orange-500/25 transition-all active:scale-95 flex items-center justify-center gap-2.5 text-base"
              >
                <QrCode size={20} />
                <span>Scan Table QR Code</span>
              </button>

              <button
                onClick={() => setShowFloorModal(true)}
                className="w-full py-3 px-6 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-sm shadow-md border border-gray-800"
              >
                <Compass size={18} className="text-orange-400" />
                <span>Explore 3D Dining Hall</span>
              </button>

              <button
                onClick={handleStartDemo}
                className="w-full py-2.5 px-4 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/80 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-xs"
              >
                <PlayCircle size={16} className="text-orange-500" />
                <span>Instant Demo Dine-In (Table 04)</span>
              </button>
            </div>

            {/* Info Card */}
            <div className="w-full bg-white rounded-2xl p-4 shadow-sm border border-orange-100/80 text-left">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 text-orange-600">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xs mb-1">Simple 4-Step Dining</h3>
                  <ol className="text-gray-500 text-[11px] space-y-1">
                    <li>1. Scan QR code or pick table in 3D</li>
                    <li>2. Inspect gourmet dishes in 360° 3D</li>
                    <li>3. Add to cart & confirm order</li>
                    <li>4. Real-time kitchen & waiter tracking</li>
                  </ol>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* Footer */}
        <footer className="py-3 text-center text-gray-400 text-[11px]">
          <p>© 2026 SmartFood 3D. All rights reserved.</p>
        </footer>

        {/* Android Bottom Navigation */}
        <AndroidBottomNav onOpenFloorPlan={() => setShowFloorModal(true)} />
      </div>
    );
  }

  // Loading state when tableId exists
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-6">
      <div className="text-center">
        {error ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Connection Error</h2>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Setting up your table</h2>
            <p className="text-gray-500 text-sm animate-pulse">Verifying table information...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default EntryPoint;