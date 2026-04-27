import { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Scale, 
  User, 
  Car, 
  Calendar, 
  Trash2, 
  Save, 
  HelpCircle as Info,
  BadgePercent,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Farmer {
  id: number;
  fullName: string;
  farmerCode: string;
}

interface Vehicle {
  id: number;
  licensePlate: string;
}

interface Price {
  id: number;
  priceGradeA: number;
  priceGradeB: number;
  priceGradeC: number;
}

const Weigh = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [todayPrice, setTodayPrice] = useState<Price | null>(null);

  const [farmerId, setFarmerId] = useState<string>('');
  const [vehicleId, setVehicleId] = useState<string>('');
  const [gross, setGross] = useState<number>(0);
  const [tare, setTare] = useState<number>(0);
  const [ffa, setFfa] = useState<number>(0);
  const [oil, setOil] = useState<number>(0);
  const [deduction, setDeduction] = useState<number>(0);
  const [grade, setGrade] = useState<'A' | 'B' | 'C'>('A');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fRes, vRes, pRes] = await Promise.all([
          api.get('/farmers'),
          api.get('/vehicles'),
          api.get('/prices/today')
        ]);
        setFarmers(fRes.data);
        setVehicles(vRes.data);
        setTodayPrice(pRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Auto-calculate grade based on FFA
  useEffect(() => {
    if (ffa <= 5) setGrade('A');
    else if (ffa <= 7) setGrade('B');
    else setGrade('C');
  }, [ffa]);

  const net = Math.max(0, gross - tare);
  const finalWeight = Math.max(0, net - deduction);
  
  const getPricePerKg = () => {
    if (!todayPrice) return 0;
    if (grade === 'A') return todayPrice.priceGradeA;
    if (grade === 'B') return todayPrice.priceGradeB;
    return todayPrice.priceGradeC;
  };

  const currentPrice = getPricePerKg();
  const total = finalWeight * currentPrice;

  const handleSubmit = async () => {
    try {
      if (!farmerId || !todayPrice) {
        alert('กรุณาเลือกเกษตรกรและตรวจสอบราคา');
        return;
      }

      const payload = {
        farmerId: parseInt(farmerId),
        vehicleId: vehicleId ? parseInt(vehicleId) : null,
        priceId: todayPrice.id,
        grossWeightKg: gross,
        tareWeightKg: tare,
        netWeightKg: net,
        ffaPercent: ffa,
        oilPercent: oil,
        grade,
        deductionKg: deduction,
        finalWeightKg: finalWeight,
        pricePerKg: currentPrice,
        totalAmount: total,
        status: 'confirmed'
      };

      await api.post('/weigh', payload);
      alert('บันทึกใบชั่งเรียบร้อยแล้ว');
      window.location.reload();
    } catch (error) {
      console.error('Error saving ticket:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Scale className="w-8 h-8 text-brand-light" />
            ลงทะเบียนชั่งน้ำหนัก
          </h1>
          <p className="text-neutral-500 text-sm mt-1">บันทึกข้อมูลการรับซื้อปาล์มน้ำมันและคำนวณยอดเงิน</p>
        </div>
        <div className="flex gap-3">
          <button 
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-neutral-700"
            onClick={() => window.location.reload()}
          >
            <Trash2 className="w-4 h-4" />
            ล้างข้อมูล
          </button>
          <button 
            className="px-6 py-2 bg-brand-light hover:bg-brand-light/90 text-neutral-900 rounded-lg text-sm font-bold transition-all shadow-lg shadow-brand-light/20 flex items-center gap-2"
            onClick={handleSubmit}
          >
            <Save className="w-4 h-4" />
            บันทึกใบชั่ง
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Info Card */}
          <div className="bg-[#1e1e1e] border border-neutral-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
              <User className="w-32 h-32" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-brand-light" />
              ข้อมูลเบื้องต้น
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3 h-3" /> เกษตรกร
                </label>
                <select 
                  className="w-full bg-[#141414] border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-light transition-all cursor-pointer"
                  value={farmerId} 
                  onChange={e => setFarmerId(e.target.value)}
                >
                  <option value="">เลือกเกษตรกร...</option>
                  {farmers.map(f => (
                    <option key={f.id} value={f.id}>{f.fullName} ({f.farmerCode})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-3 h-3" /> ทะเบียนรถ
                </label>
                <select 
                  className="w-full bg-[#141414] border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-light transition-all cursor-pointer"
                  value={vehicleId} 
                  onChange={e => setVehicleId(e.target.value)}
                >
                  <option value="">ไม่ระบุ / อื่นๆ</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.licensePlate}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> วันที่-เวลา
                </label>
                <input 
                  type="datetime-local" 
                  defaultValue={new Date().toISOString().slice(0, 16)} 
                  className="w-full bg-[#141414] border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-light transition-all [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  ราคาฐาน (เกรด A)
                </label>
                <div className="bg-brand-light/5 border border-brand-light/20 text-brand-light rounded-xl px-4 py-3 font-bold text-lg">
                  {todayPrice ? `${Number(todayPrice.priceGradeA).toFixed(2)} ฿/กก.` : '...'}
                </div>
              </div>
            </div>
          </div>

          {/* Weighing Inputs Card */}
          <div className="bg-[#1e1e1e] border border-neutral-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
              <Scale className="w-32 h-32" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Scale className="w-5 h-5 text-brand-light" />
              รายละเอียดน้ำหนักและคุณภาพ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">น้ำหนักรวม (กก.)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className="w-full bg-[#141414] border border-neutral-800 text-white rounded-xl px-4 py-4 text-xl font-bold focus:outline-none focus:border-brand-light transition-all"
                  value={gross || ''} 
                  onChange={e => setGross(parseFloat(e.target.value) || 0)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">น้ำหนักรถ (กก.)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  className="w-full bg-[#141414] border border-neutral-800 text-white rounded-xl px-4 py-4 text-xl font-bold focus:outline-none focus:border-brand-light transition-all"
                  value={tare || ''} 
                  onChange={e => setTare(parseFloat(e.target.value) || 0)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider text-red-400">หักน้ำหนัก (กก.)</label>
                <input 
                  type="number" 
                  placeholder="0"
                  className="w-full bg-[#141414] border border-red-500/30 text-red-400 rounded-xl px-4 py-4 text-xl font-bold focus:outline-none focus:border-red-500 transition-all"
                  value={deduction || ''} 
                  onChange={e => setDeduction(parseFloat(e.target.value) || 0)} 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                  <BadgePercent className="w-3 h-3" /> FFA (%)
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="0.0"
                  className="w-full bg-[#141414] border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-light transition-all"
                  value={ffa || ''} 
                  onChange={e => setFfa(parseFloat(e.target.value) || 0)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">เปอร์เซ็นต์น้ำมัน (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="0.0"
                  className="w-full bg-[#141414] border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-brand-light transition-all"
                  value={oil || ''} 
                  onChange={e => setOil(parseFloat(e.target.value) || 0)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">เกรดปาล์ม (คำนวณอัตโนมัติ)</label>
                <div className={`w-full text-center py-3 rounded-xl font-bold text-lg border ${
                  grade === 'A' ? 'bg-green-500/10 border-green-500 text-green-500' :
                  grade === 'B' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' :
                  'bg-red-500/10 border-red-500 text-red-500'
                }`}>
                  เกรด {grade}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Summary & Payment */}
        <div className="space-y-6">
          <div className="bg-[#1e1e1e] border-2 border-brand-light/30 rounded-3xl p-8 shadow-2xl shadow-brand-light/10 relative overflow-hidden h-full flex flex-col">
            {/* Glossy Background Effect */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-light/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2">สรุปรายการชั่ง</div>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-neutral-400 text-sm">น้ำหนักรวม</span>
                  <span className="text-white font-mono">{gross.toLocaleString()} กก.</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-neutral-400 text-sm">น้ำหนักรถ</span>
                  <span className="text-white font-mono">− {tare.toLocaleString()} กก.</span>
                </div>
                <div className="flex justify-between items-end pb-2 border-b border-neutral-800">
                  <span className="text-neutral-400 text-sm font-medium">น้ำหนักสุทธิ</span>
                  <span className="text-white font-bold">{net.toLocaleString()} กก.</span>
                </div>
                <div className="flex justify-between items-end text-red-400">
                  <span className="text-xs">หักสิ่งเจือปน</span>
                  <span className="text-sm font-mono">− {deduction.toLocaleString()} กก.</span>
                </div>
              </div>

              <div className="bg-neutral-900/50 rounded-2xl p-6 border border-neutral-800/50 mb-8">
                <div className="text-center">
                  <div className="text-neutral-500 text-xs font-medium uppercase tracking-wider mb-2">น้ำหนักคิดเงิน</div>
                  <div className="text-4xl font-black text-white leading-none">
                    {finalWeight.toLocaleString()} <span className="text-lg font-normal text-neutral-500">กก.</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-800 flex justify-between items-center text-sm">
                  <span className="text-neutral-400 italic">ราคาเกรด {grade}</span>
                  <span className="text-brand-light font-bold">× {Number(currentPrice || 0).toFixed(2)} ฿</span>
                </div>
              </div>

              <div className="mt-auto">
                <div className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-2 text-center">ยอดเงินสุทธิที่ต้องจ่าย</div>
                <div className="relative group text-center">
                  <div className="absolute inset-0 bg-brand-light blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                  <div className="relative text-5xl font-black text-brand-light tracking-tighter drop-shadow-sm">
                    ฿{Number(total || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="mt-10 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <CheckCircle className="w-3 h-3 text-brand-light" />
                    <span>ตรวจสอบความถูกต้องของรหัสเกษตรกร</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <CheckCircle className="w-3 h-3 text-brand-light" />
                    <span>คำนวณตามเกรด {grade} (%FFA {Number(ffa || 0).toFixed(1)})</span>
                  </div>
                  {total > 100000 && (
                    <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/5 p-2 rounded-lg border border-yellow-500/20">
                      <AlertCircle className="w-3 h-3" />
                      <span>รายการมูลค่าสูง (เกิน 1 แสนบาท)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weigh;
