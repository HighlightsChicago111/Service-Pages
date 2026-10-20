/* eslint-disable @next/next/no-img-element */

import {FooterLeadForm} from './footer-lead-form'
import {Icon, XLogo} from './hc-icons'
import {MobileMenu} from './mobile-menu'
import {LEGAL_LINKS} from '@/lib/legal-links'
import {SERVICES_PATH} from '@/lib/service-urls'

const LIVE_SITE = 'https://www.highlightschicago.com'
const HEADER_LOGO = 'https://cdn.prod.website-files.com/69f58d69563c4c5bf9b01c60/6a3c3c20491b43b0858c1876_highlights-chicago-logo.webp'
const FOOTER_LOGO = 'https://cdn.prod.website-files.com/69f58d69563c4c5bf9b01c60/69ffb4d8099654cbee2d7b53_Highlights-Chicago_Logo-white.webp'
const MAPS_URL = 'https://www.google.com/maps/place/Highlights+Chicago+Electrical+Services/@41.986143,-87.700781,15z/data=!4m5!3m4!1s0x0:0xae9382f0c0f6b3b!8m2!3d41.9861431!4d-87.7007806?hl=en-US&shorturl=1'
// Google AI Mode (udm=50) with the question already asked; the address pins the business.
const AI_SUMMARY_URL = `https://www.google.com/search?udm=50&q=${encodeURIComponent('Tell me about Highlights Chicago, the electrical contractor at 5766 N Lincoln Ave, Chicago: its services, service areas, reviews and how to book')}`

// Services is a plain link to the /services collection page, with no dropdown.
const primaryLinks: Array<{label: string; href: string; services?: boolean}> = [
  {label: 'Home', href: `${LIVE_SITE}/`},
  {label: 'About Us', href: `${LIVE_SITE}/about-us`},
  {label: 'Services', href: SERVICES_PATH, services: true},
  {label: 'Service Areas', href: `${LIVE_SITE}/service-areas`},
  {label: 'Blog', href: `${LIVE_SITE}/blog`},
  {label: 'Learning Center', href: `${LIVE_SITE}/learning-center`},
]

function NavLink({link}: {link: (typeof primaryLinks)[number]}) {
  return <a href={link.href} aria-current={link.services ? 'page' : undefined}>{link.label}</a>
}

/** Utility bar and main navigation (design system SP-00 and SP-01). */
export function CollectionHeader() {
  return (
    <div className="hc hc-header-stack">
      <div className="hc-utility" aria-label="Business contact information">
        <div className="hc-wrap hc-utility-inner">
          <div className="hc-utility-group">
            <a href={MAPS_URL}><Icon name="pin" size={16} />5766 N Lincoln Ave, Chicago, IL 60659, United States</a>
            <span className="hc-utility-divider" aria-hidden="true" />
            <span><Icon name="clock" size={16} />Mon–Fri 08:00 AM – 05:00 PM</span>
          </div>
          <div className="hc-utility-group">
            <a href="mailto:info@highlightschicago.com"><Icon name="mail" size={16} />info@highlightschicago.com</a>
            <span className="hc-utility-divider" aria-hidden="true" />
            <a className="hc-utility-phone" href="tel:773-262-3333"><Icon name="phone" size={16} />773-262-3333</a>
          </div>
        </div>
      </div>
      <header className="hc-nav">
        <div className="hc-wrap hc-nav-inner">
          <a className="hc-nav-logo" href={`${LIVE_SITE}/`} aria-label="Highlights Chicago home">
            <img src={HEADER_LOGO} alt="Highlights Chicago" />
          </a>
          <nav className="hc-nav-links" aria-label="Primary navigation">
            {primaryLinks.map((link) => <NavLink link={link} key={link.label} />)}
          </nav>
          <div className="hc-nav-actions">
            <a className="hc-nav-phone" href="tel:773-262-3333"><Icon name="phone" />(773) 262-3333</a>
            <a className="hc-nav-cta" href={`${LIVE_SITE}/contact-us`}>Contact us</a>
            <MobileMenu className="hc-nav-menu">
              {primaryLinks.map((link) => <NavLink link={link} key={link.label} />)}
              <a href="tel:773-262-3333">Call (773) 262-3333</a>
              <a href={`${LIVE_SITE}/contact-us`}>Contact us</a>
            </MobileMenu>
          </div>
        </div>
      </header>
    </div>
  )
}

/** Site footer with the quick quote form (design system SP-21). */
export function CollectionFooter() {
  return (
    <footer className="hc hc-footer">
      <div className="hc-wrap">
        <div className="hc-footer-grid">
          <div className="hc-footer-main">
            <div className="hc-footer-brand">
              <a href={`${LIVE_SITE}/`} aria-label="Highlights Chicago home"><img src={FOOTER_LOGO} alt="Highlights Chicago" /></a>
              <p>Highlights Chicago is a full-service, family-owned electrical company that has served the Chicagoland area for over 12 years. From the beginning, the team has focused on high-quality workmanship and superior customer service.</p>
              <a className="hc-footer-ai" href={AI_SUMMARY_URL} rel="nofollow">
                <span className="hc-footer-ai-icon"><Icon name="sparkle" size={16} /></span>
                <b>Learn about Highlights Chicago with AI</b>
                <Icon name="arrow" />
              </a>
            </div>
            <div className="hc-footer-rule" />
            <div className="hc-footer-links">
              <nav aria-label="Company links">
                <h2>Company</h2>
                <a href={`${LIVE_SITE}/about-us`}>About Us</a>
                <a href={SERVICES_PATH}>Our Services</a>
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
                <a className="hc-footer-contact" href={MAPS_URL}>
                  <span className="hc-footer-ai-icon"><Icon name="pin" size={16} /></span>
                  <span><small>Address:</small>5766 N. Lincoln Avenue<br />Chicago, IL 60659</span>
                </a>
                <a className="hc-footer-contact" href="tel:773-262-3333">
                  <span className="hc-footer-ai-icon"><Icon name="phone" size={16} /></span>
                  <span><small>Phone:</small>773-262-3333</span>
                </a>
                <a className="hc-footer-contact" href="mailto:info@highlightschicago.com">
                  <span className="hc-footer-ai-icon"><Icon name="mail" size={16} /></span>
                  <span><small>Email:</small>info@highlightschicago.com</span>
                </a>
              </address>
            </div>
          </div>
          <aside className="hc-footer-card">
            <h2 className="hc-footer-title">Request a quick <span>quote</span></h2>
            <p>Tell the Highlights Chicago team what electrical service you need and get help planning the next step.</p>
            <FooterLeadForm />
          </aside>
        </div>
        <div className="hc-footer-bottom">
          <div className="hc-footer-copy">
            <span>Copyright © {new Date().getFullYear()} Highlights Chicago</span>
            <nav className="hc-footer-legal" aria-label="Legal">
              {LEGAL_LINKS.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}
            </nav>
          </div>
          <div className="hc-footer-socials">
            <a href="https://www.facebook.com/HighlightsChicago" aria-label="Highlights Chicago on Facebook"><Icon name="facebook" size={16} /></a>
            <a href="https://x.com/wedoit4life" aria-label="Highlights Chicago on X"><XLogo /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}
