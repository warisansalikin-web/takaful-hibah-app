import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  // Agent Info
  const [agent, setAgent] = useState({ name: '', phone: '' });
  const [agentSaved, setAgentSaved] = useState(false);

  // Client Data
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  
  // Financial Inputs
  const [debt, setDebt] = useState(0);
  const [maintenance, setMaintenance] = useState(0);
  const [education, setEducation] = useState(0);
  const [assets, setAssets] = useState(0);

  // Load saved agent from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('agent_name');
    const savedPhone = localStorage.getItem('agent_phone');
    if (savedName && savedPhone) {
      setAgent({ name: savedName, phone: savedPhone });
      setAgentSaved(true);
    }
  }, []);

  // Calculate Hibah Required
  const totalNeeded = Number(debt) + Number(maintenance) + Number(education);
  const hibahGap = Math.max(0, totalNeeded - Number(assets));

  // Handle Agent Setup
  const handleSaveAgent = async (e) => {
    e.preventDefault();
    if (!agent.name || !agent.phone) return alert('Sila isi nama dan nombor telefon.');

    localStorage.setItem('agent_name', agent.name);
    localStorage.setItem('agent_phone', agent.phone);

    // Save/Get Advisor from Supabase
    await supabase.from('advisors').insert([{ full_name: agent.name, whatsapp_num: agent.phone }]);
    setAgentSaved(true);
  };

  // Save Client & Open WhatsApp
  const handleShareWhatsApp = async () => {
    if (!clientName) return alert('Sila masukkan nama pelanggan.');

    // 1. Save record into Supabase
    const { data: advisor } = await supabase
      .from('advisors')
      .select('id')
      .eq('whatsapp_num', agent.phone)
      .single();

    if (advisor) {
      await supabase.from('clients').insert([{
        advisor_id: advisor.id,
        client_name: clientName,
        client_phone: clientPhone,
        debt: Number(debt),
        maintenance: Number(maintenance),
        education: Number(education),
        assets: Number(assets),
        hibah_gap: hibahGap
      }]);
    }

    // 2. Build WhatsApp String
    const text = `*Ringkasan Cadangan Perlindungan Hibah*

*Pelanggan:* ${clientName}
----------------------------------
📌 *Ringkasan Keperluan:*
• Total Hutang: RM ${Number(debt).toLocaleString()}
• Sara Hidup: RM ${Number(maintenance).toLocaleString()}
• Dana Pendidikan: RM ${Number(education).toLocaleString()}
• Aset Sedia Ada: -RM ${Number(assets).toLocaleString()}

🎯 *JUMLAH HIBAH DIPERLUKAN:*
*RM ${hibahGap.toLocaleString()}*
----------------------------------
👤 *Disediakan oleh:* ${agent.name}
📞 *Hubungi/WhatsApp:* ${agent.phone}

_Dibuat menggunakan Takaful Hibah Calc - App Kalkulator Percuma Advisor_`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center py-4 border-b border-slate-700 mb-6">
        <h1 className="text-xl font-bold text-amber-400">Kalkulator Perlindungan Hibah</h1>
        <p className="text-xs text-slate-400">Perancangan Pengagihan Harta Keluarga</p>
      </div>

      {/* Step 1: Agent Setup Modal/Card */}
      {!agentSaved ? (
        <form onSubmit={handleSaveAgent} className="bg-slate-800 p-4 rounded-xl mb-6 border border-amber-500/30">
          <h2 className="text-sm font-semibold mb-3 text-amber-400"> Profil Advisor (Sekali Sahaja)</h2>
          <input
            type="text"
            placeholder="Nama Penuh Advisor"
            value={agent.name}
            onChange={(e) => setAgent({ ...agent, name: e.target.value })}
            className="w-full p-2 mb-3 bg-slate-700 rounded border border-slate-600 text-sm focus:outline-none"
          />
          <input
            type="text"
            placeholder="No. WhatsApp (cth: 0123456789)"
            value={agent.phone}
            onChange={(e) => setAgent({ ...agent, phone: e.target.value })}
            className="w-full p-2 mb-3 bg-slate-700 rounded border border-slate-600 text-sm focus:outline-none"
          />
          <button type="submit" className="w-full bg-amber-500 text-slate-950 font-bold p-2 rounded text-sm hover:bg-amber-400">
            Simpan Profil Saya
          </button>
        </form>
      ) : (
        <div className="flex justify-between items-center bg-slate-800/60 p-3 rounded-lg text-xs mb-4 text-slate-300">
          <span>Advisor: <strong>{agent.name}</strong> ({agent.phone})</span>
          <button onClick={() => setAgentSaved(false)} className="text-amber-400 underline">Ubah</button>
        </div>
      )}

      {/* Step 2: Client Details */}
      <div className="bg-slate-800 p-4 rounded-xl mb-4">
        <h2 className="text-sm font-semibold mb-2 text-slate-200"> Maklumat Pelanggan</h2>
        <input
          type="text"
          placeholder="Nama Pelanggan"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full p-2 mb-2 bg-slate-700 rounded border border-slate-600 text-sm focus:outline-none"
        />
        <input
          type="text"
          placeholder="No. Telefon (Pilihan)"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          className="w-full p-2 bg-slate-700 rounded border border-slate-600 text-sm focus:outline-none"
        />
      </div>

      {/* Step 3: Financial Calculations */}
      <div className="space-y-3 mb-6">
        <div>
          <label className="text-xs text-slate-400">Total Hutang (Debt)</label>
          <input
            type="number"
            value={debt || ''}
            onChange={(e) => setDebt(e.target.value)}
            placeholder="0"
            className="w-full p-2 bg-slate-800 rounded border border-slate-700 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Sara Hidup (Maintenance)</label>
          <input
            type="number"
            value={maintenance || ''}
            onChange={(e) => setMaintenance(e.target.value)}
            placeholder="0"
            className="w-full p-2 bg-slate-800 rounded border border-slate-700 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Pendidikan (Education)</label>
          <input
            type="number"
            value={education || ''}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="0"
            className="w-full p-2 bg-slate-800 rounded border border-slate-700 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Aset Sedia Ada (- Deduct)</label>
          <input
            type="number"
            value={assets || ''}
            onChange={(e) => setAssets(e.target.value)}
            placeholder="0"
            className="w-full p-2 bg-slate-800 rounded border border-slate-700 text-sm text-red-400"
          />
        </div>
      </div>

      {/* Step 4: Summary Card */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 p-4 rounded-xl mb-6 shadow-lg">
        <div className="text-xs font-semibold uppercase opacity-80">Jumlah Hibah Diperlukan</div>
        <div className="text-3xl font-extrabold mt-1">RM {hibahGap.toLocaleString()}</div>
      </div>

      {/* Action Buttons */}
      <button
        onClick={handleShareWhatsApp}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-xl flex items-center justify-center gap-2 shadow-lg"
      >
        💬 Kongsi Ringkasan WhatsApp & Simpan
      </button>
    </div>
  );
}