import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Download, FileText, BarChart3, TrendingUp, TrendingDown, Wallet, Calendar } from 'lucide-react';

const Report = () => {
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const months = [
    { value: 1, label: 'มกราคม' },
    { value: 2, label: 'กุมภาพันธ์' },
    { value: 3, label: 'มีนาคม' },
    { value: 4, label: 'เมษายน' },
    { value: 5, label: 'พฤษภาคม' },
    { value: 6, label: 'มิถุนายน' },
    { value: 7, label: 'กรกฎาคม' },
    { value: 8, label: 'สิงหาคม' },
    { value: 9, label: 'กันยายน' },
    { value: 10, label: 'ตุลาคม' },
    { value: 11, label: 'พฤศจิกายน' },
    { value: 12, label: 'ธันวาคม' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

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
  }, [selectedBranchId, selectedMonth, selectedYear]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedBranchId) params.append('branchId', selectedBranchId);
      params.append('month', selectedMonth.toString());
      params.append('year', selectedYear.toString());
      
      const response = await api.get(`/reports?${params.toString()}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!data) return;

    // Tickets Data
    const ticketHeaders = ['วันที่', 'เลขที่ใบชั่ง', 'สาขา', 'เกษตรกร', 'เกรด', 'น้ำหนักสุทธิ (กก.)', 'ราคา/กก. (บาท)', 'ยอดเงินรวม (บาท)'];
    const ticketRows = (data.transactions?.tickets || []).map((t: any) => [
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
    const saleRows = (data.transactions?.sales || []).map((s: any) => [
      new Date(s.saleDate).toLocaleDateString('th-TH'),
      s.saleNo,
      s.branch?.branchName,
      s.customerName,
      s.grade,
      s.quantityKg,
      s.pricePerKg,
      s.totalAmount
    ]);

    // Expenses Data
    const expenseHeaders = ['วันที่', 'รายการ', 'กลุ่ม', 'สาขา', 'ปริมาณ', 'ราคา/หน่วย', 'ยอดเงินรวม (บาท)'];
    const expenseRows = (data.transactions?.expenses || []).map((e: any) => [
      new Date(e.expenseDate).toLocaleDateString('th-TH'),
      e.description,
      e.product?.group?.name || '-',
      e.branch?.branchName,
      e.quantity || '-',
      e.pricePerUnit || '-',
      e.amount
    ]);

    // Summary Header
    const summaryHeader = ['หัวข้อสรุป', 'รายละเอียด', 'ยอดเงินรวม (ล้านบาท)'];
    const summaryRows = [
      ['รายรับ (จากการขาย)', `${(data.summary?.totalSaleVolume || 0).toFixed(1)} ตัน`, (data.summary?.totalSaleAmount || 0).toFixed(2)],
      ['รายจ่าย (จากการรับซื้อ)', `${(data.summary?.totalVolume || 0).toFixed(1)} ตัน`, (data.summary?.totalAmount || 0).toFixed(2)],
      ['รายจ่าย (อื่นๆ)', '-', (data.summary?.totalOtherExpenseAmount || 0).toFixed(2)],
      ['กำไร/ขาดทุน เบื้องต้น', '-', ((data.summary?.totalSaleAmount || 0) - (data.summary?.totalAmount || 0) - (data.summary?.totalOtherExpenseAmount || 0)).toFixed(2)]
    ];

    let csvContent = "\uFEFF"; // BOM for Thai language support in Excel
    
    csvContent += `--- สรุปรายรับ-รายจ่าย ประจำเดือน ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear} ---\n`;
    csvContent += summaryHeader.join(",") + "\n";
    csvContent += summaryRows.map(e => e.join(",")).join("\n") + "\n\n";

    csvContent += "--- รายละเอียดรายรับ (การขาย) ---\n";
    csvContent += saleHeaders.join(",") + "\n";
    csvContent += saleRows.map((e: any) => e.join(",")).join("\n") + "\n\n";

    csvContent += "--- รายละเอียดรายจ่าย (การรับซื้อ) ---\n";
    csvContent += ticketHeaders.join(",") + "\n";
    csvContent += ticketRows.map((e: any) => e.join(",")).join("\n") + "\n\n";
    
    csvContent += "--- รายละเอียดรายจ่าย (อื่นๆ) ---\n";
    csvContent += expenseHeaders.join(",") + "\n";
    csvContent += expenseRows.map((e: any) => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PalmOps_Summary_${selectedMonth}_${selectedYear}_${selectedBranchId || 'Total'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSaleAmount = data?.summary?.totalSaleAmount || 0;
  const totalAmount = data?.summary?.totalAmount || 0;
  const totalOtherExpenseAmount = data?.summary?.totalOtherExpenseAmount || 0;
  const profit = totalSaleAmount - totalAmount - totalOtherExpenseAmount;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="text-brand-light" /> สรุปรายรับ-รายจ่าย
          </h2>
          <p className="text-xs text-neutral-500 font-medium uppercase tracking-widest mt-1">Financial Summary & Performance</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Month/Year Filters */}
          <div className="flex items-center gap-2 bg-neutral-900/50 p-1 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 px-3 py-1.5 text-neutral-400">
              <Calendar size={14} />
            </div>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent text-white text-xs font-bold border-none outline-none pr-8 py-1.5 focus:ring-0"
            >
              {months.map(m => <option key={m.value} value={m.value} className="bg-neutral-900">{m.label}</option>)}
            </select>
            <div className="w-px h-4 bg-white/10"></div>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-white text-xs font-bold border-none outline-none pr-8 py-1.5 focus:ring-0"
            >
              {years.map(y => <option key={y} value={y} className="bg-neutral-900">{y}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-black/20 p-1 rounded-xl border border-white/5">
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
      </div>

      {loading ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="text-neutral-500 animate-pulse font-medium">กำลังโหลดข้อมูล...</div>
        </div>
      ) : !data ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="text-neutral-500">ไม่พบข้อมูลสำหรับเดือนนี้</div>
        </div>
      ) : (
        <>
          {/* Main Financial Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="stat-card p-6 border-l-4 border-brand-green">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-brand-green/10 rounded-xl">
                  <TrendingUp size={20} className="text-brand-green" />
                </div>
              </div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">รายรับรวม (จากการขาย)</div>
              <div className="text-white font-black text-2xl">{totalSaleAmount.toLocaleString()}</div>
              <div className="text-[10px] text-brand-green mt-1">บาท</div>
            </div>

            <div className="stat-card p-6 border-l-4 border-red-500">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-red-500/10 rounded-xl">
                  <TrendingDown size={20} className="text-red-500" />
                </div>
              </div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">รายจ่ายรับซื้อรวม</div>
              <div className="text-white font-black text-2xl">{totalAmount.toLocaleString()}</div>
              <div className="text-[10px] text-red-500 mt-1">บาท</div>
            </div>

            <div className="stat-card p-6 border-l-4 border-amber-500">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <Wallet size={20} className="text-amber-500" />
                </div>
              </div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">รายจ่ายอื่นๆ รวม</div>
              <div className="text-white font-black text-2xl">{totalOtherExpenseAmount.toLocaleString()}</div>
              <div className="text-[10px] text-amber-500 mt-1">บาท</div>
            </div>

            <div className={`stat-card p-6 border-l-4 ${profit >= 0 ? 'border-brand-light' : 'border-red-600 animate-pulse'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-xl ${profit >= 0 ? 'bg-brand-light/10' : 'bg-red-500/10'}`}>
                  <BarChart3 size={20} className={profit >= 0 ? 'text-brand-light' : 'text-red-500'} />
                </div>
              </div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">กำไร/ขาดทุน เบื้องต้น</div>
              <div className={`font-black text-2xl ${profit >= 0 ? 'text-brand-light' : 'text-red-500'}`}>{profit.toLocaleString()}</div>
              <div className={`text-[10px] mt-1 ${profit >= 0 ? 'text-brand-light' : 'text-red-500'}`}>บาท</div>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <button 
              onClick={handleExportExcel}
              className="btn btn-primary px-6 py-3 flex items-center gap-2 shadow-lg shadow-brand-green/20"
            >
              <Download size={18} /> Export Excel ({months.find(m => m.value === selectedMonth)?.label})
            </button>
            <button 
              onClick={() => window.print()}
              className="btn btn-outline px-6 py-3 flex items-center gap-2"
            >
              <FileText size={18} /> Print PDF
            </button>
          </div>

          {/* Details Table - 3 Column View */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* 1. รายรับจากการขาย */}
            <div className="table-wrap">
              <div className="p-4 border-b border-neutral-800 bg-brand-green/5 font-bold text-sm text-brand-green flex items-center gap-2">
                <TrendingUp size={14} /> รายละเอียดการขาย (รายรับ)
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="text-[11px]">
                  <thead className="sticky top-0 bg-neutral-900 z-10">
                    <tr>
                      <th>วันที่</th>
                      <th>ลูกค้า</th>
                      <th className="text-right">จำนวนเงิน (฿)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.transactions?.sales || []).length > 0 ? (
                      data.transactions.sales.map((s: any) => (
                        <tr key={s.id}>
                          <td>{new Date(s.saleDate).toLocaleDateString('th-TH')}</td>
                          <td className="font-bold text-white">{s.customerName}</td>
                          <td className="text-right text-brand-light font-black">{Number(s.totalAmount).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="text-center py-4 text-neutral-500">ไม่มีข้อมูลการขาย</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. รายจ่ายจากการรับซื้อ (เพิ่มใหม่) */}
            <div className="table-wrap">
              <div className="p-4 border-b border-neutral-800 bg-red-500/5 font-bold text-sm text-red-500 flex items-center gap-2">
                <TrendingDown size={14} /> รายละเอียดการรับซื้อปาล์ม
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="text-[11px]">
                  <thead className="sticky top-0 bg-neutral-900 z-10">
                    <tr>
                      <th>วันที่/ใบชั่ง</th>
                      <th>เกษตรกร</th>
                      <th className="text-right">จำนวนเงิน (฿)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.transactions?.tickets || []).length > 0 ? (
                      data.transactions.tickets.map((t: any) => (
                        <tr key={t.id}>
                          <td>
                            <div className="text-white font-medium">{t.ticketNo}</div>
                            <div className="text-[9px] text-neutral-500">{new Date(t.weighInAt).toLocaleDateString('th-TH')}</div>
                          </td>
                          <td className="text-neutral-300">{t.farmer?.fullName}</td>
                          <td className="text-right text-red-400 font-black">{Number(t.totalAmount).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="text-center py-4 text-neutral-500">ไม่มีข้อมูลการรับซื้อ</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. รายจ่ายอื่นๆ */}
            <div className="table-wrap">
              <div className="p-4 border-b border-neutral-800 bg-amber-500/5 font-bold text-sm text-amber-500 flex items-center gap-2">
                <Wallet size={14} /> รายละเอียดรายจ่ายอื่นๆ
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="text-[11px]">
                  <thead className="sticky top-0 bg-neutral-900 z-10">
                    <tr>
                      <th>วันที่</th>
                      <th>รายการ</th>
                      <th className="text-right">จำนวนเงิน (฿)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.transactions?.expenses || []).length > 0 ? (
                      data.transactions.expenses.map((e: any) => (
                        <tr key={e.id}>
                          <td>{new Date(e.expenseDate).toLocaleDateString('th-TH')}</td>
                          <td className="font-bold text-white">{e.description}</td>
                          <td className="text-right text-amber-500 font-black">{Number(e.amount).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="text-center py-4 text-neutral-500">ไม่มีข้อมูลรายจ่ายอื่นๆ</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Report;
