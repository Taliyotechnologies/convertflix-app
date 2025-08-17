export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

export interface FileRecord {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'pdf' | 'document';
  size: number;
  status: 'completed' | 'processing' | 'failed';
  uploadedBy: string;
  uploadedAt: string;
  convertedAt?: string;
  originalFormat: string;
  convertedFormat?: string;
  compressionRatio?: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalFiles: number;
  totalStorage: number;
  filesProcessedToday: number;
  conversionRate: number;
  averageFileSize: number;
  activeUsers: number;
}

export interface AdminSettings {
  siteName: string;
  maxFileSize: number;
  allowedFormats: string[];
  maintenanceMode: boolean;
  emailNotifications: boolean;
  autoDeleteDays: number;
}

export interface ActivityLog {
  id: string;
  type: 'file_upload' | 'user_registration' | 'file_conversion' | 'user_login' | 'error';
  message: string;
  timestamp: string;
  userId: string;
  severity: 'info' | 'warning' | 'error';
}
