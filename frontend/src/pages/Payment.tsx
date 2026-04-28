import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Loader2, DollarSign } from 'lucide-react';

interface Ticket {
  id: number;
  ticketNo: string;
  farmer: {
    fullName: string;
  };
  branch?: {
    branchName: string;
  };
  finalWeightKg: number;
  grade: string;
  totalAmount: number;
  status: string;
}

const Payment = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingTickets();
  }, []);

  const fetchPendingTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/weigh');
      // Filter for confirmed but not yet paid (in real app, use status)
      setTickets(response.data.filter((t: any) => t.status === 'confirmed'));
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (id: number) => {
    try {
      setProcessingId(id);
      await api.put(`/weigh/${id}`, { status: 'paid' });
      setTickets(prev => prev.filter(t => t.id !== id));
      alert('บันทึกการจ่ายเงินเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex gap-2 mb-4">
        <div className="flex-1 px-3.5 py-2.5 bg-neutral-800 border border-[#3f3f3f] rounded-xl text-sm text-neutral-400">
          รายการรอการจ่ายเงิน ({tickets.length} รายการ)
        </div>
        <button className="btn btn-outline border-[#3f3f3f]">ประวัติการจ่าย</button>
      </div>

      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="p-12 text-center text-neutral-500">กำลังโหลดรายการ...</div>
        ) : tickets.length > 0 ? tickets.map(ticket => (
          <div key={ticket.id} className="stat-card p-4 flex items-center gap-4 cursor-pointer hover:border-brand-light group transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-light flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-white text-[15px] group-hover:text-brand-light transition-colors">
                {ticket.farmer?.fullName}
                <span className="ml-2 text-[10px] font-black bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-full border border-brand-green/10 uppercase tracking-tighter">
                  {ticket.branch?.branchName || 'ไม่ระบุสาขา'}
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                ใบชั่ง <span className="font-mono text-brand-light">{ticket.ticketNo}</span> • {Number(ticket.finalWeightKg).toLocaleString()} กก. เกรด {ticket.grade}
              </div>
            </div>
            <div className="text-right mr-6">
              <div className="text-lg font-bold text-brand-light font-mono">{Number(ticket.totalAmount).toLocaleString()} ฿</div>
              <div className="text-[10px] text-amber-500 mt-0.5 flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> รอการจ่ายเงิน
              </div>
            </div>
            <button 
              className="btn btn-primary bg-brand-green border-brand-green py-2 px-6 shadow-lg shadow-brand-green/10 active:scale-95"
              onClick={() => handlePay(ticket.id)}
              disabled={processingId === ticket.id}
            >
              {processingId === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'จ่ายเงิน'}
            </button>
          </div>
        )) : (
          <div className="p-12 text-center bg-[#252525] border border-[#3f3f3f] border-dashed rounded-2xl">
            <div className="text-neutral-500 mb-2">ไม่มีรายการค้างจ่ายในขณะนี้</div>
            <button className="text-brand-light text-xs font-medium" onClick={fetchPendingTickets}>รีเฟรชข้อมูล</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
