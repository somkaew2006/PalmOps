import { useEffect, useState } from 'react';
import api from '../api/axios';

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats/summary');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="text-neutral-500 animate-pulse font-medium">กำลังโหลดข้อมูล...</div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Summary Cards matching screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[var(--color-bg-card)] rounded-3xl p-6 border border-[var(--color-border-dark)] shadow-lg relative overflow-hidden group hover:border-brand-green/30 transition-all">
          <div className="text-neutral-400 text-[11px] font-bold uppercase tracking-widest mb-4">ปริมาณรับซื้อวันนี้</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-brand-green">{((stats.totalWeight || 0) / 1000).toFixed(1)}</span>
            <span className="text-xl font-bold text-brand-green/70">ต.</span>
          </div>
          <div className="text-[11px] text-brand-green/60 mt-2 flex items-center gap-1 font-medium">
            <span className="text-sm">↑</span> 12% จากเมื่อวาน
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] rounded-3xl p-6 border border-[var(--color-border-dark)] shadow-lg relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="text-neutral-400 text-[11px] font-bold uppercase tracking-widest mb-4">ใบชั่งวันนี้</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{stats.ticketCount || 0}</span>
            <span className="text-xl font-bold text-white/70">ใบ</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-2 font-medium">08:00 – 16:30</div>
        </div>

        <div className="bg-[var(--color-bg-card)] rounded-3xl p-6 border border-[var(--color-border-dark)] shadow-lg relative overflow-hidden group hover:border-brand-amber/30 transition-all">
          <div className="text-neutral-400 text-[11px] font-bold uppercase tracking-widest mb-4">ยอดจ่ายเงินวันนี้</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-brand-amber">{((stats.todayAmount || 0) / 1000000).toFixed(2)}</span>
            <span className="text-xl font-bold text-brand-amber/70">ล้าน</span>
          </div>
          <div className="text-[11px] text-brand-amber/60 mt-2 font-medium">รอจ่าย 3 ราย</div>
        </div>

        <div className="bg-[var(--color-bg-card)] rounded-3xl p-6 border border-[var(--color-border-dark)] shadow-lg relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="text-neutral-400 text-[11px] font-bold uppercase tracking-widest mb-4">ราคาปัจจุบัน</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{stats.todayPrice || '0.00'}</span>
            <span className="text-xl font-bold text-white/70">฿/กก.</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-2 uppercase tracking-tight font-medium">อ้างอิง MPOB</div>
        </div>
      </div>

      {/* Latest Tickets Table matching screenshot */}
      <div className="space-y-4">
        <h3 className="text-[15px] font-bold text-white uppercase tracking-wider pl-1">ใบชั่งล่าสุด</h3>
        
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-dark)] rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--color-border-dark)] bg-black/10">
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">เลขใบชั่ง</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">เกษตรกร</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">ทะเบียนรถ</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">น้ำหนักสุทธิ</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-center">เกรด</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">ยอดเงิน</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-dark)]">
                {stats.latestTickets.length > 0 ? stats.latestTickets.map((ticket: any) => (
                  <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <span className="text-[13px] font-bold text-white block">{ticket.ticketNo}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[13px] font-bold text-neutral-200">{ticket.farmer?.fullName}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[12px] text-neutral-500 font-medium">{ticket.vehicle?.licensePlate || '—'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[13px] font-black text-white">{Number(ticket.finalWeightKg || ticket.netWeightKg).toLocaleString()}</span>
                      <span className="text-[10px] text-neutral-500 ml-1 font-medium">กก.</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black border transition-transform group-hover:scale-110 ${
                          ticket.grade === 'A' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 
                          ticket.grade === 'B' ? 'bg-brand-amber/10 text-brand-amber border-brand-amber/20' : 
                          'bg-neutral-800 text-neutral-400 border-neutral-700'
                        }`}>
                          {ticket.grade}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[14px] font-black text-white">{Number(ticket.totalAmount).toLocaleString()}</span>
                        <span className="text-[10px] text-neutral-500">฿</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {ticket.status === 'paid' ? (
                        <div className="inline-flex items-center gap-1.5 bg-brand-green/10 text-brand-green border border-brand-green/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>
                          จ่ายแล้ว
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-brand-amber/10 text-brand-amber border border-brand-amber/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse"></div>
                          รอจ่าย
                        </div>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500 font-medium">
                      ไม่พบข้อมูลใบชั่งล่าสุด
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
