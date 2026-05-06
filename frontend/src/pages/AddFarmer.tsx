import React, { useState, useEffect } from 'react';
import { 
  User, 
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';
import Select from 'react-select';
import provincesData from '../data/provinces.json';
import fullGeography from '../data/geography.json';

const STEPS = [
  { id: 1, title: 'ข้อมูลส่วนตัว', desc: 'ชื่อ, บัตรประชาชน' },
  { id: 2, title: 'ที่อยู่ติดต่อ', desc: 'จังหวัด, อำเภอ' },
  { id: 3, title: 'บัญชีธนาคาร', desc: 'สำหรับโอนเงิน' },
  { id: 4, title: 'แปลงที่ดิน', desc: 'โฉนด, พื้นที่' },
  { id: 5, title: 'ยืนยัน', desc: 'ตรวจสอบข้อมูล' },
];

const AddFarmer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useNotification();
  const [isFetching, setIsFetching] = useState(isEdit);
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', nationalId: '', phone: '', lineId: '', isActive: true,
    province: 'กระบี่', district: '', subdistrict: '', zip: '', address: '',
    bankName: '', accountNo: '', accountName: '', branch: '',
    plots: [{ id: Date.now(), deedNo: '', area: '', gps: '', palmAge: '' }]
  });

  // Geography Logic (Optimized for fullGeography)
  const provinceOptions = provincesData.map(p => ({ value: p, label: p }));
  
  // Filter districts based on selected province
  const districts = [...new Set(fullGeography
    .filter(item => item.provinceNameTh === formData.province)
    .map(item => item.districtNameTh)
  )].sort();

  // Filter subdistricts based on selected province and district
  const subdistrictsData = fullGeography.filter(item => 
    item.provinceNameTh === formData.province && 
    item.districtNameTh === formData.district
  );
  
  const subdistricts = [...new Set(subdistrictsData.map(item => item.subdistrictNameTh))].sort();

  useEffect(() => {
    if (isEdit) {
      fetchFarmerData();
    }
  }, [id]);

  const fetchFarmerData = async () => {
    try {
      const response = await api.get(`/farmers/${id}`);
      const data = response.data;
      const [firstName, ...lastNameParts] = data.fullName.split(' ');
      
      // Attempt to find zip if missing
      let zipCode = '';
      if (data.province && data.district && data.subdistrict) {
        const geo = fullGeography.find(g => 
          g.provinceNameTh === data.province && 
          g.districtNameTh === data.district && 
          g.subdistrictNameTh === data.subdistrict
        );
        zipCode = geo?.postalCode?.toString() || '';
      }

      setFormData({
        firstName: firstName || '',
        lastName: lastNameParts.join(' ') || '',
        nationalId: data.nationalId || '',
        phone: data.phone || '',
        lineId: data.lineId || '',
        isActive: data.isActive,
        province: data.province || 'กระบี่',
        district: data.district || '',
        subdistrict: data.subdistrict || '',
        zip: zipCode, 
        address: data.address || '',
        bankName: data.bankName || '',
        accountNo: data.bankAccount || '',
        accountName: '', 
        branch: data.bankBranch || '',
        plots: data.farmPlots?.length > 0 
          ? data.farmPlots.map((p: any) => ({
              id: p.id,
              deedNo: p.titleDeedNo || '',
              area: p.areaRai?.toString() || '',
              gps: (p.gpsLat && p.gpsLng) ? `${p.gpsLat}, ${p.gpsLng}` : '',
              palmAge: p.palmAgeYears?.toString() || ''
            }))
          : [{ id: Date.now(), deedNo: '', area: '', gps: '', palmAge: '' }]
      });
    } catch (error) {
      console.error('Error fetching farmer:', error);
      showAlert('ไม่สามารถดึงข้อมูลเกษตรกรได้', 'error');
    } finally {
      setIsFetching(false);
    }
  };

  const handleProvinceChange = (option: any) => {
    setFormData(prev => ({ 
      ...prev, 
      province: option ? option.value : '', 
      district: '', 
      subdistrict: '', 
      zip: '' 
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
      return;
    }

    if (name === 'district') {
      setFormData(prev => ({ ...prev, district: value, subdistrict: '', zip: '' }));
    } else if (name === 'subdistrict') {
      // Find matching zip
      const geo = subdistrictsData.find(item => item.subdistrictNameTh === value);
      setFormData(prev => ({ ...prev, subdistrict: value, zip: geo?.postalCode?.toString() || '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePlotChange = (index: number, field: string, value: string) => {
    const newPlots = [...formData.plots];
    (newPlots[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, plots: newPlots }));
  };

  const addPlot = () => {
    setFormData(prev => ({
      ...prev,
      plots: [...prev.plots, { id: Date.now(), deedNo: '', area: '', gps: '', palmAge: '' }]
    }));
  };

  const nextStep = () => setStep(s => Math.min(5, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      const payload = {
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        nationalId: formData.nationalId || null,
        phone: formData.phone || null,
        address: formData.address || null,
        province: formData.province || null,
        district: formData.district || null,
        subdistrict: formData.subdistrict || null,
        isActive: formData.isActive,
        bankName: formData.bankName || null,
        bankAccount: formData.accountNo || null,
        bankBranch: formData.branch || null,
        lineId: formData.lineId || null,
        farmPlots: formData.plots.filter(p => p.deedNo || p.area).map(p => {
          const gpsParts = p.gps ? p.gps.split(',') : [];
          return {
            plotCode: `P${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            titleDeedNo: p.deedNo || null,
            areaRai: parseFloat(p.area) || 0,
            gpsLat: gpsParts[0] ? parseFloat(gpsParts[0].trim()) : null,
            gpsLng: gpsParts[1] ? parseFloat(gpsParts[1].trim()) : null,
            palmAgeYears: parseInt(p.palmAge) || null
          };
        })
      };

      if (isEdit) {
        await api.put(`/farmers/${id}`, payload);
        showAlert('แก้ไขข้อมูลเรียบร้อยแล้ว', 'success');
      } else {
        // Only generate farmerCode for new farmers
        const farmerCode = `F${Date.now().toString().slice(-6)}`;
        await api.post('/farmers', { ...payload, farmerCode });
        showAlert('บันทึกเกษตรกรเรียบร้อยแล้ว', 'success');
      }
      
      navigate('/farmers');
    } catch (error: any) {
      console.error('Error saving farmer:', error);
      const msg = error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก';
      showAlert(`ไม่สามารถบันทึกได้: ${msg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="p-12 text-center text-neutral-500">กำลังโหลดข้อมูล...</div>;

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5 animate-in fade-in duration-300">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-[#3f3f3f] pb-2">ข้อมูลส่วนตัว</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>ชื่อจริง</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="สมชาย" />
              </div>
              <div className="form-group">
                <label>นามสกุล</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="มานะดี" />
              </div>
              <div className="form-group col-span-2">
                <label>เลขบัตรประจำตัวประชาชน</label>
                <div className="flex gap-2">
                  <input type="text" name="nationalId" value={formData.nationalId} onChange={handleChange} placeholder="1-2345-67890-12-3" className="font-mono flex-1" />
                  <button className="btn btn-outline whitespace-nowrap">ตรวจสอบ DOPA</button>
                </div>
              </div>
              <div className="form-group">
                <label>เบอร์โทรศัพท์</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="081-xxx-xxxx" />
              </div>
              <div className="form-group">
                <label>Line ID (ตัวเลือก)</label>
                <input type="text" name="lineId" value={formData.lineId} onChange={handleChange} placeholder="@somchai" />
              </div>
              <div className="form-group col-span-2 mt-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 border border-[#3f3f3f] rounded-xl bg-[#252525]">
                  <div className="relative">
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="sr-only" />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-brand-green' : 'bg-neutral-600'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.isActive ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <div>
                    <div className="text-white font-medium">เปิดใช้งานบัญชี</div>
                    <div className="text-neutral-400 font-normal text-[11px]">สามารถทำรายการชั่งน้ำหนักได้ทันที</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5 animate-in fade-in duration-300">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-[#3f3f3f] pb-2">ที่อยู่ติดต่อ</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group col-span-2 md:col-span-1">
                <label>จังหวัด</label>
                <Select
                  options={provinceOptions}
                  value={provinceOptions.find(opt => opt.value === formData.province)}
                  onChange={handleProvinceChange}
                  placeholder="พิมพ์ค้นหาจังหวัด..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: '#1e1e1e',
                      borderColor: '#3f3f3f',
                      color: 'white',
                      fontSize: '0.875rem',
                      '&:hover': { borderColor: '#2d6a4f' }
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: '#1e1e1e',
                      border: '1px solid #3f3f3f'
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused ? '#2d6a4f' : '#1e1e1e',
                      color: 'white',
                      fontSize: '0.875rem'
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: 'white'
                    }),
                    input: (base) => ({
                      ...base,
                      color: 'white'
                    })
                  }}
                />
              </div>
              <div className="form-group">
                <label>อำเภอ</label>
                <input 
                  list="districts-list" 
                  name="district" 
                  value={formData.district} 
                  onChange={handleChange} 
                  placeholder="เลือกหรือพิมพ์อำเภอ..."
                />
                <datalist id="districts-list">
                  {districts.map(d => <option key={d} value={d} />)}
                </datalist>
              </div>
              <div className="form-group">
                <label>ตำบล</label>
                <input 
                  list="subdistricts-list" 
                  name="subdistrict" 
                  value={formData.subdistrict} 
                  onChange={handleChange} 
                  placeholder="เลือกหรือพิมพ์ตำบล..."
                />
                <datalist id="subdistricts-list">
                  {subdistricts.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div className="form-group">
                <label>รหัสไปรษณีย์</label>
                <input type="text" name="zip" value={formData.zip} readOnly className="font-mono bg-neutral-900/50 text-neutral-500" placeholder="อัตโนมัติ" />
              </div>
              <div className="form-group col-span-2">
                <label>รายละเอียดที่อยู่ (บ้านเลขที่, หมู่, ซอย)</label>
                <textarea name="address" value={formData.address} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-[#3f3f3f] rounded-xl text-sm bg-neutral-800 text-neutral-200 focus:outline-none focus:border-brand-light min-h-[80px]" placeholder="เลขที่..."></textarea>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5 animate-in fade-in duration-300">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-[#3f3f3f] pb-2">บัญชีธนาคาร</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label>ธนาคาร</label>
                <select name="bankName" value={formData.bankName} onChange={handleChange}>
                  <option value="">เลือกธนาคาร...</option>
                  <option value="ธ.ก.ส.">ธ.ก.ส. (BAAC)</option>
                  <option value="กสิกรไทย">กสิกรไทย (KBank)</option>
                  <option value="ไทยพาณิชย์">ไทยพาณิชย์ (SCB)</option>
                  <option value="กรุงไทย">กรุงไทย (KTB)</option>
                  <option value="กรุงเทพ">กรุงเทพ (BBL)</option>
                </select>
              </div>
              <div className="form-group">
                <label>สาขา</label>
                <input type="text" name="branch" value={formData.branch} onChange={handleChange} />
              </div>
              <div className="form-group col-span-2">
                <label>เลขที่บัญชี</label>
                <input type="text" name="accountNo" value={formData.accountNo} onChange={handleChange} className="font-mono text-lg" placeholder="xxx-x-xxxxx-x" />
              </div>
              <div className="form-group col-span-2">
                <label>ชื่อบัญชี</label>
                <input type="text" name="accountName" value={formData.accountName} onChange={handleChange} placeholder="นาย สมชาย มานะดี" />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-[#3f3f3f] pb-2 mb-4">
              <h3 className="text-lg font-medium text-white">แปลงที่ดิน</h3>
              <button onClick={addPlot} className="btn btn-outline py-1 px-3 text-xs flex items-center gap-1">
                + เพิ่มแปลง
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.plots.map((plot, index) => (
                <div key={plot.id} className="bg-[#252525] border border-[#3f3f3f] rounded-xl p-4 relative">
                  <div className="absolute top-0 right-0 bg-[#3f3f3f] text-neutral-400 px-3 py-1 rounded-bl-xl rounded-tr-xl text-xs font-medium">แปลงที่ {index + 1}</div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="form-group">
                      <label>เลขที่โฉนด / น.ส.3ก.</label>
                      <input type="text" value={plot.deedNo} onChange={e => handlePlotChange(index, 'deedNo', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>พื้นที่ (ไร่-งาน-ตร.ว.)</label>
                      <input type="text" value={plot.area} onChange={e => handlePlotChange(index, 'area', e.target.value)} placeholder="เช่น 15-2-50" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-[#3f3f3f] pb-3 mb-4">
              <h2 className="text-xl font-medium text-white">ยืนยันข้อมูล</h2>
            </div>

            <div className="bg-[#252525] border border-[#3f3f3f] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#3f3f3f] bg-[#2a2a2a]">
                <User className="w-4 h-4 text-brand-light" /> <span className="font-medium text-neutral-200">ข้อมูลส่วนตัว</span>
              </div>
              <div className="px-5 py-2">
                <div className="flex py-3 border-b border-[#3f3f3f]/50 last:border-0 items-center">
                  <div className="w-1/3 text-neutral-400 text-sm">ชื่อ-สกุล</div>
                  <div className="w-2/3 text-white font-medium">{formData.firstName} {formData.lastName || '—'}</div>
                </div>
                <div className="flex py-3 border-b border-[#3f3f3f]/50 last:border-0 items-center">
                  <div className="w-1/3 text-neutral-400 text-sm">โทรศัพท์</div>
                  <div className="w-2/3 text-white">{formData.phone || '—'}</div>
                </div>
                <div className="flex py-3 items-center">
                  <div className="w-1/3 text-neutral-400 text-sm">สถานะ</div>
                  <div className="w-2/3">
                    {formData.isActive ? <span className="badge badge-green">ใช้งาน</span> : <span className="badge badge-gray">ระงับ</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#252525] border border-[#3f3f3f] rounded-xl p-4 text-sm text-neutral-400 text-center">
              ตรวจสอบข้อมูลให้ถูกต้องก่อนกด <strong className="text-white">บันทึกเกษตรกร</strong>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/farmers')} className="text-neutral-400 hover:text-white transition-colors">เกษตรกร</button>
        <span className="text-neutral-600">/</span>
        <span className="text-white font-medium">{isEdit ? 'แก้ไขข้อมูลเกษตรกร' : 'เพิ่มเกษตรกรใหม่'}</span>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <div className="w-64 bg-[#252525] border border-[#3f3f3f] rounded-2xl p-6 shrink-0 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-green/20"></div>
          
          <div className="space-y-8 relative">
            {STEPS.map((s, idx) => {
              const isActive = s.id === step;
              const isPast = s.id < step;
              return (
                <div key={s.id} className="flex gap-4 relative">
                  {idx < STEPS.length - 1 && (
                    <div className={`absolute top-8 left-3.5 w-px h-full -ml-px ${s.id < step ? 'bg-brand-green' : 'bg-[#3f3f3f]'}`}></div>
                  )}
                  
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors duration-300
                    ${isActive || isPast ? 'bg-brand-green text-white' : 'bg-[#3f3f3f] text-neutral-500'}`}>
                    {isPast ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{s.id}</span>}
                  </div>
                  
                  <div className={isActive ? 'opacity-100' : 'opacity-50'}>
                    <div className={`text-sm font-bold ${isActive || isPast ? 'text-white' : 'text-neutral-400'}`}>{s.title}</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 bg-[#1e1e1e] border border-[#3f3f3f] rounded-2xl overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-8">
            {renderStepContent()}
          </div>
          
          <div className="p-4 border-t border-[#3f3f3f] bg-[#252525] flex justify-between items-center">
            <button 
              className={`btn-outline ${step === 1 ? 'invisible' : ''}`}
              onClick={prevStep}
              disabled={isLoading}
            >
              <ChevronLeft className="w-4 h-4" /> ย้อนกลับ
            </button>
            
            {step < 5 ? (
              <button className="btn-primary px-8" onClick={nextStep}>
                ถัดไป <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                className="btn-primary min-w-[160px]" 
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isLoading ? (isEdit ? 'กำลังบันทึก...' : 'กำลังบันทึก...') : (isEdit ? 'บันทึกการแก้ไข' : 'บันทึกเกษตรกร')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFarmer;
