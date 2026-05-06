
import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Database, Download, RefreshCw, Trash2, Calendar, HardDrive, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

interface BackupFile {
  filename: string;
  size: number;
  createdAt: string;
}

const AdminDatabase = () => {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const { showAlert, showConfirm } = useNotification();

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/backups');
      setBackups(response.data);
    } catch (error) {
      console.error('Error fetching backups:', error);
      showAlert('ไม่สามารถโหลดข้อมูลสำรองได้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      const response = await api.post('/admin/backup');
      showAlert(`สำรองข้อมูลสำเร็จ: ${response.data.filename}`, 'success');
      fetchBackups();
    } catch (error: any) {
      console.error('Backup error:', error);
      showAlert('การสำรองข้อมูลล้มเหลว: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = (filename: string) => {
    showConfirm(
      `คุณต้องการกู้คืนข้อมูลจากไฟล์ ${filename} ใช่หรือไม่? การดำเนินการนี้จะเขียนทับข้อมูลปัจจุบันทั้งหมด!`,
      async () => {
        try {
          setRestoring(filename);
          await api.post('/admin/restore', { filename });
          showAlert('กู้คืนข้อมูลสำเร็จ ระบบจะทำการโหลดข้อมูลใหม่', 'success');
          // Optional: Refresh page or redirect
          setTimeout(() => window.location.reload(), 2000);
        } catch (error: any) {
          console.error('Restore error:', error);
          showAlert('การกู้คืนข้อมูลล้มเหลว: ' + (error.response?.data?.message || error.message), 'error');
        } finally {
          setRestoring(null);
        }
      }
    );
  };

  const handleDelete = (filename: string) => {
    showConfirm(`คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์สำรอง ${filename}?`, async () => {
      try {
        await api.delete(`/admin/backups/${filename}`);
        showAlert('ลบไฟล์สำรองสำเร็จ', 'success');
        fetchBackups();
      } catch (error) {
        console.error('Delete error:', error);
        showAlert('ไม่สามารถลบไฟล์สำรองได้', 'error');
      }
    });
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const handleDownload = async (filename: string) => {
    try {
      const response = await api.get(`/admin/backups/${filename}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      showAlert('ไม่สามารถดาวน์โหลดไฟล์ได้', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Database className="text-brand-light" /> จัดการฐานข้อมูล
          </h2>
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-widest mt-1">Database Backup & Recovery</p>
        </div>
        
        <button 
          onClick={handleCreateBackup}
          disabled={creating || loading}
          className="btn btn-primary flex items-center gap-2 px-6 py-3 shadow-lg shadow-brand-green/20 disabled:opacity-50"
        >
          {creating ? <Loader2 size={18} className="animate-spin" /> : <HardDrive size={18} />}
          <span>สร้างจุดสำรองข้อมูลใหม่</span>
        </button>
      </div>

      {/* Security Warning */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4">
        <div className="p-2 bg-amber-500/20 rounded-xl text-amber-500 shrink-0">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-500 uppercase tracking-tight">ข้อควรระวังสำหรับผู้ดูแลระบบ</h4>
          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
            การกู้คืนข้อมูล (Restore) จะทำการเขียนทับข้อมูลปัจจุบันทั้งหมดด้วยข้อมูลจากไฟล์ที่เลือก 
            กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ และควรสำรองข้อมูลปัจจุบันไว้ก่อนเสมอเพื่อป้องกันความผิดพลาด
          </p>
        </div>
      </div>

      {/* Backup List Table */}
      <div className="table-wrap overflow-hidden">
        <div className="p-4 border-b border-neutral-800 bg-black/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
            <Calendar size={14} className="text-brand-light" /> รายการไฟล์สำรองข้อมูล
          </h3>
          <div className="text-[10px] text-neutral-500 font-bold">
            พบทั้งหมด {backups.length} ไฟล์
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-neutral-900/50">
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 uppercase tracking-widest">ชื่อไฟล์สำรอง</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 uppercase tracking-widest">วันที่สร้าง</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-neutral-500 uppercase tracking-widest">ขนาดไฟล์</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-neutral-500 uppercase tracking-widest">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-neutral-500 animate-pulse font-medium">
                    กำลังโหลดข้อมูลไฟล์สำรอง...
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-neutral-600 italic text-sm">
                    ยังไม่มีไฟล์สำรองข้อมูลในระบบ
                  </td>
                </tr>
              ) : backups.map((file) => (
                <tr key={file.filename} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-neutral-800 rounded-lg group-hover:bg-brand-green/10 transition-colors">
                        <Database size={16} className="text-neutral-500 group-hover:text-brand-green" />
                      </div>
                      <span className="text-sm font-bold text-white">{file.filename}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-neutral-400">
                      {new Date(file.createdAt).toLocaleDateString('th-TH', { 
                        day: '2-digit', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-mono text-neutral-400 font-bold">{formatSize(file.size)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleDownload(file.filename)}
                        className="p-2 text-neutral-400 hover:text-brand-light hover:bg-brand-light/10 rounded-xl transition-all"
                        title="ดาวน์โหลดไฟล์"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => handleRestore(file.filename)}
                        disabled={!!restoring}
                        className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all disabled:opacity-30"
                        title="กู้คืนข้อมูล (Restore)"
                      >
                        {restoring === file.filename ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                      </button>
                      <button 
                        onClick={() => handleDelete(file.filename)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="ลบไฟล์"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Help Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="stat-card p-6 border-l-4 border-brand-green">
          <h4 className="font-bold text-white mb-2 flex items-center gap-2">
            < HardDrive size={16} className="text-brand-green" /> ทำไมต้องสำรองข้อมูล?
          </h4>
          <p className="text-xs text-neutral-500 leading-relaxed">
            การสำรองข้อมูลเป็นสิ่งสำคัญที่สุดในการบริหารจัดการระบบ เพื่อป้องกันความเสียหายที่อาจเกิดขึ้นจากความผิดพลาดของระบบ การโจมตี หรือการลบข้อมูลโดยไม่ได้ตั้งใจ แนะนำให้ทำการสำรองข้อมูลอย่างน้อยสัปดาห์ละ 1 ครั้ง หรือก่อนการอัปเดตระบบใหญ่
          </p>
        </div>
        <div className="stat-card p-6 border-l-4 border-amber-500">
          <h4 className="font-bold text-white mb-2 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" /> การกู้คืนข้อมูล
          </h4>
          <p className="text-xs text-neutral-500 leading-relaxed">
            การกู้คืนจะทำในระดับฐานข้อมูลทั้งหมด (Database-level restore) ซึ่งจะรวมถึงข้อมูลการชั่งน้ำหนัก, ลูกค้า, เกษตรกร และการตั้งค่าทั้งหมด หากมีข้อมูลใหม่ที่เกิดขึ้นหลังการสำรอง ข้อมูลเหล่านั้นจะหายไปทันทีเมื่อทำการกู้คืน
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDatabase;
