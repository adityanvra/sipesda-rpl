import axios from 'axios';
import { User, Student, Payment, PaymentType } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://sipesda-rpl.vercel.app';

class DatabaseManager {
  // USER
  async authenticateUser(username: string, password: string): Promise<User | null> {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/login`, { username, password });
      return response.data;
    } catch {
      return null;
    }
  }

  async createUser(username: string, password: string, role: string = 'operator'): Promise<boolean> {
    try {
      await axios.post(`${API_BASE_URL}/users`, { username, password, role });
      return true;
    } catch {
      return false;
    }
  }

  // STUDENT
  async getAllStudents(): Promise<Student[]> {
    const response = await axios.get(`${API_BASE_URL}/students`);
    return response.data;
  }

  async getStudentByNisn(nisn: string): Promise<Student | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/students/nisn/${nisn}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async getStudentById(id: number): Promise<Student | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/students/${id}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async createStudent(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      await axios.post(`${API_BASE_URL}/students`, student);
      return true;
    } catch {
      return false;
    }
  }

  async updateStudent(id: number, student: Partial<Student>): Promise<boolean> {
    try {
      await axios.put(`${API_BASE_URL}/students/${id}`, student);
      return true;
    } catch {
      return false;
    }
  }

  async deleteStudent(id: number): Promise<boolean> {
    try {
      await axios.delete(`${API_BASE_URL}/students/${id}`);
      return true;
    } catch {
      return false;
    }
  }

  // PAYMENT
  async getPaymentsByStudentId(studentId: number): Promise<Payment[]> {
    const response = await axios.get(`${API_BASE_URL}/payments?student_id=${studentId}`);
    return response.data;
  }

  async getPaymentsByStudentNisn(nisn: string): Promise<Payment[]> {
    const response = await axios.get(`${API_BASE_URL}/payments?student_nisn=${nisn}`);
    return response.data;
  }

  async createPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<boolean> {
    try {
      await axios.post(`${API_BASE_URL}/payments`, payment);
      return true;
    } catch {
      return false;
    }
  }

  async updatePayment(id: number, updates: Partial<Payment>): Promise<boolean> {
    try {
      await axios.put(`${API_BASE_URL}/payments/${id}`, updates);
      return true;
    } catch {
      return false;
    }
  }

  async deletePayment(id: number): Promise<boolean> {
    try {
      await axios.delete(`${API_BASE_URL}/payments/${id}`);
      return true;
    } catch {
      return false;
    }
  }

  // PAYMENT TYPE
  async getPaymentTypes(): Promise<PaymentType[]> {
    const response = await axios.get(`${API_BASE_URL}/payment-types`);
    return response.data;
  }

  async addPaymentType(type: Omit<PaymentType, 'id'>): Promise<boolean> {
    try {
      await axios.post(`${API_BASE_URL}/payment-types`, type);
      return true;
    } catch {
      return false;
    }
  }
  async getPaymentsByMonth(studentId: number, month: string, year: string): Promise<Payment[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/payments/by-month`, {
      params: { studentId, month, year }
    });
    return response.data;
  } catch (error) {
    console.error('Gagal mengambil data pembayaran per bulan:', error);
    return [];
  }
}

  async getPaymentsByMonthNisn(studentNisn: string, month: string, year: string): Promise<Payment[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/payments/by-month`, {
      params: { studentNisn, month, year }
    });
    return response.data;
  } catch (error) {
    console.error('Gagal mengambil data pembayaran per bulan:', error);
    return [];
  }
}

}

export default DatabaseManager;
