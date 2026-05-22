'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  Link2, Globe, ShieldCheck, ArrowRight, MessageSquare, 
  CheckCircle, Zap, TrendingUp, Mail, Users, Check, Sparkles,
  Sun, Moon, Palette
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light' | 'color'>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('bl_theme') as 'dark' | 'light' | 'color') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const cycleTheme = () => {
    const next = theme === 'dark' ? 'light' : theme === 'light' ? 'color' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('bl_theme', next);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Palette;

  const steps = [
    { num: '01', title: 'Sign up to SERPsupport', desc: 'Create your secure account in under a minute.' },
    { num: '02', title: 'Login and add your website', desc: 'Specify your domain, niche, display name, and details.' },
    { num: '03', title: 'Approve/Reject website connections', desc: 'Review potential partners and choose who fits your content best.' },
    { num: '04', title: 'When both sides approve, chat will start', desc: 'Instantly unlock a dedicated, secure discussion thread.' },
    { num: '05', title: 'Discuss and agree on the link placement', desc: 'Negotiate types of backlinks, target pages, and anchor texts.' },
    { num: '06', title: 'Monitor your backlinks', desc: 'Track your active links and verify live placements over time.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      {/* Background radial glow */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: '50%', 
        transform: 'translateX(-50%)', 
        width: '100%', 
        maxWidth: 1400, 
        height: 600, 
        background: 'radial-gradient(ellipse 60% 50% at 50% 0%, var(--accent-glow), transparent)', 
        pointerEvents: 'none', 
        zIndex: 0 
      }} />

      {/* Navigation */}
      <header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        background: 'var(--header-bg)', 
        backdropFilter: 'blur(12px)', 
        borderBottom: '1px solid var(--border)' 
      }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto', 
          padding: '16px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-icon"><Link2 size={18} color="#fff" /></div>
            <span className="logo-text" style={{ fontSize: '1.25rem', letterSpacing: '-0.04em' }}>SERPsupport</span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>Features</a>
            <a href="#how-it-works" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>How it works</a>
            <a href="#importance" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>Importance</a>
            <a href="#contact" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>Contact</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              onClick={cycleTheme} 
              className="btn btn-secondary btn-icon" 
              title="Cycle Theme" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, height: 36, width: 36, borderRadius: 'var(--radius-sm)' }}
            >
              <ThemeIcon size={16} />
            </button>
            {user ? (
              <Link href="/inbox" className="btn btn-primary">
                Dashboard <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link href="/auth?mode=login" className="btn btn-ghost" style={{ fontWeight: 500 }}>
                  Sign In
                </Link>
                <Link href="/auth?mode=register" className="btn btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 24px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: 48, 
          alignItems: 'center' 
        }}>
          <div>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8, 
              background: 'var(--border)', 
              padding: '6px 14px', 
              borderRadius: 99, 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              color: 'var(--accent-hover)',
              marginBottom: 24
            }}>
              <Sparkles size={13} /> Safe Directional Backlinks
            </div>

            <h1 style={{ 
              fontSize: '3.5rem', 
              lineHeight: 1.1, 
              fontWeight: 800, 
              letterSpacing: '-0.04em', 
              marginBottom: 24,
              background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--accent-hover) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Building Links,<br />Made Easy
            </h1>

            <p style={{ 
              fontSize: '1.125rem', 
              color: 'var(--text-secondary)', 
              lineHeight: 1.6, 
              marginBottom: 36,
              maxWidth: 500
            }}>
              SERPsupport is the ultimate platform for building connections between websites. Use our chat functionality to discuss the type of backlinks and outlinks. Easily approve or reject connections, ensuring high-quality links.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Link href={user ? "/inbox" : "/auth?mode=register"} className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '0.95rem', borderRadius: 'var(--radius)' }}>
                {user ? 'Go to Dashboard' : 'Get Started for Free'} <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" className="btn btn-secondary" style={{ padding: '14px 24px', fontSize: '0.95rem', borderRadius: 'var(--radius)' }}>
                Learn More
              </a>
            </div>
          </div>

          {/* Interactive CSS Mockup */}
          <div className="card" style={{ 
            padding: 24, 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 'var(--radius-lg)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
              </div>
              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Globe size={11} /> app.serpsupport.com/inbox/thread-91
              </div>
            </div>

            {/* Chat preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(124, 110, 247, 0.1)', border: '1px solid rgba(124, 110, 247, 0.2)', padding: '8px 12px', borderRadius: 8 }}>
                <Users size={14} color="var(--accent)" />
                <span style={{ fontWeight: 600 }}>Connection Active:</span>
                <span style={{ color: 'var(--text-secondary)' }}>blog.techhub.com ⇄ devspace.io</span>
              </div>

              <div className="chat-bubble theirs" style={{ alignSelf: 'flex-start', margin: 0 }}>
                Hi! I noticed your website has strong authority in the SaaS niche. Would you be open to giving a backlink from your latest software guide?
              </div>

              <div className="chat-bubble mine" style={{ alignSelf: 'flex-end', margin: 0 }}>
                Sure, that sounds perfect! In return, could you place a niche edit pointing to my landing page from one of your marketing articles?
              </div>

              <div className="chat-bubble theirs" style={{ alignSelf: 'flex-start', margin: 0 }}>
                Absolutely. Let's exchange details here. Here is my anchor text and target URL...
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, background: 'var(--bg-base)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '10px 14px' }}>
                <div style={{ flex: 1, color: 'var(--text-muted)' }}>Type details of the link placement...</div>
                <button className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>Send</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section id="features" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.02em' }}>What Makes SERPsupport Different?</h2>
            <p style={{ maxWidth: 700, margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
              SERPsupport offers a new way to build backlinks by connecting you directly with website owners through chat, allowing personalized and flexible link placements.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {/* Card 1 */}
            <div className="card card-hover" style={{ padding: 32 }}>
              <div style={{ width: 44, height: 44, background: 'rgba(124,110,247,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifySelf: 'start', justifyContent: 'center', color: 'var(--accent)', marginBottom: 20 }}>
                <Users size={22} />
              </div>
              <h3 style={{ marginBottom: 12 }}>Direct Communication</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Connect directly with website owners through chat, allowing personalized and flexible link placements. Skip the agency middleman and build real relationships.
              </p>
            </div>

            {/* Card 2 */}
            <div className="card card-hover" style={{ padding: 32 }}>
              <div style={{ width: 44, height: 44, background: 'rgba(34,197,94,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifySelf: 'start', justifyContent: 'center', color: 'var(--green)', marginBottom: 20 }}>
                <Globe size={22} />
              </div>
              <h3 style={{ marginBottom: 12 }}>Avoid Direct Swaps</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Unlike traditional methods, the portal allows you to give and receive backlinks from different sites, avoiding direct link swaps that search engines can easily flag.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card card-hover" style={{ padding: 32 }}>
              <div style={{ width: 44, height: 44, background: 'rgba(239,68,68,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifySelf: 'start', justifyContent: 'center', color: 'var(--red)', marginBottom: 20 }}>
                <ShieldCheck size={22} />
              </div>
              <h3 style={{ marginBottom: 12 }}>Full Control</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                You have full control to approve or reject website connections and placement options, ensuring your outbound links and backlinks are high-quality and highly relevant.
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link href={user ? "/inbox" : "/auth?mode=register"} className="btn btn-primary" style={{ padding: '12px 24px' }}>
              Sign Up Now
            </Link>
          </div>
        </div>
      </section>

      {/* Quote Banner */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: 'linear-gradient(180deg, var(--bg-base) 0%, rgba(124,110,247,0.03) 50%, var(--bg-base) 100%)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <span style={{ fontSize: '3rem', color: 'var(--accent)', opacity: 0.3, fontFamily: 'serif', display: 'block', height: 20 }}>“</span>
          <h2 style={{ 
            fontSize: '1.875rem', 
            fontWeight: 700, 
            lineHeight: 1.5, 
            color: 'var(--text-primary)', 
            letterSpacing: '-0.01em',
            padding: '0 20px'
          }}>
            Say goodbye to outdated backlink methods and hello to smarter, more strategic link building with SERPsupport!
          </h2>
          <span style={{ fontSize: '3rem', color: 'var(--accent)', opacity: 0.3, fontFamily: 'serif', display: 'block', height: 20 }}>”</span>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: 16 }}>How It Works</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Exchanging high-quality backlinks on SERPsupport takes just a few steps.</p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: 24 
        }}>
          {steps.map((s, idx) => (
            <div key={idx} className="card" style={{ 
              padding: 24, 
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              position: 'relative'
            }}>
              <div style={{ 
                position: 'absolute', 
                top: 20, 
                right: 20, 
                fontSize: '2rem', 
                fontWeight: 900, 
                color: 'var(--border)', 
                lineHeight: 1,
                opacity: 0.5 
              }}>{s.num}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', paddingRight: 40, marginBottom: 12 }}>{s.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Importance of Backlinks */}
      <section id="importance" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: 48, 
            alignItems: 'center' 
          }}>
            {/* Visual Rank Graphic */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <TrendingUp color="var(--green)" size={20} />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>SERP Ranking Progression</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 60, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Before:</span>
                    <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 99 }}>
                      <div style={{ width: '25%', height: '100%', background: 'var(--red)', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--red)' }}>#42</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 60, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>After:</span>
                    <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 99 }}>
                      <div style={{ width: '92%', height: '100%', background: 'var(--green)', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--green)' }}>#3</span>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <Zap size={24} color="var(--accent)" />
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Domain Authority Boost</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Search engines treat backlinks as authoritative endorsements.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em' }}>The Importance of Backlinks</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
                  Backlinks are essential for SEO as they act as endorsements from other websites, signaling to search engines that your site is authoritative and relevant. Backlinks help improve search rankings, increase visibility, and drive more traffic to your website.
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6 }}>
                  By receiving backlinks from diverse sites, your content is perceived as valuable, boosting your domain authority and SERP placement. Additionally, backlinks enhance brand awareness by reaching a broader audience through referral traffic.
                </p>
              </div>

              <div style={{ marginTop: 36 }}>
                <Link href={user ? "/inbox" : "/auth?mode=register"} className="btn btn-primary" style={{ padding: '12px 24px' }}>
                  Sign Up Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border)', padding: '64px 24px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: 40,
            marginBottom: 48
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div className="logo-icon"><Link2 size={16} color="#fff" /></div>
                <span className="logo-text" style={{ fontSize: '1.15rem' }}>SERPsupport</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, maxWidth: 300 }}>
                Boost your SEO by exchanging high-quality backlinks. Use our portal to connect with sites and improve rankings.
              </p>
            </div>

            <div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>Product</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
                <li><Link href="/auth?mode=login" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Sign In</Link></li>
                <li><Link href="/auth?mode=register" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Sign Up</Link></li>
                <li><a href="#how-it-works" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>How It Works</a></li>
              </ul>
            </div>

            <div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>Contact</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                  <Mail size={14} /> info@serpsupport.com
                </li>
              </ul>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>&copy; {new Date().getFullYear()} SERPsupport. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <a href="mailto:info@serpsupport.com" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
