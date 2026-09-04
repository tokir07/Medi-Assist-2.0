import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import type { ChatConversation, ChatMessage } from '../services/chatService';
import { Search, Send, CheckCheck, Check, MessageSquare, ShieldCheck, User } from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConv, setActiveConv] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Auto-focus input when sending finishes
  useEffect(() => {
    if (!sending) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [sending]);

  // 1. Fetch conversations on load
  const loadConversations = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await chatService.getConversations();
      setConversations(data);
      if (data.length > 0 && !activeConv) {
        setActiveConv(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // 2. Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConv) return;

    let isMounted = true;
    const fetchMsgs = async () => {
      try {
        const res = await chatService.getMessages(activeConv.id);
        if (isMounted) {
          setMessages(res.messages);
          // Update unread count in state
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConv.id ? { ...c, unread_count: 0 } : c))
          );
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };

    fetchMsgs();

    return () => {
      isMounted = false;
    };
  }, [activeConv?.id]);

  // 3. Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. WebSocket Real-time listener setup
  useEffect(() => {
    if (!user?.id) return;

    const envUrl = import.meta.env.VITE_API_URL;
    let host = window.location.host;
    let protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    if (envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))) {
      try {
        const urlObj = new URL(envUrl);
        host = urlObj.host;
        protocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
      } catch (e) {}
    }
    const wsUrl = `${protocol}//${host}/api/chat/ws/${user.id}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.type === 'NEW_MESSAGE') {
            const newMsg: ChatMessage = data.message;
            if (activeConv && newMsg.conversation_id === activeConv.id) {
              setMessages((prev) => [...prev, newMsg]);
              chatService.markRead(activeConv.id);
            }
            loadConversations();
          }
        } catch (e) {}
      };

      ws.onerror = () => {
        // Silent fallback to REST queries
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      };
    } catch (e) {
      // Silent fallback
    }
  }, [user?.id, activeConv?.id]);

  // 5. Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const newMsg = await chatService.sendMessage(activeConv.id, textToSend);
      setMessages((prev) => [...prev, newMsg]);
      
      // Update local conversation preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConv.id
            ? { ...c, last_message_preview: textToSend, last_message_at: new Date().toISOString() }
            : c
        )
      );
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to send message');
      setInputText(textToSend); // restore on error
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.other_participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.other_participant.specialty && c.other_participant.specialty.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Top Banner */}
      <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-teal-600" />
          <h1 className="text-base font-semibold text-slate-900">Patient Messages</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-md">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Confirmed Doctor Communication</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Conversations List */}
        <div className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search doctor or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading messages...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-700">No conversations yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] mx-auto">
                  Messaging becomes available after your appointment is confirmed.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = activeConv?.id === conv.id;
                const formattedTime = new Date(conv.last_message_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      isActive ? 'bg-teal-50/70 border-l-4 border-teal-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs shrink-0 overflow-hidden border border-slate-300">
                      {conv.other_participant.image ? (
                        <img
                          src={conv.other_participant.image}
                          alt={conv.other_participant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        conv.other_participant.name.charAt(0)
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {conv.other_participant.name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">{formattedTime}</span>
                      </div>
                      <p className="text-[11px] text-teal-700 font-medium truncate mb-1">
                        {conv.other_participant.specialty || 'Doctor'}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {conv.last_message_preview || 'No messages yet'}
                        </p>
                        {conv.unread_count > 0 && (
                          <span className="w-4 h-4 bg-teal-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shrink-0">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Conversation */}
        <div className="flex-1 flex flex-col bg-white">
          {activeConv ? (
            <>
              {/* Active Header */}
              <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs border border-teal-200">
                    {activeConv.other_participant.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      {activeConv.other_participant.name}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {activeConv.other_participant.specialty} • {activeConv.other_participant.hospital || 'MediAssist Network'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Notice if any */}
              {errorMsg && (
                <div className="px-4 py-2 bg-red-50 text-red-700 text-xs border-b border-red-100 flex items-center justify-between">
                  <span>{errorMsg}</span>
                  <button onClick={() => setErrorMsg(null)} className="font-bold text-red-900 text-xs">
                    Dismiss
                  </button>
                </div>
              )}

              {/* Messages Body */}
              <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30 space-y-4">
                {messages.map((msg) => {
                  if (msg.message_type === 'SYSTEM') {
                    return (
                      <div key={msg.id} className="flex justify-center my-3">
                        <div className="bg-slate-100 text-slate-600 text-[11px] px-4 py-1.5 rounded-full border border-slate-200 max-w-md text-center">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  const isMe = msg.sender_role === 'PATIENT';
                  const formattedTime = new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2.5 rounded-xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-teal-700 text-white rounded-br-none shadow-xs'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none shadow-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                            isMe ? 'text-teal-200' : 'text-slate-400'
                          }`}
                        >
                          <span>{formattedTime}</span>
                          {isMe && (
                            msg.is_read ? (
                              <CheckCheck className="w-3.5 h-3.5 text-teal-200" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-teal-300" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message to your doctor..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={sending}
                  className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Select a Conversation</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Choose a confirmed doctor from the sidebar to start or continue your consultation chat.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
