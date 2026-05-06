import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Layers, Tag, ChevronRight, FolderPlus } from 'lucide-react';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

interface Product {
  id: number;
  name: string;
  unit: string | null;
  groupId: number;
}

interface ProductGroup {
  id: number;
  name: string;
  note: string | null;
  products: Product[];
}

const Products = () => {
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const { showAlert, showConfirm } = useNotification();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || null;

  const [groupData, setGroupData] = useState({ name: '', note: '' });
  const [productData, setProductData] = useState({ name: '', unit: '', groupId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGroupId]);

  const fetchData = async () => {
    try {
      const response = await api.get('master-data/groups');
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('master-data/groups', groupData);
      setShowGroupForm(false);
      setGroupData({ name: '', note: '' });
      fetchData();
      showAlert('บันทึกกลุ่มสินค้าสำเร็จ', 'success');
    } catch (error: any) {
      console.error('Error creating group:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกกลุ่มสินค้า';
      showAlert(message, 'error');
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('master-data', productData);
      setShowProductForm(false);
      setProductData({ name: '', unit: '', groupId: '' });
      fetchData();
      showAlert('บันทึกสินค้าสำเร็จ', 'success');
    } catch (error: any) {
      console.error('Error creating product:', error);
      const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกสินค้า';
      showAlert(message, 'error');
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    showConfirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า "${name}"?`, async () => {
      try {
        await api.delete(`master-data/${id}`);
        showAlert('ลบสินค้าสำเร็จ', 'success');
        fetchData();
      } catch (error: any) {
        console.error('Error deleting product:', error);
        const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบสินค้า';
        showAlert(message, 'error');
      }
    });
  };

  const handleDeleteGroup = async (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    showConfirm(`คุณแน่ใจหรือไม่ว่าต้องการลบกลุ่ม "${name}"?`, async () => {
      try {
        await api.delete(`master-data/groups/${id}`);
        if (selectedGroupId === id) setSelectedGroupId(null);
        showAlert('ลบกลุ่มสินค้าสำเร็จ', 'success');
        fetchData();
      } catch (error: any) {
        console.error('Error deleting group:', error);
        const message = error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบกลุ่มสินค้า';
        showAlert(message, 'error');
      }
    });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = selectedGroup?.products?.slice(indexOfFirstItem, indexOfLastItem) || [];
  const totalPages = Math.ceil((selectedGroup?.products?.length || 0) / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="text-brand-light" /> จัดการกลุ่มสินค้าและบริการ
        </h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowGroupForm(true)}
            className="btn btn-outline flex items-center gap-2"
          >
            <FolderPlus size={18} /> เพิ่มกลุ่มใหม่
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Groups Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-neutral-900/50 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="p-4 bg-black/20 border-b border-neutral-800 font-bold text-neutral-400 text-xs uppercase tracking-wider">
              รายการกลุ่ม
            </div>
            <div className="divide-y divide-neutral-800">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`w-full flex items-center justify-between p-4 transition-colors hover:bg-white/5 ${selectedGroupId === group.id ? 'bg-brand-light/10 text-brand-light' : 'text-neutral-400'}`}
                >
                  <div className="flex items-center gap-3">
                    <Layers size={16} />
                    <span className="font-medium text-sm">{group.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded-full">{group.products?.length || 0}</span>
                    <button 
                      onClick={(e) => handleDeleteGroup(e, group.id, group.name)}
                      className="p-1 text-neutral-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                    <ChevronRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="md:col-span-2">
          {selectedGroup ? (
            <div className="table-wrap">
              <div className="p-6 border-b border-neutral-800 bg-black/10 flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold">{selectedGroup.name}</h3>
                  <p className="text-xs text-neutral-500">{selectedGroup.note || 'ไม่มีหมายเหตุ'}</p>
                </div>
                <button 
                  onClick={() => {
                    setProductData({ ...productData, groupId: selectedGroup.id.toString() });
                    setShowProductForm(true);
                  }}
                  className="btn btn-primary btn-sm flex items-center gap-2"
                >
                  <Plus size={14} /> เพิ่มสินค้าในกลุ่มนี้
                </button>
              </div>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>ชื่อสินค้า/บริการ</th>
                      <th>หน่วยเรียก</th>
                      <th className="text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedGroup.products || selectedGroup.products.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-12 text-neutral-600 italic">ไม่มีสินค้าในกลุ่มนี้</td>
                      </tr>
                    ) : currentProducts.map(product => (
                      <tr key={product.id}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-white flex items-center gap-2">
                            <Tag size={14} className="text-neutral-500" /> {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">{product.unit || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="p-2 text-neutral-600 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
                  <div className="text-xs text-neutral-500">
                    แสดง {indexOfFirstItem + 1} ถึง {Math.min(indexOfLastItem, selectedGroup.products.length)} จากทั้งหมด {selectedGroup.products.length} รายการ
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
                    >
                      ก่อนหน้า
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
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
                      className="px-3 py-1.5 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors"
                    >
                      ถัดไป
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-600 italic">
              <Layers size={48} className="mb-4 opacity-20" />
              เลือกกลุ่มสินค้าเพื่อดูรายละเอียด
            </div>
          )}
        </div>
      </div>

      {/* Group Modal */}
      {showGroupForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FolderPlus className="text-brand-light" /> เพิ่มกลุ่มสินค้าใหม่
            </h3>
            <form onSubmit={handleGroupSubmit} className="space-y-4">
              <div className="form-group">
                <label>ชื่อกลุ่ม</label>
                <input 
                  type="text" 
                  required 
                  value={groupData.name}
                  onChange={e => setGroupData({...groupData, name: e.target.value})}
                  placeholder="เช่น สาธารณูปโภค"
                />
              </div>
              <div className="form-group">
                <label>หมายเหตุ</label>
                <textarea 
                  value={groupData.note}
                  onChange={e => setGroupData({...groupData, note: e.target.value})}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowGroupForm(false)} className="btn btn-outline flex-1">ยกเลิก</button>
                <button type="submit" className="btn btn-primary flex-1">บันทึกกลุ่ม</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="text-brand-light" /> เพิ่มสินค้าใหม่
            </h3>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="form-group">
                <label>ชื่อสินค้า/บริการ</label>
                <input 
                  type="text" 
                  required 
                  value={productData.name}
                  onChange={e => setProductData({...productData, name: e.target.value})}
                  placeholder="เช่น ค่าน้ำ, ค่าไฟ"
                />
              </div>
              <div className="form-group">
                <label>หน่วยเรียก (ถ้ามี)</label>
                <input 
                  type="text" 
                  value={productData.unit}
                  onChange={e => setProductData({...productData, unit: e.target.value})}
                  placeholder="เช่น กก., ตัน, ชิ้น"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowProductForm(false)} className="btn btn-outline flex-1">ยกเลิก</button>
                <button type="submit" className="btn btn-primary flex-1">บันทึกสินค้า</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
