import React, { useState } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import Keuangan from "./components/Keuangan";
import RiwayatPembayaran from "./components/RiwayatPembayaran";
import ManajemenSiswa from "./components/ManajemenSiswa";
import TambahSiswa from "./components/TambahSiswa";
import EditSiswa from "./components/EditSiswa";
import { User } from "./types";

import iconUser from "./assets/user.png";
import iconDashboard from "./assets/dashboard.png";
import iconPayment from "./assets/payment.png";
import iconHistory from "./assets/history.png";
import iconStudents from "./assets/students.png";
import iconLogout from "./assets/logout.png";

function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [user, setUser] = useState<User | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage("login");
    setSelectedStudentId(null);
  };

  const handleEditStudent = (studentId: number) => {
    setSelectedStudentId(studentId);
    setCurrentPage("edit-siswa");
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "keuangan":
        return <Keuangan />;
      case "riwayat":
        return <RiwayatPembayaran />;
      case "manajemen":
        return (
          <ManajemenSiswa
            onEditStudent={handleEditStudent}
            onAddStudent={() => setCurrentPage("tambah-siswa")}
          />
        );
      case "tambah-siswa":
        return <TambahSiswa onBack={() => setCurrentPage("manajemen")} />;
      case "edit-siswa":
        return <EditSiswa studentId={selectedStudentId!} onBack={() => setCurrentPage("manajemen")} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#65465F] to-[#6C7278]">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen shadow-2xl flex flex-col">
          {/* Bagian Atas (Judul + User Info) */}
          <div className="bg-slate-800">
            <div className="p-6 border-b border-slate-700 flex justify-center">
              <h1 className="text-white text-4xl font-bold">S I P E S D A</h1>
            </div>

            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                  <img src={iconUser} alt="User" className="w-12 h-12" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {user.role === "admin" ? "Administrator" : "Operator"}
                  </p>
                  <p className="text-slate-300 text-sm">{user.username}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bagian Menu + Logout */}
          <div className="bg-gray-50/95 flex-1 flex flex-col justify-between">
            {/* Menu Navigasi */}
            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setCurrentPage("dashboard")}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
                      currentPage === "dashboard"
                        ? "bg-blue-600 text-white"
                        : "text-gray-800 hover:bg-blue-100 hover:text-slate-900"
                    }`}
                  >
                    <img
                      src={iconDashboard}
                      alt="Dashboard"
                      className="w-5 h-5"
                    />
                    <span className="font-bold">Dashboard</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentPage("keuangan")}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
                      currentPage === "keuangan"
                        ? "bg-blue-600 text-white"
                        : "text-gray-800 hover:bg-blue-100 hover:text-slate-900"
                    }`}
                  >
                    <img
                      src={iconPayment}
                      alt="Pembayaran"
                      className="w-5 h-5"
                    />
                    <span className="font-bold">Pembayaran</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentPage("riwayat")}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
                      currentPage === "riwayat"
                        ? "bg-blue-600 text-white"
                        : "text-gray-800 hover:bg-blue-100 hover:text-slate-900"
                    }`}
                  >
                    <img src={iconHistory} alt="Riwayat" className="w-5 h-5" />
                    <span className="font-bold">Riwayat Pembayaran</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setCurrentPage("manajemen")}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
                      ["manajemen", "tambah-siswa", "edit-siswa"].includes(
                        currentPage
                      )
                        ? "bg-blue-600 text-white"
                        : "text-gray-800 hover:bg-blue-100 hover:text-slate-900"
                    }`}
                  >
                    <img src={iconStudents} alt="Siswa" className="w-5 h-5" />
                    <span className="font-bold">Manajemen Siswa</span>
                  </button>
                </li>
              </ul>
            </nav>

            {/* Tombol Logout */}
            <div className="border-t border-gray-300 px-4 py-6">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-4 py-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <img src={iconLogout} alt="Logout" className="w-5 h-5" />

                <span className="font-bold">Keluar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">{renderCurrentPage()}</div>
      </div>
    </div>
  );
}

export default App;
