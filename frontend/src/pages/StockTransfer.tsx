import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Plus, 
  X, 
  Save, 
  History, 
  ArrowRightLeft, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

interface Branch {
  id: number;
  branchName: string;
  branchCode?: string;
}

interface Transfer {
  id: number;
  saleNo: string;
  saleDate: string;
  branch: { branchName: string };
  toBranch: { branchName: string };
  grade: string;
  quantityKg: number;
  status: string;
  note?: string;
}

const StockTransfer = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  
  // Filters
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const { showAlert, showConfirm } = useNotification();

  const months = [
    { value: 1, label: 'มกราคม' }, { value: 2, label: 'กุมภาพันธ์' }, { value: 3, label: 'มีนาคม' },
    { value: 4, label: 'เมษายน' }, { value: 5, label: 'พฤษภาคม' }, { value: 6, label: 'มิถุนายน' },
    { value: 7, label: 'กรกฎาคม' }, { value: 8, label: 'สิงหาคม' }, { value: 9, label: 'กันยายน' },
    { value: 10, label: 'ตุลาคม' }, { value: 11, label: 'พฤศจิกายน' }, { value: 12, label: 'ธันวาคม' },
  ];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const [formData, setFormData] = useState({
    branchId: '',
    toBranchId: '',
    saleDate: new Date().toISOString().slice(0, 16),
    grade: 'A',
    quantityKg: '',
    note: ''
  });

  const [currentStock, setCurrentStock] = useState<number>(0);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [selectedBranchId, selectedMonth, selectedYear]);

  useEffect(() => {
    if (formData.branchId && formData.grade) {
      setCurrentStock(0); 
      fetchCurrentStock(formData.branchId, formData.grade);
    }
  }, [formData.branchId, formData.grade]);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
      if (res.data.length > 0 && !formData.branchId) {
        setFormData(prev => ({ ...prev, branchId: res.data[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedBranchId) params.append('branchId', selectedBranchId);
      params.append('month', selectedMonth.toString());
      params.append('year', selectedYear.toString());
      params.append('isTransfer', 'true'); // Only fetch transfers
      
      const response = await api.get(`/sales?${params.toString()}`);
      setTransfers(response.data);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentStock = async (bId: string, g: string) => {
    try {
      // Add timestamp to prevent caching
      const res = await api.get(`/branches/stocks?branchId=${bId}&grade=${g}&_t=${Date.now()}`);
      console.log(`[DEBUG] Stock for Grade ${g}:`, res.data);
      if (res.data && res.data.length > 0) {
        const qty = parseFloat(res.data[0].quantityKg);
        setCurrentStock(isNaN(qty) ? 0 : qty);
      } else {
        setCurrentStock(0);
      }
    } catch (error) {
      console.error('Error fetching current stock:', error);
      setCurrentStock(0);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.toBranchId) {
      showAlert('กรุณาเลือกสาขาปลายทาง', 'warning');
      return;
    }
    if (formData.branchId === formData.toBranchId) {
      showAlert('สาขาต้นทางและปลายทางต้องไม่ซ้ำกัน', 'warning');
      return;
    }

    try {
      const targetBranch = branches.find(b => b.id.toString() === formData.toBranchId);
      const payload = {
        ...formData,
        customerId: 'branch', // Mark as transfer
        customerName: `โอนย้ายไปสาขา ${targetBranch?.branchName}`,
        toBranchName: targetBranch?.branchName,
        quantityKg: parseFloat(formData.quantityKg),
        pricePerKg: 0, // Transfers have no price impact
        totalAmount: 0
      };
      
      await api.post('/sales', payload);
      setShowAdd(false);
      setFormData({ ...formData, toBranchId: '', quantityKg: '', note: '' });
      fetchTransfers();
      fetchBranches();
      showAlert('บันทึกการโอนย้ายสำเร็จ!', 'success');
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const handleCancel = async (id: number) => {
    showConfirm('ยืนยันการยกเลิกรายการโอนย้ายนี้? สต็อกจะถูกดึงกลับ', async () => {
      try {
        await api.post(`/sales/${id}/cancel`);
        showAlert('ยกเลิกรายการสำเร็จ', 'success');
        fetchTransfers();
        fetchBranches();
      } catch (error) {
        showAlert('เกิดข้อผิดพลาดในการยกเลิก', 'error');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-brand-light" />
            โอนย้ายสต็อกระหว่างสาขา
          </h3>
          <p className="text-sm text-neutral-400 mt-1">จัดการการเคลื่อนย้ายสินค้าระหว่างสาขาในเครือ</p>
        </div>
        {!showAdd && (
          <button 
            onClick={() => setShowAdd(true)}
            className="btn-primary flex items-center gap-2 px-6 py-3 shadow-lg shadow-brand-green/20"
          >
            <Plus size={18} />
            <span className="font-bold">สร้างการโอนย้ายใหม่</span>
          </button>
        )}
      </div>

      {showAdd && (
        <div className="card border border-brand-light/20 animate-in slide-in-from-top-4 duration-300 mb-8 overflow-hidden">
          <div className="bg-brand-light/5 border-b border-brand-light/10 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-light/10 flex items-center justify-center text-brand-light">
                <Plus size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold">บันทึกการโอนย้ายใหม่</h4>
                <p className="text-[10px] text-brand-light/60 uppercase tracking-widest font-bold">New Internal Transfer</p>
              </div>
            </div>
            <button 
              onClick={() => setShowAdd(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-white/10 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side: Logistics */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-brand-light mb-2">
                  <Building size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">ต้นทาง - ปลายทาง</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="form-group">
                    <label>สาขาต้นทาง (คลังสินค้า)</label>
                    <select 
                      required
                      className="w-full bg-black/40 border border-white/5 text-white rounded-xl px-4 py-3 focus:border-brand-light/50 transition-all"
                      value={formData.branchId}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({...prev, branchId: val}));
                      }}
                    >
                      <option value="">เลือกสาขาต้นทาง...</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.branchName}</option>)}
                    </select>
                  </div>

                  <div className="flex justify-center md:pt-6">
                    <div className="w-10 h-10 rounded-full bg-brand-light/10 flex items-center justify-center text-brand-light border border-brand-light/20">
                      <ArrowRight size={20} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>สาขาปลายทาง (ผู้รับ)</label>
                    <select 
                      required
                      className="w-full bg-brand-light/10 border border-brand-light/30 text-brand-light rounded-xl px-4 py-3 focus:border-brand-light transition-all font-bold"
                      value={formData.toBranchId}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({...prev, toBranchId: val}));
                      }}
                    >
                      <option value="">-- เลือกสาขาปลายทาง --</option>
                      {branches
                        .filter(b => b.id.toString() !== formData.branchId)
                        .map(b => <option key={b.id} value={b.id}>{b.branchName}</option>)
                      }
                    </select>
                  </div>

                  <div className="form-group">
                    <label>วันที่โอนย้าย</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={formData.saleDate}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({...prev, saleDate: val}));
                      }}
                      className="w-full bg-black/40 border border-white/5 text-white rounded-xl px-4 py-3 [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {/* Right Side: Product & Stock */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-brand-light mb-2">
                  <Layers size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">รายละเอียดสินค้า</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>เกรดสินค้า</label>
                    <div className="flex gap-2">
                      {['A', 'B', 'C'].map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFormData(prev => ({...prev, grade: g}))}
                          className={`flex-1 py-3 rounded-xl font-bold transition-all border ${formData.grade === g ? 'bg-brand-light border-brand-light text-black shadow-lg shadow-brand-light/20' : 'bg-black/40 border-white/5 text-neutral-500 hover:text-white hover:border-white/20'}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="flex justify-between items-end">
                      <span>น้ำหนักที่โอน (กก.)</span>
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({...prev, quantityKg: currentStock.toString()}))}
                        className="text-[10px] text-brand-light hover:text-white transition-colors font-black uppercase tracking-tighter"
                      >
                        คงเหลือ: {currentStock.toLocaleString()} กก. (ใช้ทั้งหมด)
                      </button>
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        required
                        placeholder="0.00"
                        className="w-full bg-black/40 border border-white/5 text-white rounded-xl px-4 py-3 pr-12 focus:border-brand-light/50"
                        value={formData.quantityKg}
                        onChange={e => {
                          const val = e.target.value;
                          setFormData(prev => ({...prev, quantityKg: val}));
                        }}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-bold">KG</span>
                    </div>
                  </div>
                </div>

                {/* Stock Warning Box */}
                <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neutral-400">
                      <Building size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">สต็อกปัจจุบัน (ต้นทาง)</div>
                      <div className={`text-xl font-black ${currentStock > 0 ? 'text-white' : 'text-red-500'}`}>
                        {currentStock.toLocaleString()} <span className="text-xs font-normal text-neutral-500 ml-1">กก.</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">เกรดที่เลือก</div>
                    <div className="text-xl font-black text-brand-light">{formData.grade}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>หมายเหตุการโอนย้าย</label>
              <textarea 
                className="w-full bg-black/40 border border-white/5 text-white rounded-xl px-4 py-3 focus:border-brand-light/50 transition-all h-20"
                placeholder="ระบุเหตุผลการโอนย้าย หรือรายละเอียดอื่นๆ..."
                value={formData.note}
                onChange={e => {
                  const val = e.target.value;
                  setFormData(prev => ({...prev, note: val}));
                }}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5 items-center">
              {parseFloat(formData.quantityKg || '0') > currentStock && (
                <p className="text-red-500 text-[10px] font-bold animate-pulse mr-auto">จำนวนที่โอนเกินสต็อกคงเหลือ!</p>
              )}
              <button 
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-8 py-3 rounded-xl text-neutral-400 font-bold hover:bg-white/5 transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button 
                type="submit" 
                disabled={parseFloat(formData.quantityKg || '0') > currentStock || !formData.quantityKg || !formData.toBranchId}
                className={`px-10 py-3 bg-brand-green text-white rounded-xl font-bold shadow-lg shadow-brand-green/20 hover:scale-105 hover:bg-brand-light hover:text-black transition-all flex items-center gap-2 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale disabled:hover:scale-100`}
              >
                <Save className="w-5 h-5" /> ยืนยันการโอนย้าย
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 mt-8">
        <h3 className="text-[15px] font-bold text-white uppercase tracking-wider pl-1 flex items-center gap-2">
          <History className="text-brand-light" size={18} /> ประวัติการโอนย้ายสินค้า
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-900/50 p-1 rounded-xl border border-white/5 shadow-inner">
            <div className="flex items-center gap-2 px-3 py-1.5 text-neutral-400">
              <Calendar size={14} />
            </div>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent text-white text-xs font-bold border-none outline-none pr-8 py-1.5 focus:ring-0"
            >
              {months.map(m => <option key={m.value} value={m.value} className="bg-neutral-900">{m.label}</option>)}
            </select>
            <div className="w-px h-4 bg-white/10"></div>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-white text-xs font-bold border-none outline-none pr-8 py-1.5 focus:ring-0"
            >
              {years.map(y => <option key={y} value={y} className="bg-neutral-900">{y}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-black/20 p-1 rounded-xl border border-white/5 shadow-inner">
            <button
              onClick={() => setSelectedBranchId('')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedBranchId === '' 
                  ? 'bg-brand-green text-white shadow-lg' 
                  : 'text-neutral-500 hover:text-white hover:bg-white/5'
              }`}
            >
              ทุกสาขา
            </button>
            {branches.map(branch => (
              <button
                key={branch.id}
                onClick={() => setSelectedBranchId(branch.id.toString())}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedBranchId === branch.id.toString() 
                    ? 'bg-brand-green text-white shadow-lg' 
                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {branch.branchName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>เลขที่รายการ</th>
              <th>วันที่</th>
              <th>ต้นทาง</th>
              <th>ปลายทาง</th>
              <th>เกรด</th>
              <th className="text-right">จำนวน (กก.)</th>
              <th>สถานะ</th>
              <th className="text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-neutral-500">กำลังโหลด...</td></tr>
            ) : transfers.length > 0 ? transfers.map(transfer => (
              <tr key={transfer.id} className={transfer.status === 'cancelled' ? 'opacity-40 grayscale' : ''}>
                <td className="font-mono text-xs text-white">{transfer.saleNo}</td>
                <td className="text-neutral-400 text-xs">{new Date(transfer.saleDate).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                <td className="text-neutral-300 text-sm">{transfer.branch.branchName}</td>
                <td className="text-white font-medium flex items-center gap-2">
                  <ArrowRight size={14} className="text-brand-light" />
                  {transfer.toBranch?.branchName || '-'}
                </td>
                <td><span className={`badge ${transfer.grade === 'A' ? 'badge-green' : transfer.grade === 'B' ? 'badge-yellow' : 'badge-red'}`}>{transfer.grade}</span></td>
                <td className="text-right font-mono text-white">{Number(transfer.quantityKg).toLocaleString()}</td>
                <td>
                  <span className={`badge ${transfer.status === 'completed' ? 'badge-green' : 'badge-gray'}`}>
                    {transfer.status === 'completed' ? 'สำเร็จ' : 'ยกเลิกแล้ว'}
                  </span>
                </td>
                <td className="text-right">
                  {transfer.status !== 'cancelled' && (
                    <button 
                      onClick={() => handleCancel(transfer.id)}
                      className="p-2 text-neutral-500 hover:text-red-500 transition-colors"
                      title="ยกเลิกรายการ"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="text-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <History className="w-10 h-10 text-neutral-700" />
                    <p className="text-neutral-500 text-sm italic">ไม่พบประวัติการโอนย้ายในช่วงเวลาที่เลือก</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockTransfer;
