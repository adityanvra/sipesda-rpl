export interface User {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'operator';
}

export interface Student {
  id: number;
  nisn: string;
  nama: string;
  kelas: string;
  nama_wali: string;
  angkatan: string;
  alamat: string;
  no_hp: string;
  jenis_kelamin: 'L' | 'P';
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: number;
  student_id: number;
  student_nisn?: string;
  jenis_pembayaran: string;
  nominal: number;
  tanggal_pembayaran: string;
  status: 'lunas' | 'belum_lunas';
  keterangan: string;
  catatan: string;
  petugas: string;
  created_at: string;
}

export interface PaymentType {
  id: number;
  nama: string;
  nominal: number;
  periode: string;
  aktif: boolean;
}