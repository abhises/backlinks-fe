'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  ArrowLeft, Send, Link2, ExternalLink, Loader2,
  ArrowRight, Info, CheckCircle2, AlertCircle, Ban,
  ArrowUpRight, ArrowDownLeft, HelpCircle
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
  giverWorkspace: { id: string; domain: string; websiteName: string; description?: string; teamMembers?: { user: { name: string } }[] };
  receiverWorkspace: { id: string; domain: string; websiteName: string; description?: string; teamMembers?: { user: { name: string } }[] };
  messages: Message[];
  linkPlacement: any;
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

const getOwnerName = (workspace: any) => {
  if (workspace?.teamMembers && workspace.teamMembers.length > 0) {
    const name = workspace.teamMembers[0].user.name;
    return name ? name.split(' ')[0] : 'User';
  }
  return 'User';
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
  const [showInfoModal, setShowInfoModal] = useState(false);
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
            <span style={{ fontSize:'0.9rem', color:'var(--text-secondary)' }}>· {getOwnerName(isGiver ? thread.receiverWorkspace : thread.giverWorkspace)}</span>
          </div>
          <span style={{ fontSize:'0.85rem', color:'var(--text-secondary)', fontStyle:'italic' }}>
            {(isGiver ? thread.receiverWorkspace : thread.giverWorkspace).description || 'Async-first work tools and a weekly publication on distributed teams.'}
          </span>
        </div>
        
        {/* Backlink Direction Badge */}
        <div>
          {!isGiver ? (
            <span 
              title={`${thread.giverWorkspace.domain} gives a backlink to ${thread.receiverWorkspace.domain}`}
              style={{ 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                color: '#0284c7', 
                background: '#e0f2fe', 
                padding: '4px 10px', 
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'help'
              }}>
              <ArrowDownLeft size={14} /> Backlink In
            </span>
          ) : (
            <span 
              title={`${thread.giverWorkspace.domain} gives a backlink to ${thread.receiverWorkspace.domain}`}
              style={{ 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                color: '#7c3aed', 
                background: '#f3e8ff', 
                padding: '4px 10px', 
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'help'
              }}>
              <ArrowUpRight size={14} /> Backlink Out
            </span>
          )}
        </div>
      </div>

      {/* Directional Banner */}
      <div style={{ padding:'12px 32px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', background:'var(--bg-base)', flexShrink:0 }}>
        
        {/* Gives / Receives */}
        <div 
          title={`${thread.giverWorkspace.domain} gives a backlink to ${thread.receiverWorkspace.domain}`}
          style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'help' }}
        >
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
              <ArrowUpRight size={12} /> BACKLINK OUT
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
              <ArrowDownLeft size={12} /> BACKLINK IN
            </span>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              {thread.receiverWorkspace.domain}
            </span>
          </div>

          {/* Help Info Button */}
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowInfoModal(true); }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background 0.2s',
              marginLeft: '4px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            title="How this connection works"
          >
            <HelpCircle size={16} />
          </button>
        </div>

        {/* Action Button */}
        {(isGiver || hasLink) && (
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
        )}
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
        {showInfoModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }} onClick={() => setShowInfoModal(false)}>
            <div 
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '28px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: 'var(--shadow-xl)',
                animation: 'fadeIn 0.2s ease-out'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ background: '#f3e8ff', color: '#a855f7', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HelpCircle size={20} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Connection Details</h3>
              </div>

              {/* Explanation Diagram */}
              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#a855f7', background: '#f3e8ff', padding: '2px 6px', borderRadius: '4px', display: 'block', marginBottom: 4 }}>GIVER</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{thread.giverWorkspace.domain}</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Gives backlink to</span>
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--accent)', marginTop: 4 }}>
                      <span style={{ width: 30, height: 2, background: 'var(--border)' }}></span>
                      <ArrowRight size={14} style={{ marginLeft: -4 }} />
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', display: 'block', marginBottom: 4 }}>RECEIVER</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{thread.receiverWorkspace.domain}</span>
                  </div>
                </div>
              </div>

              {/* Text description */}
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p>
                  <strong>{thread.giverWorkspace.domain}</strong> gives a backlink to <strong>{thread.receiverWorkspace.domain}</strong>.
                </p>
                {isGiver ? (
                  <div style={{ background: 'rgba(168,85,247,0.05)', borderLeft: '3px solid #a855f7', padding: '10px 12px', borderRadius: '0 4px 4px 0' }}>
                    <span style={{ fontWeight: 700, color: '#a855f7', display: 'block', fontSize: '0.8rem', marginBottom: 4, letterSpacing: '0.05em' }}>YOUR ACTION REQUIRED</span>
                    As the <strong>Giver</strong>, you need to place a backlink on your site pointing to the Receiver's site. Click the <strong>Add link details</strong> button above to save the specific URL and anchor text once placed.
                  </div>
                ) : (
                  <div style={{ background: 'rgba(2,132,199,0.05)', borderLeft: '3px solid #0284c7', padding: '10px 12px', borderRadius: '0 4px 4px 0' }}>
                    <span style={{ fontWeight: 700, color: '#0284c7', display: 'block', fontSize: '0.8rem', marginBottom: 4, letterSpacing: '0.05em' }}>INCOMING BACKLINK</span>
                    As the <strong>Receiver</strong>, you will receive a backlink from the Giver's site. You can view the placement details here as soon as they add them.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowInfoModal(false)}
                  style={{
                    background: '#1a1a1a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 20px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#333'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1a1a1a'}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
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
                  <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', paddingLeft:4 }}>{msg.sender.name ? msg.sender.name.split(' ')[0] : 'User'}</span>
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
