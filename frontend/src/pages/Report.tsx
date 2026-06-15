import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Download, FileText, BarChart3, TrendingUp, TrendingDown, Wallet, Calendar, ArrowRightLeft } from 'lucide-react';

const Report = () => {
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  
  // Pagination states
  const [salesPage, setSalesPage] = useState(1);
  const [ticketsPage, setTicketsPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);
  const [transfersPage, setTransfersPage] = useState(1);
  const itemsPerPage = 15;

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
    setSalesPage(1);
    setTicketsPage(1);
    setExpensesPage(1);
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

  // Sales Pagination
  const sales = data?.transactions?.sales || [];
  const salesTotalPages = Math.ceil(sales.length / itemsPerPage);
  const currentSales = sales.slice((salesPage - 1) * itemsPerPage, salesPage * itemsPerPage);

  // Tickets Pagination
  const tickets = data?.transactions?.tickets || [];
  const ticketsTotalPages = Math.ceil(tickets.length / itemsPerPage);
  const currentTickets = tickets.slice((ticketsPage - 1) * itemsPerPage, ticketsPage * itemsPerPage);

  // Expenses Pagination
  const expenses = data?.transactions?.expenses || [];
  const expensesTotalPages = Math.ceil(expenses.length / itemsPerPage);
  const currentExpenses = expenses.slice((expensesPage - 1) * itemsPerPage, expensesPage * itemsPerPage);

  // Transfers Pagination
  const transfers = data?.transactions?.transfers || [];
  const transfersTotalPages = Math.ceil(transfers.length / itemsPerPage);
  const currentTransfers = transfers.slice((transfersPage - 1) * itemsPerPage, transfersPage * itemsPerPage);

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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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

            <div className="stat-card p-6 border-l-4 border-brand-amber">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-brand-amber/10 rounded-xl">
                  <ArrowRightLeft size={20} className="text-brand-amber" />
                </div>
              </div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase mb-1">โอนย้ายภายใน</div>
              <div className="text-white font-black text-2xl">{(data?.summary?.totalTransferVolume || 0).toLocaleString()}</div>
              <div className="text-[10px] text-brand-amber mt-1">กิโลกรัม</div>
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

          {/* Details Table - 3 Column View with refined weighted layout (3:3:2) */}
          <div className="grid grid-cols-1 xl:grid-cols-8 gap-6">
            {/* 1. รายรับจากการขาย - 37.5% width (col-span-3) */}
            <div className="table-wrap xl:col-span-3">
              <div className="p-4 border-b border-neutral-800 bg-brand-green/5 font-bold text-sm text-brand-green flex items-center gap-2">
                <TrendingUp size={14} /> รายละเอียดการขาย (รายรับ)
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="text-[11px]">
                  <thead className="sticky top-0 bg-neutral-900 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left">วันที่</th>
                      <th className="px-3 py-2 text-left">ลูกค้า</th>
                      <th className="px-3 py-2 text-right">จำนวน (กก.)</th>
                      <th className="px-3 py-2 text-right">จำนวนเงิน (฿)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentSales.length > 0 ? (
                      currentSales.map((s: any) => (
                        <tr key={s.id}>
                          <td className="px-3 py-2">{new Date(s.saleDate).toLocaleDateString('th-TH')}</td>
                          <td className="px-3 py-2 font-bold text-white">{s.customerName}</td>
                          <td className="px-3 py-2 text-right text-neutral-400 font-mono">{Number(s.quantityKg).toLocaleString()}</td>
                          <td className="px-3 py-2 text-right text-brand-light font-black">{Number(s.totalAmount).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="text-center py-4 text-neutral-500">ไม่มีข้อมูลการขาย</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {salesTotalPages > 1 && (
                <div className="p-3 bg-black/20 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-neutral-500">{sales.length} รายการ</div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setSalesPage(p => Math.max(1, p - 1))}
                      disabled={salesPage === 1}
                      className="px-2 py-1 bg-neutral-900 border border-white/10 rounded text-[10px] text-white disabled:opacity-30 hover:bg-neutral-800"
                    >
                      ก่อน
                    </button>
                    <span className="text-[10px] text-neutral-400 flex items-center px-1">{salesPage}/{salesTotalPages}</span>
                    <button 
                      onClick={() => setSalesPage(p => Math.min(salesTotalPages, p + 1))}
                      disabled={salesPage === salesTotalPages}
                      className="px-2 py-1 bg-neutral-900 border border-white/10 rounded text-[10px] text-white disabled:opacity-30 hover:bg-neutral-800"
                    >
                      ถัดไป
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. รายจ่ายจากการรับซื้อ - 37.5% width (col-span-3) */}
            <div className="table-wrap xl:col-span-3">
              <div className="p-4 border-b border-neutral-800 bg-red-500/5 font-bold text-sm text-red-500 flex items-center gap-2">
                <TrendingDown size={14} /> รายละเอียดการรับซื้อปาล์ม
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="text-[11px]">
                  <thead className="sticky top-0 bg-neutral-900 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left">วันที่/ใบชั่ง</th>
                      <th className="px-3 py-2 text-left">เกษตรกร</th>
                      <th className="px-3 py-2 text-right">จำนวน (กก.)</th>
                      <th className="px-3 py-2 text-right">จำนวนเงิน (฿)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentTickets.length > 0 ? (
                      currentTickets.map((t: any) => (
                        <tr key={t.id}>
                          <td className="px-3 py-2">
                            <div className="text-white font-medium">{t.ticketNo}</div>
                            <div className="text-[9px] text-neutral-500">{new Date(t.weighInAt).toLocaleDateString('th-TH')}</div>
                          </td>
                          <td className="px-3 py-2 text-neutral-300">{t.farmer?.fullName}</td>
                          <td className="px-3 py-2 text-right text-neutral-400 font-mono">{Number(t.finalWeightKg || t.netWeightKg).toLocaleString()}</td>
                          <td className="px-3 py-2 text-right text-red-400 font-black">{Number(t.totalAmount).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="text-center py-4 text-neutral-500">ไม่มีข้อมูลการรับซื้อ</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {ticketsTotalPages > 1 && (
                <div className="p-3 bg-black/20 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-neutral-500">{tickets.length} รายการ</div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setTicketsPage(p => Math.max(1, p - 1))}
                      disabled={ticketsPage === 1}
                      className="px-2 py-1 bg-neutral-900 border border-white/10 rounded text-[10px] text-white disabled:opacity-30 hover:bg-neutral-800"
                    >
                      ก่อน
                    </button>
                    <span className="text-[10px] text-neutral-400 flex items-center px-1">{ticketsPage}/{ticketsTotalPages}</span>
                    <button 
                      onClick={() => setTicketsPage(p => Math.min(ticketsTotalPages, p + 1))}
                      disabled={ticketsPage === ticketsTotalPages}
                      className="px-2 py-1 bg-neutral-900 border border-white/10 rounded text-[10px] text-white disabled:opacity-30 hover:bg-neutral-800"
                    >
                      ถัดไป
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. รายจ่ายอื่นๆ - 25% width (col-span-2) */}
            <div className="table-wrap xl:col-span-2">
              <div className="p-4 border-b border-neutral-800 bg-amber-500/5 font-bold text-sm text-amber-500 flex items-center gap-2">
                <Wallet size={14} /> รายละเอียดรายจ่ายอื่นๆ
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="text-[11px]">
                  <thead className="sticky top-0 bg-neutral-900 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left">วันที่</th>
                      <th className="px-3 py-2 text-left">รายการ</th>
                      <th className="px-3 py-2 text-right">จำนวนเงิน (฿)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentExpenses.length > 0 ? (
                      currentExpenses.map((e: any) => (
                        <tr key={e.id}>
                          <td className="px-3 py-2">{new Date(e.expenseDate).toLocaleDateString('th-TH')}</td>
                          <td className="px-3 py-2 font-bold text-white">{e.description}</td>
                          <td className="px-3 py-2 text-right text-amber-500 font-black">{Number(e.amount).toLocaleString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="text-center py-4 text-neutral-500">ไม่มีข้อมูลรายจ่ายอื่นๆ</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {expensesTotalPages > 1 && (
                <div className="p-3 bg-black/20 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-neutral-500">{expenses.length} รายการ</div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setExpensesPage(p => Math.max(1, p - 1))}
                      disabled={expensesPage === 1}
                      className="px-2 py-1 bg-neutral-900 border border-white/10 rounded text-[10px] text-white disabled:opacity-30 hover:bg-neutral-800"
                    >
                      ก่อน
                    </button>
                    <span className="text-[10px] text-neutral-400 flex items-center px-1">{expensesPage}/{expensesTotalPages}</span>
                    <button 
                      onClick={() => setExpensesPage(p => Math.min(expensesTotalPages, p + 1))}
                      disabled={expensesPage === expensesTotalPages}
                      className="px-2 py-1 bg-neutral-900 border border-white/10 rounded text-[10px] text-white disabled:opacity-30 hover:bg-neutral-800"
                    >
                      ถัดไป
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Internal Transfers Table */}
          <div className="mt-8 space-y-4">
            <h3 className="text-[15px] font-bold text-white uppercase tracking-wider pl-1">รายการโอนย้ายสต็อกภายใน</h3>
            <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-black/40 border-b border-white/5">
                      <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">เลขที่รายการ</th>
                      <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">วันที่</th>
                      <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">ต้นทาง</th>
                      <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">ปลายทาง</th>
                      <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-center">เกรด</th>
                      <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">จำนวน (กก.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentTransfers.length > 0 ? currentTransfers.map((s: any) => (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-white">{s.saleNo}</td>
                        <td className="px-6 py-4 text-neutral-400 text-xs">{new Date(s.saleDate).toLocaleDateString('th-TH')}</td>
                        <td className="px-6 py-4 text-neutral-300 text-sm">{s.branch?.branchName}</td>
                        <td className="px-6 py-4 text-brand-amber font-bold text-sm">{s.toBranch?.branchName}</td>
                        <td className="px-6 py-4 text-center"><span className="badge badge-gray">{s.grade}</span></td>
                        <td className="px-6 py-4 text-right font-mono text-white">{Number(s.quantityKg).toLocaleString()}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className="text-center py-12 text-neutral-500">ไม่พบรายการโอนย้าย</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {transfersTotalPages > 1 && (
                <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
                  <div className="text-xs text-neutral-500">หน้าที่ {transfersPage} จาก {transfersTotalPages}</div>
                  <div className="flex gap-2">
                    <button onClick={() => setTransfersPage(p => Math.max(1, p - 1))} disabled={transfersPage === 1} className="px-3 py-1 bg-neutral-900 border border-white/10 rounded text-xs text-white disabled:opacity-30">ก่อนหน้า</button>
                    <button onClick={() => setTransfersPage(p => Math.min(transfersTotalPages, p + 1))} disabled={transfersPage === transfersTotalPages} className="px-3 py-1 bg-neutral-900 border border-white/10 rounded text-xs text-white disabled:opacity-30">ถัดไป</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Report;
