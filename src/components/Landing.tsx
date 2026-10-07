'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import s from '@/app/landing.module.css';

const t = {
  navFeatures: 'Features', navHow: 'How it works', navPricing: 'Pricing', navFaq: 'FAQ',
  signIn: 'Sign in', getStarted: 'Get started for free', dashboard: 'Go to dashboard',
  heroH1a: 'Building Links,', heroH1b: 'Made Easy',
  heroSub: 'SERPsupport is the ultimate platform for building connections between websites. Use our chat functionality to discuss the type of backlinks and outlinks. Easily approve or reject connections, ensuring high-quality links.',
  ctaPrimary: 'Create account →', ctaDemo: 'Watch demo',
  trust: ['7 day free trial', "Don't pay for backlinks", 'Set up in under a minute'],
  mockTitle: 'Connection requests', pending: 'pending', reject: 'Reject', approve: 'Approve',
  approved: 'Approved · chat open', rejected: 'Rejected',
  chatWith: 'Chat with', chat1: 'Happy to add a contextual link in our 2026 gear guide.', chat2: 'Perfect. Sending anchor + URL now.',
  demoEyebrow: 'See it in action', demoH2: 'What Makes SERPsupport Different?',
  demoSub: 'SERPsupport offers a new way to build backlinks by connecting you directly with website owners through chat, allowing personalized and flexible link placements.',
  importanceH2: 'The Importance of Backlinks',
  importanceP: 'Backlinks are essential for SEO as they act as endorsements from other websites, signaling to search engines that your site is authoritative and relevant. Backlinks help improve search rankings, increase visibility, and drive more traffic to your website.',
  whyEyebrow: "Why it's different", whyH2: "Link swaps leave footprints. SERPsupport doesn't.",
  whySub: 'You give links to some sites and receive links from others. No direct A↔B trades, so your link profile stays natural.',
  oldTitle: 'Traditional link building', oldTag: 'THE OLD WAY', newTag: 'THE SMART WAY', swap: 'swap',
  howEyebrow: 'How it works', howH2: 'Six steps. Most members place their first link within a week.', howCta: 'Start step 1 →',
  featEyebrow: 'Features', featH2: "Everything you need to build links. Nothing you don't.",
  f1Title: 'Direct chat with site owners', f1Text: 'Negotiate link type, anchor and placement with the person who controls the page. No middlemen.',
  connected: 'CONNECTED', fchat1: 'Guest post or niche edit? We have a budgeting guide that ranks top 5.', fchat2: 'Niche edit works. Anchor: "expense tracking app".', fchat3: 'Done. Live now ✓',
  f2Title: 'Backlink monitoring', f2Text: "Every placement is checked automatically. You'll know the moment a link is removed or changed to nofollow.",
  colSource: 'SOURCE', colType: 'TYPE', colStatus: 'STATUS',
  testEyebrow: 'What members say', testH2: 'Built for people who build links for a living.',
  priceEyebrow: 'Pricing', priceH2: 'One plan. Everything included.', planTag: 'ALL FEATURES',
  monthly: 'Monthly', annual: 'Annual', perMonth: '/ month', trialCta: 'Start 7-day free trial',
  faqH2: 'Questions, answered.', faqSub: 'Still unsure? Email',
  finalH2: 'Your next backlink is one conversation away.', finalSub: 'Add your site today and start receiving connection requests from relevant website owners.', talk: 'Talk to us',
};

