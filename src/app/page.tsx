'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  Link2, Globe, ShieldCheck, ArrowRight, 
  Menu, X, Users, PlayCircle, Check,
  Sun, Moon, Palette
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'color'>('light');

  useEffect(() => {
    const saved = (localStorage.getItem('bl_theme') as 'dark' | 'light' | 'color') || 'light';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const cycleTheme = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'color' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('bl_theme', next);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Palette;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      
      {/* Navigation - Dark Theme matching serpsupport.com */}
      <header style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0,
        right: 0,
        zIndex: 100, 
        background: 'var(--header-bg)', 
        borderBottom: '1px solid rgba(255,255,255,0.1)'
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
            <Link2 size={24} color="var(--accent)" />
            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>SERPsupport</span>
          </div>

          {/* Desktop nav links */}
          <nav className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#features" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '1rem', transition: 'color 0.2s' }}>Features</a>
            <a href="#how-it-works" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '1rem', transition: 'color 0.2s' }}>How it works</a>
            <a href="#importance" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '1rem', transition: 'color 0.2s' }}>Importance</a>
            <a href="#contact" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '1rem', transition: 'color 0.2s' }}>Contact</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button 
              onClick={cycleTheme} 
              className="btn btn-icon" 
              title="Cycle Theme" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, height: 36, width: 36, borderRadius: '4px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer' }}
            >
              <ThemeIcon size={16} />
            </button>
            {/* Desktop auth buttons */}
            <span className="landing-nav-links" style={{ display: 'contents' }}>
              {user ? (
                <Link href="/inbox" className="btn btn-primary" style={{ borderRadius: '4px', padding: '10px 24px', fontWeight: 700 }}>
                  Dashboard <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link href="/auth?mode=login" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }}>
                    Sign In
                  </Link>
                  <Link href="/auth?mode=register" className="btn btn-primary" style={{ borderRadius: '4px', padding: '10px 24px', fontWeight: 700 }}>
                    Sign Up
                  </Link>
                </>
              )}
            </span>
            {/* Mobile hamburger */}
            <button
              className="landing-nav-mobile btn btn-icon"
              style={{ display: 'none', padding: 8, height: 36, width: 36, color: 'var(--text-primary)', background: 'transparent', border: 'none' }}
              onClick={() => setMobileMenuOpen(v => !v)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ background: 'var(--bg-hero)', color: 'var(--text-hero)', paddingTop: '160px', paddingBottom: '80px', position: 'relative' }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto', 
          padding: '0 24px', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '40px',
          alignItems: 'center' 
        }}>
          
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ 
              fontSize: '3.5rem', 
              fontWeight: 700,
              marginBottom: '24px',
              lineHeight: 1.2
            }}>
              Building Links,<br />Made Easy
            </h1>

            <p style={{ 
              fontSize: '1.15rem', 
              lineHeight: 1.6, 
              marginBottom: '40px',
              color: 'var(--text-hero)',
              opacity: 0.85
            }}>
              SERPsupport is the ultimate platform for building connections between websites. Use our chat functionality to discuss the type of backlinks and outlinks. Easily approve or reject connections, ensuring high-quality links.
            </p>

            <Link href={user ? "/inbox" : "/auth?mode=register"} className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem', borderRadius: '4px', fontWeight: 700 }}>
              {user ? 'Go to Dashboard' : 'Sign Up'}
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            {/* Interactive Laptop Mockup with Video */}
            <div style={{ 
              width: '100%', 
              background: '#ffffff',
              borderRadius: '12px 12px 0 0',
              padding: '16px',
              border: '8px solid #222',
              borderBottom: 'none',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', width: '6px', height: '6px', background: '#444', borderRadius: '50%' }}></div>
              <div style={{ width: '100%', overflow: 'hidden', borderRadius: '4px', background: '#000' }}>
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  controls={false}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  src="https://www.serpsupport.com/wp-content/uploads/2024/09/SERPsupport-September.mp4" 
                />
              </div>
            </div>
            {/* Laptop Base */}
            <div style={{ width: '105%', height: '24px', background: '#333', borderRadius: '0 0 16px 16px', position: 'relative' }}>
               <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '8px', background: '#222', borderRadius: '0 0 8px 8px' }}></div>
            </div>
          </div>

        </div>
      </section>

      {/* What Makes Us Different */}
      <section id="features" style={{ background: 'var(--bg-surface)', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>What Makes SERPsupport Different?</h2>
            <p style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
              SERPsupport offers a new way to build backlinks by connecting you directly with website owners through chat, allowing personalized and flexible link placements. 
              Unlike traditional methods, the portal allows you to give and receive backlinks from different sites, avoiding direct link swaps. You have full control to approve or reject links, ensuring they are high-quality and relevant.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link href={user ? "/inbox" : "/auth?mode=register"} className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1rem', borderRadius: '4px', fontWeight: 700 }}>
              Sign Up
            </Link>
          </div>
        </div>
      </section>

      {/* Quote Banner */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: 500, 
            lineHeight: 1.5, 
            color: 'var(--text-primary)', 
            fontStyle: 'italic'
          }}>
            “Say goodbye to outdated backlink methods and hello to smarter, more strategic link building with SERPsupport!”
          </h2>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ background: 'var(--bg-surface)', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '60px', color: 'var(--text-primary)' }}>How it works</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {[
              { title: 'Sign up to SERPsupport', icon: <Users size={32} /> },
              { title: 'Login and add your website', icon: <Globe size={32} /> },
              { title: 'Approve/Reject website connections', icon: <ShieldCheck size={32} /> },
              { title: 'When both sides approve, chat will start', icon: <PlayCircle size={32} /> },
              { title: 'Discuss and agree on the link placement', icon: <Link2 size={32} /> },
              { title: 'Monitor your backlinks', icon: <Check size={32} /> },
            ].map((step, idx) => (
              <div key={idx} style={{ 
                background: 'var(--bg-card)', 
                padding: '40px 30px', 
                borderRadius: '8px', 
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'center',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ color: 'var(--accent)', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                  {step.icon}
                </div>
                <h4 style={{ color: 'var(--text-primary)' }}>{step.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Importance of Backlinks */}
      <section id="importance" style={{ padding: '100px 24px', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '30px', color: 'var(--text-primary)' }}>The Importance of Backlinks</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '20px' }}>
            Backlinks are essential for SEO as they act as endorsements from other websites, signaling to search engines that your site is authoritative and relevant. Backlinks help improve search rankings, increase visibility, and drive more traffic to your website.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '40px' }}>
            By receiving backlinks from diverse sites, your content is perceived as valuable, boosting your domain authority and SERP placement. Additionally, backlinks enhance brand awareness by reaching a broader audience through referral traffic.
          </p>
          
          <Link href={user ? "/inbox" : "/auth?mode=register"} className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1rem', borderRadius: '4px', fontWeight: 700 }}>
            Sign Up
          </Link>
        </div>
      </section>

      {/* Footer Matching serpsupport.com */}
      <footer id="contact" style={{ background: 'var(--bg-footer)', color: 'var(--text-footer)', padding: '60px 24px 30px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', marginBottom: '60px' }}>
            <div>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.5rem', fontWeight: 600, marginBottom: '20px', color: '#fff' }}>SERPsupport</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '350px' }}>
                Boost your SEO by exchanging high-quality backlinks. Use our portal to connect with sites and improve rankings.
              </p>
              <div style={{ marginTop: '20px' }}>
                <Link href="/auth?mode=register" className="btn btn-primary" style={{ borderRadius: '4px', padding: '10px 24px', fontWeight: 700 }}>
                  Sign Up
                </Link>
              </div>
            </div>

            <div>
              <h4 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.125rem' }}>Contact</h4>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                info@serpsupport.com
              </p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
              © {new Date().getFullYear()} SERPsupport
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
              <a href="#contact" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem' }}>Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile full-screen menu */}
      {mobileMenuOpen && (
        <div className="landing-mobile-menu" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
            <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)' }} onClick={() => setMobileMenuOpen(false)}>
              <X size={32} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', fontSize: '1.25rem' }}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>How it works</a>
            <a href="#importance" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Importance</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Contact</a>
            
            <div style={{ width: '100%', height: 1, background: 'var(--border-subtle)', margin: '10px 0' }} />
            
            {user ? (
              <Link href="/inbox" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)} style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: '4px', fontWeight: 700 }}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth?mode=login" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
                <Link href="/auth?mode=register" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)} style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: '4px', fontWeight: 700 }}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
