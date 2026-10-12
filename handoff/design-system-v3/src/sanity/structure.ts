import type {StructureResolver} from 'sanity/structure'

export const SETTINGS_ID = 'v2-siteSettings'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Service Pages (V2 template)')
    .items([
      S.documentTypeListItem('v2ServicePage').title('Service pages (V2)'),
      S.divider(),
      S.documentTypeListItem('v2ServiceArea').title('Service areas'),
      S.listItem().title('Site settings').child(S.document().schemaType('v2SiteSettings').documentId(SETTINGS_ID)),
    ])
