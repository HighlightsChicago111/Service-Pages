import assert from 'node:assert/strict'
import {prepareCollectionItems, type CollectionItem} from '../src/lib/collection-items'

const changedData: CollectionItem[] = [
  {
    _id: 'known-service',
    title: 'Changed generator title',
    serviceSlug: 'generator-installation',
    areaSlug: 'chicago',
    serviceName: null,
    areaName: null,
    monthlySearchVolume: Number.NaN,
    metaDescription: '  Updated Sanity description  ',
    cardImage: 'https://example.com/replaced-sanity-image.jpg',
    cardImageAlt: 'Sanity generator image alt that should not describe the local cover',
  },
  {
    _id: 'future-service',
    title: 'Future electrical service',
    serviceSlug: 'future-electrical-service',
    areaSlug: 'evanston',
    serviceName: '',
    areaName: 'Evanston',
    monthlySearchVolume: 125,
    cardImage: 'https://cdn.example.com/future-cover.webp',
    cardImageAlt: 'Electrician inspecting a future electrical service installation in Evanston',
    cardImageCaption: 'Future electrical service in Evanston',
  },
  {
    _id: 'future-service-without-image',
    title: null,
    serviceSlug: 'future-service-without-image',
    areaSlug: 'chicago',
    cardImage: null,
  },
  {
    _id: 'missing-route-data',
    title: 'Incomplete draft',
    serviceSlug: null,
    areaSlug: 'chicago',
  },
]

const prepared = prepareCollectionItems(changedData)

assert.equal(prepared.length, 3, 'Incomplete route records should be omitted without crashing')
assert.equal(prepared[0].serviceName, 'Changed generator title', 'Title should backfill a missing service name')
assert.equal(prepared[0].areaName, 'Chicago', 'Missing area names should receive a safe display fallback')
assert.equal(prepared[0].monthlySearchVolume, undefined, 'Invalid search volume should be removed')
assert.equal(prepared[0].metaDescription, 'Updated Sanity description', 'Changed text should be normalized')
assert.equal(prepared[0].cardImage, '/services/images/services/generator-installation.jpg', 'Known services should keep their stable local image')
assert.equal(prepared[0].cardImageAlt, 'Changed generator title in Chicago', 'Local covers should receive contextual alt text that matches the displayed image')
assert.equal(prepared[1].serviceName, 'Future electrical service', 'Future services should render from their title')
assert.equal(prepared[1].cardImage, 'https://cdn.example.com/future-cover.webp', 'Future services should accept a changed Sanity image')
assert.equal(prepared[1].cardImageAlt, 'Electrician inspecting a future electrical service installation in Evanston', 'Sanity alt text should be retained for future service covers')
assert.equal(prepared[1].cardImageCaption, 'Future electrical service in Evanston', 'Sanity image captions should be retained')
assert.equal(prepared[2].serviceName, 'Electrical service', 'Missing labels should receive a safe fallback')
assert.equal(prepared[2].cardImage, undefined, 'Missing images should use the visual placeholder')
assert.equal(prepared[2].cardImageAlt, 'Electrical service in Chicago', 'Missing image metadata should receive a safe contextual fallback')

console.log('Collection resilience test passed: changed images, optional sub-data, and incomplete routes are handled safely.')
