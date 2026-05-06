import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Loader2, DollarSign } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

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
  weighInAt: string;
}

const PaymentItem = ({ ticket, onPay, processingId }: { ticket: Ticket; onPay: (id: number, useFee: number) => void; processingId: number | null }) => {
  const [fee, setFee] = useState<string>('0');
  
  return (
    <div className="stat-card p-4 flex items-center gap-4 cursor-pointer hover:border-brand-light group transition-all">
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
          ใบชั่ง <span className="font-mono text-brand-light">{ticket.ticketNo}</span> • {new Date(ticket.weighInAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })} {new Date(ticket.weighInAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} • {Number(ticket.finalWeightKg).toLocaleString()} กก. เกรด {ticket.grade}
        </div>
      </div>
      
      <div className="flex items-center gap-4 bg-black/20 p-2 rounded-xl border border-white/5">
        <div className="flex flex-col items-start gap-1">
          <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest px-1">ค่าธรรมเนียมโอน</span>
          <div className="flex items-center gap-1">
            <input 
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-16 bg-neutral-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-brand-light font-bold focus:border-brand-light/50 outline-none"
              placeholder="0"
            />
            <span className="text-[10px] text-neutral-600 font-bold">฿</span>
          </div>
        </div>

        <div className="text-right min-w-[100px]">
          <div className="text-lg font-bold text-brand-light font-mono">
            {Number(ticket.totalAmount - (parseFloat(fee) || 0)).toLocaleString()} ฿
          </div>
          {(parseFloat(fee) > 0) && <div className="text-[9px] text-amber-500 font-bold">- หัก {fee}฿ เรียบร้อย</div>}
        </div>
      </div>

      <button 
        className="btn btn-primary bg-brand-green border-brand-green py-2 px-6 shadow-lg shadow-brand-green/10 active:scale-95"
        onClick={() => onPay(ticket.id, parseFloat(fee) || 0)}
        disabled={processingId === ticket.id}
      >
        {processingId === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'จ่ายเงิน'}
      </button>
    </div>
  );
};

const Payment = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { showAlert } = useNotification();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchPendingTickets();
  }, []);

  const fetchPendingTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/weigh');
      setTickets(response.data.filter((t: any) => t.status === 'confirmed'));
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (id: number, feeAmount: number) => {
    try {
      setProcessingId(id);
      await api.put(`/weigh/${id}`, { 
        status: 'paid',
        feeAmount: feeAmount
      });
      setTickets(prev => prev.filter(t => t.id !== id));
      showAlert('บันทึกการจ่ายเงินเรียบร้อยแล้ว' + (feeAmount > 0 ? ` (หักค่าธรรมเนียม ${feeAmount}฿)` : ''), 'success');
    } catch (error) {
      console.error('Error processing payment:', error);
      showAlert('เกิดข้อผิดพลาดในการบันทึกการจ่ายเงิน', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = tickets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(tickets.length / itemsPerPage);

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
        ) : currentItems.length > 0 ? (
          <>
            {currentItems.map(ticket => (
              <PaymentItem 
                key={ticket.id} 
                ticket={ticket} 
                onPay={handlePay} 
                processingId={processingId} 
              />
            ))}
            
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between px-2">
                <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                  หน้า {currentPage} จาก {totalPages}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-neutral-900 border border-white/5 rounded-xl text-xs text-white disabled:opacity-30 hover:bg-neutral-800 transition-all"
                  >
                    ก่อนหน้า
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-neutral-900 border border-white/5 rounded-xl text-xs text-white disabled:opacity-30 hover:bg-neutral-800 transition-all"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
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
