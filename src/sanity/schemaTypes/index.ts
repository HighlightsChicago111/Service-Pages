import {externalImage, faq, guide, linkedService, pricingRow, review, serviceType, subArea, titledBody, trustMetric} from './objects'
import {serviceArea} from './serviceArea'
import {serviceDefinition} from './serviceDefinition'
import {servicePage} from './servicePage'
import {servicePageTemplate} from './servicePageTemplate'
import {siteSettings} from './siteSettings'
import {v2ServiceArea, v2ServicePage, v2SiteSettings} from './v2/documents'
import {objectTypes as v2ObjectTypes} from './v2/objects'

// The current design's types come first and are never edited by the new-design
// rollout. The new design's types all start with "v2", so the two sets never clash.
export const schemaTypes = [
  faq,
  externalImage,
  serviceType,
  titledBody,
  linkedService,
  pricingRow,
  review,
  guide,
  subArea,
  trustMetric,
  siteSettings,
  servicePageTemplate,
  serviceDefinition,
  serviceArea,
  servicePage,
  ...v2ObjectTypes,
  v2SiteSettings,
  v2ServiceArea,
  v2ServicePage,
]
