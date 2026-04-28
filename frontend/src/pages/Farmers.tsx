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
              {filteredFarmers.length > 0 ? filteredFarmers.map(farmer => (
                <tr key={farmer.id}>
                  <td className="font-mono text-brand-light">{farmer.farmerCode}</td>
                  <td className="text-white font-medium">{farmer.fullName}</td>
                  <td>{farmer.phone || '-'}</td>
                  <td>{farmer._count?.farmPlots || 0} แปลง</td>
                  <td>
                    <span className={`badge ${farmer.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {farmer.isActive ? 'ใช้งาน' : 'ระงับ'}
                    </span>
                  </td>
                  <td className="text-right">
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
      </div>
    </div>
  );
};

export default Farmers;
