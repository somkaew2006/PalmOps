import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Building, Plus, Save, X, Edit2 } from 'lucide-react';

interface Stock {
  grade: string;
  quantityKg: number;
}

interface Branch {
  id: number;
  branchCode: string;
  branchName: string;
  address: string;
  phone: string;
  isActive: boolean;
  stocks: Stock[];
}

const Branches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    branchCode: '',
    branchName: '',
    address: '',
    phone: '',
    isActive: true
  });

  useEffect(() => {
    fetchBranches();
    
    const handleToggle = () => setShowForm(prev => !prev);
    window.addEventListener('toggleBranchForm', handleToggle);
    return () => window.removeEventListener('toggleBranchForm', handleToggle);
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setFormData({
      branchCode: branch.branchCode,
      branchName: branch.branchName,
      address: branch.address || '',
      phone: branch.phone || '',
      isActive: branch.isActive
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Saving branch with data:', formData);
      if (editingId) {
        await api.put(`/branches/${editingId}`, formData);
      } else {
        await api.post('/branches', formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ branchCode: '', branchName: '', address: '', phone: '', isActive: true });
      fetchBranches();
    } catch (error) {
      console.error('Error saving branch:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ branchCode: '', branchName: '', address: '', phone: '', isActive: true });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Building className="w-5 h-5 text-brand-light" />
          รายการสาขาและสต็อกสินค้า
        </h3>
      </div>

      {showForm && (
        <div className="card border border-brand-light/20 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-white font-bold">{editingId ? 'แก้ไขข้อมูลสาขา' : 'เพิ่มสาขาใหม่'}</h4>
            <button onClick={cancelForm} className="text-neutral-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="form-group">
              <label>รหัสสาขา</label>
              <input 
                type="text" 
                required 
                value={formData.branchCode}
                onChange={e => setFormData({...formData, branchCode: e.target.value})}
                placeholder="เช่น BR001"
              />
            </div>
            <div className="form-group">
              <label>ชื่อสาขา</label>
              <input 
                type="text" 
                required 
                value={formData.branchName}
                onChange={e => setFormData({...formData, branchName: e.target.value})}
                placeholder="เช่น สาขาหลัก"
              />
            </div>
            <div className="form-group">
              <label>เบอร์โทรศัพท์</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="0xx-xxx-xxxx"
              />
            </div>
            <div className="form-group">
              <label className="flex items-center gap-2 cursor-pointer py-2">
                <input 
                  type="checkbox" 
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 accent-brand-light"
                />
                <span className="text-sm text-white font-medium">เปิดใช้งานสาขา</span>
              </label>
            </div>
            <div className="form-group md:col-span-2 lg:col-span-3">
              <label>ที่อยู่</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                placeholder="ระบุที่อยู่สาขา..."
              />
            </div>
            <div className="form-group">
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 font-bold">
                  <Save className="w-4 h-4" /> บันทึก
                </button>
                <button type="button" onClick={cancelForm} className="btn-outline py-2.5 px-4 text-sm font-medium">
                  ยกเลิก
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-neutral-500">กำลังโหลดข้อมูล...</div>
        ) : branches.length > 0 ? branches.map(branch => (
          <div key={branch.id} className="card hover:border-brand-light/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  {branch.branchName}
                  <button 
                    onClick={() => handleEdit(branch)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-xl transition-all text-neutral-400 hover:text-brand-light"
                    title="แก้ไขสาขา"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </h4>
                <div className="text-sm text-neutral-400">รหัส: {branch.branchCode}</div>
              </div>
              <span className={`badge ${branch.isActive ? 'badge-green' : 'badge-gray'}`}>
                {branch.isActive ? 'เปิดบริการ' : 'ปิดบริการ'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {['A', 'B', 'C'].map(grade => {
                const stock = branch.stocks?.find(s => s.grade === grade);
                return (
                  <div key={grade} className="bg-black/20 rounded-xl p-3 border border-white/5 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">เกรด {grade}</div>
                    <div className="text-lg font-mono text-emerald-400 font-bold">
                      {Number(stock?.quantityKg || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-neutral-600">กก.</div>
                  </div>
                );
              })}
            </div>

            <div className="text-sm text-neutral-500 flex flex-col gap-1">
              {branch.phone && <div>📞 {branch.phone}</div>}
              {branch.address && <div className="truncate">📍 {branch.address}</div>}
            </div>
          </div>
        )) : (
          <div className="col-span-full p-12 text-center text-neutral-500 border border-dashed border-white/10 rounded-2xl">
            ยังไม่มีข้อมูลสาขา
          </div>
        )}
      </div>
    </div>
  );
};

export default Branches;
