import {jsonLdHtml, type JsonLdNode} from '@/lib/structured-data'

/** One schema.org @graph as a JSON-LD script tag. */
export function JsonLdScript({graph}: {graph: JsonLdNode[]}) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLdHtml(graph)}} />
}
