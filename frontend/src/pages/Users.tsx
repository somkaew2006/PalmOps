import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { UserPlus, Search, Trash2, Edit2, Save, X, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert, showConfirm } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'weigher',
    isActive: true
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // password is optional on edit
        const payload = { ...formData };
        if (!payload.password) delete (payload as any).password;
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        if (!formData.password) {
          showAlert('กรุณาระบุรหัสผ่านสำหรับผู้ใช้ใหม่', 'warning');
          return;
        }
        await api.post('/users', formData);
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ username: '', password: '', fullName: '', role: 'weigher', isActive: true });

      fetchUsers();
      showAlert('บันทึกข้อมูลสำเร็จ', 'success');
    } catch (error: any) {
      showAlert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // password field empty on edit unless user wants to change it
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number, name: string) => {
    showConfirm(`ยืนยันการลบผู้ใช้งาน "${name}"?`, async () => {
      try {
        await api.delete(`/users/${id}`);
        showAlert('ลบผู้ใช้งานสำเร็จ', 'success');
        fetchUsers();
      } catch (error: any) {
        showAlert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ', 'error');
      }
    });
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="text-brand-light" /> จัดการผู้ใช้งาน
          </h2>
          <p className="text-sm text-neutral-400">เพิ่ม แก้ไข หรือระงับสิทธิ์การใช้งานของพนักงานในบริษัท</p>
        </div>
        <button 
          onClick={() => {
            setEditingUser(null);
            setFormData({ username: '', password: '', fullName: '', role: 'weigher', isActive: true });

            setShowModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} /> เพิ่มผู้ใช้ใหม่
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหาชื่อผู้ใช้ หรือ ชื่อ-นามสกุล..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:border-brand-light focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="p-12 text-center text-neutral-500">กำลังโหลดข้อมูลผู้ใช้งาน...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ชื่อผู้ใช้ (Username)</th>
                <th>ชื่อ-นามสกุล</th>
                <th>บทบาท</th>
                <th className="text-center">สถานะ</th>
                <th className="text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? currentItems.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">@{user.username}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-neutral-300">{user.fullName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      {user.isActive ? (
                        <CheckCircle size={18} className="text-brand-green" />
                      ) : (
                        <XCircle size={18} className="text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="p-2 text-neutral-400 hover:text-brand-light hover:bg-brand-light/10 rounded-lg transition-all"
                        title="แก้ไข"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id, user.fullName)}
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
                  <td colSpan={5} className="text-center py-12 text-neutral-500 italic">ไม่พบข้อมูลผู้ใช้งาน</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
            <div className="text-xs text-neutral-500">
              แสดง {indexOfFirstItem + 1} ถึง {Math.min(indexOfLastItem, filteredUsers.length)} จากทั้งหมด {filteredUsers.length} รายการ
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-black/20 border-b border-neutral-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {editingUser ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="form-group">
                <label className="block text-sm font-medium text-neutral-400 mb-1">ชื่อผู้ใช้ (Username) *</label>
                <input 
                  type="text" 
                  required
                  disabled={!!editingUser}
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  placeholder="เช่น somchai_p"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:border-brand-light focus:outline-none disabled:opacity-50"
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-neutral-400 mb-1">
                  รหัสผ่าน {editingUser && '(เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)'} {!editingUser && '*'}
                </label>
                <input 
                  type="password" 
                  required={!editingUser}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:border-brand-light focus:outline-none"
                />
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-neutral-400 mb-1">ชื่อ-นามสกุล *</label>
                <input 
                  type="text" 
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  placeholder="เช่น นายสมชาย ปาล์มดี"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:border-brand-light focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="block text-sm font-medium text-neutral-400 mb-1">บทบาท</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:border-brand-light focus:outline-none"
                  >
                    <option value="weigher">Staff (พนักงานทั่วไป)</option>

                    <option value="admin">Admin (ผู้จัดการ)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-neutral-400 mb-1">สถานะ</label>
                  <select 
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={e => setFormData({...formData, isActive: e.target.value === 'true'})}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-white focus:border-brand-light focus:outline-none"
                  >
                    <option value="true">เปิดใช้งาน</option>
                    <option value="false">ระงับการใช้งาน</option>
                  </select>
                </div>
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

export default Users;
