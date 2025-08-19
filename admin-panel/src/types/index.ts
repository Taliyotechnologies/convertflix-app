export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'sub-admin' | 'user';
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
  totalVisits: number;
  // visit analytics (from activities)
  deviceTypeVisits?: Record<string, number>;
  countryVisits?: Record<string, number>;
  // device analytics (from unique visitors store)
  uniqueDevices?: number;
  deviceTypeDevices?: Record<string, number>;
  countryDevices?: Record<string, number>;
  newDevicesToday?: number;
}

export interface AdminSettings {
  siteName: string;
  maxFileSize: number;
  allowedFormats: string[];
  maintenanceMode: boolean;
  emailNotifications: boolean;
  adminNotifications: boolean;
  autoDeleteDays: number;
}

export interface ActivityLog {
  id: string;
  type: 'file_upload' | 'user_registration' | 'file_conversion' | 'user_login' | 'site_visit' | 'new_device' | 'error';
  message: string;
  timestamp: string;
  userId: string;
  severity: 'info' | 'warning' | 'error';
}
