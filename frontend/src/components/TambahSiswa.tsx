import React, { useState } from 'react';
import { useDatabaseContext } from '../contexts/DatabaseContext';

interface TambahSiswaProps {
  onBack: () => void;
}

const TambahSiswa: React.FC<TambahSiswaProps> = ({ onBack }) => {
  const { db, isLoading: isDbLoading } = useDatabaseContext();
  const [formData, setFormData] = useState({
    nisn: '',
    nama: '',
    nama_wali: '',
    angkatan: new Date().getFullYear().toString(),
    kelas: '1A',
    alamat: '',
    no_hp: '',
    jenis_kelamin: 'L' as const
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate class options
  const generateClassOptions = () => {
    const classes = [];
    for (let grade = 1; grade <= 6; grade++) {
      for (let section of ['A', 'B', 'C', 'D']) {
        classes.push(`${grade}${section}`);
      }
    }
    return classes;
  };

  const classOptions = generateClassOptions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.nisn || !formData.nama || !formData.nama_wali || !formData.kelas) {
        throw new Error('Mohon lengkapi semua field yang diperlukan');
      }

      // Check if NISN already exists
      const existingStudent = await db.getStudentByNisn(formData.nisn);
      if (existingStudent) {
        throw new Error('NISN sudah terdaftar');
      }

      const success = await db.createStudent(formData);
      if (success) {
        alert('Data siswa berhasil ditambahkan');
        onBack();
      } else {
        throw new Error('Gagal menambahkan data siswa');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

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
          <button
            onClick={onBack}
            className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
          >
            ←
          </button>
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">➕</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Tambah Siswa Baru</h1>
        </div>
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium">
          Jumat 16 May 2025 | 11.45 AM
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-[#D9D9D9] to-[#9A5F5F]">
          <h2 className="text-xl font-bold text-gray-800">Form Tambah Siswa</h2>
          <p className="text-gray-600 text-sm mt-1">Lengkapi semua informasi siswa dengan benar</p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* NISN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NISN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nisn"
                  value={formData.nisn}
                  onChange={handleChange}
                  placeholder="Masukkan NISN"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {/* Nama Siswa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Siswa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {/* Nama Wali */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Wali <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nama_wali"
                  value={formData.nama_wali}
                  onChange={handleChange}
                  placeholder="Masukkan nama wali"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {/* Angkatan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Angkatan <span className="text-red-500">*</span>
                </label>
                <select
                  name="angkatan"
                  value={formData.angkatan}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  {years.map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Kelas - Updated to Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kelas <span className="text-red-500">*</span>
                </label>
                <select
                  name="kelas"
                  value={formData.kelas}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  {classOptions.map((kelas) => (
                    <option key={kelas} value={kelas}>
                      {kelas}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <select
                  name="jenis_kelamin"
                  value={formData.jenis_kelamin}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              {/* No HP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No HP
                </label>
                <input
                  type="tel"
                  name="no_hp"
                  value={formData.no_hp}
                  onChange={handleChange}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Alamat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat
              </label>
              <textarea
                name="alamat"
                value={formData.alamat}
                onChange={handleChange}
                placeholder="Masukkan alamat lengkap"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !db}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Menyimpan...' : 'Simpan Siswa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TambahSiswa;