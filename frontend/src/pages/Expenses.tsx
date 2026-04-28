import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, DollarSign, Tag, Layers } from 'lucide-react';
import api from '../api/axios';

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
  
  // Filters
  const [selectedBranchId, setSelectedBranchId] = useState('');
  
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
    fetchExpenses();
  }, [selectedBranchId]);

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
      const url = selectedBranchId 
        ? `/expenses?branchId=${selectedBranchId}`
        : '/expenses';
      const response = await api.get(url);
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
      alert('เกิดข้อผิดพลาดในการบันทึกรายจ่าย');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('ยืนยันการลบรายการนี้?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <select 
            className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-brand-light"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            <option value="">ทุกสาขา</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.branchName}</option>
            ))}
          </select>
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
              ) : expenses.map((item) => (
                <tr key={item.id}>
                  <td className="text-sm">{new Date(item.expenseDate).toLocaleDateString('th-TH')}</td>
                  <td>
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
                  <td>
                    <div className="text-sm text-neutral-300">{item.description}</div>
                    {item.note && <div className="text-[10px] text-neutral-500">{item.note}</div>}
                  </td>
                  <td>
                    <span className="badge badge-gray">{item.branch.branchName}</span>
                  </td>
                  <td className="text-right text-sm">
                    {item.quantity ? Number(item.quantity).toLocaleString() : '-'}
                  </td>
                  <td className="text-right text-sm">
                    {item.pricePerUnit ? Number(item.pricePerUnit).toLocaleString() : '-'}
                  </td>
                  <td className="text-right font-black text-brand-amber">
                    {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="text-center">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-neutral-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {expenses.length > 0 && (
              <tfoot>
                <tr className="bg-black/20 font-bold">
                  <td colSpan={6} className="text-right py-4 text-neutral-400 uppercase tracking-widest text-[10px]">ยอดรวมทั้งสิ้น</td>
                  <td className="text-right py-4 text-brand-light text-lg">
                    {expenses.reduce((sum, item) => sum + Number(item.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
