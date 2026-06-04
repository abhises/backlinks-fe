'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  ArrowLeft, Send, Link2, ExternalLink, Loader2,
  ArrowRight, Info, CheckCircle2, AlertCircle, Ban,
  ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import AddLinkModal from '@/components/AddLinkModal';
import { io } from 'socket.io-client';

type Message = {
  id: string;
  messageText: string;
  timestamp: string;
  sender: { id: string; name: string; email: string };
};
type Thread = {
  id: string; stage: string; status: string;
  giverWorkspace: { id: string; domain: string; websiteName: string; description?: string };
  receiverWorkspace: { id: string; domain: string; websiteName: string; description?: string };
  messages: Message[];
  linkPlacement: any;
};

const CONTACT_NAMES: Record<string, string> = {
  'fernway.io': 'Mira',
  'ledgerpost.com': 'Devon',
  'byteweekly.dev': 'Lukas',
  'petalpress.co': 'Noor',
  'hikersguide.no': 'Ingrid',
  'northlight.studio': 'Mira',
  'kettle-and-bean.com': 'Owen',
};

const getContactName = (domain: string) => {
  const normalized = domain.toLowerCase().trim();
  if (CONTACT_NAMES[normalized]) return CONTACT_NAMES[normalized];
  const names = ['Devon', 'Lukas', 'Noor', 'Ingrid', 'Mira', 'Owen', 'Devin', 'Sofia', 'Alex', 'Liam'];
  let sum = 0;
  for (let i = 0; i < normalized.length; i++) sum += normalized.charCodeAt(i);
  return names[sum % names.length];
};

const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.3);

    // Tone 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08); // D6
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
};

