import { useEffect, useState } from 'react';
import api from '../api/axios';
import { NavLink } from 'react-router-dom';

interface Farmer {
  id: number;
  farmerCode: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  _count?: {
    farmPlots: number;
  };
}

const Farmers = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/farmers');
      setFarmers(response.data);
    } catch (error) {
      console.error('Error fetching farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFarmers = farmers.filter(f => 
    f.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.farmerCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFarmers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFarmers.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          placeholder="🔍 ค้นหาชื่อ หรือ รหัสเกษตรกร..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3.5 py-2.5 border border-[var(--color-border-dark)] rounded-xl text-sm bg-neutral-800 text-neutral-200 focus:outline-none focus:border-brand-light"
        />
        <select className="w-36 px-3.5 py-2.5 border border-[var(--color-border-dark)] rounded-xl text-sm bg-neutral-800 text-neutral-200 focus:outline-none focus:border-brand-light">
          <option>ทุกสถานะ</option>
          <option>ใช้งาน</option>
          <option>ระงับ</option>
        </select>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">กำลังโหลดข้อมูล...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ชื่อ-สกุล</th>
                <th>โทรศัพท์</th>
                <th>จำนวนแปลง</th>
                <th>สถานะ</th>
                <th className="text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? currentItems.map(farmer => (
                <tr key={farmer.id}>
                  <td className="px-6 py-4 font-mono text-brand-light">{farmer.farmerCode}</td>
                  <td className="px-6 py-4 text-white font-medium">{farmer.fullName}</td>
                  <td className="px-6 py-4">{farmer.phone || '-'}</td>
                  <td className="px-6 py-4">{farmer._count?.farmPlots || 0} แปลง</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${farmer.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {farmer.isActive ? 'ใช้งาน' : 'ระงับ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <NavLink to={`/farmers/${farmer.id}`} className="btn btn-outline py-1 px-3 text-xs">
                      แก้ไข
                    </NavLink>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-500">ไม่พบข้อมูลเกษตรกร</td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
            <div className="text-xs text-neutral-500">
              แสดง {indexOfFirstItem + 1} ถึง {Math.min(indexOfLastItem, filteredFarmers.length)} จากทั้งหมด {filteredFarmers.length} รายการ
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

export default Farmers;
