import React, { useState, useEffect } from "react";
import { Student } from "../types";
import { useDatabaseContext } from "../contexts/DatabaseContext";
import RealTimeClock from "./RealTimeClock";
import * as XLSX from "xlsx";

interface ManajemenSiswaProps {
  onEditStudent: (studentId: number) => void;
  onAddStudent: () => void;
}

const ManajemenSiswa: React.FC<ManajemenSiswaProps> = ({
  onEditStudent,
  onAddStudent,
}) => {
  const { db, isLoading: isDbLoading } = useDatabaseContext();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    maleStudents: 0,
    femaleStudents: 0,
    totalClasses: 0,
  });

  useEffect(() => {
    loadStudents();
  }, [db]);

  useEffect(() => {
    // Calculate statistics when students data changes
    const calculateStats = () => {
      const totalStudents = students.length;
      const maleStudents = students.filter(
        (s) => s.jenis_kelamin === "L"
      ).length;
      const femaleStudents = students.filter(
        (s) => s.jenis_kelamin === "P"
      ).length;
      const uniqueClasses = new Set(students.map((s) => s.kelas)).size;

      setStats({
        totalStudents,
        maleStudents,
        femaleStudents,
        totalClasses: uniqueClasses,
      });
    };

    calculateStats();
  }, [students]);

  const loadStudents = async () => {
    if (!db) return;

    try {
      const allStudents = await db.getAllStudents();
      setStudents(allStudents);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !db) return;

  try {
    const XLSX = await import("xlsx");
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

    let successCount = 0;
    let errorRows: number[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];

      const nisn = String(row.NISN || "").trim();
      const nama = String(row.Nama || "").trim();
      const namaWali = String(row["Nama Wali"] || "").trim();
      const kelas = String(row.Kelas || "").trim();
      const angkatan = Number(row.Angkatan);
      const noHp = String(row["No HP"] || "").trim();
      const jenisKelamin = row.Jenis_Kelamin;

      // Validasi: jika ada kolom yang kosong
      if (
        !nisn ||
        !nama ||
        !namaWali ||
        !kelas ||
        isNaN(angkatan) ||
        !noHp ||
        (jenisKelamin !== "L" && jenisKelamin !== "P")
      ) {
        errorRows.push(i + 2); // +2 karena baris Excel dimulai dari 1, dan ada header
        continue;
      }

      const student = {
        nisn,
        nama,
        nama_wali: namaWali,
        kelas,
        angkatan,
        no_hp: noHp,
        jenis_kelamin: jenisKelamin,
      };

      const success = await db.createStudent(student as any);
      if (success) successCount++;
    }

    let message = `${successCount} siswa berhasil ditambahkan.`;
    if (errorRows.length > 0) {
      message += `\n\nBaris bermasalah (tidak diimpor): ${errorRows.join(", ")}.\nPastikan semua kolom terisi dengan benar.`;
    }

    alert(message);
    loadStudents();
  } catch (error) {
    console.error("Gagal memproses Excel:", error);
    alert("Gagal memproses file Excel");
  }
};

  const handleDownloadTemplate = async () => {
    const XLSX = await import("xlsx");

    const templateData = [
      {
        NISN: "1234567890",
        Nama: "Nama Siswa",
        "Nama Wali": "Nama Orang Tua",
        Kelas: "1A",
        Angkatan: 2024,
        "No HP": "08123456789",
        Jenis_Kelamin: "L", // atau 'P'
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Siswa");

    XLSX.writeFile(workbook, "Template-Import-Siswa.xlsx");
  };

  const handleDeleteStudent = async (id: number, nama: string) => {
    if (!db) return;

    if (window.confirm(`Apakah Anda yakin ingin menghapus siswa ${nama}?`)) {
      try {
        const success = await db.deleteStudent(id);
        if (success) {
          loadStudents();
          alert("Siswa berhasil dihapus");
        } else {
          alert("Gagal menghapus siswa");
        }
      } catch (error) {
        alert("Terjadi kesalahan saat menghapus siswa");
      }
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nisn.includes(searchTerm) ||
      student.kelas.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">👥</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Manajemen Siswa</h1>
        </div>
        <RealTimeClock />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {/* Total Students Card */}
        <div className="bg-[#FF0000] rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Total Siswa</p>
              <h3 className="text-3xl font-bold mt-1">{stats.totalStudents}</h3>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <span className="text-2xl">👨‍🎓</span>
            </div>
          </div>
        </div>

        {/* Male Students Card */}
        <div className="bg-[#FF4141] rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Siswa Laki-laki</p>
              <h3 className="text-3xl font-bold mt-1">{stats.maleStudents}</h3>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <span className="text-2xl">👨‍🎓</span>
            </div>
          </div>
        </div>

        {/* Female Students Card */}
        <div className="bg-[#FF7777] rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Siswa Perempuan</p>
              <h3 className="text-3xl font-bold mt-1">
                {stats.femaleStudents}
              </h3>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <span className="text-2xl">👩‍🎓</span>
            </div>
          </div>
        </div>

        {/* Total Classes Card */}
        <div className="bg-[#FF9090] rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Total Kelas</p>
              <h3 className="text-3xl font-bold mt-1">{stats.totalClasses}</h3>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏫</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Search and Add Section */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Data Siswa</h2>

            {/* Upload & Download Excel */}
            <div className="flex items-center space-x-2 ml-auto">
              {/* Tombol Tambah */}
              <button
                onClick={onAddStudent}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Tambah Siswa</span>
              </button>

              {/* Tombol Import */}
              <label className="bg-[#C71B1E] text-white px-4 py-2 rounded-lg hover:bg-red-700 cursor-pointer">
                📥 Import Excel
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                />
              </label>

              {/* Tombol Download Template */}
              <button
                onClick={handleDownloadTemplate}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
              >
                📄 Unduh Template
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Cari berdasarkan nama, NISN, atau kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
            <div className="text-sm text-gray-600">
              Total: {filteredStudents.length} siswa
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat data siswa...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-gray-400 text-4xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                {searchTerm
                  ? "Tidak ada siswa yang ditemukan"
                  : "Belum ada data siswa"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? "Coba ubah kata kunci pencarian"
                  : "Mulai dengan menambahkan siswa baru"}
              </p>
              {!searchTerm && (
                <button
                  onClick={onAddStudent}
                  className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Tambah Siswa Pertama
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      No
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      NISN
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Nama Siswa
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Nama Wali
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Kelas
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Angkatan
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      No HP
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student, index) => (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 text-center"
                    >
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {student.nisn}
                      </td>
                      <td className="px-4 py-3 text-sm">{student.nama}</td>
                      <td className="px-4 py-3 text-sm">{student.nama_wali}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {student.kelas}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{student.angkatan}</td>
                      <td className="px-4 py-3 text-sm">{student.no_hp}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="inline-flex justify-center items-center space-x-2">
                          <button
                            onClick={() => onEditStudent(student.id)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteStudent(student.id, student.nama)
                            }
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManajemenSiswa;
