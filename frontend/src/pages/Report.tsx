import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Download, FileText, BarChart3, PieChart } from 'lucide-react';

const Report = () => {
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('/branches');
        setBranches(response.data);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [selectedBranchId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const url = selectedBranchId ? `/reports?branchId=${selectedBranchId}` : '/reports';
      const response = await api.get(url);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    // Tickets Data
    const ticketHeaders = ['วันที่', 'เลขที่ใบชั่ง', 'สาขา', 'เกษตรกร', 'เกรด', 'น้ำหนักสุทธิ (กก.)', 'ราคา/กก. (บาท)', 'ยอดเงินรวม (บาท)'];
    const ticketRows = data.transactions.tickets.map((t: any) => [
      new Date(t.weighInAt).toLocaleDateString('th-TH'),
      t.ticketNo,
      t.branch?.branchName,
      t.farmer?.fullName,
      t.grade,
      t.finalWeightKg,
      t.pricePerKg,
      t.totalAmount
    ]);

    // Sales Data
    const saleHeaders = ['วันที่', 'เลขที่การขาย', 'สาขา', 'ลูกค้า', 'เกรด', 'ปริมาณ (กก.)', 'ราคา/กก. (บาท)', 'ยอดเงินรวม (บาท)'];
    const saleRows = data.transactions.sales.map((s: any) => [
      new Date(s.saleDate).toLocaleDateString('th-TH'),
      s.saleNo,
      s.branch?.branchName,
      s.customerName,
      s.grade,
      s.quantityKg,
      s.pricePerKg,
      s.totalAmount
    ]);

    // Summary Header
    const summaryHeader = ['หัวข้อสรุป', 'ปริมาณรวม (ตัน)', 'ยอดเงินรวม (ล้านบาท)'];
    const summaryRows = [
      ['การรับซื้อรวม', data.summary.totalVolume, data.summary.totalAmount],
      ['การขายออกรวม', data.summary.totalSaleVolume, data.summary.totalSaleAmount]
    ];

    let csvContent = "\uFEFF"; // BOM for Thai language support in Excel
    
    csvContent += "--- สรุปภาพรวม ---\n";
    csvContent += summaryHeader.join(",") + "\n";
    csvContent += summaryRows.map(e => e.join(",")).join("\n") + "\n\n";

    csvContent += "--- รายละเอียดการรับซื้อ ---\n";
    csvContent += ticketHeaders.join(",") + "\n";
    csvContent += ticketRows.map((e: any) => e.join(",")).join("\n") + "\n\n";
    
    csvContent += "--- รายละเอียดการขายออก ---\n";
    csvContent += saleHeaders.join(",") + "\n";
    csvContent += saleRows.map((e: any) => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PalmOps_Report_${selectedBranchId || 'Total'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (loading || !data) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="text-neutral-500 animate-pulse font-medium">กำลังประมวลผลรายงาน...</div>
    </div>
  );

  const maxVolume = Math.max(...data.dailyVolume.map((d: any) => d.volume), 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white tracking-tight">รายงานสรุป</h2>
        <div className="flex items-center gap-2 bg-black/20 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setSelectedBranchId('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedBranchId === '' 
                ? 'bg-brand-green text-white shadow-lg' 
                : 'text-neutral-500 hover:text-white hover:bg-white/5'
            }`}
          >
            ทุกสาขา
          </button>
          {branches.map(branch => (
            <button
              key={branch.id}
              onClick={() => setSelectedBranchId(branch.id.toString())}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedBranchId === branch.id.toString() 
                  ? 'bg-brand-green text-white shadow-lg' 
                  : 'text-neutral-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {branch.branchName}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
        <div className="flex gap-2">
          <select className="px-3.5 py-2 border border-[var(--color-border-dark)] rounded-lg text-sm bg-neutral-800 text-neutral-200 focus:outline-none focus:border-brand-light">
            <option>เดือนปัจจุบัน ({new Date().toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })})</option>
            <option>เดือนที่แล้ว</option>
          </select>
          <button 
            onClick={handleExportExcel}
            className="btn btn-outline py-2 px-4 text-xs flex items-center gap-2 border-emerald-900/30 hover:bg-emerald-500/10 hover:text-emerald-500"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="btn btn-outline py-2 px-4 text-xs flex items-center gap-2 border-red-900/30 hover:bg-red-500/10 hover:text-red-500"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
        </div>
        <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
          อัปเดตล่าสุด: {new Date().toLocaleTimeString('th-TH')}
        </div>
      </div>

      <div className="no-print-section">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Purchasing Volume Chart */}
        <div className="stat-card p-6">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[var(--color-border-dark)]">
            <BarChart3 size={16} className="text-brand-green" />
            <h4 className="text-[13px] font-bold text-white uppercase tracking-wider">ปริมาณรับซื้อรายวัน (ตัน)</h4>
          </div>
          <div className="flex flex-col gap-4">
            {data.dailyVolume.length > 0 ? data.dailyVolume.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-4 group">
                <span className="w-16 text-right text-[10px] font-bold text-neutral-500 group-hover:text-neutral-300 transition-colors uppercase">{item.date}</span>
                <div className="flex-1 h-5 bg-neutral-800/50 rounded-full overflow-hidden border border-neutral-700/30 relative">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-forest to-brand-green rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${(item.volume / maxVolume) * 100}%` }}
                  ></div>
                </div>
                <span className="w-16 font-black text-white text-[11px]">{item.volume.toFixed(1)} ต.</span>
              </div>
            )) : (
              <div className="py-8 text-center text-neutral-600 italic text-sm">ยังไม่มีข้อมูลการซื้อในเดือนนี้</div>
            )}
          </div>
        </div>

        {/* Daily Sales Volume Chart */}
        <div className="stat-card p-6">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[var(--color-border-dark)]">
            <BarChart3 size={16} className="text-brand-amber" />
            <h4 className="text-[13px] font-bold text-white uppercase tracking-wider">ปริมาณการขายออกรายวัน (ตัน)</h4>
          </div>
          <div className="flex flex-col gap-4">
            {data.dailySaleVolume.length > 0 ? data.dailySaleVolume.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-4 group">
                <span className="w-16 text-right text-[10px] font-bold text-neutral-500 group-hover:text-neutral-300 transition-colors uppercase">{item.date}</span>
                <div className="flex-1 h-5 bg-neutral-800/50 rounded-full overflow-hidden border border-neutral-700/30 relative">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-900 to-brand-amber rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${(item.volume / Math.max(...data.dailySaleVolume.map((d: any) => d.volume), 1)) * 100}%` }}
                  ></div>
                </div>
                <span className="w-16 font-black text-white text-[11px]">{item.volume.toFixed(1)} ต.</span>
              </div>
            )) : (
              <div className="py-8 text-center text-neutral-600 italic text-sm">ยังไม่มีข้อมูลการขายในเดือนนี้</div>
            )}
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="stat-card p-6">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-[var(--color-border-dark)]">
            <PieChart size={16} className="text-brand-amber" />
            <h4 className="text-[13px] font-bold text-white uppercase tracking-wider">สัดส่วนเกรดปาล์ม (ซื้อเข้า)</h4>
          </div>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <span className="w-16 text-right text-[10px] font-bold text-brand-green uppercase tracking-widest">เกรด A</span>
              <div className="flex-1 h-3 bg-neutral-800/50 rounded-full overflow-hidden">
                <div className="h-full bg-brand-green" style={{ width: `${data.gradeDistribution.A}%` }}></div>
              </div>
              <span className="w-12 font-black text-white text-right text-[12px]">{data.gradeDistribution.A}%</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-16 text-right text-[10px] font-bold text-amber-500 uppercase tracking-widest">เกรด B</span>
              <div className="flex-1 h-3 bg-neutral-800/50 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${data.gradeDistribution.B}%` }}></div>
              </div>
              <span className="w-12 font-black text-white text-right text-[12px]">{data.gradeDistribution.B}%</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-16 text-right text-[10px] font-bold text-neutral-500 uppercase tracking-widest">เกรด C</span>
              <div className="flex-1 h-3 bg-neutral-800/50 rounded-full overflow-hidden">
                <div className="h-full bg-neutral-600" style={{ width: `${data.gradeDistribution.C}%` }}></div>
              </div>
              <span className="w-12 font-black text-white text-right text-[12px]">{data.gradeDistribution.C}%</span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="stat-card p-6 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-brand-green/20 transition-colors">
              <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">ปริมาณรับซื้อรวม</div>
              <div className="text-brand-light font-black text-xl">{data.summary.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 1 })} <span className="text-[10px] font-normal text-neutral-500">ต.</span></div>
            </div>
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-brand-amber/20 transition-colors">
              <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">ปริมาณการขายรวม</div>
              <div className="text-brand-amber font-black text-xl">{data.summary.totalSaleVolume.toLocaleString(undefined, { minimumFractionDigits: 1 })} <span className="text-[10px] font-normal text-neutral-500">ต.</span></div>
            </div>
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-brand-amber/20 transition-colors">
              <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">จ่ายเงินรวม</div>
              <div className="text-brand-amber font-black text-xl">{data.summary.totalAmount.toFixed(2)} <span className="text-[10px] font-normal text-neutral-500">ล้าน ฿</span></div>
            </div>
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-brand-green/20 transition-colors">
              <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">รับเงินรวม (ขาย)</div>
              <div className="text-brand-green font-black text-xl">{data.summary.totalSaleAmount.toFixed(2)} <span className="text-[10px] font-normal text-neutral-500">ล้าน ฿</span></div>
            </div>
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">จำนวนใบชั่ง</div>
              <div className="text-white font-black text-xl">{data.summary.ticketCount.toLocaleString()} <span className="text-[10px] font-normal text-neutral-500">ใบ</span></div>
            </div>
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">เกษตรกร</div>
              <div className="text-white font-black text-xl">{data.summary.farmersCount.toLocaleString()} <span className="text-[10px] font-normal text-neutral-500">ราย</span></div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Print-only Transaction Tables */}
      <div className="print-only mt-12 space-y-8">
        <div className="border-b-2 border-black pb-4 mb-8">
          <h1 className="text-3xl font-bold text-black">รายงานสรุปประจำเดือน - PalmOps</h1>
          <p className="text-gray-600">สาขา: {branches.find(b => b.id.toString() === selectedBranchId)?.branchName || 'ทุกสาขา'}</p>
          <p className="text-gray-600">วันที่พิมพ์: {new Date().toLocaleDateString('th-TH')} {new Date().toLocaleTimeString('th-TH')}</p>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 border-l-4 border-brand-green pl-3">สรุปผลการดำเนินงาน</h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">หัวข้อ</th>
                <th className="border border-gray-300 p-2 text-right">ปริมาณ (ตัน)</th>
                <th className="border border-gray-300 p-2 text-right">จำนวนเงิน (ล้านบาท)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 font-bold">ยอดการรับซื้อรวม</td>
                <td className="border border-gray-300 p-2 text-right">{data.summary.totalVolume.toLocaleString()}</td>
                <td className="border border-gray-300 p-2 text-right">{data.summary.totalAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-bold">ยอดการขายออกรวม</td>
                <td className="border border-gray-300 p-2 text-right">{data.summary.totalSaleVolume.toLocaleString()}</td>
                <td className="border border-gray-300 p-2 text-right">{data.summary.totalSaleAmount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 border-l-4 border-brand-green pl-3">รายละเอียดการรับซื้อ</h2>
          <table className="w-full border-collapse border border-gray-300 text-[12px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">วันที่</th>
                <th className="border border-gray-300 p-2">เลขที่ใบชั่ง</th>
                <th className="border border-gray-300 p-2">เกษตรกร</th>
                <th className="border border-gray-300 p-2">เกรด</th>
                <th className="border border-gray-300 p-2 text-right">น้ำหนัก (กก.)</th>
                <th className="border border-gray-300 p-2 text-right">ยอดเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.tickets.map((t: any) => (
                <tr key={t.id}>
                  <td className="border border-gray-300 p-2">{new Date(t.weighInAt).toLocaleDateString('th-TH')}</td>
                  <td className="border border-gray-300 p-2 font-mono">{t.ticketNo}</td>
                  <td className="border border-gray-300 p-2">{t.farmer?.fullName}</td>
                  <td className="border border-gray-300 p-2 text-center">{t.grade}</td>
                  <td className="border border-gray-300 p-2 text-right">{Number(t.finalWeightKg).toLocaleString()}</td>
                  <td className="border border-gray-300 p-2 text-right font-bold">{Number(t.totalAmount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 border-l-4 border-brand-amber pl-3">รายละเอียดการขายออก</h2>
          <table className="w-full border-collapse border border-gray-300 text-[12px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">วันที่</th>
                <th className="border border-gray-300 p-2">เลขที่การขาย</th>
                <th className="border border-gray-300 p-2">ลูกค้า</th>
                <th className="border border-gray-300 p-2">เกรด</th>
                <th className="border border-gray-300 p-2 text-right">ปริมาณ (กก.)</th>
                <th className="border border-gray-300 p-2 text-right">ยอดเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.sales.map((s: any) => (
                <tr key={s.id}>
                  <td className="border border-gray-300 p-2">{new Date(s.saleDate).toLocaleDateString('th-TH')}</td>
                  <td className="border border-gray-300 p-2 font-mono">{s.saleNo}</td>
                  <td className="border border-gray-300 p-2">{s.customerName}</td>
                  <td className="border border-gray-300 p-2 text-center">{s.grade}</td>
                  <td className="border border-gray-300 p-2 text-right">{Number(s.quantityKg).toLocaleString()}</td>
                  <td className="border border-gray-300 p-2 text-right font-bold">{Number(s.totalAmount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Report;
