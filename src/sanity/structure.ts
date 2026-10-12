import type {StructureResolver} from 'sanity/structure'

// Fixed IDs of the new design's shared documents. The V2 content scripts use the
// same IDs, so the pages they create link to these documents.
export const NEW_DESIGN_SETTINGS_ID = 'v2-siteSettings'
export const NEW_DESIGN_AREA_ID = 'v2-area-chicago'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Highlights Chicago')
    .items([
      S.listItem()
        .title('Site settings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.listItem()
        .title('Service-page template')
        .child(S.document().schemaType('servicePageTemplate').documentId('servicePageTemplate-standard-v1')),
      S.divider(),
      S.documentTypeListItem('serviceDefinition').title('Service definitions'),
      S.documentTypeListItem('serviceArea').title('Service areas'),
      // A URL shows its published "New design" page when there is one, otherwise its
      // "Current design" page. Publishing or unpublishing a new-design page switches it.
      S.listItem()
        .title('Service pages')
        .child(
          S.list()
            .title('Service pages')
            .items([
              S.documentTypeListItem('servicePage').title('Current design'),
              S.listItem()
                .title('New design')
                .child(
                  S.list()
                    .title('New design')
                    .items([
                      S.documentTypeListItem('v2ServicePage').title('Pages'),
                      S.divider(),
                      S.listItem()
                        .title('New design settings')
                        .child(S.document().schemaType('v2SiteSettings').documentId(NEW_DESIGN_SETTINGS_ID)),
                      S.listItem()
                        .title('New design area: Chicago')
                        .child(S.document().schemaType('v2ServiceArea').documentId(NEW_DESIGN_AREA_ID)),
                    ]),
                ),
            ]),
        ),
    ])
