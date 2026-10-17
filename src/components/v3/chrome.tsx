/* eslint-disable @next/next/no-img-element -- Small logo files from /public. */
import {Icon} from './icon'
import {IconBadge} from './atoms'
import {FooterQuoteForm} from './footer-quote-form'
import {MobileMenu} from '@/components/mobile-menu'
import {LOGO, LOGO_WHITE} from '@/lib/v3/visuals'
import {PUBLIC_SITE_ORIGIN, SERVICES_PATH} from '@/lib/service-urls'
import type {V2Settings} from '@/types/v2'

const SHOP_MAPS_URL = 'https://www.google.com/maps/place/Highlights+Chicago+Electrical+Services/@41.986143,-87.700781,15z'
const HOURS = 'Mon–Fri 08:00 AM – 05:00 PM'

const NAV = [
  {label: 'Home', href: `${PUBLIC_SITE_ORIGIN}/`},
  {label: 'About us', href: `${PUBLIC_SITE_ORIGIN}/about-us`},
  {label: 'Services', href: SERVICES_PATH, current: true},
  {label: 'Service Areas', href: `${PUBLIC_SITE_ORIGIN}/service-areas`},
  {label: 'Reviews', href: `${PUBLIC_SITE_ORIGIN}/reviews`},
  {label: 'Blog', href: `${PUBLIC_SITE_ORIGIN}/blog`},
  {label: 'Learning Center', href: `${PUBLIC_SITE_ORIGIN}/learning-center`},
]

function addressLine(settings: V2Settings) {
  const address = settings.address
  return address ? `${address.street}, ${address.city}, ${address.state} ${address.zip}` : ''
}

/** D0 + D1: navy utility bar and the white main nav (global blocks). */
export function SiteHeader({settings, tel}: {settings: V2Settings; tel: string}) {
  return (
    <>
      <div className="ds-utility" aria-label="Business contact information">
        <div className="ds-wrap ds-utility-inner">
          <a href={SHOP_MAPS_URL}><Icon name="mapPin" size={16} />{addressLine(settings)}, United States</a>
          <span className="ds-utility-sep" aria-hidden="true" />
          <span><Icon name="clock" size={16} />{HOURS}</span>
          <span className="ds-utility-spacer" />
          {settings.email && <a href={`mailto:${settings.email}`}><Icon name="mail" size={16} />{settings.email}</a>}
          <span className="ds-utility-sep" aria-hidden="true" />
          <a className="ds-utility-phone" href={tel}><Icon name="phone" size={16} />{settings.phoneDisplay}</a>
        </div>
      </div>
      <header className="ds-nav">
        <div className="ds-wrap ds-nav-inner">
          <a className="ds-nav-logo" href={`${PUBLIC_SITE_ORIGIN}/`} aria-label={`${settings.companyName} home`}><img src={LOGO} alt="Highlights Chicago Electrical Services" width={180} height={44} /></a>
          <nav className="ds-nav-links" aria-label="Primary navigation">
            {NAV.map((item) => item.current
              ? <a className="ds-nav-current" href={SERVICES_PATH} key={item.label}>{item.label}</a>
              : <a href={item.href} key={item.label}>{item.label}</a>)}
          </nav>
          <a className="ds-btn ds-btn--primary ds-btn--m ds-nav-cta" href={`${PUBLIC_SITE_ORIGIN}/contact-us`}><span>Book Now</span></a>
          <a className="ds-nav-call" href={tel} aria-label={`Call ${settings.phoneDisplay}`}><Icon name="phone" size={20} /></a>
          <MobileMenu className="ds-nav-mobile">
            {NAV.map((item) => <a href={item.href} key={item.label} aria-current={item.current ? 'page' : undefined}>{item.label}</a>)}
            <a className="ds-btn ds-btn--primary ds-btn--block" href={`${PUBLIC_SITE_ORIGIN}/contact-us`}><span>Book Now</span></a>
          </MobileMenu>
        </div>
      </header>
    </>
  )
}

/** Global footer: navy, link columns, contact, glass quote card. */
export function SiteFooter({settings, tel}: {settings: V2Settings; tel: string}) {
  const address = settings.address
  return (
    <footer className="ds-footer">
      <div className="ds-wrap ds-footer-grid">
        <div className="ds-footer-main">
          <a className="ds-footer-logo" href={`${PUBLIC_SITE_ORIGIN}/`} aria-label={`${settings.companyName} home`}><img src={LOGO_WHITE} alt="Highlights Chicago Electrical Services" width={170} height={50} /></a>
          <p className="ds-footer-blurb">Highlights Chicago is a full-service, family-owned electrical company that has served the Chicagoland area for over 12 years. From the beginning, the team has focused on high-quality workmanship and superior customer service.</p>
          <a className="ds-footer-ai" href={`${PUBLIC_SITE_ORIGIN}/`}><IconBadge icon="sparkles" tone="navy" size={32} /><span>Learn about Highlights Chicago with AI</span><Icon name="arrowRight" size={16} /></a>
          <div className="ds-footer-cols">
            <nav aria-label="Company">
              <h2>Company</h2>
              <a href={`${PUBLIC_SITE_ORIGIN}/about-us`}>About Us</a>
              <a href={`${PUBLIC_SITE_ORIGIN}/services`}>Our Services</a>
              <a href={`${PUBLIC_SITE_ORIGIN}/learning-center`}>Learning Center</a>
              <a href={`${PUBLIC_SITE_ORIGIN}/contact-us`}>Contact Us</a>
            </nav>
            <nav aria-label="About us">
              <h2>About us</h2>
              <a href={`${PUBLIC_SITE_ORIGIN}/our-team`}>Our Team</a>
              <a href={`${PUBLIC_SITE_ORIGIN}/testimonials`}>Testimonials</a>
              <a href={`${PUBLIC_SITE_ORIGIN}/faq`}>FAQ</a>
            </nav>
            <address>
              <h2>Contact</h2>
              <a href={SHOP_MAPS_URL}><IconBadge icon="mapPin" tone="navy" size={32} /><span><b>Address:</b>{address?.street}<br />{address?.city}, {address?.state} {address?.zip}</span></a>
              <a href={tel}><IconBadge icon="phone" tone="navy" size={32} /><span><b>Phone:</b>{settings.phoneDisplay}</span></a>
              {settings.email && <a href={`mailto:${settings.email}`}><IconBadge icon="mail" tone="navy" size={32} /><span><b>Email:</b>{settings.email}</span></a>}
            </address>
          </div>
        </div>
        <aside className="ds-footer-card" aria-labelledby="footer-quote-title">
          <h2 id="footer-quote-title">Request a quick <span>quote</span></h2>
          <p>Tell the Highlights Chicago team what electrical service you need and get help planning the next step.</p>
          <FooterQuoteForm phone={settings.phoneDisplay || ''} tel={tel} />
        </aside>
      </div>
      <div className="ds-wrap ds-footer-bottom">
        <span>Copyright © {new Date().getFullYear()} Highlights Chicago</span>
        <div className="ds-socials">
          <a href="https://www.facebook.com/HighlightsChicago" aria-label="Highlights Chicago on Facebook"><Icon name="facebook" size={18} /></a>
          <a href="https://x.com/wedoit4life" aria-label="Highlights Chicago on X"><Icon name="x" size={16} /></a>
        </div>
      </div>
    </footer>
  )
}
