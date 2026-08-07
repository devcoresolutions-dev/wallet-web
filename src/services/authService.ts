// Servicio de autenticación

import { apiRequest, ApiError } from './apiClient';

// Tipos de request y response

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Funciones

/**
 * Registra un nuevo usuario en el backend.
 * POST /api/auth/register
 * Devuelve token + user (igual que login): el usuario queda
 * autenticado al registrarse, sin necesidad de un segundo request.
 */
export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: data,
  });
}

/**
 * Inicia sesión y devuelve el JWT.
 * POST /api/auth/login
 */
export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: data,
  });
}

// Re-export para que las páginas puedan capturar errores tipados
export { ApiError };