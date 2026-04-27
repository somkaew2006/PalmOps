import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Download, FileText, BarChart3, PieChart } from 'lucide-react';

const Report = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="text-neutral-500 animate-pulse font-medium">กำลังประมวลผลรายงาน...</div>
    </div>
  );

  const maxVolume = Math.max(...data.dailyVolume.map((d: any) => d.volume), 1);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
        <div className="flex gap-2">
          <select className="px-3.5 py-2 border border-[var(--color-border-dark)] rounded-lg text-sm bg-neutral-800 text-neutral-200 focus:outline-none focus:border-brand-light">
            <option>เดือนปัจจุบัน ({new Date().toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })})</option>
            <option>เดือนที่แล้ว</option>
          </select>
          <button className="btn btn-outline py-2 px-4 text-xs flex items-center gap-2 border-emerald-900/30 hover:bg-emerald-500/10 hover:text-emerald-500">
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button className="btn btn-outline py-2 px-4 text-xs flex items-center gap-2 border-red-900/30 hover:bg-red-500/10 hover:text-red-500">
            <FileText className="w-4 h-4" /> Export PDF
          </button>
        </div>
        <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
          อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Volume Chart */}
        <div className="stat-card p-6">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[var(--color-border-dark)]">
            <BarChart3 size={16} className="text-brand-green" />
            <h4 className="text-[13px] font-bold text-white uppercase tracking-wider">ปริมาณรับซื้อรายวัน (ตัน)</h4>
          </div>
          <div className="flex flex-col gap-4">
            {data.dailyVolume.length > 0 ? data.dailyVolume.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-4 group">
                <span className="w-16 text-right text-[10px] font-bold text-neutral-500 group-hover:text-neutral-300 transition-colors uppercase">{item.date}</span>
                <div className="flex-1 h-5 bg-neutral-800/50 rounded-full overflow-hidden border border-neutral-700/30 relative">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-forest to-brand-green rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${(item.volume / maxVolume) * 100}%` }}
                  ></div>
                </div>
                <span className="w-16 font-black text-white text-[11px]">{item.volume.toFixed(1)} ต.</span>
              </div>
            )) : (
              <div className="py-8 text-center text-neutral-600 italic text-sm">ยังไม่มีข้อมูลการซื้อในเดือนนี้</div>
            )}
          </div>
        </div>

        {/* Grade Distribution & Summary */}
        <div className="stat-card p-6">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[var(--color-border-dark)]">
            <PieChart size={16} className="text-brand-amber" />
            <h4 className="text-[13px] font-bold text-white uppercase tracking-wider">สัดส่วนเกรดปาล์ม</h4>
          </div>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="w-16 text-right text-[10px] font-bold text-brand-green uppercase tracking-widest">เกรด A</span>
              <div className="flex-1 h-3 bg-neutral-800/50 rounded-full overflow-hidden">
                <div className="h-full bg-brand-green" style={{ width: `${data.gradeDistribution.A}%` }}></div>
              </div>
              <span className="w-12 font-black text-white text-right text-[12px]">{data.gradeDistribution.A}%</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-16 text-right text-[10px] font-bold text-amber-500 uppercase tracking-widest">เกรด B</span>
              <div className="flex-1 h-3 bg-neutral-800/50 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${data.gradeDistribution.B}%` }}></div>
              </div>
              <span className="w-12 font-black text-white text-right text-[12px]">{data.gradeDistribution.B}%</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-16 text-right text-[10px] font-bold text-neutral-500 uppercase tracking-widest">เกรด C</span>
              <div className="flex-1 h-3 bg-neutral-800/50 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-600" style={{ width: `${data.gradeDistribution.C}%` }}></div>
              </div>
              <span className="w-12 font-black text-white text-right text-[12px]">{data.gradeDistribution.C}%</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--color-border-dark)]">
            <h4 className="text-[11px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">ยอดสรุปรายเดือน</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-brand-green/20 transition-colors">
                <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">ปริมาณรวม</div>
                <div className="text-brand-light font-black text-xl">{data.summary.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 1 })} <span className="text-[10px] font-normal text-neutral-500">ต.</span></div>
              </div>
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-brand-amber/20 transition-colors">
                <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">จ่ายเงินรวม</div>
                <div className="text-brand-amber font-black text-xl">{data.summary.totalAmount.toFixed(2)} <span className="text-[10px] font-normal text-neutral-500">ล้าน ฿</span></div>
              </div>
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">จำนวนใบชั่ง</div>
                <div className="text-white font-black text-xl">{data.summary.ticketCount.toLocaleString()} <span className="text-[10px] font-normal text-neutral-500">ใบ</span></div>
              </div>
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">เกษตรกร</div>
                <div className="text-white font-black text-xl">{data.summary.farmersCount.toLocaleString()} <span className="text-[10px] font-normal text-neutral-500">ราย</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
