import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import { useDatabaseContext } from '../contexts/DatabaseContext';

interface EditSiswaProps {
  studentId: number;
  onBack: () => void;
}

const EditSiswa: React.FC<EditSiswaProps> = ({ studentId, onBack }) => {
  const { db, isLoading: isDbLoading } = useDatabaseContext();
  const [formData, setFormData] = useState<{
    nisn: string;
    nama: string;
    nama_wali: string;
    angkatan: string;
    kelas: string;
    alamat: string;
    no_hp: string;
    jenis_kelamin: 'L' | 'P';
  }>({
    nisn: '',
    nama: '',
    nama_wali: '',
    angkatan: '',
    kelas: '',
    alamat: '',
    no_hp: '',
    jenis_kelamin: 'L'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadStudent();
  }, [studentId, db]);

  const loadStudent = async () => {
    if (!db) return;
    
    try {
      const studentData = await db.getStudentById(studentId);
      if (studentData) {
        setStudent(studentData);
        setFormData({
          nisn: studentData.nisn,
          nama: studentData.nama,
          nama_wali: studentData.nama_wali,
          angkatan: studentData.angkatan,
          kelas: studentData.kelas,
          alamat: studentData.alamat || '',
          no_hp: studentData.no_hp || '',
          jenis_kelamin: studentData.jenis_kelamin
        });
      } else {
        setError('Siswa tidak ditemukan');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data siswa');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    setLoading(true);
    setError('');

    try {
      const success = await db.updateStudent(studentId, formData);
      if (success) {
        alert('Data siswa berhasil diperbarui!');
        onBack();
      } else {
        setError('Gagal memperbarui data siswa');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memperbarui data siswa');
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

  if (isDbLoading || (!student && !error)) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-white">Memuat data siswa...</p>
        </div>
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
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">✏️</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Edit Data Siswa</h1>
        </div>
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium">
          Jumat 16 May 2025 | 11.45 AM
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-xl font-bold text-gray-800">Form Edit Siswa</h2>
          <p className="text-gray-600 text-sm mt-1">
            Perbarui informasi siswa: {student?.nama} ({student?.nisn})
          </p>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {classOptions.map((kelas) => (
                    <option key={kelas} value={kelas}>
                      {kelas}
                    </option>
                  ))}
                </select>
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
                  placeholder="Masukkan alamat"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
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
                  placeholder="Masukkan nomor HP"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || !db}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditSiswa;