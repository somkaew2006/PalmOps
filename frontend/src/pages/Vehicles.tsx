import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface Vehicle {
  id: number;
  licensePlate: string;
  vehicleType: string;
  brand: string;
  tareWeightKg: number;
  driverName: string;
  driverPhone: string;
  isActive: boolean;
}

const Vehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vehicles');
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="table-wrap">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">กำลังโหลดข้อมูล...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ทะเบียนรถ</th>
                <th>ประเภท</th>
                <th>คนขับ</th>
                <th>โทรศัพท์</th>
                <th>น้ำหนักเปล่า</th>
                <th>สถานะ</th>
                <th className="text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length > 0 ? vehicles.map(vehicle => (
                <tr key={vehicle.id}>
                  <td className="font-medium text-white">{vehicle.licensePlate}</td>
                  <td className="text-neutral-400">{vehicle.vehicleType || '-'}</td>
                  <td className="text-white">{vehicle.driverName || '-'}</td>
                  <td>{vehicle.driverPhone || '-'}</td>
                  <td className="font-mono text-emerald-400">{Number(vehicle.tareWeightKg).toLocaleString()} กก.</td>
                  <td>
                    <span className={`badge ${vehicle.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {vehicle.isActive ? 'ใช้งาน' : 'ระงับ'}
                    </span>
                  </td>
                  <td className="text-right">
                    <button 
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                      className="btn btn-outline py-1 px-3 text-xs"
                    >
                      แก้ไข
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500">ไม่พบข้อมูลรถ</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Vehicles;
