// shared/types/api-response.ts
// #shared-types #api-contracts

// ============================================
// Standard API Response Envelope
// ============================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  correlationId?: string;
  timestamp: string;
}

// ============================================
// Pagination
// ============================================
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  timestamp: string;
}

// ============================================
// Service-specific types
// ============================================
export interface UserContext {
  userId: string;
  email: string;
  role: UserRole;
  cafeId: string;
}

export type UserRole = 'admin' | 'manager' | 'staff';

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  timestamp: string;
  uptime?: number;
  version?: string;
}
