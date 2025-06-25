import React, { useState, useEffect } from 'react';
import { Student, Payment } from '../types';
import { useDatabaseContext } from '../contexts/DatabaseContext';
import RealTimeClock from './RealTimeClock';

const Keuangan: React.FC = () => {
  const { db, isLoading: isDbLoading } = useDatabaseContext();
  const [searchNisn, setSearchNisn] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState('SPP');
  const [sppYear, setSppYear] = useState(new Date().getFullYear().toString());
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    keterangan: '',
    catatan: '',
    petugas: ''
  });
  const [paymentStatus, setPaymentStatus] = useState<Array<{
    month: string;
    year: string;
    amount: number;
    status: 'lunas' | 'belum_lunas';
    kelas: string;
  }>>([]);
  const SPP_PER_MONTH = 100000;
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<{
    id: string;
    tanggal: string;
    siswa: string;
    angkatan: string;
    bulan: string[];
    tahunPembayaran: string;
    total: number;
    petugas: string;
  } | null>(null);

  const paymentTypes = [
    { id: 'SPP', name: 'Pembayaran SPP', nominal: 100000, periode: 'Bulanan' },
    { id: 'LKS', name: 'Pembayaran LKS', nominal: 250000, periode: 'Tahunan' },
    { id: 'SERAGAM', name: 'Pembayaran Seragam', nominal: 300000, periode: 'Sekali' },
    { id: 'EKSKUL', name: 'Pembayaran Ekstrakurikuler', nominal: 150000, periode: 'Tahunan' },
    { id: 'KEGIATAN', name: 'Pembayaran Kegiatan', nominal: 200000, periode: 'Tahunan' }
  ];

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
        const studentPayments = await db.getPaymentsByStudentNisn(foundStudent.nisn);
        setPayments(studentPayments);
      } else {
        alert('Siswa dengan NISN tersebut tidak ditemukan');
        setStudent(null);
        setPayments([]);
      }
    } catch (error) {
      alert('Terjadi kesalahan saat mencari siswa');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle month selection
  const handleMonthSelection = (month: string) => {
    setSelectedMonths(prev => {
      if (prev.includes(month)) {
        return prev.filter(m => m !== month);
      } else {
        return [...prev, month];
      }
    });
  };

  // Calculate total SPP based on selected months
  const calculateTotalSPP = () => {
    return selectedMonths.length * SPP_PER_MONTH;
  };

  // Function to generate receipt ID
  const generateReceiptId = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SPP${year}${month}${day}${random}`;
  };

  // Function to handle payment and print
  const handlePaymentAndPrint = async () => {
    if (!student || !selectedMonths.length || !db) return;
    
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const receiptId = generateReceiptId();
      
      // Create payment records for each selected month
      const paymentPromises = selectedMonths.map(month => {
        const payment = {
          receipt_id: receiptId,
          student_id: student.id,
          student_nisn: student.nisn,
          jenis_pembayaran: `SPP ${month} ${sppYear}`,
          nominal: SPP_PER_MONTH,
          tanggal_pembayaran: currentDate,
          status: 'lunas' as const,
          keterangan: paymentDetails.keterangan,
          catatan: paymentDetails.catatan,
          petugas: paymentDetails.petugas
        };
        return db.createPayment(payment);
      });

      const results = await Promise.all(paymentPromises);
      const allSuccess = results.every(success => success);

      if (allSuccess) {
        // Update payments list
        const studentPayments = await db.getPaymentsByStudentNisn(student.nisn);
        setPayments(studentPayments);
        
        // Set receipt data for printing
        setCurrentReceipt({
          id: receiptId,
          tanggal: currentDate,
          siswa: student.nama,
          angkatan: student.angkatan,
          bulan: selectedMonths,
          tahunPembayaran: sppYear,
          total: calculateTotalSPP(),
          petugas: paymentDetails.petugas || 'Admin'
        });
        
        // Show receipt modal
        setShowReceipt(true);
        
        // Clear form
        setSelectedMonths([]);
        setPaymentDetails({
          keterangan: '',
          catatan: '',
          petugas: ''
        });

        alert('Pembayaran berhasil disimpan');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Gagal memproses pembayaran');
    }
  };

  // Function to print receipt
  const handlePrint = () => {
    if (!currentReceipt) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bukti Pembayaran SPP</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 14px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .school-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .school-address {
            font-size: 12px;
            margin-bottom: 3px;
          }
          .school-contact {
            font-size: 12px;
            margin-bottom: 3px;
          }
          .title {
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
          }
          .receipt-row {
            display: flex;
            margin-bottom: 10px;
          }
          .receipt-row div:first-child {
            width: 150px;
          }
          .notes {
            margin-top: 30px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">SD MUHAMMADIYAH MLANGI</div>
          <div class="school-address">Pundung, Nogotirto, Kec. Gamping, Kab. Sleman</div>
          <div class="school-address">Prov. D.I. Yogyakarta</div>
          <div class="school-contact">TELP: 02746499098</div>
          <div class="school-contact">EMAIL: sdm.mlangi@yahoo.co.id</div>
        </div>

        <div class="title">BUKTI PEMBAYARAN SPP</div>

        <div class="receipt-content">
          <div class="receipt-row">
            <div>No. Kwitansi</div>
            <div>: ${currentReceipt.id}</div>
          </div>
          <div class="receipt-row">
            <div>Tanggal</div>
            <div>: ${new Date(currentReceipt.tanggal).toLocaleDateString('id-ID')}</div>
          </div>
          <div class="receipt-row">
            <div>Nama Siswa</div>
            <div>: ${currentReceipt.siswa}</div>
          </div>
          <div class="receipt-row">
            <div>Angkatan</div>
            <div>: ${currentReceipt.angkatan}</div>
          </div>
          <div class="receipt-row">
            <div>Pembayaran</div>
            <div>: SPP Bulan ${currentReceipt.bulan.map(month => 
              months.find(m => m.id === month)?.name
            ).join(', ')} ${currentReceipt.tahunPembayaran}</div>
          </div>
          <div class="receipt-row">
            <div>Total Pembayaran</div>
            <div>: Rp ${currentReceipt.total.toLocaleString()}</div>
          </div>
        </div>

        <div class="notes">
          <div style="margin-bottom: 10px;">
            <div style="font-weight: bold;">Keterangan:</div>
            <div>${paymentDetails.keterangan || '-'}</div>
          </div>
          <div>
            <div style="font-weight: bold;">Catatan:</div>
            <div>${paymentDetails.catatan || '-'}</div>
          </div>
        </div>
        
        <div class="footer">
          <div>Petugas,</div>
          <br/><br/><br/>
          <div>${currentReceipt.petugas}</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDelete = async () => {
    if (!student || !selectedMonth || !db) {
      alert('Pilih pembayaran yang akan dihapus');
      return;
    }

    const selectedPayments = await db.getPaymentsByMonth(student.id, selectedMonth, sppYear);
    if (selectedPayments.length === 0) {
      alert('Tidak ada pembayaran untuk dihapus');
      return;
    }

    if (window.confirm('Apakah Anda yakin ingin menghapus pembayaran ini?')) {
      try {
        const success = await db.deletePayment(selectedPayments[0].id);
        if (success) {
          alert('Pembayaran berhasil dihapus');
          // Refresh payments
          const updatedPayments = await db.getPaymentsByStudentNisn(student.nisn);
          setPayments(updatedPayments);
        } else {
          alert('Gagal menghapus pembayaran');
        }
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Terjadi kesalahan saat menghapus pembayaran');
      }
    }
  };

  const handlePaymentDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPaymentDetails({
      ...paymentDetails,
      [e.target.name]: e.target.value
    });
  };

  

  const months = [
    { id: 'JAN', name: 'Januari' },
    { id: 'FEB', name: 'Februari' },
    { id: 'MAR', name: 'Maret' },
    { id: 'APR', name: 'April' },
    { id: 'MEI', name: 'Mei' },
    { id: 'JUN', name: 'Juni' },
    { id: 'JUL', name: 'Juli' },
    { id: 'AUG', name: 'Agustus' },
    { id: 'SEP', name: 'September' },
    { id: 'OKT', name: 'Oktober' },
    { id: 'NOV', name: 'November' },
    { id: 'DES', name: 'Desember' }
  ];

  const years = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019'];

  // Effect to update payment status when payments change
  useEffect(() => {
    if (!student || !payments.length) return;

    const sppPayments = payments.filter(p => p.jenis_pembayaran.startsWith('SPP'));
    const currentClass = student.kelas;
    
    // Create status for each month
    const monthlyStatus = months.map(month => {
      const paymentForMonth = sppPayments.find(p => 
        p.jenis_pembayaran.includes(month.id) && 
        p.jenis_pembayaran.includes(sppYear)
      );

      return {
        month: month.id,
        year: sppYear,
        amount: SPP_PER_MONTH,
        status: paymentForMonth ? ('lunas' as const) : ('belum_lunas' as const),
        kelas: currentClass
      };
    });

    setPaymentStatus(monthlyStatus);
  }, [payments, student, sppYear]);

  if (isDbLoading) {
    return (
      <div className="p-6">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg">
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">💰</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Keuangan</h1>
        </div>
            <RealTimeClock />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Sidebar - Payment Types */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-slate-800 text-white p-4">
                  <h3 className="font-bold">Jenis Pembayaran</h3>
                </div>
                <div className="divide-y">
                  {paymentTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedPaymentType(type.id)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        selectedPaymentType === type.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      <span className="font-medium">{type.name}</span>
                      {selectedPaymentType === type.id && (
                        <span className="text-blue-600">→</span>
                      )}
                    </button>
                  ))}
                </div>
        </div>
      </div>

            {/* Main Content Area */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-slate-800 text-white p-4">
                  <h3 className="font-bold">
                    {paymentTypes.find(t => t.id === selectedPaymentType)?.name || 'Pembayaran'}
                  </h3>
                </div>

                {/* Search Student Section */}
        <div className="p-6 border-b">
                  <div className="flex space-x-4">
              <input
                type="text"
                      placeholder="Masukkan NISN Siswa"
                value={searchNisn}
                onChange={(e) => setSearchNisn(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            <button 
              onClick={handleSearch}
              disabled={loading}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Mencari...' : 'Cari'}
            </button>
          </div>
        </div>

                {/* Student Info and Payment Status Section */}
                {student && (
                  <div className="p-6 grid grid-cols-2 gap-6">
                    {/* Student Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-4">Informasi Siswa</h4>
                      <div className="flex space-x-4">
                        {/* Profile Photo */}
                        <div className="w-24 h-24 bg-pink-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-4xl">👤</span>
              </div>

                        {/* Student Details */}
                        <div className="flex-1">
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <p className="text-sm text-gray-600">Nama</p>
                              <p className="font-medium">{student.nama}</p>
                    </div>
                            <div>
                              <p className="text-sm text-gray-600">NISN</p>
                              <p className="font-medium">{student.nisn}</p>
                  </div>
                      <div>
                              <p className="text-sm text-gray-600">Kelas</p>
                              <p className="font-medium">{student.kelas}</p>
                      </div>
                      <div>
                              <p className="text-sm text-gray-600">Angkatan</p>
                              <p className="font-medium">{student.angkatan}</p>
                      </div>
                      <div>
                              <p className="text-sm text-gray-600">Nama Wali</p>
                              <p className="font-medium">{student.nama_wali}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Status Pembayaran</h4>
                      <div className="overflow-auto max-h-[300px] pr-2">
                        <div className="space-y-2">
                          {paymentStatus
                            .filter(status => status.status === 'belum_lunas')
                            .map((status, index) => (
                              <div 
                                key={`${status.month}-${status.year}`}
                                className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg"
                              >
                                <div className="flex justify-between items-center">
                      <div>
                                    <p className="font-medium text-sm">
                                      SPP {months.find(m => m.id === status.month)?.name} {status.year}
                                    </p>
                                    <p className="text-xs text-red-600">
                                      Kelas {status.kelas}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-sm text-red-600">
                                      Rp {status.amount.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-red-600">
                                      Belum Lunas
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}

                          {paymentStatus.filter(status => status.status === 'belum_lunas').length === 0 && (
                            <div className="text-center py-3 text-sm text-gray-500">
                              Semua pembayaran sudah lunas
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Kalender SPP */}
                <div className="m-6">
                  <h3 className="text-lg font-medium mb-4">Kalender SPP</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                    {months.slice(0, 6).map(month => (
                      <button
                        key={month.id}
                        onClick={() => handleMonthSelection(month.id)}
                        className={`p-4 rounded-lg text-center transition-colors ${
                          selectedMonths.includes(month.id)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {month.name}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {months.slice(6).map(month => (
                      <button
                        key={month.id}
                        onClick={() => handleMonthSelection(month.id)}
                        className={`p-4 rounded-lg text-center transition-colors ${
                          selectedMonths.includes(month.id)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {month.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Details Input Section */}
                {selectedMonths.length > 0 && (
                  <div className="mt-6 bg-white rounded-lg p-6 shadow-md">
                    <h3 className="text-lg font-medium mb-4">Detail Pembayaran</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Keterangan
                        </label>
                        <input
                          type="text"
                          value={paymentDetails.keterangan}
                          onChange={(e) => setPaymentDetails(prev => ({
                            ...prev,
                            keterangan: e.target.value
                          }))}
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Masukkan keterangan pembayaran"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Catatan
                        </label>
                        <textarea
                          value={paymentDetails.catatan}
                          onChange={(e) => setPaymentDetails(prev => ({
                            ...prev,
                            catatan: e.target.value
                          }))}
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Masukkan catatan tambahan"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nama Petugas
                        </label>
                        <input
                          type="text"
                          value={paymentDetails.petugas}
                          onChange={(e) => setPaymentDetails(prev => ({
                            ...prev,
                            petugas: e.target.value
                          }))}
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Masukkan nama petugas"
                        />
                      </div>
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={handlePaymentAndPrint}
                          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Proses Pembayaran
                        </button>
                      </div>
                    </div>
                </div>
              )}

                {/* Payment Receipt Modal */}
                {showReceipt && currentReceipt && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg w-full max-w-2xl">
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-bold">Bukti Pembayaran SPP</h2>
                          <button
                            onClick={() => setShowReceipt(false)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <span className="text-2xl">×</span>
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-gray-600">No. Kwitansi:</p>
                              <p className="font-medium">{currentReceipt.id}</p>
                    </div>
                            <div>
                              <p className="text-gray-600">Tanggal:</p>
                              <p className="font-medium">
                                {new Date(currentReceipt.tanggal).toLocaleDateString('id-ID')}
                              </p>
                </div>
            </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-gray-600">Nama Siswa:</p>
                              <p className="font-medium">{currentReceipt.siswa}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Angkatan:</p>
                              <p className="font-medium">{currentReceipt.angkatan}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-gray-600">Pembayaran:</p>
                            <p className="font-medium">
                              SPP Bulan {currentReceipt.bulan.map(month => 
                                months.find(m => m.id === month)?.name
                              ).join(', ')} {currentReceipt.tahunPembayaran}
                            </p>
              </div>
              
                          <div>
                            <p className="text-gray-600">Total Pembayaran:</p>
                            <p className="font-medium">
                              Rp {currentReceipt.total.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-4 mt-6">
                            <button
                            onClick={() => setShowReceipt(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Tutup
                            </button>
                            <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                          >
                            Cetak
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Keuangan;