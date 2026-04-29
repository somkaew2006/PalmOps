import { useEffect, useState } from 'react';
import api from '../api/axios';
import { History, ArrowUpCircle, ArrowDownCircle, Building, Filter, Search } from 'lucide-react';

interface StockMovement {
  id: string;
  date: string;
  type: 'IN' | 'OUT';
  reference: string;
  grade: string;
  quantity: number;
  status: string;
  branchName: string;
  description: string;
}

const StockHistory = () => {
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('/branches');
        setBranches(response.data);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [selectedBranchId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/branches/${selectedBranchId}/stock-history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching stock history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => 
    item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.branchName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <History className="text-brand-light" /> ประวัติความเคลื่อนไหวสต็อก
          </h2>
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-widest mt-1">Stock Ledger & Transaction History</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="form-group">
          <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">เลือกสาขา</label>
          <div className="relative">
            <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-neutral-900/50 border border-white/5 rounded-xl text-white text-sm focus:border-brand-light/50 outline-none transition-all"
            >
              <option value="all" className="bg-neutral-900">ทุกสาขา</option>
              {branches.map(b => <option key={b.id} value={b.id} className="bg-neutral-900">{b.branchName}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group md:col-span-2">
          <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">ค้นหาข้อมูล</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่อ้างอิง, สาขา หรือรายละเอียด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-neutral-900/50 border border-white/5 rounded-xl text-white text-sm focus:border-brand-light/50 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>วันที่/เวลา</th>
              <th>สาขา</th>
              <th>ประเภท</th>
              <th>เลขที่อ้างอิง</th>
              <th>เกรด</th>
              <th className="text-right">จำนวน (กก.)</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-neutral-500">กำลังโหลดประวัติสต็อก...</td></tr>
            ) : filteredHistory.length > 0 ? (
              filteredHistory.map((item) => (
                <tr key={item.id} className={item.status === 'cancelled' ? 'opacity-40 grayscale' : ''}>
                  <td className="text-xs">
                    <div className="text-white font-medium">
                      {new Date(item.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-neutral-500">
                      {new Date(item.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="text-xs text-neutral-300 font-bold">{item.branchName}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      item.type === 'IN' 
                        ? 'bg-brand-green/10 text-brand-green border border-brand-green/20' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {item.type === 'IN' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                      {item.type === 'IN' ? 'รับเข้า' : 'ขายออก'}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-white">
                    <span className={item.status === 'cancelled' ? 'line-through' : ''}>{item.reference}</span>
                  </td>
                  <td>
                    <span className={`badge ${item.grade === 'A' ? 'badge-green' : item.grade === 'B' ? 'badge-yellow' : 'badge-red'}`}>
                      {item.grade}
                    </span>
                  </td>
                  <td className={`text-right font-black ${item.type === 'IN' ? 'text-brand-green' : 'text-red-400'}`}>
                    <span className={item.status === 'cancelled' ? 'line-through' : ''}>
                      {item.type === 'IN' ? '+' : '-'}{item.quantity.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className={`text-[10px] font-bold uppercase ${
                      item.status === 'cancelled' ? 'text-red-500' : 'text-brand-light'
                    }`}>
                      {item.status === 'cancelled' ? 'ยกเลิก' : item.status === 'paid' ? 'จ่ายแล้ว' : item.status === 'confirmed' ? 'ยืนยันแล้ว' : 'สำเร็จ'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="text-center py-12 text-neutral-500">ไม่พบความเคลื่อนไหวสต็อก</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockHistory;
