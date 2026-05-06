import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, DollarSign, Tag, Layers, Calendar } from 'lucide-react';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

interface Branch {
  id: number;
  branchName: string;
}

interface Product {
  id: number;
  name: string;
  groupId: number;
}

interface ProductGroup {
  id: number;
  name: string;
  products: Product[];
}

interface Expense {
  id: number;
  expenseDate: string;
  description: string;
  quantity: number | null;
  pricePerUnit: number | null;
  amount: number;
  note: string | null;
  branch: { branchName: string };
  product?: {
    name: string;
    group: { name: string };
  };
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { showAlert, showConfirm } = useNotification();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // Filters
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const months = [
    { value: 1, label: 'มกราคม' }, { value: 2, label: 'กุมภาพันธ์' }, { value: 3, label: 'มีนาคม' },
    { value: 4, label: 'เมษายน' }, { value: 5, label: 'พฤษภาคม' }, { value: 6, label: 'มิถุนายน' },
    { value: 7, label: 'กรกฎาคม' }, { value: 8, label: 'สิงหาคม' }, { value: 9, label: 'กันยายน' },
    { value: 10, label: 'ตุลาคม' }, { value: 11, label: 'พฤศจิกายน' }, { value: 12, label: 'ธันวาคม' },
  ];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  
  // New Expense Form
  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
    quantity: '',
    pricePerUnit: '',
    amount: '',
    note: '',
    branchId: '',
    productGroupId: '',
    productId: ''
  });

  useEffect(() => {
    fetchBranches();
    fetchProductGroups();
  }, []);

  useEffect(() => {
    fetchExpenses();
    setCurrentPage(1);
  }, [selectedBranchId, selectedMonth, selectedYear]);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
      if (response.data.length > 0 && !formData.branchId) {
        setFormData(prev => ({ ...prev, branchId: response.data[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchProductGroups = async () => {
    try {
      const response = await api.get('master-data/groups');
      setProductGroups(response.data);
    } catch (error) {
      console.error('Error fetching product groups:', error);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranchId) params.append('branchId', selectedBranchId);
      params.append('month', selectedMonth.toString());
      params.append('year', selectedYear.toString());
      
      const response = await api.get(`/expenses?${params.toString()}`);
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'productGroupId') {
      const group = productGroups.find(g => g.id.toString() === value);
      setAvailableProducts(group ? group.products : []);
      setFormData(prev => ({ ...prev, productGroupId: value, productId: '' }));
      return;
    }

    if (name === 'productId') {
      const product = availableProducts.find(p => p.id.toString() === value);
      setFormData(prev => ({ 
        ...prev, 
        productId: value,
        description: product ? product.name : prev.description 
      }));
      return;
    }

    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-calculate amount if quantity and price are provided
      if ((name === 'quantity' || name === 'pricePerUnit') && newData.quantity && newData.pricePerUnit) {
        const qty = parseFloat(newData.quantity);
        const price = parseFloat(newData.pricePerUnit);
        if (!isNaN(qty) && !isNaN(price)) {
          newData.amount = (qty * price).toString();
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses', formData);
      setShowForm(false);
      setFormData({
        expenseDate: new Date().toISOString().split('T')[0],
        description: '',
        quantity: '',
        pricePerUnit: '',
        amount: '',
        note: '',
        branchId: branches[0]?.id.toString() || '',
        productGroupId: '',
        productId: ''
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error creating expense:', error);
      showAlert('เกิดข้อผิดพลาดในการบันทึกรายจ่าย', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    showConfirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? ข้อมูลที่ลบแล้วจะไม่สามารถกู้คืนได้', async () => {
      try {
        await api.delete(`expenses/${id}`);
        showAlert('ลบรายการสำเร็จ!', 'success');
        fetchExpenses();
      } catch (error: any) {
        console.error('[ERROR] Delete expense failed:', error);
        const msg = error.response?.data?.message || error.message;
        showAlert('ลบไม่สำเร็จ: ' + msg, 'error');
      }
    });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = expenses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(expenses.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month/Year Filters */}
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

        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-2 px-6 py-3"
        >
          <Plus size={18} />
          <span>บันทึกรายจ่ายใหม่</span>
        </button>
      </div>

      {showForm && (
        <div className="form-card animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="form-card-title">
            <FileText size={18} className="mr-2" /> รายละเอียดรายจ่าย
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="form-group">
              <label>วันที่</label>
              <input 
                type="date" 
                name="expenseDate"
                required 
                value={formData.expenseDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>สาขา</label>
              <select 
                name="branchId" 
                required 
                value={formData.branchId}
                onChange={handleInputChange}
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.branchName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>กลุ่มสินค้า/บริการ</label>
              <select 
                name="productGroupId" 
                value={formData.productGroupId}
                onChange={handleInputChange}
              >
                <option value="">-- เลือกกลุ่ม --</option>
                {productGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>สินค้า/บริการ</label>
              <select 
                name="productId" 
                value={formData.productId}
                onChange={handleInputChange}
                disabled={!formData.productGroupId}
              >
                <option value="">-- เลือกสินค้า --</option>
                {availableProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group md:col-span-1">
              <label>ชื่อรายการ (ระบุเพิ่มเติม)</label>
              <input 
                type="text" 
                name="description"
                placeholder="ระบุรายละเอียดรายจ่าย" 
                required 
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>น้ำหนัก/จำนวน (หน่วย)</label>
              <input 
                type="number" 
                step="any"
                name="quantity"
                placeholder="0.00" 
                value={formData.quantity}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>ราคาต่อหน่วย (บาท)</label>
              <input 
                type="number" 
                step="any"
                name="pricePerUnit"
                placeholder="0.00" 
                value={formData.pricePerUnit}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>เงินจ่ายรวม (บาท)</label>
              <input 
                type="number" 
                step="any"
                name="amount"
                required 
                placeholder="0.00" 
                value={formData.amount}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group md:col-span-3">
              <label>หมายเหตุ</label>
              <textarea 
                name="note"
                className="w-full px-3.5 py-2.5 border border-[var(--color-border-dark)] rounded-xl text-sm bg-[var(--color-bg-main)] text-neutral-200"
                placeholder="ระบุรายละเอียดเพิ่มเติม..."
                value={formData.note}
                onChange={handleInputChange}
              />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="btn btn-outline"
              >
                ยกเลิก
              </button>
              <button type="submit" className="btn btn-primary px-8">
                บันทึกรายการ
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-wrap">
        <div className="p-6 border-b border-neutral-800 bg-black/10 flex items-center justify-between">
          <h3 className="text-white font-bold flex items-center gap-2">
            <DollarSign size={18} className="text-brand-amber" />
            รายการค่าใช้จ่าย
          </h3>
          <div className="text-xs text-neutral-500 font-medium">
            ทั้งหมด {expenses.length} รายการ
          </div>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>กลุ่ม / สินค้า</th>
                <th>รายละเอียด</th>
                <th>สาขา</th>
                <th className="text-right">ปริมาณ</th>
                <th className="text-right">ราคา/หน่วย</th>
                <th className="text-right">จำนวนเงิน (บาท)</th>
                <th className="text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-neutral-500 animate-pulse">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-neutral-600 italic">ไม่พบข้อมูลรายจ่าย</td>
                </tr>
              ) : currentItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm">{new Date(item.expenseDate).toLocaleDateString('th-TH')}</td>
                  <td className="px-6 py-4">
                    {item.product ? (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-brand-light uppercase tracking-tighter flex items-center gap-1">
                          <Layers size={10} /> {item.product.group.name}
                        </span>
                        <span className="font-bold text-white flex items-center gap-1">
                          <Tag size={12} className="text-neutral-500" /> {item.product.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-neutral-500 italic text-xs">ไม่ได้ระบุ</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-300">{item.description}</div>
                    {item.note && <div className="text-[10px] text-neutral-500">{item.note}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="badge badge-gray">{item.branch.branchName}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    {item.quantity ? Number(item.quantity).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    {item.pricePerUnit ? Number(item.pricePerUnit).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-brand-amber">
                    {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="inline-flex items-center justify-center w-10 h-10 text-red-500 hover:bg-red-500/10 transition-all cursor-pointer relative z-[10] rounded-xl border border-red-500/20 active:scale-95"
                      title="ลบรายการ"
                    >
                      <Trash2 size={18} className="pointer-events-none" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {expenses.length > 0 && (
              <tfoot>
                <tr className="bg-black/20 font-bold">
                  <td colSpan={6} className="px-6 py-4 text-right text-neutral-400 uppercase tracking-widest text-[10px]">ยอดรวมทั้งสิ้น (ในหน้าจอนี้)</td>
                  <td className="px-6 py-4 text-right text-brand-light text-lg">
                    {currentItems.reduce((sum, item) => sum + Number(item.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
                <tr className="bg-brand-light/5 font-bold border-t border-brand-light/10">
                  <td colSpan={6} className="px-6 py-4 text-right text-brand-light uppercase tracking-widest text-[11px]">ยอดรวมสุทธิทั้งหมด ({expenses.length} รายการ)</td>
                  <td className="px-6 py-4 text-right text-white text-xl">
                    {expenses.reduce((sum, item) => sum + Number(item.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
            <div className="text-xs text-neutral-500">
              แสดง {indexOfFirstItem + 1} ถึง {Math.min(indexOfLastItem, expenses.length)} จากทั้งหมด {expenses.length} รายการ
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

export default Expenses;
