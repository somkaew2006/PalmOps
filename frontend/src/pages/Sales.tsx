import { useEffect, useState } from 'react';
import api from '../api/axios';
import { ShoppingCart, Plus, Save, X, Building, User, Calendar } from 'lucide-react';

interface Branch {
  id: number;
  branchName: string;
  stocks: { grade: string; quantityKg: number }[];
}

interface Sale {
  id: number;
  saleNo: string;
  branchId: number;
  customerName: string;
  saleDate: string;
  grade: string;
  quantityKg: number;
  pricePerKg: number;
  totalAmount: number;
  status: string;
  branch: { branchName: string };
}

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    branchId: '',
    customerName: '',
    saleDate: new Date().toISOString().slice(0, 16),
    grade: 'A',
    quantityKg: '',
    pricePerKg: '',
    note: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, bRes] = await Promise.all([
        api.get('/sales'),
        api.get('/branches')
      ]);
      setSales(sRes.data);
      setBranches(bRes.data);
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
      setFormData({ ...formData, customerName: '', quantityKg: '', pricePerKg: '', note: '' });
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
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-brand-light" />
          รายการขายสินค้าออก (ส่งโรงสกัด)
        </h3>
        {!showAdd && (
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> บันทึกการขาย
          </button>
        )}
      </div>

      {showAdd && (
        <div className="card border border-brand-light/20 animate-in slide-in-from-top-4 duration-300 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-white font-bold">บันทึกการขายออก</h4>
            <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-neutral-500" /></button>
          </div>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="form-group">
                <label className="flex items-center gap-1.5"><Building className="w-3 h-3" /> สาขาที่ขาย</label>
                <select 
                  required
                  className="w-full bg-[#141414] border border-neutral-800 text-white rounded-xl px-4 py-2"
                  value={formData.branchId}
                  onChange={e => setFormData({...formData, branchId: e.target.value})}
                >
                  <option value="">เลือกสาขา...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.branchName}</option>)}
                </select>
                <div className="mt-2 p-2 bg-brand-light/5 border border-brand-light/10 rounded-lg">
                  <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">สต็อกคงเหลือเกรด {formData.grade}</div>
                  <div className="text-sm text-emerald-400 font-bold">{Number(currentStock).toLocaleString()} กก.</div>
                </div>
              </div>
              <div className="form-group">
                <label className="flex items-center gap-1.5"><User className="w-3 h-3" /> ชื่อลูกค้า/โรงงาน</label>
                <input 
                  type="text" 
                  required
                  value={formData.customerName}
                  onChange={e => setFormData({...formData, customerName: e.target.value})}
                  placeholder="เช่น โรงงาน A"
                />
              </div>
              <div className="form-group">
                <label className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> วันที่ขาย</label>
                <input 
                  type="datetime-local" 
                  required
                  value={formData.saleDate}
                  onChange={e => setFormData({...formData, saleDate: e.target.value})}
                  className="[color-scheme:dark]"
                />
              </div>
              <div className="form-group">
                <label>เกรดสินค้า</label>
                <select 
                  className="w-full bg-[#141414] border border-neutral-800 text-white rounded-xl px-4 py-2"
                  value={formData.grade}
                  onChange={e => setFormData({...formData, grade: e.target.value})}
                >
                  <option value="A">เกรด A</option>
                  <option value="B">เกรด B</option>
                  <option value="C">เกรด C</option>
                </select>
              </div>
              <div className="form-group">
                <label>จำนวนที่ขาย (กก.)</label>
                <input 
                  type="number" 
                  required
                  value={formData.quantityKg}
                  onChange={e => setFormData({...formData, quantityKg: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>ราคาต่อหน่วย (บาท)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.pricePerKg}
                  onChange={e => setFormData({...formData, pricePerKg: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group lg:col-span-2 flex items-end gap-4">
                <div className="flex-1">
                  <label>รวมยอดเงิน (บาท)</label>
                  <div className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-lg font-bold text-brand-light">
                    {Number(parseFloat(formData.quantityKg || '0') * parseFloat(formData.pricePerKg || '0')).toLocaleString()} ฿
                  </div>
                </div>
                <button type="submit" className="btn-primary py-2.5 px-8 font-bold flex items-center gap-2">
                  <Save className="w-4 h-4" /> บันทึกการขาย
                </button>
              </div>
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
