import { useEffect, useState } from 'react';
import api from '../api/axios';
import { History, Building, Search, Tag, FileDown, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

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
  beginningBalance: number;
  endingBalance: number;
}

const StockHistory = () => {
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('A');
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = All months
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [selectedBranchId, selectedGrade, selectedMonth, selectedYear]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const url = `/branches/${selectedBranchId}/stock-history?grade=${selectedGrade}&month=${selectedMonth}&year=${selectedYear}`;
      console.log('Fetching stock history from:', url);
      const response = await api.get(url);
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const handleExportExcel = () => {
    const data = filteredHistory.map(item => ({
      'วันที่': new Date(item.date).toLocaleDateString('th-TH'),
      'เวลา': new Date(item.date).toLocaleTimeString('th-TH'),
      'รายการ': item.description,
      'อ้างอิง': item.reference,
      'เกรด': item.grade,
      'ยอดยกมา': item.beginningBalance,
      'จำนวน': item.type === 'IN' ? item.quantity : -item.quantity,
      'คงเหลือ': item.endingBalance,
      'สาขา': item.branchName
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StockHistory");
    XLSX.writeFile(wb, `StockHistory_${selectedGrade}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <History className="text-brand-light" /> บัญชีคุมสินค้า (Stock Ledger)
          </h2>
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-widest mt-1">Movement with Beginning & Ending Balances</p>
        </div>
        <button 
          onClick={handleExportExcel}
          className="btn btn-outline btn-sm flex items-center gap-2"
          disabled={filteredHistory.length === 0}
        >
          <FileDown size={18} /> Export Excel
        </button>
      </div>

      {/* Stock Summary by Branch */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {branches.map(branch => {
          const gradeStock = branch.stocks?.find((s: any) => s.grade === selectedGrade);
          const quantity = Number(gradeStock?.quantityKg || 0);
          return (
            <div 
              key={branch.id} 
              className={`p-3 rounded-2xl border transition-all duration-300 ${
                selectedBranchId === branch.id.toString() || selectedBranchId === 'all'
                  ? 'bg-brand-light/10 border-brand-light/30 ring-1 ring-brand-light/20' 
                  : 'bg-white/5 border-white/5 opacity-50'
              }`}
            >
              <div className="text-[10px] font-black text-neutral-500 uppercase tracking-tighter mb-1 truncate">
                {branch.branchName}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-white">{quantity.toLocaleString()}</span>
                <span className="text-[10px] text-neutral-500 font-bold">กก.</span>
              </div>
            </div>
          );
        })}
        {selectedBranchId === 'all' && (
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-center">
            <div className="text-[10px] font-black text-brand-light uppercase tracking-tighter mb-1">ยอดรวมทุกสาขา</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-brand-light">
                {branches.reduce((acc, b) => acc + Number(b.stocks?.find((s: any) => s.grade === selectedGrade)?.quantityKg || 0), 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-brand-light/60 font-bold">กก.</span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="form-group">
          <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">เลือกสาขา</label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full !pl-12 pr-10 py-3 bg-neutral-900 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-brand-light/50 appearance-none"
            >
              <option value="all">ทุกสาขา</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.branchName}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">เลือกเกรด</label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full !pl-12 pr-4 py-3 bg-neutral-900 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-brand-light/50 appearance-none"
            >
              <option value="A">เกรด A</option>
              <option value="B">เกรด B</option>
              <option value="C">เกรด C</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">ประจำเดือน</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full !pl-10 pr-2 py-3 bg-neutral-900 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-light/50 appearance-none"
              >
                <option value={0}>ทุกเดือน</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('th-TH', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative w-24">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-3 bg-neutral-900 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-brand-light/50 appearance-none"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <option key={y} value={y}>{y + 543}</option>;
                })}
              </select>
            </div>
          </div>
        </div>

        <div className="form-group md:col-span-1">
          <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">ค้นหาอ้างอิง</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
            <input
              type="text"
              placeholder="ค้นหาเลขที่อ้างอิง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full !pl-12 pr-4 py-3 bg-neutral-900 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-brand-light/50"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/40 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">วันที่/เวลา</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">รายการ</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">ยอดยกมา</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">เข้า (+)</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">ออก (-)</th>
                <th className="px-6 py-4 text-[10px] font-black text-brand-light uppercase tracking-widest text-right bg-brand-light/5">คงเหลือ</th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-center">สาขา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-20 text-neutral-500 animate-pulse font-bold">กำลังประมวลผลสต็อก...</td></tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((item: any) => (
                  <tr key={item.id} className={`hover:bg-white/[0.02] transition-colors ${item.status === 'cancelled' ? 'opacity-30 grayscale' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="text-[13px] font-bold text-white">
                        {new Date(item.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-medium">
                        {new Date(item.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[12px] font-bold text-neutral-200">{item.description}</div>
                      <div className="text-[10px] font-mono text-neutral-500">{item.reference}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-[13px] font-medium text-neutral-400">
                      {item.beginningBalance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.type === 'IN' ? (
                        <span className="text-[13px] font-black text-brand-green">+{item.quantity.toLocaleString()}</span>
                      ) : <span className="text-neutral-700">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.type === 'OUT' ? (
                        <span className="text-[13px] font-black text-red-400">-{item.quantity.toLocaleString()}</span>
                      ) : <span className="text-neutral-700">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right bg-brand-light/5">
                      <span className="text-[14px] font-black text-white">{item.endingBalance.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-black bg-white/5 px-2 py-1 rounded-lg text-neutral-400 border border-white/5">
                        {item.branchName}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-neutral-600 font-medium italic">
                    ไม่พบข้อมูลความเคลื่อนไหวในเกรดที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
            <div className="text-xs text-neutral-500">
              แสดง {indexOfFirstItem + 1} ถึง {Math.min(indexOfLastItem, filteredHistory.length)} จากทั้งหมด {filteredHistory.length} รายการ
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
              >
                ก่อนหน้า
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                      currentPage === page 
                        ? 'bg-brand-light text-black shadow-lg shadow-brand-light/20' 
                        : 'bg-neutral-900 text-neutral-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockHistory;
