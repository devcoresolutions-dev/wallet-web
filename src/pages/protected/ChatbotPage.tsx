import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Send,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Trash2,
  HelpCircle,
  Zap,
  BarChart2,
  DollarSign,
} from 'lucide-react';
import styles from './ChatbotPage.module.css';
import { getWallets } from '../../services/walletService';
import { getTransactions } from '../../services/transactionService';
import { sendChatMessage, type ChatMessage } from '../../services/chatbotService';
import type { Wallet } from '../../types/wallet';
import type { Transaction } from '../../types/transaction';

const QUICK_PROMPTS = [
  {
    icon: <BarChart2 size={16} />,
    title: 'Analizar mi portafolio',
    prompt: 'Analizar mi portafolio actual y resumen de saldos',
  },
  {
    icon: <DollarSign size={16} />,
    title: 'Cotización USD / EUR',
    prompt: '¿Cuál es la cotización del Dólar y del Euro hoy?',
  },
  {
    icon: <ShieldCheck size={16} />,
    title: 'Estrategia de resguardo',
    prompt: 'Recomiéndame una estrategia de ahorro y resguardo de capital',
  },
  {
    icon: <Zap size={16} />,
    title: 'Estructura de comisiones',
    prompt: '¿Cuáles son las comisiones por realizar intercambios en eWallet?',
  },
];

