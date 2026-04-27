import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Truck, 
  User, 
  Phone, 
  Weight, 
  CheckCircle, 
  ChevronLeft,
  Save,
  Trash2
} from 'lucide-react';
import api from '../api/axios';

const AddVehicle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    licensePlate: '',
    vehicleType: '',
    brand: '',
    tareWeightKg: '',
    driverName: '',
    driverPhone: '',
    isActive: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchVehicle();
    }
  }, [id]);

  const fetchVehicle = async () => {
    try {
      setIsFetching(true);
      const response = await api.get(`/vehicles/${id}`);
      const data = response.data;
      setFormData({
        licensePlate: data.licensePlate || '',
        vehicleType: data.vehicleType || '',
        brand: data.brand || '',
        tareWeightKg: data.tareWeightKg?.toString() || '',
        driverName: data.driverName || '',
        driverPhone: data.driverPhone || '',
        isActive: data.isActive
      });
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      alert('ไม่สามารถดึงข้อมูลรถได้');
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!formData.licensePlate) {
      alert('กรุณากรอกทะเบียนรถ');
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        ...formData,
        tareWeightKg: parseFloat(formData.tareWeightKg) || 0
      };

      if (isEdit) {
        await api.put(`/vehicles/${id}`, payload);
        alert('แก้ไขข้อมูลเรียบร้อยแล้ว');
      } else {
        await api.post('/vehicles', payload);
        alert('บันทึกข้อมูลรถเรียบร้อยแล้ว');
      }
      navigate('/vehicles');
    } catch (error: any) {
      console.error('Error saving vehicle:', error);
      alert(error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-neutral-500 animate-pulse font-medium">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/vehicles')}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-neutral-400 hover:text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isEdit ? 'แก้ไขข้อมูลรถ' : 'เพิ่มรถใหม่'}
            </h1>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">
              Vehicle Information Management
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isLoading}
          className="btn-primary flex items-center gap-2 px-6"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Save size={18} />
          )}
          <span className="font-bold">{isEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Basic Info Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-dark)] rounded-3xl p-8 shadow-2xl space-y-8">
            <div className="flex items-center gap-3 border-b border-[var(--color-border-dark)] pb-4">
              <div className="w-10 h-10 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                <Truck size={20} />
              </div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">ข้อมูลรถ</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">ทะเบียนรถ <span className="text-brand-red">*</span></label>
                <div className="relative group">
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    placeholder="เช่น กข 1234 พัทลุง"
                    className="w-full bg-black/20 border border-[var(--color-border-dark)] rounded-2xl px-4 py-3.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-green/50 focus:ring-1 focus:ring-brand-green/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">ประเภทรถ</label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-[var(--color-border-dark)] rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-brand-green/50 transition-all appearance-none"
                >
                  <option value="">เลือกประเภทรถ</option>
                  <option value="กระบะ 4 ล้อ">กระบะ 4 ล้อ</option>
                  <option value="รถบรรทุก 6 ล้อ">รถบรรทุก 6 ล้อ</option>
                  <option value="รถบรรทุก 10 ล้อ">รถบรรทุก 10 ล้อ</option>
                  <option value="พ่วง">พ่วง</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">ยี่ห้อ</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="เช่น ISUZU, HINO"
                  className="w-full bg-black/20 border border-[var(--color-border-dark)] rounded-2xl px-4 py-3.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-green/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">น้ำหนักเปล่า (กก.)</label>
                <div className="relative group">
                  <input
                    type="number"
                    name="tareWeightKg"
                    value={formData.tareWeightKg}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full bg-black/20 border border-[var(--color-border-dark)] rounded-2xl px-4 py-3.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-green/50 transition-all pr-12 font-mono"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 font-bold text-[10px] uppercase">KG</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-dark)] rounded-3xl p-8 shadow-2xl space-y-8">
            <div className="flex items-center gap-3 border-b border-[var(--color-border-dark)] pb-4">
              <div className="w-10 h-10 rounded-2xl bg-brand-amber/10 flex items-center justify-center text-brand-amber">
                <User size={20} />
              </div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">ข้อมูลคนขับ</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">ชื่อคนขับ</label>
                <input
                  type="text"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleChange}
                  placeholder="ชื่อ-นามสกุล"
                  className="w-full bg-black/20 border border-[var(--color-border-dark)] rounded-2xl px-4 py-3.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-green/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  name="driverPhone"
                  value={formData.driverPhone}
                  onChange={handleChange}
                  placeholder="08X-XXXXXXX"
                  className="w-full bg-black/20 border border-[var(--color-border-dark)] rounded-2xl px-4 py-3.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-brand-green/50 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Status Section */}
        <div className="space-y-6">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-dark)] rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-[var(--color-border-dark)] pb-4">
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white">
                <CheckCircle size={20} />
              </div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">สถานะ</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-[var(--color-border-dark)] cursor-pointer hover:border-brand-green/30 transition-all group">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">เปิดใช้งาน</span>
                  <span className="text-[10px] text-neutral-500 uppercase font-black tracking-tighter">Active Status</span>
                </div>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-6 h-6 rounded-lg bg-black border-[var(--color-border-dark)] text-brand-green focus:ring-brand-green/50"
                />
              </label>

              <div className="p-4 rounded-2xl bg-brand-green/5 border border-brand-green/10">
                <p className="text-[11px] text-brand-green/70 leading-relaxed font-medium">
                  รถที่เปิดใช้งานจะปรากฏในรายการเพื่อเลือกสำหรับการสร้างใบชั่งน้ำหนัก
                </p>
              </div>
            </div>
          </div>

          {isEdit && (
            <button 
              className="w-full bg-brand-red/10 border border-brand-red/20 text-brand-red hover:bg-brand-red/20 transition-all p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm"
              onClick={() => {
                if(window.confirm('ยืนยันการลบข้อมูลรถ?')) {
                  api.delete(`/vehicles/${id}`).then(() => navigate('/vehicles'));
                }
              }}
            >
              <Trash2 size={16} />
              ลบข้อมูลรถ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddVehicle;
