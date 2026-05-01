import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ShoppingCart, Plus, Save, X, Building, User, Scale } from 'lucide-react';

interface Branch {
  id: number;
  branchName: string;
  stocks: { grade: string; quantityKg: number }[];
}

interface Sale {
  id: number;
  saleNo: string;
  branchId: number;
  customerId: number | null;
  customerName: string;
  saleDate: string;
  grade: string;
  quantityKg: number;
  pricePerKg: number;
  totalAmount: number;
  status: string;
  branch: { branchName: string };
  customer?: { name: string };
}

interface Customer {
  id: number;
  name: string;
}

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    branchId: '',
    customerId: '',
    customerName: '',
    saleDate: new Date().toISOString().slice(0, 16),
    grade: 'A',
    quantityKg: '',
    pricePerKg: '',
    note: ''
  });

  useEffect(() => {
    fetchData();
    
    const handleToggle = () => setShowAdd(prev => !prev);
    window.addEventListener('toggleSaleForm', handleToggle);
    return () => window.removeEventListener('toggleSaleForm', handleToggle);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, bRes, cRes] = await Promise.all([
        api.get('/sales'),
        api.get('/branches'),
        api.get('/customers')
      ]);
      setSales(sRes.data);
      setBranches(bRes.data);
      setCustomers(cRes.data);
      if (bRes.data.length > 0 && !formData.branchId) {
        setFormData(prev => ({ ...prev, branchId: bRes.data[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        quantityKg: parseFloat(formData.quantityKg),
        pricePerKg: parseFloat(formData.pricePerKg),
        totalAmount: parseFloat(formData.quantityKg) * parseFloat(formData.pricePerKg)
      };
      await api.post('/sales', payload);
      setShowAdd(false);
      setFormData({ ...formData, customerId: '', customerName: '', quantityKg: '', pricePerKg: '', note: '' });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('ยืนยันการยกเลิกรายการขายนี้? สต็อกจะถูกคืนเข้าสาขา')) return;
    try {
      await api.post(`/sales/${id}/cancel`);
      fetchData();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการยกเลิก');
    }
  };

  const selectedBranch = branches.find(b => b.id.toString() === formData.branchId);
  const currentStock = selectedBranch?.stocks.find(s => s.grade === formData.grade)?.quantityKg || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-brand-light" />
            บันทึกการขายสินค้าออก
          </h3>
          <p className="text-sm text-neutral-400 mt-1">จัดการรายการส่งสินค้าออกไปยังโรงสกัดและลูกค้าภายนอก</p>
        </div>
      </div>

      {showAdd && (
        <div className="card border border-brand-light/20 animate-in slide-in-from-top-4 duration-300 mb-8 overflow-hidden">
          <div className="bg-brand-light/5 border-b border-brand-light/10 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-light/10 flex items-center justify-center text-brand-light">
                <Plus size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold">บันทึกรายการขายใหม่</h4>
                <p className="text-[10px] text-brand-light/60 uppercase tracking-widest font-bold">New Sale Transaction</p>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Section 1: Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-brand-light mb-2">
                  <Building size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">ข้อมูลพื้นฐาน</span>
                </div>
                
                <div className="form-group">
                  <label>สาขาที่ดำเนินการ</label>
                  <select 
                    required
                    className="w-full bg-black/40 border border-white/5 text-white rounded-xl px-4 py-3 focus:border-brand-light/50 transition-all"
                    value={formData.branchId}
                    onChange={e => setFormData({...formData, branchId: e.target.value})}
                  >
                    <option value="">เลือกสาขา...</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.branchName}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>วันที่ดำเนินการ</label>
                  <div className="relative">
                    <input 
                      type="datetime-local" 
                      required
                      value={formData.saleDate}
                      onChange={e => setFormData({...formData, saleDate: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 text-white rounded-xl px-4 py-3 [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Customer & Product */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-brand-light mb-2">
                  <User size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">ข้อมูลลูกค้าและเกรด</span>
                </div>

                <div className="form-group">
                  <label>เลือกชื่อลูกค้า / โรงงานปลายทาง</label>
                  <select 
                    required
                    value={formData.customerId}
                    onChange={e => {
                      const cust = customers.find(c => c.id.toString() === e.target.value);
                      setFormData({
                        ...formData, 
                        customerId: e.target.value,
                        customerName: cust ? cust.name : ''
                      });
                    }}
                    className="w-full bg-black/40 border border-white/5 text-white rounded-xl px-4 py-3 focus:border-brand-light/50 transition-all"
                  >
                    <option value="">-- เลือกบริษัท / โรงงาน --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option value="other">อื่น ๆ (ระบุเอง)</option>
                  </select>
                </div>

                {formData.customerId === 'other' && (
                  <div className="form-group animate-in fade-in slide-in-from-top-2 duration-200">
                    <label>ระบุชื่อลูกค้า (กรณีไม่มีในระบบ)</label>
                    <input 
                      type="text" 
                      required
                      value={formData.customerName}
                      onChange={e => setFormData({...formData, customerName: e.target.value})}
                      placeholder="ระบุชื่อโรงงาน หรือลูกค้า..."
                      className="w-full bg-black/40 border border-white/5 text-white rounded-xl px-4 py-3"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>เกรดสินค้า</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['A', 'B', 'C'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData({...formData, grade: g})}
                        className={`py-2 rounded-xl border transition-all font-bold ${
                          formData.grade === g 
                            ? 'bg-brand-light text-black border-brand-light shadow-lg shadow-brand-light/20' 
                            : 'bg-black/20 text-neutral-400 border-white/5 hover:border-white/20'
                        }`}
                      >
                        เกรด {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3: Quantity & Price */}
              <div className="bg-white/5 rounded-2xl p-6 space-y-4 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <ShoppingCart size={80} />
                </div>
                
                <div className="flex items-center gap-2 text-brand-light mb-2">
                  <Scale size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">รายละเอียดจำนวนและราคา</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>จำนวน (กก.)</label>
                    <input 
                      type="number" 
                      required
                      value={formData.quantityKg}
                      onChange={e => setFormData({...formData, quantityKg: e.target.value})}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/5 text-white rounded-xl px-4 py-3 font-mono"
                    />
                  </div>
                  <div className="form-group">
                    <label>ราคา/กก. (บาท)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={formData.pricePerKg}
                      onChange={e => setFormData({...formData, pricePerKg: e.target.value})}
                      placeholder="0.00"
                      className="w-full bg-black/40 border border-white/5 text-white rounded-xl px-4 py-3 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-neutral-400">สต็อกคงเหลือปัจจุบัน:</span>
                    <span className="text-sm text-emerald-400 font-bold">{Number(currentStock).toLocaleString()} กก.</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 mb-1 uppercase font-bold tracking-widest">ยอดรวมสุทธิ (Net Total)</div>
                  <div className="text-3xl font-black text-brand-light flex items-baseline gap-2">
                    {Number(parseFloat(formData.quantityKg || '0') * parseFloat(formData.pricePerKg || '0')).toLocaleString()}
                    <span className="text-sm font-bold opacity-50">฿</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5 gap-3">
              <button 
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-6 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-all"
              >
                ยกเลิก
              </button>
              <button 
                type="submit" 
                className="px-10 py-3 bg-gradient-to-r from-brand-green to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-brand-green/20 hover:scale-105 transition-all flex items-center gap-2"
              >
                <Save className="w-5 h-5" /> ยืนยันบันทึกการขายออก
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>เลขที่รายการ</th>
              <th>วันที่</th>
              <th>สาขา</th>
              <th>ลูกค้า</th>
              <th>เกรด</th>
              <th className="text-right">จำนวน (กก.)</th>
              <th className="text-right">ราคา/กก.</th>
              <th className="text-right">ยอดรวม</th>
              <th>สถานะ</th>
              <th className="text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-12 text-neutral-500">กำลังโหลด...</td></tr>
            ) : sales.length > 0 ? sales.map(sale => (
              <tr key={sale.id} className={sale.status === 'cancelled' ? 'opacity-40 grayscale' : ''}>
                <td className="font-mono text-xs text-white">{sale.saleNo}</td>
                <td className="text-neutral-400 text-xs">{new Date(sale.saleDate).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                <td className="text-neutral-300 text-sm">{sale.branch.branchName}</td>
                <td className="text-white font-medium">{sale.customerName}</td>
                <td><span className={`badge ${sale.grade === 'A' ? 'badge-green' : sale.grade === 'B' ? 'badge-yellow' : 'badge-red'}`}>{sale.grade}</span></td>
                <td className="text-right font-mono text-white">{Number(sale.quantityKg).toLocaleString()}</td>
                <td className="text-right text-neutral-400">{Number(sale.pricePerKg).toFixed(2)}</td>
                <td className="text-right font-bold text-brand-light">{Number(sale.totalAmount).toLocaleString()} ฿</td>
                <td>
                  <span className={`badge ${sale.status === 'completed' ? 'badge-green' : 'badge-gray'}`}>
                    {sale.status === 'completed' ? 'สำเร็จ' : 'ยกเลิกแล้ว'}
                  </span>
                </td>
                <td className="text-right">
                  {sale.status === 'completed' && (
                    <button onClick={() => handleCancel(sale.id)} className="text-red-400 hover:text-red-300 text-xs font-medium hover:underline">
                      ยกเลิก
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={10} className="text-center py-12 text-neutral-500">ไม่พบรายการขาย</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;