const getAvatarColor = (domain: string) => {
  const colors = [
    { bg: '#d0e1fd', text: '#1e40af' }, // Blue
    { bg: '#fed7aa', text: '#c2410c' }, // Orange
    { bg: '#d1fae5', text: '#065f46' }, // Green
    { bg: '#fce7f3', text: '#9d174d' }, // Pink
    { bg: '#fef3c7', text: '#92400e' }, // Amber
    { bg: '#e9d5ff', text: '#6b21a8' }, // Purple
  ];
  let sum = 0;
  const cleanDomain = domain.toLowerCase().trim();
  for (let i = 0; i < cleanDomain.length; i++) sum += cleanDomain.charCodeAt(i);
  return colors[sum % colors.length];
};

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const { user, workspace } = useAuth();
  const router = useRouter();
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const [threadRes, msgRes] = await Promise.all([
        api.get(`/api/threads/${id}`),
        api.get(`/api/messages/${id}`),
      ]);
      setThread(threadRes.data.thread);
      setMessages(msgRes.data.messages);
    } catch { router.replace('/inbox'); }
    finally { setLoading(false); }
  }, [id, router]);

  useEffect(() => { 
    load(); 
    const handleRefresh = () => load();
    window.addEventListener('refresh_inbox', handleRefresh);
    return () => window.removeEventListener('refresh_inbox', handleRefresh);
  }, [load]);

  // Auto-open link details card if a link already exists
  useEffect(() => {
    if (thread?.linkPlacement) {
      setShowLinkModal(true);
    }
  }, [thread]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!id) return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const socket = io(socketUrl);

    socket.emit('join', id);

    socket.on('message', (message: Message) => {
      if (message.sender.id !== user?.id) {
        playNotificationSound();
      }
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    return () => {
      socket.emit('leave', id);
      socket.disconnect();
    };
  }, [id, user]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await api.post('/api/messages', { threadId: id, messageText: text.trim() });
      setMessages(prev => {
        if (prev.some(m => m.id === res.data.message.id)) return prev;
        return [...prev, res.data.message];
      });
      setText('');
    } catch {} finally { setSending(false); }
  };

  if (loading || !thread || !workspace) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
        <Loader2 size={28} className="animate-spin" style={{ color:'var(--accent)' }} />
      </div>
    );
  }

  const isGiver = thread.giverWorkspace.id === workspace.id;
  const myDomain = isGiver ? thread.giverWorkspace.domain : thread.receiverWorkspace.domain;
  const theirDomain = isGiver ? thread.receiverWorkspace.domain : thread.giverWorkspace.domain;
  const hasLink = !!thread.linkPlacement;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Top bar */}
      <div style={{ padding:'24px 32px 16px 32px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'flex-start', gap:16, background:'var(--bg-base)', flexShrink:0 }}>
        <button onClick={() => router.push('/inbox')} style={{ background:'none', border:'none', cursor:'pointer', marginTop: 10, color:'var(--text-secondary)' }}>
          <ArrowLeft size={20} />
        </button>
        {(() => {
          const avatarStyle = getAvatarColor(theirDomain);
          return (
            <div style={{ 
              width: 42, 
              height: 42, 
              background: avatarStyle.bg, 
              color: avatarStyle.text, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.1rem', 
              fontWeight: 600,
              flexShrink: 0
            }}>
              {theirDomain.substring(0,1).toUpperCase()}
            </div>
          );
        })()}
        <div style={{ flex:1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight:700, fontSize:'1.05rem', color: 'var(--text-primary)' }}>{theirDomain}</span>
            <span style={{ fontSize:'0.9rem', color:'var(--text-secondary)' }}>· {getContactName(theirDomain)}</span>
          </div>
          <span style={{ fontSize:'0.85rem', color:'var(--text-secondary)', fontStyle:'italic' }}>
            {(isGiver ? thread.receiverWorkspace : thread.giverWorkspace).description || 'Async-first work tools and a weekly publication on distributed teams.'}
          </span>
        </div>
        
        {/* Backlink Direction Badge */}
        <div>
          {!isGiver ? (
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 600, 
              color: '#0284c7', 
              background: '#e0f2fe', 
              padding: '4px 10px', 
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}>
              <ArrowDownLeft size={14} /> Backlink In
            </span>
          ) : (
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 600, 
              color: '#7c3aed', 
              background: '#f3e8ff', 
              padding: '4px 10px', 
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}>
              <ArrowUpRight size={14} /> Backlink Out
            </span>
          )}
        </div>
      </div>

      {/* Directional Banner */}
      <div style={{ padding:'12px 32px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', background:'var(--bg-base)', flexShrink:0 }}>
        
        {/* Gives / Receives */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              color: '#a855f7', 
              background: '#f3e8ff', 
              padding: '2px 6px', 
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              letterSpacing: '0.05em'
            }}>
              <ArrowUpRight size={12} /> GIVES
            </span>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              {thread.giverWorkspace.domain}
            </span>
          </div>

          <div style={{ color: 'var(--border-subtle)', display: 'flex', alignItems: 'center' }}>
            <span style={{ width: 16, height: 1, background: 'var(--border)' }}></span>
            <Link2 size={14} style={{ color: 'var(--border)' }} />
            <span style={{ width: 16, height: 1, background: 'var(--border)' }}></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              color: '#0284c7', 
              background: '#e0f2fe', 
              padding: '2px 6px', 
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              letterSpacing: '0.05em'
            }}>
              <ArrowDownLeft size={12} /> RECEIVES
            </span>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              {thread.receiverWorkspace.domain}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button id={hasLink ? 'view-link-btn' : 'add-link-btn'} onClick={() => setShowLinkModal(true)}
          style={{
            background: '#a855f7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer'
          }}>
          <Link2 size={16} />
          {hasLink ? 'Link details' : 'Add link details'}
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:12 }}>
        {showLinkModal && (
          <AddLinkModal
            thread={thread}
            isGiver={isGiver}
            hasLink={hasLink}
            myWorkspace={workspace}
            onClose={() => setShowLinkModal(false)}
            onSaved={() => { setShowLinkModal(false); load(); }}
          />
        )}
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:12 }}>
          {messages.length === 0 && !showLinkModal && (
            <div style={{ paddingTop: 80, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
              No messages yet — send the first one to start the conversation.
            </div>
          )}
          {messages.map(msg => {
            const mine = msg.sender.id === user?.id;
            return (
              <div key={msg.id} style={{ display:'flex', flexDirection:'column', alignItems: mine ? 'flex-end' : 'flex-start', gap:4 }}>
                {!mine && (
                  <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', paddingLeft:4 }}>{msg.sender.name}</span>
                )}
                <div className={`chat-bubble ${mine ? 'mine' : 'theirs'}`}>
                  {msg.messageText}
                </div>
                <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input — locked when rejected or pending */}
      {thread.status === 'REJECTED' ? (
        <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border)', background:'var(--bg-surface)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <Ban size={16} style={{ color:'var(--red)', flexShrink:0 }} />
          <span style={{ fontSize:'0.875rem', color:'var(--text-muted)' }}>
            This connection was rejected — messaging is disabled.
          </span>
        </div>
      ) : thread.status === 'PENDING' ? (
        <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border)', background:'var(--bg-surface)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <Loader2 size={16} className="animate-spin" style={{ color:'var(--amber)', flexShrink:0 }} />
          <span style={{ fontSize:'0.875rem', color:'var(--text-muted)' }}>
            Waiting for mutual acceptance before messaging unlocks...
          </span>
        </div>
      ) : (
        <form onSubmit={sendMessage} style={{ padding:'16px 24px', borderTop:'1px solid var(--border)', display:'flex', gap:10, background:'var(--bg-surface)', flexShrink:0 }}>
          <input
            id="chat-input"
            value={text}
            onChange={e => setText(e.target.value)}
            className="input-field"
            placeholder="Type a message…"
            style={{ flex:1 }}
            disabled={sending}
          />
          <button id="chat-send" type="submit" className="btn btn-primary btn-icon" disabled={!text.trim() || sending}>
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      )}
    </div>
  );
}