const REQUESTS = [
  { initial: 'T', domain: 'travelnotes.io', meta: 'Travel · DR 52 · Guest post' },
  { initial: 'G', domain: 'greenhomeguide.com', meta: 'Home · DR 41 · Niche edit' },
  { initial: 'C', domain: 'codecraft.dev', meta: 'Tech · DR 63 · Guest post' },
];
const OLD = ['Reciprocal links that search engines can spot', 'Cold outreach with low reply rates', 'Placements tracked in spreadsheets', "No say in where or how you're linked"];
const NEW = ['Give and receive across different sites, no direct swaps', 'Talk directly to site owners who want to collaborate', 'Every placement monitored automatically', 'Approve or reject every connection yourself'];
const STEPS = [
  ['Sign up', 'Create your free account in under a minute.'],
  ['Add your website', 'Log in, add your site and tell us your niche.'],
  ['Approve or reject connections', 'Review sites that want to work with you. Accept only the ones that fit.'],
  ['Chat opens on mutual approval', 'When both sides approve, a private chat starts automatically.'],
  ['Agree on the placement', 'Guest post or niche edit, anchor text, target page. Settle it in chat.'],
  ['Monitor your backlinks', 'We check every link and alert you if anything changes.'],
];
const STATUS = {
  live: { label: 'Live', bg: '#ECFDF3', fg: '#15803D' },
  pend: { label: 'Pending', bg: '#FFF7E6', fg: '#A16207' },
  lost: { label: 'Lost', bg: '#FEF2F2', fg: '#B91C1C' },
};
const LINKS: { src: string; type: string; st: keyof typeof STATUS }[] = [
  { src: 'fintechdaily.com/budgeting', type: 'Niche edit', st: 'live' },
  { src: 'travelnotes.io/gear-2026', type: 'Guest post', st: 'live' },
  { src: 'codecraft.dev/tools', type: 'Guest post', st: 'pend' },
  { src: 'homelab.blog/setup', type: 'Niche edit', st: 'lost' },
];
const SMALL = [
  ['✓', 'Full approval control', "Nothing goes live without your yes. Reject any site that doesn't meet your bar."],
  ['↻', 'No reciprocal footprints', 'Links flow across the network, never back and forth between two sites.'],
  ['¶', 'Guest posts & niche edits', 'Pick the placement type that fits your strategy, deal by deal.'],
];
const TESTIMONIALS = [
  { quote: 'We replaced three outreach tools and a spreadsheet. Clients get a live link report instead of a monthly PDF.', name: 'Maya Lindqvist', initials: 'ML', role: 'Founder, Northbound SEO' },
  { quote: 'The approval step is the reason I trust it. I only work with sites I would have picked myself.', name: 'Daniel Okafor', initials: 'DO', role: 'Head of Growth, Ledgerly' },
  { quote: 'Got my first two placements in the first week, both on sites in my niche. No awkward link swaps.', name: 'Priya Raman', initials: 'PR', role: 'Owner, The Plant Desk' },
];
const PLAN = ['1 website', 'Direct chat with site owners', 'Link monitoring + alerts', 'Approve or reject every link'];
const FAQS = [
  ['Is this a link swap scheme?', 'No. You give links to some sites and receive links from different sites. There are no direct A↔B trades, which keeps your link profile natural.'],
  ['Who can I connect with?', 'Website owners worldwide who have added their sites to SERPsupport. You review every request and only approve sites that fit your niche and quality bar.'],
  ['What types of links can I get?', 'Guest posts, niche edits and other placements. You and the other site owner agree on the type, anchor text and target page in chat.'],
  ['How does link monitoring work?', 'Once a placement is live, SERPsupport checks it automatically and alerts you if the link is removed or changed by the other user.'],
  ['Can I cancel anytime?', 'Yes. You can cancel your subscription at any time.'],
];

type ReqState = 'pending' | 'approved' | 'rejected';

