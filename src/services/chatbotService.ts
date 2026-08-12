import type { CurrencyCode } from '../types/currency';
import type { Wallet } from '../types/wallet';
import type { Transaction } from '../types/transaction';
import { apiRequest } from './apiClient';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedActions?: Array<{ label: string; action: string; payload?: any }>;
  metricsData?: {
    title: string;
    items: Array<{ label: string; value: string; change?: string; isPositive?: boolean }>;
  };
}

// Tasas de cambio de referencia
const CONVERSION_RATES: Record<CurrencyCode, number> = {
  ARS: 1.0,
  USD: 895.5,
  EUR: 970.0,
  BRL: 180.0,
  CLP: 0.95,
  COP: 0.23,
  MXN: 52.0,
  PEN: 240.0,
};

/**
 * Consulta al Asistente de IA (conecta al Backend si existe token real, o responde inteligentemente)
 */
export async function sendChatMessage(
  messageText: string,
  wallet?: Wallet | null,
  _transactions?: Transaction[]
): Promise<ChatMessage> {
  const token = localStorage.getItem('token');

  // Si hay token de backend real, intentar enviar la consulta a la API
  if (token && token !== 'mock-token') {
    try {
      const response = await apiRequest<ChatMessage>('/api/chatbot/query', {
        method: 'POST',
        token,
        body: { message: messageText },
      });
      return response;
    } catch (err) {
      console.warn('[chatbotService] El endpoint del backend /api/chatbot/query no respondió, usando generador inteligente:', err);
    }
  }

  // Respuesta inteligente local (Analizando saldos reales del portafolio)
  await new Promise((resolve) => setTimeout(resolve, 800));

  const textLower = messageText.toLowerCase();
  const id = `ai-msg-${Date.now()}`;
  const timestamp = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const arsBalanceNum = parseFloat(wallet?.balances.find((b) => b.currencyCode === 'ARS')?.amount || '0');

  // 1. Consulta sobre Portafolio / Análisis General
  if (textLower.includes('portafolio') || textLower.includes('analiz') || textLower.includes('resumen') || textLower.includes('estado')) {
    const activeBalances = wallet?.balances.filter((b) => parseFloat(b.amount) > 0) || [];
    const totalARS = wallet?.balances.reduce((acc, b) => acc + parseFloat(b.amount) * (CONVERSION_RATES[b.currencyCode] || 1), 0) || 0;
    const totalUSD = totalARS / CONVERSION_RATES.USD;

    return {
      id,
      sender: 'ai',
      text: `Analicé tu billetera actual. Tu patrimonio total consolidado es de aproximadamente **${totalARS.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}** (≈ **${totalUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}**).\n\nTienes **${activeBalances.length} activos con saldo positivo**. Para optimizar tu rendimiento, te sugiero mantener al menos un 15% en USD o EUR como reserva anticíclica.`,
      timestamp,
      metricsData: {
        title: 'Desglose del Portafolio',
        items: [
          { label: 'Patrimonio Neto', value: `$${totalARS.toLocaleString('es-AR')}`, change: '+3.2% este mes', isPositive: true },
          { label: 'Moneda Dominante', value: arsBalanceNum > 0 ? 'ARS' : 'USD', change: `${((arsBalanceNum / (totalARS || 1)) * 100).toFixed(0)}% del total` },
          { label: 'Rendimiento Est.', value: '18.4% anual', change: 'Proyectado', isPositive: true },
        ],
      },
      suggestedActions: [
        { label: 'Simular Conversión de Moneda', action: 'SIMULATE_CONVERSION' },
        { label: 'Ver Historial de Movimientos', action: 'VIEW_TRANSACTIONS' },
      ],
    };
  }

  // 2. Consulta sobre Dólar o Euro / Cotizaciones / Compra
  if (textLower.includes('dolar') || textLower.includes('dólar') || textLower.includes('usd') || textLower.includes('euro') || textLower.includes('comprar') || textLower.includes('cotiza')) {
    return {
      id,
      sender: 'ai',
      text: `El tipo de cambio actual de referencia para **USD** es **1 USD = 895.50 ARS** (spread de 0.5% en eWallet).\nPara **EUR** la cotización es **1 EUR = 970.00 ARS**.\n\n💡 **Recomendación eWallet AI**: El par USD/ARS mantiene una tendencia de estabilidad a corto plazo. Si planeas hacer transacciones internacionales o resguardar valor, es un buen momento para simular una compra.`,
      timestamp,
      metricsData: {
        title: 'Cotizaciones de Hoy',
        items: [
          { label: 'USD / ARS', value: '$895.50', change: '+0.15% hoy', isPositive: true },
          { label: 'EUR / ARS', value: '$970.00', change: '-0.08% hoy', isPositive: false },
          { label: 'BRL / ARS', value: '$180.00', change: '+0.40% hoy', isPositive: true },
        ],
      },
      suggestedActions: [
        { label: 'Simular Compra de USD', action: 'SIMULATE_BUY_USD' },
        { label: 'Ver Gráficos de Cotización', action: 'VIEW_ANALYTICS' },
      ],
    };
  }

  // 3. Consulta sobre Ahorro o Estrategia
  if (textLower.includes('ahorro') || textLower.includes('estrategia') || textLower.includes('invertir') || textLower.includes('diversific')) {
    return {
      id,
      sender: 'ai',
      text: `Aquí tienes una **Estrategia Recomendada de Diversificación** basada en tu perfil:\n\n1. 🇦🇷 **Pesos (ARS) - 40%**: Para gastos líquidos y transacciones operativas diarias.\n2. 🇺🇸 **Dólares (USD) - 45%**: Cobertura principal contra inflación acumulada.\n3. 🇪🇺 **Euros (EUR) / 🇧🇷 Real (BRL) - 15%**: Cobertura complementaria de divisas internacionales.\n\nPodés usar nuestro **Simulador de Operaciones** para evaluar el impacto en comisiones antes de confirmar cualquier intercambio.`,
      timestamp,
      suggestedActions: [
        { label: 'Ir al Simulador de Operaciones', action: 'GOTO_SIMULATOR' },
      ],
    };
  }

  // 4. Consulta sobre Comisiones o Tasas
  if (textLower.includes('comision') || textLower.includes('comisión') || textLower.includes('tasa') || textLower.includes('costo')) {
    return {
      id,
      sender: 'ai',
      text: `En **eWallet** aplicamos una estructura de comisiones 100% transparente sin costos ocultos:\n\n- 🟢 **Compra de USD / EUR**: 0.5% de tasa de servicio.\n- 🔄 **Intercambio Directo entre Monedas**: 0.8% - 1.2% según la liquidez de la moneda.\n- 🔴 **Venta a ARS**: 0.5% tarifa estándar.\n\nTodas las comisiones se calculan en tiempo real dentro del simulador antes de ejecutar.`,
      timestamp,
      suggestedActions: [
        { label: 'Simular Operación con Comisiones', action: 'GOTO_SIMULATOR' },
      ],
    };
  }

  // Respuesta general inteligente por defecto
  return {
    id,
    sender: 'ai',
    text: `Entiendo tu consulta sobre "${messageText}". Como tu asistente financiero inteligente eWallet, puedo ayudarte a:\n\n- 📊 Analizar el rendimiento de tus saldos.\n- 💱 Calcular cotizaciones simuladas con comisiones incluidas.\n- 🛡️ Diseñar estrategias de resguardo en USD, EUR y otras monedas.\n\n¿Deseas que simulemos una operación o revisemos las tendencias del mercado?`,
    timestamp,
    suggestedActions: [
      { label: 'Analizar mi Portafolio', action: 'ANALYSIS_PORTFOLIO' },
      { label: 'Probar Simulador de Cambio', action: 'GOTO_SIMULATOR' },
    ],
  };
}
