import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../types';
import { Save, Store, Receipt, Coins } from 'lucide-react';

interface SettingsViewProps {
    settings: StoreSettings;
    onSaveSettings: (newSettings: StoreSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSaveSettings }) => {
    const [formData, setFormData] = useState<StoreSettings>(settings);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleChange = (field: keyof StoreSettings, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        onSaveSettings(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="p-8 h-full bg-[#f8fafc] overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Configuración</h1>
                        <p className="text-slate-500 font-medium">Personaliza los datos de tu negocio</p>
                    </div>
                    <button 
                        onClick={handleSave} 
                        className={`px-8 py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center gap-3 ${saved ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-black hover:scale-105'}`}
                    >
                        {saved ? '¡Guardado!' : <><Save className="w-5 h-5"/> Guardar Cambios</>}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* General Info */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-violet-100 rounded-2xl text-violet-600"><Store className="w-6 h-6"/></div>
                            <h2 className="text-xl font-bold text-slate-800">Datos del Comercio</h2>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre de la Tienda</label>
                                <input 
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-violet-500 transition-colors"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-