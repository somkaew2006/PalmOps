import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Edit2, Save, X, Info } from 'lucide-react';

interface DailyPrice {
  id: number;
  priceDate: string;
  priceGradeA: number;
  priceGradeB: number;
  priceGradeC: number;
  referenceSource: string;
  note?: string;
  branchId: number;
  branch?: { branchName: string };
}

interface Branch {
  id: number;
  branchName: string;
}

const Price = () => {
  const [prices, setPrices] = useState<DailyPrice[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    branchId: '',
    priceGradeA: '',
    priceGradeB: '',
    priceGradeC: '',
    referenceSource: 'MPOB',
    note: ''
  });

  useEffect(() => {
    const init = async () => {
      try {
        const bRes = await api.get('/branches');
        setBranches(bRes.data);
        if (bRes.data.length > 0) {
          setSelectedBranchId(bRes.data[0].id.toString());
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      fetchPrices(selectedBranchId);
    }
  }, [selectedBranchId]);

  const fetchPrices = async (branchId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/prices`);
      // For now, filter on client side or update backend to support branchId filter
      const filtered = response.data.filter((p: DailyPrice) => p.branchId.toString() === branchId);
      setPrices(filtered);
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayPrice = prices.length > 0 ? prices[0] : null;
  const isToday = todayPrice ? new Date(todayPrice.priceDate).toDateString() === new Date().toDateString() : false;

  const handleOpenModal = () => {
    if (todayPrice) {
      setFormData({
        branchId: selectedBranchId,
        priceGradeA: todayPrice.priceGradeA.toString(),
        priceGradeB: todayPrice.priceGradeB.toString(),
        priceGradeC: todayPrice.priceGradeC.toString(),
        referenceSource: todayPrice.referenceSource,
        note: todayPrice.note || ''
      });
    } else {
      setFormData({
        branchId: selectedBranchId,
        priceGradeA: '',
        priceGradeB: '',
        priceGradeC: '',
        referenceSource: 'MPOB',
        note: ''
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        branchId: parseInt(formData.branchId),
        priceGradeA: parseFloat(formData.priceGradeA) || 0,
        priceGradeB: parseFloat(formData.priceGradeB) || 0,
        priceGradeC: parseFloat(formData.priceGradeC) || 0
      };

      setSaving(true);
      if (isToday && todayPrice) {
        await api.put(`/prices/${todayPrice.id}`, payload);
      } else {
        await api.post('/prices', {
          ...payload,
          priceDate: new Date().toISOString()
        });
      }
      setShowModal(false);
      fetchPrices(selectedBranchId);
      alert('บันทึกราคาเรียบร้อยแล้ว');
    } catch (error: any) {
      console.error('Error saving price:', error);
      alert(error.response?.data?.message || 'ไม่สามารถบันทึกราคาได้');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Branch Selector */}
      <div className="flex items-center gap-4 bg-black/20 p-2 rounded-2xl border border-white/5 w-fit">
        {branches.map(branch => (
          <button
            key={branch.id}
            onClick={() => setSelectedBranchId(branch.id.toString())}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              selectedBranchId === branch.id.toString() 
                ? 'bg-brand-green text-white shadow-lg' 
                : 'text-neutral-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {branch.branchName}
          </button>
        ))}
      </div>
      {/* Today Price Banner */}
      <div className="bg-gradient-to-br from-brand-green to-emerald-900 border border-brand-green/30 rounded-3xl p-8 text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10">
          <div className="text-[11px] uppercase tracking-[0.2em] font-black text-white/60 mb-2">
            ราคาวันนี้ — {todayPrice ? new Date(todayPrice.priceDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-6xl font-black font-heading tracking-tighter">
              {todayPrice ? Number(todayPrice.priceGradeA).toFixed(2) : '0.00'}
            </div>
            <div className="text-xl font-bold text-white/50">฿/กก.</div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="badge badge-green bg-white/10 text-white border-white/20 px-4 py-1.5">เกรด A พิเศษ</span>
            <span className="text-[11px] text-white/60">อ้างอิง: {todayPrice?.referenceSource || 'ยังไม่ได้กำหนด'}</span>
          </div>
        </div>
        <button 
          onClick={handleOpenModal}
          className="btn-primary bg-white text-brand-green hover:bg-white/90 px-8 py-4 relative z-10"
        >
          <Edit2 className="w-5 h-5 mr-2" /> 
          <span className="font-bold text-lg">ปรับราคาวันนี้</span>
        </button>
      </div>

      {/* Grade Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card p-8 group">
          <div className="text-[11px] font-black text-brand-green uppercase tracking-widest mb-4">เกรด A</div>
          <div className="text-4xl font-black text-white font-heading mb-2">
            {todayPrice ? Number(todayPrice.priceGradeA).toFixed(2) : '-'} ฿
          </div>
          <div className="text-xs text-neutral-500 font-medium">%FFA ≤ 5%</div>
        </div>
        <div className="stat-card p-8 group">
          <div className="text-[11px] font-black text-amber-500 uppercase tracking-widest mb-4">เกรด B</div>
          <div className="text-4xl font-black text-white font-heading mb-2">
            {todayPrice ? Number(todayPrice.priceGradeB).toFixed(2) : '-'} ฿
          </div>
          <div className="text-xs text-neutral-500 font-medium">%FFA 5.1–7%</div>
        </div>
        <div className="stat-card p-8 group">
          <div className="text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-4">เกรด C</div>
          <div className="text-4xl font-black text-white font-heading mb-2">
            {todayPrice ? Number(todayPrice.priceGradeC).toFixed(2) : '-'} ฿
          </div>
          <div className="text-xs text-neutral-500 font-medium">%FFA &gt; 7%</div>
        </div>
      </div>

      {/* Price History Table */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="text-[15px] font-bold text-white uppercase tracking-wider">ประวัติราคาล่าสุด</h3>
          <div className="text-[10px] text-neutral-500 font-black uppercase tracking-tighter bg-neutral-800/50 px-3 py-1 rounded-full border border-neutral-700/50">
            ย้อนหลัง 30 วัน
          </div>
        </div>
        
        <div className="table-wrap">
          {loading ? (
            <div className="p-12 text-center text-neutral-500 animate-pulse font-medium italic">กำลังดึงข้อมูลประวัติราคา...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th>วันที่ประกาศ</th>
                  <th>เกรด A</th>
                  <th>เกรด B</th>
                  <th>เกรด C</th>
                  <th>แหล่งอ้างอิง</th>
                  <th className="text-right">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {prices.length > 0 ? prices.map(price => (
                  <tr key={price.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="text-white font-bold">{new Date(price.priceDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                    <td className="text-brand-light font-black text-[15px]">{Number(price.priceGradeA).toFixed(2)}</td>
                    <td className="text-amber-500 font-bold">{Number(price.priceGradeB).toFixed(2)}</td>
                    <td className="text-neutral-500 font-medium">{Number(price.priceGradeC).toFixed(2)}</td>
                    <td className="text-[11px] font-bold text-neutral-400 uppercase">{price.referenceSource}</td>
                    <td className="text-right text-[11px] text-neutral-600 italic">{price.note || '—'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-neutral-600 font-medium">ไม่พบข้อมูลประวัติราคาในระบบ</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-dark)] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-[var(--color-border-dark)] bg-black/20 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">ปรับราคารับซื้อ</h2>
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-1">Update Daily Pricing</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-neutral-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center gap-3 p-4 bg-brand-green/5 border border-brand-green/10 rounded-2xl mb-2">
                <Info className="text-brand-green w-5 h-5 shrink-0" />
                <p className="text-[11px] text-brand-green/80 font-medium leading-relaxed">
                  การปรับราคาจะมีผลทันทีต่อการคำนวณใบชั่งน้ำหนักชุดใหม่ทั้งหมด {isToday ? '(กำลังแก้ไขราคาของวันนี้)' : '(กำลังสร้างราคาส่วนต่างใหม่ของวันนี้)'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">ราคาเกรด A (฿/กก.)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.priceGradeA}
                    onChange={(e) => setFormData({...formData, priceGradeA: e.target.value})}
                    className="w-full bg-black/20 border border-[var(--color-border-dark)] rounded-2xl px-5 py-4 text-white text-2xl font-black font-heading focus:outline-none focus:border-brand-green transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">เกรด B</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.priceGradeB}
                    onChange={(e) => setFormData({...formData, priceGradeB: e.target.value})}
                    className="w-full bg-black/20 border border-[var(--color-border-dark)] rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-brand-green transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">เกรด C</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.priceGradeC}
                    onChange={(e) => setFormData({...formData, priceGradeC: e.target.value})}
                    className="w-full bg-black/20 border border-[var(--color-border-dark)] rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-brand-green transition-all"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">แหล่งอ้างอิง / ตลาดกลาง</label>
                  <input 
                    type="text" 
                    value={formData.referenceSource}
                    onChange={(e) => setFormData({...formData, referenceSource: e.target.value})}
                    placeholder="เช่น MPOB, สุราษฎร์ธานี"
                    className="w-full bg-black/20 border border-[var(--color-border-dark)] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-green transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-[var(--color-border-dark)] bg-black/20 flex gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="btn-outline flex-1 py-4"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 py-4 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-brand-forest/30 border-t-brand-forest rounded-full animate-spin"></div>
                ) : (
                  <Save size={20} />
                )}
                <span className="font-bold">ยืนยันปรับราคา</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Price;
