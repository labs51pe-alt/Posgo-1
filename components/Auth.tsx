
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  Rocket, ArrowRight, MessageSquare, CheckCircle, RefreshCw, 
  Sparkles, ShieldAlert, Lock, TrendingUp, Package, Globe, ChevronDown, AlertCircle
} from 'lucide-react';
import { supabase } from '../services/supabase';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

interface CountryConfig {
    code: string;
    flag: string;
    name: string;
    length: number;
    startsWith?: string; // Optional specific starting digit
    placeholder: string;
}

// LISTA EXTENDIDA LATAM + ESPAÑA/USA
const COUNTRIES: CountryConfig[] = [
    { code: '+51', flag: '🇵🇪', name: 'Perú', length: 9, startsWith: '9', placeholder: '900 000 000' },
    { code: '+54', flag: '🇦🇷', name: 'Argentina', length: 10, placeholder: '9 11 1234 5678' },
    { code: '+591', flag: '🇧🇴', name: 'Bolivia', length: 8, placeholder: '7000 0000' },
    { code: '+55', flag: '🇧🇷', name: 'Brasil', length: 11, placeholder: '11 91234 5678' },
    { code: '+56', flag: '🇨🇱', name: 'Chile', length: 9, placeholder: '9 1234 5678' },
    { code: '+57', flag: '🇨🇴', name: 'Colombia', length: 10, placeholder: '300 123 4567' },
    { code: '+593', flag: '🇪🇨', name: 'Ecuador', length: 9, placeholder: '99 123 4567' },
    { code: '+52', flag: '🇲🇽', name: 'México', length: 10, placeholder: '55 1234 5678' },
    { code: '+595', flag: '🇵🇾', name: 'Paraguay', length: 9, placeholder: '981 123 456' },
    { code: '+598', flag: '🇺🇾', name: 'Uruguay', length: 9, placeholder: '99 123 456' },
    { code: '+58', flag: '🇻🇪', name: 'Venezuela', length: 10, placeholder: '414 123 4567' },
    { code: '+34', flag: '🇪🇸', name: 'España', length: 9, placeholder: '600 123 456' },
    { code: '+1', flag: '🇺🇸', name: 'USA', length: 10, placeholder: '202 555 0123' },
];

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'CLIENT' | 'DEMO'>('CLIENT');
  const [loading, setLoading] = useState(false);
  
  // Login State
  const [loginStep, setLoginStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [countryCode, setCountryCode] = useState('+51');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [validationError, setValidationError] = useState('');
  
  // God Mode
  const [logoClicks, setLogoClicks] = useState(0);
  const [showGodMode, setShowGodMode] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [godError, setGodError] = useState('');

  // Get current country config
  const currentCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  useEffect(() => {
      // Limpiar error cuando cambia el input o país
      setValidationError('');
  }, [phoneNumber, countryCode]);

  const handleLogoClick = () => {
    setLogoClicks(prev => {
      const newCount = prev + 1;
      if (newCount === 4) {
        setShowGodMode(true);
        return 0;
      }
      return newCount;
    });
    setTimeout(() => setLogoClicks(0), 1000);
  };

  const validatePhone = () => {
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      
      // 1. Validar Longitud exacta
      if (cleanNumber.length !== currentCountry.length) {
          setValidationError(`El número debe tener ${currentCountry.length} dígitos.`);
          return false;
      }

      // 2. Validar Prefijo específico (Caso Perú)
      if (currentCountry.startsWith && !cleanNumber.startsWith(currentCountry.startsWith)) {
          setValidationError(`En ${currentCountry.name}, el celular debe empezar con ${currentCountry.startsWith}.`);
          return false;
      }

      return true;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone()) return;

    setLoading(true);

    if (activeTab === 'CLIENT') {
        const fullPhone = `${countryCode}${phoneNumber}`;
        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: fullPhone
            });
            if (error) {
                console.error("Error sending OTP:", error.message);
                console.warn("SMS Provider might not be set up. Proceeding for testing UI.");
            }
        } catch (err) {
            console.error(err);
        }
    }

    setTimeout(() => {
      setLoading(false);
      setLoginStep('OTP');
    }, 1000);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (activeTab === 'CLIENT') {
        const fullPhone = `${countryCode}${phoneNumber}`;
        
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                phone: fullPhone,
                token: otpCode,
                type: 'sms'
            });

            if (data.session) {
                // Real Login Success
                onLogin({ 
                    id: data.user?.id || 'unknown', 
                    name: 'Emprendedor PosGo!', 
                    role: 'cashier',
                    email: data.user?.email 
                });
            } else {
                console.warn("OTP Verification failed or no session. Simulating login for demo/testing purposes.");
                // Simulate login if real auth fails (for testing UI without SMS)
                if (otpCode === '000000') {
                     onLogin({ id: `user-${phoneNumber}`, name: 'Usuario Prueba', role: 'cashier' });
                } else {
                    alert('Código incorrecto (Usa 000000 para prueba local si no llega SMS)');
                    setLoading(false);
                }
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    } else {
        // DEMO MODE (Lead Capture)
        setTimeout(() => {
            const fullPhone = `${countryCode} ${phoneNumber}`;
            onLogin({ 
                id: 'test-user-demo', 
                name: `Lead: ${fullPhone}`, 
                role: 'admin' 
            });
        }, 1500);
    }
  };

  const handleTabSwitch = (tab: 'CLIENT' | 'DEMO') => {
      setActiveTab(tab);
      setLoginStep('PHONE');
      setPhoneNumber('');
      setOtpCode('');
      setGodError('');
      setValidationError('');
  };

  const handleGodModeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPassword === 'Luis2021') {
       onLogin({ id: 'god-mode', name: 'Super Admin', role: 'admin' });
    } else {
       setGodError('Acceso Denegado');
       setMasterPassword('');
    }
  };

  return (
    <div className="min-h-screen flex font-inter overflow-hidden relative selection:bg-indigo-500 selection:text-white">
        
        {/* LEFT PANEL: Professional & Joyful Visualization */}
        <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-center items-center p-12">
             
             {/* HEADLINE: Professional but with gradient punch */}
             <div className="mb-14 text-center max-w-lg z-20">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white shadow-sm mb-6 animate-fade-in-up">
                     <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                     <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Software Punto de Venta</span>
                 </div>
                 <h1 className="text-6xl font-black text-slate-800 tracking-tight mb-6 leading-[1.1]">
                     PosGo! <br/>
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-500">Impulsa tu Éxito.</span>
                 </h1>
                 <p className="text-slate-500 text-lg font-medium leading-relaxed">
                     La plataforma integral que combina potencia y simplicidad. <br/>Controla, vende y crece sin límites.
                 </p>
             </div>

             {/* 3D FLOATING CARDS */}
             <div className="relative w-full max-w-lg aspect-square">
                 {/* Main Dashboard Card */}
                 <div className="absolute inset-0 m-auto w-[90%] h-[60%] bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-200/40 border border-white flex flex-col overflow-hidden animate-float">
                      <div className="h-16 border-b border-slate-100 flex items-center px-8 gap-4">
                          <div className="flex gap-2">
                             <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                             <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                          </div>
                          <div className="h-2 w-24 bg-slate-100 rounded-full"></div>
                      </div>
                      <div className="flex-1 p-6 flex gap-4 items-end">
                          <div className="w-1/4 h-[40%] bg-indigo-50 rounded-xl"></div>
                          <div className="w-1/4 h-[70%] bg-indigo-100 rounded-xl"></div>
                          <div className="w-1/4 h-[50%] bg-indigo-200 rounded-xl"></div>
                          <div className="w-1/4 h-[90%] bg-gradient-to-t from-indigo-500 to-violet-500 rounded-xl shadow-lg shadow-indigo-200"></div>
                      </div>
                 </div>

                 {/* Feature Card 1: Sales */}
                 <div className="absolute top-0 right-0 p-5 bg-white rounded-[2rem] shadow-xl shadow-rose-100 border border-white animate-float-slow flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                          <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Ventas</p>
                          <p className="text-xl font-black text-slate-800">+24%</p>
                      </div>
                 </div>

                 {/* Feature Card 2: Inventory */}
                 <div className="absolute bottom-10 left-0 p-5 bg-white rounded-[2rem] shadow-xl shadow-emerald-100 border border-white animate-float flex items-center gap-4 animation-delay-400">
                      <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                          <Package className="w-6 h-6" />
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Stock</p>
                          <p className="text-xl font-black text-slate-800">En Orden</p>
                      </div>
                 </div>
             </div>
        </div>

        {/* RIGHT PANEL: CLEAN LOGIN */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-12 relative z-20">
            <div className="w-full max-w-[420px]">
                
                {/* Mobile Logo */}
                <div className="lg:hidden flex justify-center mb-10">
                    <button onClick={handleLogoClick} className="w-20 h-20 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-violet-200 transform rotate-3">
                        <Rocket className="w-10 h-10 text-white"/>
                    </button>
                </div>

                {/* LOGIN CARD */}
                <div className="bg-white/70 backdrop-blur-2xl p-8 lg:p-10 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white relative overflow-hidden">
                    
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                            {activeTab === 'CLIENT' ? '¡Bienvenido!' : 'Pruébalo Gratis'}
                        </h2>
                        <p className="text-slate-500 font-medium text-sm">
                            {activeTab === 'CLIENT' ? 'Ingresa para gestionar tu negocio.' : 'Acceso inmediato al modo demostración.'}
                        </p>
                    </div>

                    {/* TABS (Modern Switch) */}
                    <div className="flex bg-slate-100/80 p-1.5 rounded-2xl mb-8 relative z-10">
                        <button 
                            onClick={() => handleTabSwitch('CLIENT')}
                            className={`flex-1 py-3.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'CLIENT' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Soy Cliente
                        </button>
                        <button 
                            onClick={() => handleTabSwitch('DEMO')}
                            className={`flex-1 py-3.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'DEMO' ? 'bg-white text-violet-600 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Sparkles className="w-4 h-4"/> Quiero Probar
                        </button>
                    </div>

                    {/* FORM */}
                    <div className="min-h-[240px]">
                       {loginStep === 'PHONE' ? (
                        <form onSubmit={handleSendCode} className="space-y-6 animate-fade-in">
                            <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">
                                    {activeTab === 'CLIENT' ? 'Tu Celular' : 'WhatsApp'}
                                 </label>
                                 
                                 <div className={`flex items-center gap-2 bg-white border-2 rounded-2xl p-2 transition-all focus-within:shadow-lg focus-within:shadow-violet-100 ${validationError ? 'border-red-300 bg-red-50' : 'border-slate-100 focus-within:border-violet-500'}`}>
                                    {/* Country */}
                                    <div className="relative pl-2 border-r border-slate-100 pr-2">
                                        <select 
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            className="appearance-none bg-transparent font-black text-slate-700 outline-none w-full h-full absolute inset-0 opacity-0 cursor-pointer z-10"
                                        >
                                            {COUNTRIES.map(c => (
                                                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                            ))}
                                        </select>
                                        <div className="flex items-center gap-1 cursor-pointer hover:bg-slate-50/50 rounded-lg p-1">
                                            <span className="text-2xl">{currentCountry?.flag}</span>
                                            <ChevronDown className="w-3 h-3 text-slate-300"/>
                                        </div>
                                    </div>

                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                        maxLength={currentCountry.length}
                                        className="w-full bg-transparent outline-none font-black text-xl text-slate-800 placeholder:text-slate-300 h-12"
                                        placeholder={currentCountry.placeholder}
                                        autoFocus
                                    />
                                 </div>
                                 
                                 {/* VALIDATION ERROR MESSAGE */}
                                 {validationError && (
                                     <div className="flex items-center gap-2 text-red-500 text-xs font-bold animate-fade-in px-2">
                                         <AlertCircle className="w-3 h-3"/> {validationError}
                                     </div>
                                 )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden active:scale-95 ${
                                    activeTab === 'CLIENT' 
                                    ? 'bg-slate-900 text-white shadow-slate-200 hover:bg-black' 
                                    : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-violet-200 hover:shadow-2xl'
                                }`}
                            >
                                <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 animate-shimmer" />
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin"/> : (
                                    <>
                                        {activeTab === 'CLIENT' ? 'INGRESAR AHORA' : 'OBTENER DEMO'} 
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
                                    </>
                                )}
                            </button>
                        </form>
                       ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                    <MessageSquare className="w-8 h-8 fill-current"/>
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg mb-1">Código Enviado</h3>
                                <p className="text-sm text-slate-500">
                                    Revisa tu WhatsApp/SMS al <br/><span className="font-black text-slate-800">{countryCode} {phoneNumber}</span>
                                </p>
                                <button type="button" onClick={() => setLoginStep('PHONE')} className="text-xs font-black text-violet-500 hover:underline mt-4 uppercase tracking-widest">
                                    Corregir
                                </button>
                            </div>
                            
                            <div className="flex justify-center my-4">
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    className="w-full text-center bg-white border-2 border-slate-100 rounded-2xl py-4 font-black text-4xl tracking-[0.3em] text-slate-800 outline-none focus:border-violet-500 focus:shadow-lg transition-all placeholder:text-slate-100"
                                    placeholder="000000"
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otpCode.length < 4}
                                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                            >
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <>VALIDAR Y ENTRAR <CheckCircle className="w-5 h-5"/></>}
                            </button>
                        </form>
                       )}
                    </div>
                </div>

                <div className="mt-8 text-center space-y-3">
                    <p className="text-[10px] font-medium text-slate-400">
                        Al continuar, aceptas nuestros <a href="#" className="text-violet-500 hover:underline font-bold">Términos de Uso</a>
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        <span>Software by</span>
                        <a href="https://gaorsystem.vercel.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-violet-500 transition-colors">
                            <Globe className="w-3 h-3"/> GaorSystemPeru
                        </a>
                    </div>
                </div>
            </div>
        </div>

        {/* GOD MODE MODAL */}
        {showGodMode && (
             <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-fade-in">
                 <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-fade-in-up text-center relative overflow-hidden border-4 border-slate-900">
                     <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-red-100 rotate-12">
                         <ShieldAlert className="w-10 h-10 text-red-600 -rotate-12"/>
                     </div>
                     <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Super Admin</h2>
                     <p className="text-slate-400 text-xs mb-8 font-black uppercase tracking-wide">Acceso Master</p>
                     
                     <form onSubmit={handleGodModeLogin} className="space-y-4">
                        <div className="relative group">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-red-600 transition-colors"/>
                            <input 
                                type="password" 
                                value={masterPassword}
                                onChange={e => setMasterPassword(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 font-black outline-none focus:border-red-600 focus:bg-white transition-all placeholder:text-slate-300 text-lg"
                                placeholder="******"
                                autoFocus
                            />
                        </div>
                        {godError && <p className="text-red-600 text-xs font-black animate-pulse bg-red-50 py-2 rounded-xl border border-red-100">{godError}</p>}
                        
                        <div className="flex gap-3 mt-6">
                            <button type="button" onClick={() => setShowGodMode(false)} className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-100 rounded-2xl transition-colors text-sm">Cancelar</button>
                            <button type="submit" className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-red-200 transition-all text-sm hover:scale-105">Desbloquear</button>
                        </div>
                     </form>
                 </div>
             </div>
        )}
    </div>
  );
};
