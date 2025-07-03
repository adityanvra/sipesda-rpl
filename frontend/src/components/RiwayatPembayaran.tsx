import React, { useState, useEffect } from 'react';
import { Student, Payment } from '../types';
import { useDatabaseContext } from '../contexts/DatabaseContext';
import RealTimeClock from './RealTimeClock';
import * as XLSX from 'xlsx';

interface ClassSummary {
  className: string;
  totalStudents: number;
  paidStudents: number;
  unpaidStudents: number;
  totalPaid: number;
  totalUnpaid: number;
}

interface PaymentSummary {
  maleStudents: number;
  femaleStudents: number;
  totalPaid: number;
  totalUnpaid: number;
  classSummaries: ClassSummary[];
}

const RiwayatPembayaran: React.FC = () => {
  const { db, isLoading: isDbLoading } = useDatabaseContext();
  const [searchNisn, setSearchNisn] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'rekap' | 'siswa'>('rekap');
  const [selectedPaymentType, setSelectedPaymentType] = useState('SPP Bulanan');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    maleStudents: 0,
    femaleStudents: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    classSummaries: []
  });
  const [studentPayments, setStudentPayments] = useState<{
    spp: Payment[];
    other: Payment[];
  }>({
    spp: [],
    other: []
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const paymentTypes = [
    'SPP Bulanan',
    'Buku LKS',
    'Seragam',
    'Ekstrakulikuler',
    'Kegiatan'
  ];

  const years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019'];

  useEffect(() => {
    loadSummaryData();
  }, [db, selectedPaymentType, selectedYear]);

  const loadSummaryData = async () => {
    if (!db) return;
    
    try {
      setLoading(true);
      
      // Get all students
      const students = await db.getAllStudents();
      
      // For all payment types including SPP Bulanan, filter by selected year
      const relevantStudents = students.filter(s => s.angkatan === selectedYear);
      
      // Filter students by selected year for statistics
      const yearStudents = students.filter(s => s.angkatan === selectedYear);
      
      // Calculate gender statistics for the selected year
      const maleStudents = yearStudents.filter(s => s.jenis_kelamin === 'L').length;
      const femaleStudents = yearStudents.filter(s => s.jenis_kelamin === 'P').length;

      // Get all payments for selected type and year
      const allPayments = await Promise.all(
        relevantStudents.map(async (student) => {
          const payments = await db.getPaymentsByStudentNisn(student.nisn);
          
          const filtered = payments.filter(p => {
            // Filter by payment type
            const matchesPaymentType = p.jenis_pembayaran.startsWith(selectedPaymentType.split(' ')[0]);
            
            // For SPP Bulanan, don't filter by payment year since students can pay SPP in any year
            // For other payment types, filter by the selected year
            let matchesYear = true;
            if (selectedPaymentType !== 'SPP Bulanan') {
              const paymentYear = new Date(p.tanggal_pembayaran).getFullYear().toString();
              matchesYear = paymentYear === selectedYear;
            }
            
            return matchesPaymentType && matchesYear;
          });
          
          return filtered;
        })
      );

      // Generate all class combinations
      const classes = [];
      for (let grade = 1; grade <= 6; grade++) {
        for (let section of ['A', 'B', 'C', 'D']) {
          classes.push(`${grade}${section}`);
        }
      }

      // Calculate class summaries
      const classSummaries = await Promise.all(
        classes.map(async (className) => {
          // Only show students from selected year for all payment types
          const classStudents = yearStudents.filter(s => s.kelas === className);
            
          const classPayments = await Promise.all(
            classStudents.map(async (student) => {
              const payments = await db.getPaymentsByStudentNisn(student.nisn);
              const relevantPayments = payments.filter(p => {
                // Filter by payment type
                const matchesPaymentType = p.jenis_pembayaran.startsWith(selectedPaymentType.split(' ')[0]);
                
                // For SPP Bulanan, don't filter by payment year since students can pay SPP in any year
                // For other payment types, filter by the selected year
                let matchesYear = true;
                if (selectedPaymentType !== 'SPP Bulanan') {
                  const paymentYear = new Date(p.tanggal_pembayaran).getFullYear().toString();
                  matchesYear = paymentYear === selectedYear;
                }
                
                return matchesPaymentType && matchesYear;
              });
              return {
                hasPaid: relevantPayments.length > 0,
                amount: relevantPayments.reduce((sum, p) => sum + parseFloat(String(p.nominal || 0)), 0)
              };
            })
          );

          const paidStudents = classPayments.filter(p => p.hasPaid).length;
          const totalPaid = classPayments.reduce((sum, p) => {
            const amount = p.amount || 0;  // Use 'amount' which is already calculated above
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);
          
          // Calculate expected amount based on payment type for non-SPP payments
          let totalUnpaid = 0;
          if (selectedPaymentType !== 'SPP Bulanan') {
            let expectedAmount = 0;
            if (selectedPaymentType === 'Buku LKS') {
            expectedAmount = classStudents.length * 250000; // 250000 per student
          } else if (selectedPaymentType === 'Seragam') {
            expectedAmount = classStudents.length * 300000; // 300000 per student
          } else if (selectedPaymentType === 'Ekstrakulikuler') {
            expectedAmount = classStudents.length * 150000; // 150000 per student
          } else if (selectedPaymentType === 'Kegiatan') {
            expectedAmount = classStudents.length * 200000; // 200000 per student
            }
            totalUnpaid = Math.max(0, expectedAmount - totalPaid);
          } else {
            // For SPP Bulanan, calculate expected amount based on monthly SPP fee
            // Assuming SPP is 100,000 per month and we're calculating for the selected year (12 months)
            const expectedSPPPerStudentPerYear = 100000 * 12; // 1,200,000 per student per year
            const expectedAmount = classStudents.length * expectedSPPPerStudentPerYear;
            totalUnpaid = Math.max(0, expectedAmount - totalPaid); // Ensure non-negative
          }

          return {
            className,
            totalStudents: classStudents.length,
            paidStudents,
            unpaidStudents: classStudents.length - paidStudents,
            totalPaid,
            totalUnpaid
          };
        })
      );

      // Calculate total statistics
      const totalPaid = classSummaries.reduce((sum, c) => {
        const amount = c.totalPaid || 0;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      const totalUnpaid = classSummaries.reduce((sum, c) => {
        const amount = c.totalUnpaid || 0;
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      setPaymentSummary({
        maleStudents,
        femaleStudents,
        totalPaid,
        totalUnpaid,
        classSummaries
      });

    } catch (error) {
      console.error('Error loading summary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchNisn.trim()) {
      alert('Masukkan NISN siswa');
      return;
    }

    if (!db) return;

    setLoading(true);
    try {
      const foundStudent = await db.getStudentByNisn(searchNisn);
      if (foundStudent) {
        setStudent(foundStudent);
        
        // Get student's payments
        const payments = await db.getPaymentsByStudentNisn(foundStudent.nisn);
        
        // Separate payments by type
        setStudentPayments({
          spp: payments.filter(p => p.jenis_pembayaran.startsWith('SPP')),
          other: payments.filter(p => !p.jenis_pembayaran.startsWith('SPP'))
        });
      } else {
        alert('Siswa dengan NISN tersebut tidak ditemukan');
        setStudent(null);
        setStudentPayments({ spp: [], other: [] });
      }
    } catch (error) {
      alert('Terjadi kesalahan saat mencari siswa');
    } finally {
      setLoading(false);
    }
  };

  // Add click handler for payments
  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment);
  };

  // Add print receipt function
  const handlePrintReceipt = (payment: Payment) => {
    if (!student) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nota Pembayaran - ${payment.jenis_pembayaran}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
          }
          .receipt {
            max-width: 400px;
            margin: 0 auto;
            border: 1px solid #ddd;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .school-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .school-info {
            font-size: 10px;
            color: #666;
          }
          .receipt-title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin: 15px 0;
            text-transform: uppercase;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 2px 0;
          }
          .info-label {
            font-weight: bold;
            min-width: 120px;
          }
          .divider {
            border-top: 1px dashed #333;
            margin: 15px 0;
          }
          .amount-section {
            background: #f9f9f9;
            padding: 10px;
            margin: 15px 0;
            text-align: center;
          }
          .amount {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
          }
          .signature-box {
            text-align: center;
            width: 45%;
          }
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 50px;
            padding-top: 5px;
            font-size: 10px;
          }
          @media print {
            body { margin: 0; }
            .receipt { border: none; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="school-name">SIPESDA</div>
            <div class="school-info">Sistem Informasi Pembayaran Siswa</div>
            <div class="school-info">Jl. Pendidikan No. 123, Jakarta</div>
          </div>
          
          <div class="receipt-title">Nota Pembayaran</div>
          
          <div class="info-row">
            <span class="info-label">No. Nota:</span>
            <span>#${payment.id.toString().padStart(6, '0')}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Tanggal:</span>
            <span>${new Date(payment.tanggal_pembayaran).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Waktu:</span>
            <span>${new Date(payment.created_at || payment.tanggal_pembayaran).toLocaleTimeString('id-ID')}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="info-row">
            <span class="info-label">NISN:</span>
            <span>${student.nisn}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Nama Siswa:</span>
            <span>${student.nama}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Kelas:</span>
            <span>${student.kelas}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Angkatan:</span>
            <span>${student.angkatan}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="info-row">
            <span class="info-label">Jenis Pembayaran:</span>
            <span>${payment.jenis_pembayaran}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span style="color: #16a34a; font-weight: bold;">${payment.status.toUpperCase()}</span>
          </div>
          
          ${payment.keterangan ? `
          <div class="info-row">
            <span class="info-label">Keterangan:</span>
            <span>${payment.keterangan}</span>
          </div>
          ` : ''}
          
          ${payment.catatan ? `
          <div class="info-row">
            <span class="info-label">Catatan:</span>
            <span>${payment.catatan}</span>
          </div>
          ` : ''}
          
          <div class="amount-section">
            <div>TOTAL PEMBAYARAN</div>
                         <div class="amount">Rp ${parseFloat(String(payment.nominal)).toLocaleString('id-ID')}</div>
          </div>
          
          <div class="info-row">
            <span class="info-label">Petugas:</span>
            <span>${payment.petugas}</span>
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <div>Penerima</div>
              <div class="signature-line">${payment.petugas}</div>
            </div>
            <div class="signature-box">
              <div>Pembayar</div>
              <div class="signature-line">${student.nama}</div>
            </div>
          </div>
          
          <div class="footer">
            <div>Terima kasih atas pembayaran Anda</div>
            <div>Simpan nota ini sebagai bukti pembayaran yang sah</div>
            <div style="margin-top: 10px;">
              Dicetak pada: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}
            </div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  // Add Excel export function
  const handleExportToExcel = async () => {
    if (!paymentSummary || !db) return;
    
    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Summary Overview
      const summaryData = [
        ['REKAP PEMBAYARAN ' + selectedPaymentType.toUpperCase()],
        ['Angkatan: ' + selectedYear],
        ['Tanggal Export: ' + new Date().toLocaleDateString('id-ID')],
        [],
        ['RINGKASAN'],
        ['Total Siswa Laki-laki', paymentSummary.maleStudents],
        ['Total Siswa Perempuan', paymentSummary.femaleStudents],
        ['Total Siswa', paymentSummary.maleStudents + paymentSummary.femaleStudents],
        [],
        ['TOTAL DANA'],
        ['Yang Sudah Dibayarkan', 'Rp ' + paymentSummary.totalPaid.toLocaleString('id-ID')],
        ['Yang Belum Dibayarkan', 'Rp ' + paymentSummary.totalUnpaid.toLocaleString('id-ID')],
        ['Total Expected', 'Rp ' + (paymentSummary.totalPaid + paymentSummary.totalUnpaid).toLocaleString('id-ID')],
        [],
        ['BREAKDOWN PER KELAS'],
        ['Kelas', 'Total Siswa', 'Siswa Lunas', 'Siswa Belum Lunas', 'Dana Terkumpul', 'Dana Belum Terkumpul']
      ];
      
      // Add class breakdown data
      paymentSummary.classSummaries.forEach(classData => {
        summaryData.push([
          classData.className,
          classData.totalStudents,
          classData.paidStudents,
          classData.unpaidStudents,
          'Rp ' + classData.totalPaid.toLocaleString('id-ID'),
          'Rp ' + classData.totalUnpaid.toLocaleString('id-ID')
        ]);
      });
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');
      
      // Sheet 2: Detailed Student Payments
      const students = await db.getAllStudents();
      const relevantStudents = students.filter(s => s.angkatan === selectedYear);
      
      const detailData = [
        ['DETAIL PEMBAYARAN SISWA'],
        ['Jenis Pembayaran: ' + selectedPaymentType],
        ['Angkatan: ' + selectedYear],
        [],
        ['NISN', 'Nama Siswa', 'Kelas', 'Jenis Kelamin', 'Status Pembayaran', 'Total Dibayar', 'Tanggal Pembayaran Terakhir', 'Petugas']
      ];
      
      for (const student of relevantStudents) {
        const payments = await db.getPaymentsByStudentNisn(student.nisn);
        const relevantPayments = payments.filter(p => {
          const matchesPaymentType = p.jenis_pembayaran.startsWith(selectedPaymentType.split(' ')[0]);
          let matchesYear = true;
          if (selectedPaymentType !== 'SPP Bulanan') {
            const paymentYear = new Date(p.tanggal_pembayaran).getFullYear().toString();
            matchesYear = paymentYear === selectedYear;
          }
          return matchesPaymentType && matchesYear;
        });
        
        const totalPaid = relevantPayments.reduce((sum, p) => sum + parseFloat(String(p.nominal || 0)), 0);
        const lastPayment = relevantPayments.length > 0 ? relevantPayments[relevantPayments.length - 1] : null;
        
        detailData.push([
          student.nisn,
          student.nama,
          student.kelas,
          student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
          relevantPayments.length > 0 ? 'Sudah Bayar' : 'Belum Bayar',
          'Rp ' + totalPaid.toLocaleString('id-ID'),
          lastPayment ? new Date(lastPayment.tanggal_pembayaran).toLocaleDateString('id-ID') : '-',
          lastPayment ? lastPayment.petugas : '-'
        ]);
      }
      
      const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detail Siswa');
      
      // Sheet 3: Payment History (if SPP)
      if (selectedPaymentType === 'SPP Bulanan') {
        const sppHistoryData = [
          ['RIWAYAT PEMBAYARAN SPP DETAIL'],
          ['Angkatan: ' + selectedYear],
          [],
          ['NISN', 'Nama Siswa', 'Kelas', 'Bulan/Tahun SPP', 'Nominal', 'Tanggal Bayar', 'Status', 'Petugas', 'Keterangan']
        ];
        
        for (const student of relevantStudents) {
          const payments = await db.getPaymentsByStudentNisn(student.nisn);
          const sppPayments = payments.filter(p => p.jenis_pembayaran.startsWith('SPP'));
          
          if (sppPayments.length > 0) {
            sppPayments.forEach(payment => {
              sppHistoryData.push([
                student.nisn,
                student.nama,
                student.kelas,
                payment.jenis_pembayaran,
                'Rp ' + parseFloat(String(payment.nominal || 0)).toLocaleString('id-ID'),
                new Date(payment.tanggal_pembayaran).toLocaleDateString('id-ID'),
                payment.status,
                payment.petugas,
                payment.keterangan || '-'
              ]);
            });
          } else {
            sppHistoryData.push([
              student.nisn,
              student.nama,
              student.kelas,
              'Belum ada pembayaran SPP',
              'Rp 0',
              '-',
              'Belum Bayar',
              '-',
              '-'
            ]);
          }
        }
        
        const sppHistorySheet = XLSX.utils.aoa_to_sheet(sppHistoryData);
        XLSX.utils.book_append_sheet(workbook, sppHistorySheet, 'Riwayat SPP');
      }
      
      // Generate filename
      const fileName = `Rekap_${selectedPaymentType.replace(' ', '_')}_Angkatan_${selectedYear}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Write and download
      XLSX.writeFile(workbook, fileName);
      
      alert('File Excel berhasil didownload!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Terjadi kesalahan saat mengexport ke Excel');
    }
  };

  if (isDbLoading) {
    return (
      <div className="p-6">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">📋</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Laporan</h1>
        </div>
        <RealTimeClock />
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-100 rounded-lg p-2 mb-6">
        <button
          onClick={() => setActiveTab('rekap')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'rekap'
              ? 'bg-slate-800 text-white'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          Rekap Keseluruhan
        </button>
        <button
          onClick={() => setActiveTab('siswa')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'siswa'
              ? 'bg-slate-800 text-white'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          Rekap Siswa
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {activeTab === 'rekap' ? (
          loading ? (
            <div className="p-20 flex justify-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="p-6">
              {/* Payment Type and Year Selection */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Pembayaran:
                  </label>
                  <select
                    value={selectedPaymentType}
                    onChange={(e) => setSelectedPaymentType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {paymentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Angkatan:
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Statistics */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 p-6 rounded-lg flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl">👨</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Siswa Laki-laki</p>
                    <p className="text-2xl font-bold">{paymentSummary.maleStudents}</p>
                  </div>
                </div>
                <div className="bg-pink-50 p-6 rounded-lg flex items-center space-x-4">
                  <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-2xl">👩</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Siswa Perempuan</p>
                    <p className="text-2xl font-bold">{paymentSummary.femaleStudents}</p>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-white border rounded-lg mb-6">
                <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
                  <h3 className="font-bold">Rekap Total Dana {selectedPaymentType}</h3>
                  <button
                    onClick={handleExportToExcel}
                    disabled={loading || !paymentSummary}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    📊 Export Excel
                  </button>
                </div>
                <div className="p-6">
                  {selectedPaymentType === 'SPP Bulanan' ? (
                    // For SPP Bulanan, show total accumulated funds for selected year
                    <>
                    <div className="mb-4">
                      <p className="font-medium">Total Dana SPP Bulanan Siswa Angkatan {selectedYear} yang sudah dibayarkan</p>
                      <p className="text-2xl font-bold text-green-600">Rp {paymentSummary.totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="mb-4">
                      <p className="font-medium">Total Dana SPP Bulanan Siswa Angkatan {selectedYear} yang belum dibayarkan</p>
                      <p className="text-2xl font-bold text-red-600">Rp {paymentSummary.totalUnpaid.toLocaleString()}</p>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      <p>Total akumulasi dana SPP yang telah terkumpul dari pembayaran siswa angkatan {selectedYear} pada tahun {selectedYear}</p>
                      <p className="mt-1">Perhitungan berdasarkan SPP Rp 100.000/bulan × 12 bulan = Rp 1.200.000/siswa/tahun</p>
                    </div>
                    </>
                  ) : (
                    // For other payment types, show paid vs unpaid
                    <>
                  <div className="mb-4">
                    <p className="font-medium">Total Dana {selectedPaymentType} Siswa Angkatan {selectedYear} yang sudah dibayarkan</p>
                    <p className="text-xl font-bold text-green-600">Rp {paymentSummary.totalPaid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="font-medium">Total Dana {selectedPaymentType} Siswa Angkatan {selectedYear} yang belum dibayarkan</p>
                    <p className="text-xl font-bold text-red-600">Rp {paymentSummary.totalUnpaid.toLocaleString()}</p>
                  </div>
                    </>
                  )}
                </div>
              </div>

              {/* Class Payment Status */}
              <div className="space-y-6">
                {/* Group classes by grade */}
                {[1, 2, 3, 4, 5, 6].map((grade) => {
                  const gradeClasses = paymentSummary.classSummaries
                    .filter(summary => summary.className.startsWith(grade.toString()));
                  
                  // Only show grades that have classes with students
                  if (gradeClasses.length === 0 || gradeClasses.every(c => c.totalStudents === 0)) {
                    return null;
                  }

                  return (
                    <div key={grade} className="bg-white border rounded-lg">
                      <div className="bg-slate-800 text-white p-4">
                        <h3 className="font-bold">Kelas {grade}</h3>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {gradeClasses.map((summary) => (
                          <div key={summary.className} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="font-medium">Kelas {summary.className}</h4>
                              <span className="text-sm text-gray-600">Total Siswa: {summary.totalStudents}</span>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span>Siswa Lunas {selectedPaymentType}</span>
                                  <span>{summary.paidStudents} Siswa</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{
                                      width: `${summary.totalStudents ? (summary.paidStudents / summary.totalStudents) * 100 : 0}%`
                                    }}
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span>Siswa Belum Lunas {selectedPaymentType}</span>
                                  <span>{summary.unpaidStudents} Siswa</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-red-500 h-2 rounded-full"
                                    style={{
                                      width: `${summary.totalStudents ? (summary.unpaidStudents / summary.totalStudents) * 100 : 0}%`
                                    }}
                                  />
                                </div>
                              </div>
                              {selectedPaymentType === 'SPP Bulanan' && (
                                <div>
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span>Total Dana SPP Terkumpul</span>
                                    <span className="font-bold text-green-600">Rp {summary.totalPaid.toLocaleString()}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Dana SPP angkatan {selectedYear} dari {summary.paidStudents} siswa yang telah melakukan pembayaran pada tahun {selectedYear}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          // Rekap Siswa Content
          <div>
            {/* Search Section */}
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold mb-4">Data Siswa</h2>
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Masukan NISN Siswa"
                    value={searchNisn}
                    onChange={(e) => setSearchNisn(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                </div>
                <button 
                  onClick={handleSearch}
                  disabled={loading || !db}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  Cari
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-20 flex justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : student ? (
              <div className="grid grid-cols-12 gap-6 p-6">
                {/* Profile Section */}
                <div className="col-span-4">
                  <div className="bg-slate-800 text-white p-4 rounded-t-lg">
                    <h3 className="font-bold">Profile Siswa</h3>
                  </div>
                  <div className="border border-t-0 rounded-b-lg p-6">
                    <div className="flex justify-center mb-6">
                      <div className="w-24 h-24 bg-pink-200 rounded-full flex items-center justify-center">
                        <span className="text-4xl">{student.jenis_kelamin === 'L' ? '👨' : '👩'}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-600">NISN</label>
                        <p className="font-medium">{student.nisn}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Nama</label>
                        <p className="font-medium">{student.nama}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Jenis Kelamin</label>
                        <p className="font-medium">{student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Nama Wali</label>
                        <p className="font-medium">{student.nama_wali}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Angkatan</label>
                        <p className="font-medium">{student.angkatan}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Kelas</label>
                        <p className="font-medium">{student.kelas}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Alamat</label>
                        <p className="font-medium">{student.alamat || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">No. HP</label>
                        <p className="font-medium">{student.no_hp || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment History Section */}
                <div className="col-span-8">
                  <div className="bg-slate-800 text-white p-4 rounded-t-lg">
                    <h3 className="font-bold">Riwayat Pembayaran</h3>
                  </div>
                  <div className="border border-t-0 rounded-b-lg">
                    <div className="p-4">
                      {/* SPP Payments */}
                      {studentPayments.spp.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-800 mb-4">Pembayaran SPP</h4>
                          <div className="space-y-4">
                            {studentPayments.spp.map((payment, index) => (
                              <div
                                key={`spp-${index}`}
                                onClick={() => handlePaymentClick(payment)}
                                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                  selectedPayment?.id === payment.id
                                    ? 'bg-blue-50 border-blue-500'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">{payment.jenis_pembayaran}</p>
                                    <p className="text-sm text-gray-600">
                                      {new Date(payment.tanggal_pembayaran).toLocaleDateString('id-ID')}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      Petugas: {payment.petugas}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-green-600">
                                      Rp {parseFloat(String(payment.nominal)).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {payment.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                                    </p>
                                  </div>
                                </div>
                                {(payment.keterangan || payment.catatan) && (
                                  <div className="mt-2 pt-2 border-t text-sm text-gray-600">
                                    {payment.keterangan && (
                                      <p>Keterangan: {payment.keterangan}</p>
                                    )}
                                    {payment.catatan && (
                                      <p className="mt-1">Catatan: {payment.catatan}</p>
                                    )}
                                  </div>
                                )}
                                {selectedPayment?.id === payment.id && payment.status === 'lunas' && (
                                  <div className="mt-3 pt-3 border-t flex justify-end">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePrintReceipt(payment);
                                      }}
                                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                                    >
                                      🖨️ Cetak Nota
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other Payments */}
                      {studentPayments.other.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-4">Pembayaran Lainnya</h4>
                          <div className="space-y-4">
                            {studentPayments.other.map((payment, index) => (
                              <div
                                key={`other-${index}`}
                                onClick={() => handlePaymentClick(payment)}
                                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                  selectedPayment?.id === payment.id
                                    ? 'bg-blue-50 border-blue-500'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">{payment.jenis_pembayaran}</p>
                                    <p className="text-sm text-gray-600">
                                      {new Date(payment.tanggal_pembayaran).toLocaleDateString('id-ID')}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      Petugas: {payment.petugas}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-green-600">
                                      Rp {parseFloat(String(payment.nominal)).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {payment.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                                    </p>
                                  </div>
                                </div>
                                {(payment.keterangan || payment.catatan) && (
                                  <div className="mt-2 pt-2 border-t text-sm text-gray-600">
                                    {payment.keterangan && (
                                      <p>Keterangan: {payment.keterangan}</p>
                                    )}
                                    {payment.catatan && (
                                      <p className="mt-1">Catatan: {payment.catatan}</p>
                                    )}
                                  </div>
                                )}
                                {selectedPayment?.id === payment.id && payment.status === 'lunas' && (
                                  <div className="mt-3 pt-3 border-t flex justify-end">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePrintReceipt(payment);
                                      }}
                                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                                    >
                                      🖨️ Cetak Nota
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {studentPayments.spp.length === 0 && studentPayments.other.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                          Belum ada riwayat pembayaran
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-20 text-center text-gray-500">
                Masukkan NISN siswa untuk melihat riwayat pembayaran
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiwayatPembayaran;