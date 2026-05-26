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
            <div style={{ width: '100%' }}>
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                controls
                style={{ width: '100%', height: 'auto', display: 'block' }}
                src="https://www.serpsupport.com/wp-content/uploads/2024/09/SERPsupport-September.mp4" 
              />
            </div>
          </div>

        </div>
      </section>

      {/* What Makes Us Different */}
      <section id="features" style={{ background: '#f8fafc', padding: '120px 24px' }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '60px',
          alignItems: 'center'
        }}>
          {/* Left Text Content */}
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ 
              marginBottom: '24px', 
              color: '#121212',
              fontSize: '2.5rem',
              fontWeight: 700,
              fontFamily: 'Poppins, sans-serif',
              lineHeight: 1.3
            }}>
              What Makes SERPsupport Different?
            </h2>
            <p style={{ color: '#334155', fontSize: '1.125rem', marginBottom: '20px', lineHeight: 1.7 }}>
              SERPsupport offers a new way to build backlinks by connecting you directly with website owners through chat, allowing personalized and flexible link placements.
            </p>
            <p style={{ color: '#334155', fontSize: '1.125rem', marginBottom: '40px', lineHeight: 1.7 }}>
              Unlike traditional methods, the portal allows you to give and receive backlinks from different sites, avoiding direct link swaps. You have full control to approve or reject links, ensuring they are high-quality and relevant.
            </p>
            <Link href={user ? "/inbox" : "/auth?mode=register"} className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1.1rem', borderRadius: '6px', fontWeight: 700 }}>
              Sign Up
            </Link>
          </div>

          {/* Right Graphic: The Link Loop */}
          <div style={{ position: 'relative', width: '100%', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            
            {/* Circular Arrows Background SVG */}
            <svg style={{ position: 'absolute', width: '320px', height: '320px', zIndex: 0 }} viewBox="0 0 100 100">
              <defs>
                <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#121212" />
                </marker>
              </defs>
              <path d="M 50,15 A 35,35 0 0,1 85,50" fill="none" stroke="#121212" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
              <path d="M 85,50 A 35,35 0 0,1 50,85" fill="none" stroke="#121212" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
              <path d="M 50,85 A 35,35 0 0,1 15,50" fill="none" stroke="#121212" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
              <path d="M 15,50 A 35,35 0 0,1 50,15" fill="none" stroke="#121212" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
            </svg>

            {/* Browser Mockups Container */}
            <div style={{ position: 'relative', width: '320px', height: '320px', zIndex: 1 }}>
              
              {/* Top Browser (Blue) */}
              <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '80px', background: '#fff', borderRadius: '6px', border: '2px solid #121212', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ height: '20px', background: '#3b82f6', borderBottom: '2px solid #121212', display: 'flex', alignItems: 'center', padding: '0 6px', gap: '4px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>
                </div>
                {/* Diagonal X pattern */}
                <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom right, transparent 48%, #121212 48%, #121212 52%, transparent 52%)' }}/>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to top right, transparent 48%, #121212 48%, #121212 52%, transparent 52%)' }}/>
                </div>
              </div>

              {/* Right Browser (Green) */}
              <div style={{ position: 'absolute', top: '50%', right: '-40px', transform: 'translateY(-50%)', width: '120px', height: '80px', background: '#fff', borderRadius: '6px', border: '2px solid #121212', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ height: '20px', background: '#10b981', borderBottom: '2px solid #121212', display: 'flex', alignItems: 'center', padding: '0 6px', gap: '4px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>
                </div>
                <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom right, transparent 48%, #121212 48%, #121212 52%, transparent 52%)' }}/>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to top right, transparent 48%, #121212 48%, #121212 52%, transparent 52%)' }}/>
                </div>
              </div>

              {/* Bottom Browser (Yellow) */}
              <div style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '80px', background: '#fff', borderRadius: '6px', border: '2px solid #121212', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ height: '20px', background: '#f59e0b', borderBottom: '2px solid #121212', display: 'flex', alignItems: 'center', padding: '0 6px', gap: '4px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>
                </div>
                <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom right, transparent 48%, #121212 48%, #121212 52%, transparent 52%)' }}/>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to top right, transparent 48%, #121212 48%, #121212 52%, transparent 52%)' }}/>
                </div>
              </div>

              {/* Left Browser (Rose) */}
              <div style={{ position: 'absolute', top: '50%', left: '-40px', transform: 'translateY(-50%)', width: '120px', height: '80px', background: '#fff', borderRadius: '6px', border: '2px solid #121212', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ height: '20px', background: '#f43f5e', borderBottom: '2px solid #121212', display: 'flex', alignItems: 'center', padding: '0 6px', gap: '4px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>
                </div>
                <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom right, transparent 48%, #121212 48%, #121212 52%, transparent 52%)' }}/>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to top right, transparent 48%, #121212 48%, #121212 52%, transparent 52%)' }}/>
                </div>
              </div>

            </div>
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
      <section id="how-it-works" style={{ background: '#f4f4f6', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '60px', color: '#121212', fontFamily: 'Poppins, sans-serif' }}>How it works</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
            {[
              { title: 'Sign up to SERPsupport', img: 'https://www.serpsupport.com/wp-content/uploads/2024/10/1-1.jpg' },
              { title: 'Login and add your website', img: 'https://www.serpsupport.com/wp-content/uploads/2024/10/2-1.jpg' },
              { title: 'Approve/Reject website connections', img: 'https://www.serpsupport.com/wp-content/uploads/2024/10/3-1.jpg' },
              { title: 'When both sides approve, chat will start', img: 'https://www.serpsupport.com/wp-content/uploads/2024/10/4-1.jpg' },
              { title: 'Discuss and agree on the link placement', img: 'https://www.serpsupport.com/wp-content/uploads/2024/10/5-1.jpg' },
              { title: 'Monitor your backlinks', img: 'https://www.serpsupport.com/wp-content/uploads/2024/10/6-1.jpg' },
            ].map((step, idx) => (
              <div key={idx} className="how-it-works-card" style={{ 
                background: '#ffffff', 
                borderRadius: '8px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                textAlign: 'center',
                border: '1px solid #e5e5e5',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ width: '100%', aspectRatio: '16/10', overflow: 'hidden', borderBottom: '1px solid #e5e5e5', background: '#eee' }}>
                  <img src={step.img} alt={step.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '24px 20px' }}>
                  <h4 style={{ color: '#121212', fontFamily: 'Poppins, sans-serif', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>{step.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Importance of Backlinks */}
      <section id="importance" style={{ padding: '120px 24px', background: '#ffffff' }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '60px',
          alignItems: 'center'
        }}>
          {/* Left Column: Image with offset shadow border */}
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', padding: '0 20px 20px 0' }}>
            {/* Offset Shadow Border */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              width: '100%',
              height: '100%',
              border: '4px solid #00b899', // using the teal color
              borderRadius: '8px',
              zIndex: 0
            }} />
            <img 
              src="https://www.serpsupport.com/wp-content/uploads/2024/10/SerpSupport1.jpg" 
              alt="The Importance of Backlinks" 
              style={{ 
                width: '100%', 
                height: 'auto', 
                borderRadius: '8px', 
                position: 'relative', 
                zIndex: 1,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
              }} 
            />
          </div>

          {/* Right Column: Content */}
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ 
              marginBottom: '24px', 
              color: '#121212',
              fontSize: '2.5rem',
              fontWeight: 700,
              fontFamily: 'Poppins, sans-serif',
              lineHeight: 1.3
            }}>
              The Importance of Backlinks
            </h2>
            <p style={{ color: '#334155', fontSize: '1.125rem', marginBottom: '20px', lineHeight: 1.7 }}>
              Backlinks are essential for SEO as they act as endorsements from other websites, signaling to search engines that your site is authoritative and relevant. Backlinks help improve search rankings, increase visibility, and drive more traffic to your website.
            </p>
            <p style={{ color: '#334155', fontSize: '1.125rem', marginBottom: '40px', lineHeight: 1.7 }}>
              By receiving backlinks from diverse sites, your content is perceived as valuable, boosting your domain authority and SERP placement. Additionally, backlinks enhance brand awareness by reaching a broader audience through referral traffic.
            </p>
            <Link href={user ? "/inbox" : "/auth?mode=register"} className="btn" style={{ background: '#00b899', color: '#ffffff', padding: '14px 32px', fontSize: '1.1rem', borderRadius: '6px', fontWeight: 700 }}>
              Sign Up
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Matching serpsupport.com */}
      <footer id="contact" style={{ background: '#0b2d56', color: '#ffffff', padding: '80px 24px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', marginBottom: '60px' }}>
            <div>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.5rem', fontWeight: 600, marginBottom: '20px', color: '#ffffff' }}>SERPsupport</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '350px', marginBottom: '24px' }}>
                Boost your SEO by exchanging high-quality backlinks. Use our portal to connect with sites and improve rankings.
              </p>
              <div>
                <Link href="/auth?mode=register" className="btn" style={{ background: '#00b899', color: '#ffffff', padding: '10px 24px', borderRadius: '4px', fontWeight: 700 }}>
                  Sign Up
                </Link>
              </div>
            </div>

            <div>
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px', color: '#ffffff' }}>Contact</h3>
              <a href="mailto:info@serpsupport.com" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: 500, fontSize: '1.1rem' }}>
                info@serpsupport.com
              </a>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '30px' }}>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
              © SERPsupport
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
