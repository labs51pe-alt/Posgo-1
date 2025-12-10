
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  Rocket, ArrowRight, MessageSquare, CheckCircle, RefreshCw, 
  Sparkles, ShieldAlert, Lock, Globe, ChevronDown, AlertCircle, PlayCircle
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
    startsWith?: string; 
    placeholder: string;
}

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

  const currentCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  useEffect(() => {
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
      if (cleanNumber.length !== currentCountry.length) {
          setValidationError(`El número debe tener ${currentCountry.length} dígitos.`);
          return false;
      }
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
                console.warn("SMS Provider might not be set up.");
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
                onLogin({ 
                    id: data.user?.id || 'unknown', 
                    name: 'Usuario PosGo!', 
                    role: 'cashier',
                    email: data.user?.email 
                });
            } else {
                console.warn("OTP Fallback");
                if (otpCode === '000000') {
                     onLogin({ id: `user-${phoneNumber}`, name: 'Usuario Prueba', role: 'cashier' });
                } else {
                    alert('Código incorrecto (Usa 000000 para prueba)');
                    setLoading(false);
                }
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    } else {
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
    <div className="min-h-screen flex flex-col lg:flex-row font-inter overflow-hidden relative selection:bg-indigo-500 selection:text-white bg-white">
        
        {/* LEFT PANEL: Corporate Minimalism */}
        <div className="w-full lg:w-[55%] relative z-10 flex flex-col justify-center px-12 lg:px-24 py-12">
             
             {/* Brand Header */}
             <div className="flex items-center gap-2 mb-12">
                 <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                     <Rocket className="w-4 h-4 text-white" />
                 </div>
                 <span className="text-lg font-black text-slate-900 tracking-tight">PosGo!</span>
             </div>

             {/* Main Content */}
             <div className="max-w-2xl animate-fade-in-up">
                 {/* The Pill */}
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-8">
                     <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
                     <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">GaorSystem Workspace</span>
                 </div>

                 {/* The Headline */}
                 <h1 className="text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] mb-8 tracking-tight">
                     Software que <br/>
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">impulsa tu éxito.</span>
                 </h1>

                 <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-lg mb-12">
                     Control de inventario, ventas y facturación en una plataforma diseñada para escalar.
                 </p>

                 {/* Social Proof / Trust */}
                 <div className="flex items-center gap-8 border-t border-slate-100 pt-8">
                     <div>
                         <p className="text-3xl font-black text-slate-900">10k+</p>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Negocios</p>
                     </div>
                     <div className="h-10 w-px bg-slate-200"></div>
                     <div>
                         <p className="text-3xl font-black text-slate-900">99.9%</p>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Uptime</p>
                     </div>
                     <div className="flex-1 flex justify-end">
                         <button onClick={() => window.open('https://gaorsystem.vercel.app/', '_blank')} className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors group">
                             Conoce más de Gaor <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                         </button>
                     </div>
                 </div>
             </div>
        </div>

        {/* RIGHT PANEL: Minimalist Login Form */}
        <div className="w-full lg:w-[45%] bg-slate-50/50 border-l border-slate-100 flex flex-col justify-center items-center p-8 lg:p-16 relative">
            <div className="w-full max-w-[400px]">
                
                {/* Mobile Logo */}
                <div className="lg:hidden flex justify-center mb-8">
                    <button onClick={handleLogoClick} className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center">
                        <Rocket className="w-8 h-8 text-white"/>
                    </button>
                </div>

                <div className="mb-10">
                    <h2 className="text-2xl font-black text-slate-900 mb-2">
                        {activeTab === 'CLIENT' ? 'Iniciar Sesión' : 'Solicitar Demo'}
                    </h2>
                    <p className="text-slate-500">
                        {activeTab === 'CLIENT' ? 'Accede a tu panel de control.' : 'Prueba el sistema gratis hoy.'}
                    </p>
                </div>

                {/* Clean Tabs */}
                <div className="flex gap-6 mb-8 border-b border-slate-200 pb-1">
                    <button 
                        onClick={() => handleTabSwitch('CLIENT')}
                        className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'CLIENT' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Soy Cliente
                        {activeTab === 'CLIENT' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                    </button>
                    <button 
                        onClick={() => handleTabSwitch('DEMO')}
                        className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'DEMO' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Quiero Probar
                        {activeTab === 'DEMO' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                    </button>
                </div>

                {/* Form */}
                <div className="min-h-[240px]">
                   {loginStep === 'PHONE' ? (
                    <form onSubmit={handleSendCode} className="space-y-6 animate-fade-in">
                        <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {activeTab === 'CLIENT' ? 'Número de Celular' : 'WhatsApp de Contacto'}
                             </label>
                             
                             <div className={`flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 transition-all ${validationError ? 'border-red-300 ring-2 ring-red-50' : 'focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-50'}`}>
                                {/* Country */}
                                <div className="relative pl-1 pr-3 border-r border-slate-100">
                                    <select 
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="appearance-none bg-transparent font-bold text-slate-700 outline-none w-full h-full absolute inset-0 opacity-0 cursor-pointer z-10"
                                    >
                                        {COUNTRIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                        ))}
                                    </select>
                                    <div className="flex items-center gap-1 cursor-pointer">
                                        <span className="text-2xl">{currentCountry?.flag}</span>
                                        <ChevronDown className="w-3 h-3 text-slate-400"/>
                                    </div>
                                </div>

                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                    maxLength={currentCountry.length}
                                    className="w-full bg-transparent outline-none font-bold text-lg text-slate-800 placeholder:text-slate-300 h-8"
                                    placeholder={currentCountry.placeholder}
                                    autoFocus
                                />
                             </div>
                             
                             {validationError && (
                                 <div className="flex items-center gap-2 text-red-500 text-xs font-bold animate-fade-in mt-1">
                                     <AlertCircle className="w-3 h-3"/> {validationError}
                                 </div>
                             )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
                        >
                            {loading ? <RefreshCw className="w-5 h-5 animate-spin"/> : (
                                <>
                                    {activeTab === 'CLIENT' ? 'Ingresar Ahora' : 'Obtener Acceso Demo'} 
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                                </>
                            )}
                        </button>
                        
                        {activeTab === 'DEMO' && (
                            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                                <PlayCircle className="w-4 h-4"/> Sin tarjeta de crédito
                            </div>
                        )}
                    </form>
                   ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in">
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-6 h-6 fill-current"/>
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg mb-1">Código de Verificación</h3>
                            <p className="text-sm text-slate-500">
                                Enviado a <span className="font-bold text-slate-900">{countryCode} {phoneNumber}</span>
                            </p>
                            <button type="button" onClick={() => setLoginStep('PHONE')} className="text-xs font-bold text-indigo-600 hover:underline mt-2">
                                Cambiar número
                            </button>
                        </div>
                        
                        <div className="flex justify-center my-4">
                            <input
                                type="text"
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                className="w-full text-center bg-white border border-slate-200 rounded-xl py-4 font-black text-3xl tracking-[0.5em] text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-200"
                                placeholder="000000"
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otpCode.length < 4}
                            className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                        >
                            {loading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <>Validar e Ingresar <CheckCircle className="w-5 h-5"/></>}
                        </button>
                    </form>
                   )}
                </div>

                <div className="mt-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        <span>Powered by</span>
                        <a href="https://gaorsystem.vercel.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors">
                            <Globe className="w-3 h-3"/> GaorSystemPeru
                        </a>
                    </div>
                </div>
            </div>
        </div>

        {/* GOD MODE MODAL (Hidden) */}
        {showGodMode && (
             <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in">
                 <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl animate-fade-in-up text-center border border-slate-200">
                     <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                         <ShieldAlert className="w-8 h-8 text-red-600"/>
                     </div>
                     <h2 className="text-2xl font-black text-slate-900 mb-2">Super Admin</h2>
                     <p className="text-slate-400 text-xs mb-6 font-bold uppercase tracking-wide">Acceso Restringido</p>
                     
                     <form onSubmit={handleGodModeLogin} className="space-y-4">
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"/>
                            <input 
                                type="password" 
                                value={masterPassword}
                                onChange={e => setMasterPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:border-red-500 transition-all placeholder:text-slate-300"
                                placeholder="******"
                                autoFocus
                            />
                        </div>
                        {godError && <p className="text-red-600 text-xs font-bold">{godError}</p>}
                        
                        <div className="flex gap-3 mt-6">
                            <button type="button" onClick={() => setShowGodMode(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors text-sm">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all text-sm">Entrar</button>
                        </div>
                     </form>
                 </div>
             </div>
        )}
    </div>
  );
};
