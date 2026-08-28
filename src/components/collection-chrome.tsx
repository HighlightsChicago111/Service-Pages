/* eslint-disable @next/next/no-img-element */

import {FooterLeadForm} from './footer-lead-form'

const LIVE_SITE = 'https://www.highlightschicago.com'
const HEADER_LOGO = 'https://cdn.prod.website-files.com/69f58d69563c4c5bf9b01c60/6a3c3c20491b43b0858c1876_highlights-chicago-logo-p-500.webp'
const FOOTER_LOGO = 'https://cdn.prod.website-files.com/69f58d69563c4c5bf9b01c60/69ffb4d8099654cbee2d7b53_Highlights-Chicago_Logo-white.webp'

const primaryLinks = [
  {label: 'Home', href: `${LIVE_SITE}/`},
  {label: 'About Us', href: `${LIVE_SITE}/about-us`},
  {label: 'Services', href: `${LIVE_SITE}/services`},
  {label: 'Blog', href: `${LIVE_SITE}/blog`},
  {label: 'Learning Center', href: `${LIVE_SITE}/learning-center`},
]

export function CollectionHeader() {
  return (
    <header className="collection-header">
      <div className="collection-nav-shell">
        <a className="collection-logo" href={`${LIVE_SITE}/`} aria-label="Highlights Chicago home">
          <img src={HEADER_LOGO} alt="Highlights Chicago" />
        </a>
        <nav className="collection-desktop-nav" aria-label="Primary navigation">
          {primaryLinks.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}
        </nav>
        <a className="collection-contact-button" href={`${LIVE_SITE}/contact-us`}>Contact us</a>
        <details className="collection-mobile-menu">
          <summary aria-label="Open navigation menu"><span /><span /><span /></summary>
          <nav aria-label="Mobile navigation">
            {primaryLinks.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}
            <a href={`${LIVE_SITE}/contact-us`}>Contact us</a>
          </nav>
        </details>
      </div>
    </header>
  )
}

export function CollectionFooter() {
  return (
    <footer className="collection-footer">
      <div className="collection-footer-grid">
        <div className="collection-footer-main">
          <a className="collection-footer-logo" href={`${LIVE_SITE}/`} aria-label="Highlights Chicago home">
            <img src={FOOTER_LOGO} alt="Highlights Chicago" />
          </a>
          <p className="collection-footer-intro">Highlights Chicago is a full-service, family-owned electrical company that has served the Chicagoland area for over 12 years. From the beginning, the team has focused on high-quality workmanship and superior customer service.</p>
          <a className="collection-ai-link" href={`${LIVE_SITE}/`}>Learn about Highlights Chicago with AI <span aria-hidden="true">→</span></a>
          <div className="collection-footer-rule" />
          <div className="collection-footer-links">
            <nav aria-label="Company links">
              <h2>Company</h2>
              <a href={`${LIVE_SITE}/about-us`}>About Us</a>
              <a href={`${LIVE_SITE}/services`}>Our Services</a>
              <a href={`${LIVE_SITE}/learning-center`}>Learning Center</a>
              <a href={`${LIVE_SITE}/contact-us`}>Contact Us</a>
            </nav>
            <nav aria-label="About links">
              <h2>About Us</h2>
              <a href={`${LIVE_SITE}/our-team`}>Our Team</a>
              <a href={`${LIVE_SITE}/testimonials`}>Testimonials</a>
              <a href={`${LIVE_SITE}/faq`}>FAQ</a>
            </nav>
            <address>
              <h2>Contact</h2>
              <a href="https://www.google.com/maps/place/Highlights+Chicago+Electrical+Services/@41.986143,-87.700781,15z/data=!4m5!3m4!1s0x0:0xae9382f0c0f6b3b!8m2!3d41.9861431!4d-87.7007806?hl=en-US&amp;shorturl=1">Address: 5766 N. Lincoln Avenue<br />Chicago, IL 60659</a>
              <a href="tel:773-262-3333">Phone: 773-262-3333</a>
              <a href="mailto:info@highlightschicago.com">Email: info@highlightschicago.com</a>
            </address>
          </div>
          <div className="collection-footer-bottom">
            <span>Copyright © {new Date().getFullYear()} Highlights Chicago</span>
            <div className="collection-socials">
              <a href="https://www.facebook.com/HighlightsChicago" aria-label="Highlights Chicago on Facebook">f</a>
              <a href="https://x.com/wedoit4life" aria-label="Highlights Chicago on X">X</a>
            </div>
          </div>
        </div>
        <aside className="collection-footer-cta">
          <p className="collection-footer-kicker">Request a quick</p>
          <h2>Quote</h2>
          <p>Tell the Highlights Chicago team what electrical service you need and get help planning the next step.</p>
          <FooterLeadForm />
          <a className="collection-footer-phone" href="tel:773-262-3333">Or call 773-262-3333</a>
        </aside>
      </div>
    </footer>
  )
}