export default function Landing({ fontClassName }: { fontClassName: string }) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [annual, setAnnual] = useState(true);
  const [faqOpen, setFaqOpen] = useState(0);
  const [req, setReq] = useState<ReqState[]>(['pending', 'pending', 'pending']);
  const pendingCount = req.filter(r => r === 'pending').length;

  const navLinks = (
    <>
      <a href="#features" onClick={() => setMenuOpen(false)}>{t.navFeatures}</a>
      <a href="#how" onClick={() => setMenuOpen(false)}>{t.navHow}</a>
      <a href="#pricing" onClick={() => setMenuOpen(false)}>{t.navPricing}</a>
      <a href="#faq" onClick={() => setMenuOpen(false)}>{t.navFaq}</a>
    </>
  );
  const authLinks = user ? (
    <Link href="/inbox" className={s.getStarted}>{t.dashboard}</Link>
  ) : (
    <>
      <Link href="/auth?mode=login" className={s.signIn}>{t.signIn}</Link>
      <Link href="/auth?mode=register" className={s.getStarted}>{t.getStarted}</Link>
    </>
  );
  const signupHref = user ? '/inbox' : '/auth?mode=register';

  return (
    <div className={`${s.root} ${fontClassName}`}>
      <header className={s.header}>
        <div className={`${s.wrap} ${s.headerInner}`}>
          <a href="#" className={s.brand}>SERPsupport</a>
          <nav className={s.nav}>{navLinks}</nav>
          <div className={s.headerActions}>{authLinks}</div>
          <button className={s.burger} onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && <div className={s.mobileMenu}>{navLinks}{authLinks}</div>}
      </header>

      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroGrid} />
        <div className={`${s.wrap} ${s.heroInner}`}>
          <div className={s.heroCopy}>
            <h1 className={s.h1}>{t.heroH1a} <span>{t.heroH1b}</span></h1>
            <p className={s.heroSub}>{t.heroSub}</p>
            <div className={s.ctaRow}>
              <Link href={signupHref} className={s.ctaPrimary}>{t.ctaPrimary}</Link>
              <a href="#demo" className={s.ctaGhost}><span className={s.play} />{t.ctaDemo}</a>
            </div>
            <div className={s.trust}>{t.trust.map(x => <span key={x}>✓ {x}</span>)}</div>
          </div>

          <div className={s.mockWrap}>
            <div className={s.mock}>
              <div className={s.mockBar}>
                <span className={s.dot} /><span className={s.dot} /><span className={s.dot} />
                <span className={`${s.mono} ${s.mockUrl}`}>app.serpsupport.com/connections</span>
              </div>
              <div className={s.mockBody}>
                <div className={s.mockHead}>
                  <span className={s.mockTitle}>{t.mockTitle}</span>
                  <span className={`${s.mono} ${s.pill}`}>{pendingCount} {t.pending}</span>
                </div>
                {REQUESTS.map((r, i) => {
                  const st = req[i];
                  const decide = (v: ReqState) => setReq(prev => prev.map((p, j) => (j === i ? v : p)));
                  return (
                    <div key={r.domain} className={s.req}>
                      <span className={s.avatar}>{r.initial}</span>
                      <div className={s.reqText}>
                        <span className={s.reqDomain}>{r.domain}</span>
                        <span className={`${s.mono} ${s.reqMeta}`}>{r.meta}</span>
                      </div>
                      {st === 'pending' ? (
                        <div className={s.reqBtns}>
                          <button className={s.btnReject} onClick={() => decide('rejected')}>{t.reject}</button>
                          <button className={s.btnApprove} onClick={() => decide('approved')}>{t.approve}</button>
                        </div>
                      ) : (
                        <span className={s.badge} style={st === 'approved' ? { background: '#ECFDF3', color: '#15803D' } : { background: '#F3F5F9', color: '#5A6275' }}>
                          {st === 'approved' ? t.approved : t.rejected}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={s.chatFloat}>
              <div className={s.chatWith}><span className={s.online} />{t.chatWith} travelnotes.io</div>
              <div className={s.bubbleIn}>{t.chat1}</div>
              <div className={s.bubbleOut}>{t.chat2}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className={s.demo}>
        <div className={s.demoInner}>
          <span className={s.eyebrow}>{t.demoEyebrow}</span>
          <h2 className={s.h2}>{t.demoH2}</h2>
          <p className={s.lead}>{t.demoSub}</p>
          <div className={s.videoFrame}>
            <iframe
              src="https://www.youtube-nocookie.com/embed/hxRucpw_yXI?rel=0"
              title="SERPsupport demo"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Importance */}
      <section>
        <div className={`${s.wrap} ${s.importance}`}>
          <div className={s.importanceCard}>
            <h2>{t.importanceH2}</h2>
            <p>{t.importanceP}</p>
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why">
        <div className={`${s.wrap} ${s.why}`}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>{t.whyEyebrow}</span>
            <h2 className={s.h2}>{t.whyH2}</h2>
            <p className={s.lead}>{t.whySub}</p>
          </div>
          <div className={s.compare}>
            <div className={`${s.compareCard} ${s.compareOld}`}>
              <div className={s.compareHead}>
                <span style={{ color: '#5A6275' }}>{t.oldTitle}</span>
                <span className={`${s.mono} ${s.compareTag}`} style={{ color: '#8A93A6' }}>{t.oldTag}</span>
              </div>
              <div className={s.diagram}>
                <span className={s.node} style={{ border: '1.5px solid #C7CFDE', background: '#fff', color: '#5A6275' }}>A</span>
                <span className={s.mono} style={{ fontSize: 13, color: '#DC2626' }}>⇄ {t.swap}</span>
                <span className={s.node} style={{ border: '1.5px solid #C7CFDE', background: '#fff', color: '#5A6275' }}>B</span>
              </div>
              <div className={s.compareList} style={{ color: '#4A5266' }}>
                {OLD.map(x => <span key={x}>✕ {x}</span>)}
              </div>
            </div>
            <div className={`${s.compareCard} ${s.compareNew}`}>
              <div className={s.compareHead}>
                <span>SERPsupport</span>
                <span className={`${s.mono} ${s.compareTag}`} style={{ color: '#2F6BFF' }}>{t.newTag}</span>
              </div>
              <div className={s.diagram} style={{ gap: 10 }}>
                <span className={s.node} style={{ background: '#2F6BFF', color: '#fff' }}>A</span>
                <span className={s.mono} style={{ fontSize: 13, color: '#2F6BFF' }}>→</span>
                <span className={s.node} style={{ border: '1.5px solid #2F6BFF', background: '#fff', color: '#2F6BFF' }}>B</span>
                <span className={s.mono} style={{ fontSize: 13, color: '#2F6BFF' }}>→</span>
                <span className={s.node} style={{ border: '1.5px solid #2F6BFF', background: '#fff', color: '#2F6BFF' }}>C</span>
                <span className={s.mono} style={{ fontSize: 13, color: '#2F6BFF' }}>→ A</span>
              </div>
              <div className={s.compareList}>
                {NEW.map(x => <span key={x}><span style={{ color: '#2F6BFF' }}>✓</span> {x}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className={s.how}>
        <div className={`${s.wrap} ${s.howInner}`}>
          <div className={s.howTop}>
            <div className={s.sectionHead}>
              <span className={s.eyebrow}>{t.howEyebrow}</span>
              <h2 className={s.h2}>{t.howH2}</h2>
            </div>
            <Link href={signupHref} className={s.btnLight}>{t.howCta}</Link>
          </div>
          <div className={s.steps}>
            {STEPS.map(([h, p], i) => (
              <div key={h} className={s.step}>
                <span className={s.mono}>0{i + 1}</span>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={s.features}>
        <div className={`${s.wrap} ${s.featuresInner}`}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>{t.featEyebrow}</span>
            <h2 className={s.h2}>{t.featH2}</h2>
          </div>

          <div className={s.bigFeatures}>
            <div className={s.featureCard}>
              <div className={s.featureText}><h3>{t.f1Title}</h3><p>{t.f1Text}</p></div>
              <div className={`${s.panel} ${s.chatPanel}`}>
                <div className={s.chatPanelHead}>
                  <span className={s.avatar}>F</span>
                  <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>fintechdaily.com</span>
                  <span className={`${s.mono} ${s.connected}`}>{t.connected}</span>
                </div>
                <div className={s.bubbleIn}>{t.fchat1}</div>
                <div className={s.bubbleOut}>{t.fchat2}</div>
                <div className={s.bubbleIn}>{t.fchat3}</div>
              </div>
            </div>

            <div className={s.featureCard}>
              <div className={s.featureText}><h3>{t.f2Title}</h3><p>{t.f2Text}</p></div>
              <div className={`${s.panel} ${s.table}`}>
                <div className={`${s.tableRow} ${s.tableHead} ${s.mono}`}>
                  <span>{t.colSource}</span><span>{t.colType}</span><span>{t.colStatus}</span>
                </div>
                {LINKS.map(l => (
                  <div key={l.src} className={s.tableRow}>
                    <span className={s.tableSrc}>{l.src}</span>
                    <span style={{ color: '#5A6275' }}>{l.type}</span>
                    <span className={s.status} style={{ background: STATUS[l.st].bg, color: STATUS[l.st].fg }}>{STATUS[l.st].label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={s.smallFeatures}>
            {SMALL.map(([icon, h, p]) => (
              <div key={h} className={s.smallFeature}>
                <span className={s.icon}>{icon}</span>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={s.testimonials}>
        <div className={`${s.wrap} ${s.sectionPad}`}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>{t.testEyebrow}</span>
            <h2 className={s.h2}>{t.testH2}</h2>
          </div>
          <div className={s.quotes}>
            {TESTIMONIALS.map(q => (
              <figure key={q.name} className={s.quote}>
                <blockquote>“{q.quote}”</blockquote>
                <figcaption>
                  <span className={s.quoteAvatar}>{q.initials}</span>
                  <span className={s.quoteWho}><span>{q.name}</span><span>{q.role}</span></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={s.pricing}>
        <div className={`${s.wrap} ${s.pricingInner}`}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>{t.priceEyebrow}</span>
            <h2 className={s.h2}>{t.priceH2}</h2>
          </div>
          <div className={s.toggle}>
            <button className={!annual ? s.toggleOn : ''} onClick={() => setAnnual(false)}>{t.monthly}</button>
            <button className={annual ? s.toggleOn : ''} onClick={() => setAnnual(true)}>{t.annual} <span className={s.save}>−20%</span></button>
          </div>
          <div className={s.plan}>
            <div className={s.planHead}><span>SERPsupport</span><span className={`${s.mono} ${s.planTag}`}>{t.planTag}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className={s.priceRow}><span className={s.price}>{annual ? '$19' : '$24'}</span><span className={s.perMonth}>{t.perMonth}</span></div>
              <span className={s.billed}>{annual ? 'Billed yearly at $228 (save $60)' : 'Billed monthly. Cancel anytime.'}</span>
            </div>
            <Link href={signupHref} className={s.planCta}>{t.trialCta}</Link>
            <div className={s.planList}>{PLAN.map(x => <span key={x}>✓ {x}</span>)}</div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={s.faq}>
        <div className={`${s.wrap} ${s.faqInner}`}>
          <div className={s.sectionHead}>
            <span className={s.eyebrow}>FAQ</span>
            <h2 className={s.h2}>{t.faqH2}</h2>
            <p>{t.faqSub} <a href="mailto:info@serpsupport.com">info@serpsupport.com</a></p>
          </div>
          <div className={s.faqList}>
            {FAQS.map(([q, a], i) => {
              const open = faqOpen === i;
              return (
                <div key={q} className={s.faqItem}>
                  <button className={s.faqQ} onClick={() => setFaqOpen(open ? -1 : i)} aria-expanded={open}>
                    {q}
                    <span className={s.faqPlus} style={{ transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
                  </button>
                  {open && <p className={s.faqA}>{a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="contact" className={s.final}>
        <div className={s.finalGlow} />
        <div className={s.finalInner}>
          <h2>{t.finalH2}</h2>
          <p>{t.finalSub}</p>
          <div className={s.finalBtns}>
            <Link href={signupHref} className={s.btnLight}>{t.ctaPrimary}</Link>
            <a href="mailto:info@serpsupport.com" className={s.btnOutline}>{t.talk}</a>
          </div>
        </div>
      </section>

      <footer className={s.footer}>
        <div className={`${s.wrap} ${s.footerInner}`}>
          <span className={s.brand}>SERPsupport</span>
          <nav className={s.footerNav}>
            <a href="#features">{t.navFeatures}</a>
            <a href="#pricing">{t.navPricing}</a>
            <a href="#faq">{t.navFaq}</a>
            <a href="mailto:info@serpsupport.com">info@serpsupport.com</a>
          </nav>
          <span>© {new Date().getFullYear()} SERPsupport</span>
        </div>
      </footer>
    </div>
  );
}