export const ChatbotPage: React.FC = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Historial de chat por defecto
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: '¡Hola! Soy **Gemini**, tu **Asistente Financiero eWallet**. Puedo analizar tus saldos, comparar cotizaciones en tiempo real y sugerirte estrategias de resguardo de patrimonio.',
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: 'Analizar mi Portafolio', action: 'ANALYSIS_PORTFOLIO' },
        { label: 'Cotizaciones de Hoy', action: 'VIEW_RATES' },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Cargar datos contextuales de la billetera
  useEffect(() => {
    async function loadData() {
      try {
        const [walletsData, txData] = await Promise.all([
          getWallets(),
          getTransactions(),
        ]);
        if (walletsData && walletsData.length > 0) {
          setWallet(walletsData[0]);
        }
        setTransactions(txData);
      } catch (err) {
        console.error('Error cargando contexto en chatbot:', err);
      }
    }
    loadData();
  }, []);

  // Auto-scroll al fondo cuando hay un nuevo mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  async function handleSend(textToSend?: string) {
    const query = textToSend || inputMessage.trim();
    if (!query || isThinking) return;

    // 1. Añadir mensaje del usuario
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsThinking(true);

    try {
      // 2. Obtener respuesta de la IA
      const aiResponse = await sendChatMessage(query, wallet, transactions);
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error al responder IA:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: 'Ocurrió un inconveniente al procesar tu solicitud. Por favor intenta nuevamente.',
          timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  function handleQuickPromptClick(promptText: string) {
    handleSend(promptText);
  }

  function handleActionClick(actionType: string) {
    switch (actionType) {
      case 'SIMULATE_CONVERSION':
      case 'SIMULATE_BUY_USD':
      case 'GOTO_SIMULATOR':
        navigate('/operations');
        break;
      case 'VIEW_TRANSACTIONS':
        navigate('/transactions');
        break;
      case 'VIEW_ANALYTICS':
      case 'VIEW_RATES':
        navigate('/analytics');
        break;
      case 'ANALYSIS_PORTFOLIO':
        handleSend('Analizar mi portafolio actual');
        break;
      default:
        break;
    }
  }

  function handleClearChat() {
    setMessages([
      {
        id: `init-reset-${Date.now()}`,
        sender: 'ai',
        text: 'Conversación reiniciada. ¿En qué puedo ayudarte ahora?',
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }

  function handleCopyText(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className={styles.container}>
      {/* ─── Cabecera del Chat ─── */}
      <div className={styles.headerCard}>
        <div className={styles.botInfo}>
          <div className={styles.botAvatar}>
            <Bot size={24} />
          </div>
          <div>
            <h1 className={styles.botTitle}>
              Gemini Financial AI <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            </h1>
            <div className={styles.botStatus}>
              <span className={styles.statusDot} />
              <span>Conectado al feed de eWallet • Tiempo Real</span>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.actionBtn} onClick={handleClearChat} title="Limpiar conversación">
            <Trash2 size={14} />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* ─── Contenedor Principal de Chat ─── */}
      <div className={styles.chatBox}>
        {/* Sugerencias Rápidas Iniciales */}
        {messages.length <= 2 && (
          <div className={styles.quickPromptsSection}>
            <div className={styles.quickPromptsTitle}>
              <HelpCircle size={13} />
              <span>Consultas Frecuentes</span>
            </div>
            <div className={styles.quickPromptsGrid}>
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  className={styles.promptCard}
                  onClick={() => handleQuickPromptClick(qp.prompt)}
                >
                  <span className={styles.promptIcon}>{qp.icon}</span>
                  <span>{qp.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensajes del Chat */}
        <div className={styles.messagesList}>
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                className={`${styles.messageRow} ${
                  isAi ? styles.messageRowAi : styles.messageRowUser
                }`}
              >
                <div
                  className={`${styles.msgAvatar} ${
                    isAi ? styles.msgAvatarAi : styles.msgAvatarUser
                  }`}
                >
                  {isAi ? <Bot size={18} /> : 'TÚ'}
                </div>

                <div style={{ flex: 1, maxWidth: '100%' }}>
                  <div className={styles.msgBubble}>
                    {/* Render de texto simple con resaltados */}
                    {msg.text.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx} style={{ marginBottom: pIdx < msg.text.split('\n\n').length - 1 ? 12 : 0 }}>
                        {paragraph.split('**').map((part, bIdx) =>
                          bIdx % 2 === 1 ? <strong key={bIdx}>{part}</strong> : part
                        )}
                      </p>
                    ))}

                    {/* Render de Métricas si existen */}
                    {msg.metricsData && (
                      <div className={styles.metricsCard}>
                        <div className={styles.metricsTitle}>{msg.metricsData.title}</div>
                        <div className={styles.metricsGrid}>
                          {msg.metricsData.items.map((m, mIdx) => (
                            <div key={mIdx} className={styles.metricItem}>
                              <span className={styles.metricLabel}>{m.label}</span>
                              <div className={styles.metricValue}>{m.value}</div>
                              {m.change && (
                                <div
                                  className={`${styles.metricChange} ${
                                    m.isPositive ? styles.positive : m.isPositive === false ? styles.negative : ''
                                  }`}
                                >
                                  {m.change}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Acciones sugeridas de la IA */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className={styles.suggestedActionsList}>
                        {msg.suggestedActions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            className={styles.suggestedActionBtn}
                            onClick={() => handleActionClick(act.action)}
                          >
                            <span>{act.label}</span>
                            <ArrowRight size={13} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: isAi ? 'space-between' : 'flex-end', alignItems: 'center', marginTop: 4 }}>
                    {isAi && (
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-subtle)',
                          fontSize: 11,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {copiedId === msg.id ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                        <span>{copiedId === msg.id ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    )}
                    <span className={styles.msgTime}>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Indicador de Pensamiento */}
          {isThinking && (
            <div className={`${styles.messageRow} ${styles.messageRowAi}`}>
              <div className={`${styles.msgAvatar} ${styles.msgAvatarAi}`}>
                <Bot size={18} />
              </div>
              <div className={styles.typingIndicator}>
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ─── Formulario de Entrada ─── */}
        <form
          className={styles.inputForm}
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className={styles.inputWrapper}>
            <input
              type="text"
              className={styles.textInput}
              placeholder="Escribe tu consulta sobre saldos, cotizaciones o ahorro..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isThinking}
            />
          </div>

          <button
            type="submit"
            className={styles.sendBtn}
            disabled={!inputMessage.trim() || isThinking}
            title="Enviar mensaje"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotPage;
