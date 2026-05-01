import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { User, Plus, Search, Trash2, Edit2, Save, X, Phone, MapPin } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  note: string | null;
  isActive: boolean;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    note: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      setShowModal(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', address: '', note: '' });
      fetchCustomers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      note: customer.note || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`ยืนยันการลบข้อมูลลูกค้า "${name}"?`)) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="text-brand-light" /> จัดการข้อมูลลูกค้าและโรงงาน
          </h2>
          <p className="text-sm text-neutral-400">กำหนดรายชื่อลูกค้าและโรงงานปลายทางสำหรับการขายสินค้าออก</p>
        </div>
        <button 
          onClick={() => {
            setEditingCustomer(null);
            setFormData({ name: '', phone: '', address: '', note: '' });
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> เพิ่มลูกค้าใหม่
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหาชื่อลูกค้า หรือ โรงงาน..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:border-brand-light focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="p-12 text-center text-neutral-500">กำลังโหลดข้อมูลลูกค้า...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ชื่อลูกค้า / โรงงานปลายทาง</th>
                <th>เบอร์โทรศัพท์</th>
                <th>ที่อยู่ / หมายเหตุ</th>
                <th className="text-center">สถานะ</th>
                <th className="text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
                <tr key={customer.id}>
                  <td>
                    <div className="font-bold text-white">{customer.name}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Phone size={14} /> {customer.phone || '-'}
                    </div>
                  </td>
                  <td className="max-w-xs">
                    <div className="flex items-start gap-2 text-neutral-400 text-xs">
                      <MapPin size={14} className="mt-0.5 shrink-0" />
                      <span className="truncate">{customer.address || customer.note || '-'}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className={`badge ${customer.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {customer.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(customer)}
                        className="p-2 text-neutral-400 hover:text-brand-light hover:bg-brand-light/10 rounded-lg transition-all"
                        title="แก้ไข"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(customer.id, customer.name)}
                        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="ลบ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-neutral-500 italic">ไม่พบข้อมูลลูกค้า</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-black/20 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {editingCustomer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-neutral-400 mb-1">ชื่อลูกค้า / โรงงานปลายทาง *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="เช่น โรงงานไทยปาล์ม"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:border-brand-light focus:outline-none"
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-neutral-400 mb-1">เบอร์โทรศัพท์</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="08X-XXXXXXX"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:border-brand-light focus:outline-none"
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-neutral-400 mb-1">ที่อยู่</label>
                <textarea 
                  rows={2}
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  placeholder="รายละเอียดที่อยู่..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:border-brand-light focus:outline-none"
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-neutral-400 mb-1">หมายเหตุ</label>
                <input 
                  type="text" 
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                  placeholder="ข้อมูลเพิ่มเติม..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:border-brand-light focus:outline-none"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline flex-1"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Save size={18} /> บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
