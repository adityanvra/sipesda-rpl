import React, { useState, useEffect } from 'react';
import { useDatabaseContext } from '../contexts/DatabaseContext';
import RealTimeClock from './RealTimeClock';

const Dashboard: React.FC = () => {
  const { db, isLoading: isDbLoading } = useDatabaseContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMaleStudents: 0,
    totalFemaleStudents: 0,
    totalStudents: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [db]);

  const loadDashboardData = async () => {
    if (!db) return;
    
    try {
      const students = await db.getAllStudents();
      const maleStudents = students.filter(s => s.jenis_kelamin === 'L').length;
      const femaleStudents = students.filter(s => s.jenis_kelamin === 'P').length;
      
      setStats({
        totalMaleStudents: maleStudents,
        totalFemaleStudents: femaleStudents,
        totalStudents: students.length
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
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
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">📊</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        </div>
        <RealTimeClock />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        {/* School Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏫</span>
            </div>
            <div>
              <h3 className="text-sm opacity-80">SEKOLAH DASAR MUHAMMADIYAH MLANGI</h3>
            </div>
          </div>
        </div>

        {/* Kepala Sekolah Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <span className="text-2xl">👩‍💼</span>
            </div>
            <div>
              <h3 className="text-sm opacity-80">Kepala Sekolah</h3>
              <p className="text-sm opacity-80">Dewi Susiloningsih</p>
            </div>
          </div>
        </div>

        {/* Staff Count */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lga">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h3 className="text-sm opacity-80">Total Guru & Tendik</h3>
              <p className="text-3xl font-bold mt-1">28</p>
            </div>
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <span className="text-2xl">👨‍👧‍👦</span>
            </div>
            <div>
              <h3 className="text-sm opacity-80">Total Siswa</h3>
              <p className="text-3xl font-bold mt-1">{loading ? '...' : stats.totalStudents}</p>
            </div>
          </div>
        </div>

        {/* Male Students */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <span className="text-2xl">👨‍🎓</span>
            </div>
            <div>
              <h3 className="text-sm opacity-80">Total Siswa Laki-laki</h3>
              <p className="text-3xl font-bold mt-1">{loading ? '...' : stats.totalMaleStudents}</p>
            </div>
          </div>
        </div>

        {/* Female Students */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <span className="text-2xl">👩‍🎓</span>
            </div>
            <div>
              <h3 className="text-sm opacity-80">Total Siswa Perempuan</h3>
              <p className="text-3xl font-bold mt-1">{loading ? '...' : stats.totalFemaleStudents}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Types */}
        <div className="bg-gray-100/80 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-slate-800 text-white p-4">
            <h3 className="font-bold">Jenis Pembayaran</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">Pembayaran SPP</h4>
              <p className="text-sm text-gray-600">Per bulan</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">Pembayaran LKS</h4>
              <p className="text-sm text-gray-600">Tahun ajaran 2025/2026 (UNDER MAINTENANCE)</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">Pembayaran Seragam</h4>
              <p className="text-sm text-gray-600">Tahun ajaran 2025/2026 (UNDER MAINTENANCE)</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">Pembayaran Ekstrakurikuler</h4>
              <p className="text-sm text-gray-600">Tahun ajaran 2025/2026 (UNDER MAINTENANCE)</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">Pembayaran Kegiatan Sekolah</h4>
              <p className="text-sm text-gray-600">Tahun ajaran 2025/2026 (UNDER MAINTENANCE)</p>
            </div>
          </div>
        </div>

        {/* Payment Periods and Announcement */}
        <div className="space-y-6">
          {/* Payment Periods */}
          <div className="bg-gray-100/80 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-slate-800 text-white p-4">
              <h3 className="font-bold">Periode Pembayaran Bulan Ini</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                <p className="font-medium text-red-700">Pembayaran SPP</p>
                <p className="text-sm text-red-600">1 Juni - 30 Juni</p>
              </div>
             
            </div>
          </div>

          {/* Announcement */}
          <div className="bg-gray-100/80 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-slate-800 text-white p-4">
              <h3 className="font-bold">PENGUMUMAN</h3>
            </div>
            <div className="p-6">
              <div className="text-red-600 font-medium">
                Bagi para Siswa/i yang masih belum melakukan pembayaran silahkan segera melakukan pembayaran sebelum batas tanggal terakhir
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;