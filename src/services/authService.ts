// Servicio de autenticación

import { apiRequest, ApiError } from './apiClient';

// Tipos de request y response

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  fullName: string;
  defaultLocalCurrency: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

// Funciones

/**
 * Registra un nuevo usuario en el backend.
 * POST /api/auth/register
 */
export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: data,
  });
}

/**
 * Inicia sesión y devuelve el JWT.
 * POST /api/auth/login
 */
export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: data,
  });
}

// Re-export para que las páginas puedan capturar errores tipados
export { ApiError };
