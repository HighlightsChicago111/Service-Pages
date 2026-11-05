import type {StructureResolver} from 'sanity/structure'

// Fixed IDs of the new design's shared documents. The V2 content scripts use the
// same IDs, so the pages they create link to these documents.
export const NEW_DESIGN_SETTINGS_ID = 'v2-siteSettings'
export const NEW_DESIGN_AREA_ID = 'v2-area-chicago'

// The first service ID of the pages written after the original service list (301-372).
const FIRST_NEW_SERVICE_ID = 373

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
      // The id keeps the old address (/structure/servicePage) and editors' bookmarks working.
      S.listItem()
        .id('servicePage')
        .title('Service pages')
        .child(
          S.list()
            .title('Service pages')
            .items([
              S.documentTypeListItem('servicePage').title('Current design'),
              S.listItem()
                .id('newDesign')
                .title('New design')
                .child(
                  S.list()
                    .title('New design')
                    .items([
                      // The id keeps the old address of this list working.
                      S.listItem()
                        .id('v2ServicePage')
                        .title('Pages')
                        .child(
                          S.list()
                            .title('Pages')
                            .items([
                              S.documentTypeListItem('v2ServicePage').id('allPages').title('All pages'),
                              // A view, not a move: these pages also stay in "All pages".
                              S.listItem()
                                .id('newServicePages')
                                .title('New service pages')
                                .child(
                                  S.documentTypeList('v2ServicePage')
                                    .title('New service pages')
                                    .apiVersion('2025-02-19')
                                    .filter('_type == "v2ServicePage" && serviceId >= $first')
                                    .params({first: FIRST_NEW_SERVICE_ID})
                                    .defaultOrdering([{field: 'serviceId', direction: 'asc'}]),
                                ),
                            ]),
                        ),
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
