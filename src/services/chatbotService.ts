import { apiRequest, ApiError } from './apiClient';

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatHistoryItem[];
}

export interface ChatResponse {
  reply: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

/**
 * Envia un mensaje al chatbot en el backend
 * POST /api/chat
 */
export async function sendChatMessage(
  messageText: string,
  history: ChatHistoryItem[] = []
): Promise<ChatMessage> {
  const token = localStorage.getItem('token');

  // Limitar mensaje a 500 caracteres
  const trimmedMessage = messageText.slice(0, 500);

  // Limitar historial a máximo 10 mensajes
  const trimmedHistory = history.slice(-10);

  if (!token) {
    return {
      id: `err-${Date.now()}`,
      sender: 'ai',
      text: 'No estás autenticado. Por favor inicia sesión para usar el asistente.',
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  try {
    const response = await apiRequest<ChatResponse>('/api/chat', {
      method: 'POST',
      token,
      body: {
        message: trimmedMessage,
        history: trimmedHistory,
      },
    });

    return {
      id: `ai-msg-${Date.now()}`,
      sender: 'ai',
      text: response.reply,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch (err: any) {
    console.error('[chatbotService] Error al comunicarse con el backend:', err);
    
    let errorText = 'El servicio de asistente no está disponible en este momento. Por favor intenta más tarde.';
    if (err instanceof ApiError) {
      if (err.status === 429) {
        errorText = 'Has alcanzado el límite de 20 mensajes por minuto. Por favor aguarda unos momentos antes de intentar nuevamente.';
      } else if (err.status === 503) {
        errorText = 'El servicio de cotizaciones o el asistente no se encuentra disponible (503 Service Unavailable).';
      }
    }

    return {
      id: `err-${Date.now()}`,
      sender: 'ai',
      text: errorText,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };
  }
}
