export * from '@prisma/client';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  address?: string;
  phone?: string;
  emergencyContact?: string;
  idNumber?: string;
  companyName?: string;
}

export interface DashboardStats {
  totalExpenses: number;
  totalIncome: number;
  pendingApprovals: number;
  activeProjects: number;
  totalStaff: number;
}

export interface ExpenseFormData {
  items: Array<{
    description: string;
    amount: number;
    categoryId?: string;
    receiptUrl?: string;
  }>;
}

export interface BillFormData {
  clientName: string;
  clientAddress?: string;
  clientContact?: string;
  items: Array<{
    serialNumber: number;
    description: string;
    quantity: number;
    rate: number;
  }>;
  vatEnabled: boolean;
  vatRate?: number;
  discount?: number;
  remarks?: string;
}
