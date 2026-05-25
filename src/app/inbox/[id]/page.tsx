'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  ArrowLeft, Send, Link2, ExternalLink, Loader2,
  ArrowRight, Info, CheckCircle2, AlertCircle, Ban
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
  giverWorkspace: { id: string; domain: string; websiteName: string };
  receiverWorkspace: { id: string; domain: string; websiteName: string };
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
      <div style={{ padding:'14px 80px 14px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, background:'var(--bg-surface)', flexShrink:0 }}>
        <button onClick={() => router.push('/inbox')} className="btn btn-ghost btn-icon">
          <ArrowLeft size={18} />
        </button>
        <div style={{ width:36, height:36, background:'linear-gradient(135deg, var(--accent), #a855f7)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:800, color:'#fff' }}>
          {theirDomain.substring(0,2).toUpperCase()}
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:700, fontSize:'0.9375rem' }}>{theirDomain}</p>
          <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>
            Status: <span style={{ color: thread.status === 'REJECTED' ? 'var(--red)' : thread.stage === 'PLACED' ? 'var(--green)' : 'var(--accent)', fontWeight:600 }}>
              {thread.status === 'REJECTED' ? 'Rejected' : thread.stage === 'NEW' ? 'Pending Approval' : thread.stage === 'CHAT' ? 'Chatting' : 'Link Placed ✓'}
            </span>
          </p>
        </div>
        {/* Show Add/Edit button to BOTH if no link exists. If link exists, only the true giver can Edit, the other views. */}
        {(!hasLink || isGiver) ? (
          <button id="add-link-btn" onClick={() => setShowLinkModal(true)}
            className={`btn btn-sm ${hasLink ? 'btn-secondary' : 'btn-primary'}`}>
            <Link2 size={14} />
            {hasLink ? 'Edit Link Details' : 'Add Link Details (Become Giver)'}
          </button>
        ) : (
          <button id="view-link-btn" onClick={() => setShowLinkModal(true)}
            className="btn btn-sm btn-secondary">
            <Link2 size={14} />
            View Link Details
          </button>
        )}

      </div>

      {/* Directional Banner */}
      <div className="direction-banner">
        {hasLink ? (
          <>
            <span style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
              {isGiver ? '📤 You GAVE' : '📥 You RECEIVED'}
            </span>
            <span className="direction-domain" style={{ color: isGiver ? 'var(--accent)' : 'var(--green)' }}>
              {thread.giverWorkspace.domain}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:4, color:'var(--text-muted)' }}>
              <ArrowRight size={14} />
              {thread.linkPlacement?.anchorText && (
                <span style={{ fontStyle:'italic', fontSize:'0.75rem' }}>&quot;{thread.linkPlacement.anchorText}&quot;</span>
              )}
              <ArrowRight size={14} />
            </span>
            <span className="direction-domain" style={{ color: isGiver ? 'var(--green)' : 'var(--accent)' }}>
              {thread.receiverWorkspace.domain}
            </span>
          </>
        ) : (
          <span style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>
            Discuss your websites below. Once decided, the person placing the link should click <strong>Add Link Details</strong> above.
          </span>
        )}
        {thread.status === 'REJECTED' && (
          <span className="pill pill-rejected" style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5 }}>
            <Ban size={11} /> Connection Rejected
          </span>
        )}
        {thread.status !== 'REJECTED' && hasLink && (
          <span className="pill pill-live" style={{ marginLeft:'auto' }}>
            <CheckCircle2 size={11} /> Link Placed
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:12 }}>
        {messages.length === 0 && (
          <div className="empty-state" style={{ paddingTop:40 }}>
            <div className="empty-state-icon"><Info /></div>
            <h3>No messages yet</h3>
            <p>Start the conversation to coordinate your backlink exchange.</p>
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
    </div>
  );
}
