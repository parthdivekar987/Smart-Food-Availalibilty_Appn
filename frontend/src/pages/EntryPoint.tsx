import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { guestApi } from '../api/guestApi';
import { useSessionStore } from '../store/useSessionStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  QrCode, Utensils, AlertCircle, User, LogOut, Compass, Sparkles, PlayCircle,
  X, Flame, ChevronRight, Clock, ShieldCheck, CheckCircle2, ArrowRight,
  Smartphone, ChefHat, Eye, Camera, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LuxuryDining3DExperience from '../components/3d/LuxuryDining3DExperience';
import Restaurant3DFloorPlan from '../components/3d/Restaurant3DFloorPlan';
import AndroidBottomNav from '../components/mobile/AndroidBottomNav';

const EntryPoint: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);
  const { user, logout } = useAuthStore();
  const tableId = searchParams.get('tableId');
  const token = searchParams.get('token');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [showScanner, setShowScanner] = useState(false);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);

  // Android tactile haptic helper
  const triggerHaptic = (ms = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (e) {
        // Ignore if unsupported
      }
    }
  };

  // Scroll listener for Android floating quick action button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setScrolledPastHero(true);
      } else {
        setScrolledPastHero(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      triggerHaptic(20);
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
        setScanError("Could not find a valid table QR code in this image. Please try a clearer photo.");
      }
    }
  };

  const startCamera = async () => {
    triggerHaptic(20);
    setScanError(null);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode("reader");

      await html5QrCode.start(
        { facingMode: { ideal: "environment" } },
        {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxEdge = Math.floor(minEdge * 0.72);
            return { width: Math.max(200, qrboxEdge), height: Math.max(200, qrboxEdge) };
          },
        },
        (decodedText: string) => {
          triggerHaptic(35);
          console.log("Scanned from Android camera:", decodedText);
          html5QrCode.stop();
          setShowScanner(false);
          window.location.href = decodedText;
        },
        () => {
          // Ignore parsing noise
        }
      );
    } catch (err) {
      console.error("Camera start failed", err);
      setScanError("Unable to access Android camera. Please check camera permissions in Chrome settings.");
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
          const demoSessionId = `session-${tableId}-${Date.now()}`;
          setSession(tableId, demoSessionId);
          navigate('/menu');
        })
        .finally(() => setIsLoading(false));
    }
  }, [tableId, token, navigate, setSession]);

  const handleLogout = () => {
    triggerHaptic(15);
    logout();
    navigate('/');
  };

  const handleStartDemo = (tableNum = '04') => {
    triggerHaptic(25);
    setSession(`table-demo-${tableNum}`, `session-demo-${tableNum}-${Date.now()}`);
    navigate('/menu');
  };

  const handleOpenScanner = () => {
    triggerHaptic(20);
    setShowScanner(true);
  };

  const handleOpenFloor = () => {
    triggerHaptic(20);
    setShowFloorModal(true);
  };

  // If tableId is in URL, render loading state
  if (tableId) {
    return (
      <div className="min-h-screen bg-[#080a0f] text-white flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/20 via-transparent to-transparent pointer-events-none" />
        <div className="text-center relative z-10 max-w-sm w-full">
          {error ? (
            <div className="bg-[#12151f]/95 backdrop-blur-xl border border-red-500/30 p-6 sm:p-8 rounded-3xl shadow-2xl">
              <div className="w-14 h-14 mx-auto mb-4 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center">
                <AlertCircle size={28} />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mb-2">Connection Error</h2>
              <p className="text-red-400 text-xs sm:text-sm mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="bg-[#12151f]/95 backdrop-blur-xl border border-amber-500/30 p-6 sm:p-8 rounded-3xl shadow-2xl">
              <div className="w-14 h-14 mx-auto mb-4 relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
                <Utensils size={24} className="text-amber-400 animate-pulse" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mb-2">Setting Up Your Table</h2>
              <p className="text-gray-400 text-xs tracking-wide">Syncing table session & unlocking 3D dining menu...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a0f] text-gray-100 flex flex-col relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* LUXURY AMBIENT BACKGROUND GLOWS (NON-WHITE ATMOSPHERE) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[500px] bg-gradient-to-b from-amber-600/15 via-orange-600/10 to-transparent rounded-full blur-[120px]" />
        <div className="absolute top-[35%] -left-28 w-[400px] h-[400px] bg-rose-600/10 rounded-full blur-[110px]" />
        <div className="absolute top-[60%] -right-28 w-[450px] h-[450px] bg-sky-600/10 rounded-full blur-[120px]" />
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
            backgroundSize: '28px 28px'
          }}
        />
      </div>

      {/* ======================================================== */}
      {/* 1. TOP MOBILE & DESKTOP NAVIGATION BAR                   */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-[#090b10]/90 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group active:scale-95 transition-transform">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Utensils size={18} className="text-white sm:w-[22px] sm:h-[22px]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Smart<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Food</span>
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  3D
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-gray-400 font-medium tracking-wider uppercase hidden sm:block">
                Interactive Smart Dining
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#12151e]/80 border border-white/10 px-3 py-1.5 rounded-2xl shadow-inner">
            <button
              onClick={handleOpenFloor}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <Compass size={14} className="text-amber-400" />
              <span>3D Dining Hall</span>
            </button>
            <Link
              to="/menu"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <Flame size={14} className="text-orange-400" />
              <span>Digital Menu</span>
            </Link>
            <Link
              to="/tracking"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <Clock size={14} className="text-sky-400" />
              <span>Live Order Tracker</span>
            </Link>
          </nav>

          {/* Right Action: Table Status / User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Table Indicator Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] sm:text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tables Ready</span>
            </div>

            {user ? (
              <div className="flex items-center gap-1.5">
                <Link
                  to={user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? "/admin" : "/profile"}
                  className="flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-[#141822] border border-white/10 text-gray-200 text-xs font-bold hover:border-amber-500/50 transition-all active:scale-95"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-xs">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[80px] sm:max-w-[120px] truncate hidden xs:inline">{user.fullName || 'Account'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 sm:p-2.5 rounded-xl bg-[#141822] border border-white/10 text-gray-400 hover:text-red-400 transition-all"
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => triggerHaptic(10)}
                className="px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <User size={13} />
                <span>Sign In</span>
              </Link>
            )}
          </div>

        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. HERO SHOWCASE SECTION (OPTIMIZED FOR ANDROID & PC)    */}
      {/* ======================================================== */}
      <main className="flex-1 relative z-10 max-w-7xl mx-auto w-full px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-32">
        
        {/* On Mobile / Android: Stack logically (Title -> 3D Centerpiece -> Primary Scan Button -> Options) */}
        {/* On Desktop: Side-by-side (Col 1-6 Text & Actions, Col 7-12 3D Canvas) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-12 items-center">
          
          {/* Left Column / Mobile Top: Vision & Header */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 sm:space-y-6">
            
            {/* Pill Tag */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-transparent border border-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-black tracking-wide uppercase shadow-lg shadow-amber-500/5"
            >
              <Sparkles size={12} className="text-amber-400 animate-spin" style={{ animationDuration: '7s' }} />
              <span>3D Contactless Dining Ecosystem</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]"
            >
              Dine with <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 drop-shadow-sm">
                3D Gastronomy
              </span>
            </motion.h1>

            {/* Sub-headline description */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-xs sm:text-sm lg:text-base leading-relaxed max-w-xl"
            >
              Scan your table QR code, inspect artisanal dishes in 360° Three.js 3D, and track live kitchen cooking straight from your smartphone.
            </motion.p>

            {/* MOBILE ONLY: 3D CENTERPIECE RIGHT HERE IN THE THUMB VIEWPORT */}
            <div className="w-full lg:hidden my-1">
              <LuxuryDining3DExperience
                onExploreHall={handleOpenFloor}
                onInstantDemo={() => handleStartDemo('04')}
              />
            </div>

            {/* Action Buttons Hub (Large 52px Touch Targets for Android) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1"
            >
              {/* Button 1: Scan Table QR (Primary Android Thumb Target) */}
              <button
                onClick={handleOpenScanner}
                className="group relative w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-black text-sm sm:text-base text-black bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 shadow-[0_10px_30px_rgba(245,158,11,0.35)] hover:shadow-[0_14px_40px_rgba(245,158,11,0.45)] hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-3 min-h-[50px] touch-manipulation"
              >
                <div className="w-8 h-8 rounded-xl bg-black/15 flex items-center justify-center text-black">
                  <QrCode size={19} className="group-hover:rotate-6 transition-transform" />
                </div>
                <span>Scan Table QR Code</span>
                <ChevronRight size={17} className="text-black/70 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Button 2: Explore 3D Floor Plan */}
              <button
                onClick={handleOpenFloor}
                className="w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl font-bold text-xs sm:text-sm text-gray-200 bg-[#141722]/90 hover:bg-[#1c2130] border border-white/15 hover:border-amber-500/40 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[50px] touch-manipulation"
              >
                <Compass size={17} className="text-amber-400" />
                <span>3D Dining Hall</span>
              </button>
            </motion.div>

            {/* Instant Demo Dine-In (Table 04) Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="w-full pt-1"
            >
              <div className="p-3 sm:p-3.5 rounded-2xl bg-[#12151f]/85 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="font-semibold text-gray-200">Testing on mobile or no QR plaque nearby?</span>
                </div>
                <button
                  onClick={() => handleStartDemo('04')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center justify-center gap-2 active:scale-95 min-h-[42px] touch-manipulation"
                >
                  <PlayCircle size={14} className="text-amber-400" />
                  <span>Instant Demo (Table 04)</span>
                </button>
              </div>
            </motion.div>

            {/* Trust & Performance Pillars */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-2 sm:gap-3 w-full pt-3 sm:pt-4 border-t border-white/10 text-left"
            >
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center sm:text-left">
                <p className="text-base sm:text-lg font-black text-amber-400 leading-tight">360°</p>
                <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 mt-0.5">Photoreal 3D</p>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center sm:text-left">
                <p className="text-base sm:text-lg font-black text-white leading-tight">&lt; 1s</p>
                <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 mt-0.5">Kitchen Sync</p>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center sm:text-left">
                <p className="text-base sm:text-lg font-black text-amber-400 leading-tight">100%</p>
                <p className="text-[10px] sm:text-[11px] font-semibold text-gray-400 mt-0.5">Contactless</p>
              </div>
            </motion.div>

          </div>

          {/* DESKTOP ONLY: Three.js Interactive Masterpiece (Right Column) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col items-center justify-center relative">
            <LuxuryDining3DExperience
              onExploreHall={handleOpenFloor}
              onInstantDemo={() => handleStartDemo('04')}
            />
          </div>

        </div>

        {/* ======================================================== */}
        {/* 3. STEP-BY-STEP DINING EXPERIENCE FLOW (MOBILE FRIENDLY) */}
        {/* ======================================================== */}
        <section className="mt-14 sm:mt-20 pt-8 sm:pt-12 border-t border-white/10">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-amber-400">
              The Digital Guest Journey
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-white mt-1">
              Smart Dining in 4 Simple Steps
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-1.5">
              Works instantly on Android and iOS browsers. No app downloads required.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            
            {/* Step 1 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#12151f]/85 border border-white/10 backdrop-blur-md hover:border-amber-500/30 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-sm sm:text-base mb-3 group-hover:scale-105 transition-transform">
                  1
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">Scan Table QR</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Use your phone camera or our 3D dining hall to connect directly to your restaurant table.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/5 text-[10px] sm:text-[11px] font-bold text-amber-400">
                <span>Instant table pairing</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#12151f]/85 border border-white/10 backdrop-blur-md hover:border-amber-500/30 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-orange-500/15 text-orange-400 border border-orange-500/20 flex items-center justify-center font-black text-sm sm:text-base mb-3 group-hover:scale-105 transition-transform">
                  2
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">Inspect in 3D</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Rotate gourmet dishes in 360°, inspect authentic ingredients, portion sizes, and plating.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/5 text-[10px] sm:text-[11px] font-bold text-orange-400">
                <span>WebGL 3D engine</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#12151f]/85 border border-white/10 backdrop-blur-md hover:border-amber-500/30 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/20 flex items-center justify-center font-black text-sm sm:text-base mb-3 group-hover:scale-105 transition-transform">
                  3
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">Confirm Order</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Add chef customization notes, select extras, and transmit directly to the kitchen display.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/5 text-[10px] sm:text-[11px] font-bold text-rose-400">
                <span>Realtime Socket.IO</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#12151f]/85 border border-white/10 backdrop-blur-md hover:border-amber-500/30 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/20 flex items-center justify-center font-black text-sm sm:text-base mb-3 group-hover:scale-105 transition-transform">
                  4
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">Live Prep Tracker</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Watch live cooking status updates, estimated preparation countdowns, and waiter delivery.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/5 text-[10px] sm:text-[11px] font-bold text-sky-400">
                <span>Redis live updates</span>
              </div>
            </div>

          </div>
        </section>

        {/* ======================================================== */}
        {/* 4. FEATURED SIGNATURE DISHES QUICK LAUNCHPAD             */}
        {/* ======================================================== */}
        <section className="mt-14 sm:mt-20 pt-8 sm:pt-12 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-amber-400">
                Chef's Recommendations
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-white mt-0.5">
                Signature Culinary Creations
              </h2>
            </div>
            <Link
              to="/menu"
              onClick={() => triggerHaptic(10)}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-[#141722] hover:bg-[#1d2232] border border-white/15 text-xs font-bold text-gray-200 hover:text-white flex items-center gap-2 transition-all active:scale-95"
            >
              <span>Explore All Dishes</span>
              <ArrowRight size={13} className="text-amber-400" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Dish 1 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#12151f]/90 border border-white/10 hover:border-amber-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-full h-36 sm:h-44 rounded-2xl bg-gradient-to-tr from-amber-950/40 to-black/60 border border-white/5 flex items-center justify-center relative overflow-hidden mb-3.5">
                  <span className="text-5xl sm:text-6xl group-hover:scale-115 transition-transform duration-300">🍔</span>
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] sm:text-[10px] font-black text-amber-300 border border-amber-500/30">
                    3D Ready
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">Double Angus Wagyu Burger</h3>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  Prime flame-broiled angus, double melted cheddar, heirloom tomatoes on glazed brioche.
                </p>
              </div>
              <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm sm:text-base font-black text-amber-400">$18.50</span>
                <button
                  onClick={() => handleStartDemo('04')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-black font-extrabold text-xs transition-colors flex items-center gap-1.5 active:scale-95 touch-manipulation"
                >
                  <Eye size={12} />
                  <span>Inspect</span>
                </button>
              </div>
            </div>

            {/* Dish 2 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#12151f]/90 border border-white/10 hover:border-amber-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-full h-36 sm:h-44 rounded-2xl bg-gradient-to-tr from-rose-950/40 to-black/60 border border-white/5 flex items-center justify-center relative overflow-hidden mb-3.5">
                  <span className="text-5xl sm:text-6xl group-hover:scale-115 transition-transform duration-300">🍕</span>
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] sm:text-[10px] font-black text-rose-300 border border-rose-500/30">
                    Wood-Fired
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">Artisanal Truffle Pizza</h3>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  Slow-fermented sourdough crust, Buffalo mozzarella, charred pepperoni and fresh basil.
                </p>
              </div>
              <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm sm:text-base font-black text-amber-400">$21.00</span>
                <button
                  onClick={() => handleStartDemo('04')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-black font-extrabold text-xs transition-colors flex items-center gap-1.5 active:scale-95 touch-manipulation"
                >
                  <Eye size={12} />
                  <span>Inspect</span>
                </button>
              </div>
            </div>

            {/* Dish 3 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#12151f]/90 border border-white/10 hover:border-amber-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-full h-36 sm:h-44 rounded-2xl bg-gradient-to-tr from-sky-950/40 to-black/60 border border-white/5 flex items-center justify-center relative overflow-hidden mb-3.5">
                  <span className="text-5xl sm:text-6xl group-hover:scale-115 transition-transform duration-300">🥤</span>
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] sm:text-[10px] font-black text-sky-300 border border-sky-500/30">
                    Sub-Zero
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">Chilled Signature Soda</h3>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  Served in frosted crystal glass over pure ice spheres with organic lemon wheel.
                </p>
              </div>
              <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm sm:text-base font-black text-amber-400">$5.50</span>
                <button
                  onClick={() => handleStartDemo('04')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-black font-extrabold text-xs transition-colors flex items-center gap-1.5 active:scale-95 touch-manipulation"
                >
                  <Eye size={12} />
                  <span>Inspect</span>
                </button>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* ======================================================== */}
      {/* 5. FLOATING ANDROID QUICK-SCAN THUMB BUTTON              */}
      {/* ======================================================== */}
      <AnimatePresence>
        {scrolledPastHero && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 right-4 z-40 sm:hidden"
          >
            <button
              onClick={handleOpenScanner}
              className="px-4 py-3 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black font-black text-xs shadow-[0_8px_25px_rgba(245,158,11,0.5)] active:scale-90 transition-all flex items-center gap-2 border border-black/20"
            >
              <Camera size={16} />
              <span>Scan QR</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 6. LUXURY DARK FOOTER                                    */}
      {/* ======================================================== */}
      <footer className="relative z-10 bg-[#06080c] border-t border-white/10 py-8 pb-24 sm:pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white">
              <Utensils size={14} />
            </div>
            <span className="text-xs sm:text-sm font-black text-white">
              Smart<span className="text-amber-400">Food</span> 3D
            </span>
          </div>

          <p className="text-[11px] text-gray-500">
            © 2026 SmartFood 3D Systems • Optimized for Android & Mobile Browsers
          </p>

          <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-400">
            <a href="#" className="hover:text-amber-400 transition-colors">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-amber-400 transition-colors">Terms</a>
          </div>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* 7. MODALS: 3D FLOOR PLAN & QR SCANNER                    */}
      {/* ======================================================== */}

      {/* 3D FLOOR PLAN MODAL */}
      <AnimatePresence>
        {showFloorModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-6xl bg-[#0f1117] rounded-3xl overflow-hidden shadow-2xl border border-gray-800 relative flex flex-col max-h-[92vh]"
            >
              <div className="p-3.5 sm:p-4 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Compass size={18} />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-sm sm:text-base leading-none">Interactive 3D Dining Hall</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Click any table to simulate sitting down & start ordering</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFloorModal(false)}
                  className="p-2 rounded-full bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors active:scale-90"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-2 sm:p-4 overflow-y-auto">
                <Restaurant3DFloorPlan
                  tables={[]}
                  onSelectTable={(table) => {
                    triggerHaptic(25);
                    setSession(table.id, 'session-' + table.id);
                    setShowFloorModal(false);
                    navigate('/menu');
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR SCANNER MODAL (OPTIMIZED FOR ANDROID CAMERA) */}
      <AnimatePresence>
        {showScanner && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3.5 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              className="bg-[#12151f] border border-white/10 rounded-3xl p-5 sm:p-6 w-full max-w-md relative flex flex-col items-center shadow-2xl text-white"
            >
              <button
                onClick={() => setShowScanner(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors active:scale-90"
              >
                <X size={18} />
              </button>

              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5">
                <QrCode size={22} />
              </div>
              
              <h3 className="text-lg sm:text-xl font-black text-white mb-1 text-center">Scan Table QR</h3>
              <p className="text-gray-400 text-xs mb-4 text-center max-w-xs">
                Aim your phone camera at the QR code plaque on your dining table
              </p>

              {/* Camera Viewport */}
              <div id="reader" className="w-full bg-black/60 rounded-2xl overflow-hidden min-h-[260px] sm:min-h-[280px] mb-3.5 relative border border-white/10">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-gray-500 text-xs">Tap Activate Camera below</p>
                </div>
              </div>

              {scanError && (
                <div className="mb-3.5 p-2.5 bg-red-500/15 border border-red-500/30 text-red-400 text-xs rounded-xl w-full text-center">
                  {scanError}
                </div>
              )}

              <div className="flex flex-col gap-2.5 w-full">
                <button
                  onClick={startCamera}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black rounded-xl font-black shadow-lg shadow-orange-500/20 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm min-h-[48px] touch-manipulation"
                >
                  <Camera size={18} />
                  <span>Activate Android Camera</span>
                </button>

                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button className="w-full py-3 border border-white/15 bg-white/5 text-gray-200 rounded-xl font-bold hover:bg-white/10 transition-colors text-center text-xs min-h-[44px]">
                    Upload QR Image from Gallery
                  </button>
                </div>

                <div className="pt-1.5 text-center">
                  <button
                    onClick={() => {
                      triggerHaptic(20);
                      setShowScanner(false);
                      handleStartDemo('04');
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4 active:scale-95 py-1"
                  >
                    Or skip and simulate sitting at Table 04
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Android Bottom Navigation */}
      <AndroidBottomNav onOpenFloorPlan={handleOpenFloor} />
    </div>
  );
};

export default EntryPoint;
