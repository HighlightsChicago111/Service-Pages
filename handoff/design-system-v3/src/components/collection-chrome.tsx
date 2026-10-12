/* eslint-disable @next/next/no-img-element */

import {FooterLeadForm} from './footer-lead-form'

const LIVE_SITE = 'https://www.highlightschicago.com'
const HEADER_LOGO = 'https://cdn.prod.website-files.com/69f58d69563c4c5bf9b01c60/6a3c3c20491b43b0858c1876_highlights-chicago-logo.webp'
const FOOTER_LOGO = 'https://cdn.prod.website-files.com/69f58d69563c4c5bf9b01c60/69ffb4d8099654cbee2d7b53_Highlights-Chicago_Logo-white.webp'

const primaryLinks = [
  {label: 'Home', href: `${LIVE_SITE}/`},
  {label: 'About Us', href: `${LIVE_SITE}/about-us`},
  {label: 'Services', href: `${LIVE_SITE}/services`},
  {label: 'Blog', href: `${LIVE_SITE}/blog`},
  {label: 'Learning Center', href: `${LIVE_SITE}/learning-center`},
]

const utilityIcons = {
  location: 'M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 10.2A3.2 3.2 0 1 1 12 5.8a3.2 3.2 0 0 1 0 6.4Z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5v4.45l3.2 1.85-1 1.73L11 12.6V7h2Z',
  email: 'M3 4h18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm9 8.3L20.2 7H3.8l8.2 5.3Zm0 2.4L3 8.9V18h18V8.9l-9 5.8Z',
  phone: 'M6.6 2.7 10 6.1 7.8 9c1.3 2.6 3.5 4.8 6.1 6.1l2.9-2.2 3.4 3.4-2.1 3.4c-.4.7-1.2 1.1-2 1C8.8 19.6 4.4 15.2 3.3 7.9c-.1-.8.3-1.6 1-2l2.3-3.2Z',
} as const

function UtilityIcon({name}: {name: keyof typeof utilityIcons}) {
  return <svg className="collection-utility-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={utilityIcons[name]} /></svg>
}

export function CollectionHeader() {
  return (
    <div className="collection-header-stack">
      <div className="collection-utility" aria-label="Business contact information">
        <div className="collection-utility-inner">
          <a href="https://www.google.com/maps/place/Highlights+Chicago+Electrical+Services/@41.986143,-87.700781,15z/data=!4m5!3m4!1s0x0:0xae9382f0c0f6b3b!8m2!3d41.9861431!4d-87.7007806?hl=en-US&amp;shorturl=1"><UtilityIcon name="location" />5766 N Lincoln Ave, Chicago, IL 60659, United States</a>
          <div className="collection-utility-group">
            <span><UtilityIcon name="clock" />Mon–Fri 08:00 AM – 05:00 PM</span>
            <a href="mailto:info@highlightschicago.com"><UtilityIcon name="email" />info@highlightschicago.com</a>
            <a href="tel:773-262-3333"><UtilityIcon name="phone" />773-262-3333</a>
          </div>
        </div>
      </div>
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
    </div>
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
              <a href="https://www.facebook.com/HighlightsChicago" aria-label="Highlights Chicago on Facebook"><svg className="collection-social-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4.5c-.5-.1-2.2-.2-4.1-.2-4 0-6.7 2.4-6.7 6.9V15H2v4h4.2v10h5.1V19h4.2l.7-4h-4.9v-3.4C11.3 10.4 11.7 8 14 8Z" /></svg></a>
              <a href="https://x.com/wedoit4life" aria-label="Highlights Chicago on X"><svg className="collection-social-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.2 2.3h3.3l-7.2 8.2 8.5 11.2h-6.7l-5.2-6.8-6 6.8H1.6l7.8-8.9L1.2 2.3h6.9l4.7 6.2 5.4-6.2Zm-1.2 17.5h1.8L7.1 4H5.2L17 19.8Z" /></svg></a>
            </div>
          </div>
        </div>
        <aside className="collection-footer-cta">
          <h2 className="collection-footer-title">Request a quick <span>quote</span></h2>
          <p>Tell the Highlights Chicago team what electrical service you need and get help planning the next step.</p>
          <FooterLeadForm />
          <a className="collection-footer-phone" href="tel:773-262-3333">Or call 773-262-3333</a>
        </aside>
      </div>
    </footer>
  )
}
