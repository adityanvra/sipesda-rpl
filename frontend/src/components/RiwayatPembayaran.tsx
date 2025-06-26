import React, { useState, useEffect } from 'react';
import { Student, Payment } from '../types';
import { useDatabaseContext } from '../contexts/DatabaseContext';
import RealTimeClock from './RealTimeClock';

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
          return payments.filter(p => {
            // Filter by payment type
            const matchesPaymentType = p.jenis_pembayaran.startsWith(selectedPaymentType.split(' ')[0]);
            
            // For all payment types including SPP, filter by the selected year
            const paymentYear = new Date(p.tanggal_pembayaran).getFullYear().toString();
            const matchesYear = paymentYear === selectedYear;
            
            return matchesPaymentType && matchesYear;
          });
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
                
                // For all payment types including SPP, filter by the selected year
                const paymentYear = new Date(p.tanggal_pembayaran).getFullYear().toString();
                const matchesYear = paymentYear === selectedYear;
                
                return matchesPaymentType && matchesYear;
              });
              return {
                hasPaid: relevantPayments.length > 0,
                amount: relevantPayments.reduce((sum, p) => sum + p.nominal, 0)
              };
            })
          );

          const paidStudents = classPayments.filter(p => p.hasPaid).length;
          const totalPaid = classPayments.reduce((sum, p) => sum + p.amount, 0);
          
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
            totalUnpaid = expectedAmount - totalPaid;
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
      const totalPaid = classSummaries.reduce((sum, c) => sum + c.totalPaid, 0);
      const totalUnpaid = classSummaries.reduce((sum, c) => sum + c.totalUnpaid, 0);

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
                <div className="bg-slate-800 text-white p-4">
                  <h3 className="font-bold">Rekap Total Dana {selectedPaymentType}</h3>
                </div>
                <div className="p-6">
                  {selectedPaymentType === 'SPP Bulanan' ? (
                    // For SPP Bulanan, show total accumulated funds for selected year
                    <div className="mb-4">
                      <p className="font-medium">Total Dana SPP Bulanan Siswa Angkatan {selectedYear} yang sudah dibayarkan</p>
                      <p className="text-2xl font-bold text-green-600">Rp {paymentSummary.totalPaid.toLocaleString()}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Total akumulasi dana SPP yang telah terkumpul dari pembayaran siswa angkatan {selectedYear} pada tahun {selectedYear}
                      </p>
                    </div>
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
                              {selectedPaymentType !== 'SPP Bulanan' && (
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
                              )}
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
                                      Rp {payment.nominal.toLocaleString()}
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
                                      Rp {payment.nominal.toLocaleString()}
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