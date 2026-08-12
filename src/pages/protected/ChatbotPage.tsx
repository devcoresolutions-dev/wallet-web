import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Copy,
  Check,
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
import { sendChatMessage, type ChatMessage, type ChatHistoryItem } from '../../services/chatbotService';

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
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Historial de chat en el estado local del cliente
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: '¡Hola! Soy tu **Asistente Financiero eWallet**. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Resiliencia al cargar contexto secundario con Promise.allSettled
  useEffect(() => {
    async function loadData() {
      await Promise.allSettled([
        getWallets(),
        getTransactions(),
      ]);
    }
    loadData();
  }, []);

  // Auto-scroll al fondo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  async function handleSend(textToSend?: string) {
    const rawQuery = textToSend || inputMessage.trim();
    if (!rawQuery || isThinking) return;

    // Truncar a máximo 500 caracteres
    const query = rawQuery.slice(0, 500);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInputMessage('');
    setIsThinking(true);

    try {
      // Construir historial previo (máximo 10 mensajes)
      const historyItems: ChatHistoryItem[] = newMessages
        .slice(-11, -1) // Tomar los mensajes previos excluyendo el recién agregado
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      const aiResponse = await sendChatMessage(query, historyItems);
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error al responder IA:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: 'Ocurrió un inconveniente de red al procesar tu mensaje. Por favor reintenta.',
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
              Asistente Financiero eWallet <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            </h1>
            <div className={styles.botStatus}>
              <span className={styles.statusDot} />
              <span>Conectado a POST /api/chat</span>
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
                    {msg.text.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx} style={{ marginBottom: pIdx < msg.text.split('\n\n').length - 1 ? 12 : 0 }}>
                        {paragraph.split('**').map((part, bIdx) =>
                          bIdx % 2 === 1 ? <strong key={bIdx}>{part}</strong> : part
                        )}
                      </p>
                    ))}
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
              maxLength={500}
              className={styles.textInput}
              placeholder="Escribe tu consulta (máx 500 caracteres)..."
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
