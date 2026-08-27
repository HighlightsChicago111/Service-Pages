import type {StructureResolver} from 'sanity/structure'

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
      S.documentTypeListItem('servicePage').title('Service pages'),
    ])
