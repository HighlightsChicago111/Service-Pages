import {dataset, projectId} from '@/sanity/env'

/**
 * Highlights Chicago's own Yelp job photos that an option card or equipment tile may
 * borrow when the page sets no photo of its own (approved for use by Krishna,
 * 2026-10-12; source: the vault's yelp/_index.json). Each is already a Sanity asset:
 * the asset id is the file's SHA-1, so a page that uses the same photo is recognised
 * and the photo never shows twice there. Alt text was written from the photo itself;
 * the credit is the index's credit line, word for word (the uploader when Yelp shows one).
 */
type YelpStandIn = {yelp: string; asset: string; alt: string; credit: string; suits: RegExp; titleOnly?: boolean}

const YELP_PAGE = "Photo from Highlights Chicago's Yelp page"

const YELP: YelpStandIn[] = [
  {yelp: '006', asset: '8323eb071aad9abd9398e33199237136a9a5d61c-1000x750', alt: 'Three gray breaker panels mounted side by side on a plywood board', credit: YELP_PAGE, suits: /panel swap|new panels?\b|replace(ment)? (the |a )?panel|subpanel/i},
  {yelp: '007', asset: 'fc16fd1b6722ddfa0c326e4bf43c91a767bc522d-750x1000', alt: 'Highlights Chicago electrician working at a bank of meter sockets on a brick wall', credit: YELP_PAGE, suits: /utility work|at the service|\bmeters?\b|service entrance|comed/i},
  {yelp: '011', asset: 'd1816b6235b11810ee1d4cc7dd17a6063f962211-750x1000', alt: 'Overhead service drop reaching the service mast on a frame building', credit: YELP_PAGE, suits: /utility (work|pole|lines?|side)|service drop|overhead|\bmast\b|service plus/i},
  {yelp: '012', asset: '9a912ba4020ce0e8752d46937de83cd48d38f389-1000x750', alt: 'Three electric meters on a brick wall, with conduit above', credit: YELP_PAGE, suits: /\bmeters?\b|three-flat|multi-unit|service upgrade/i},
  {yelp: '013', asset: 'ff9bc5b870a6e18a945d20edcd1a0c1c086990f8-1000x750', alt: 'Room with one wall opened to the brick for new wiring', credit: YELP_PAGE, suits: /rewir|open(ed)? wall|in the room/i},
  {yelp: '014', asset: 'ce24727d854cdd1e0093ec3a2880fd25fc5c77bc-750x1000', alt: 'New 240-volt duplex receptacle on a gray wall above the baseboard', credit: YELP_PAGE, suits: /240|receptacle|dedicated outlet/i},
  {yelp: '015', asset: 'a688ec1954a63ea8def3841f36aafcaa2b038f61-1000x750', alt: 'New 200-amp service panel on a basement wall above a laundry sink', credit: YELP_PAGE, suits: /service upgrade|200-amp|new service|bigger service|basement/i},
  {yelp: '016', asset: '7564007abef29b14a0abecc2ee62a810108e4209-750x1000', alt: '50-amp NEMA 14-50 receptacle on a metal box fed by conduit', credit: 'Photo: G. M. on Yelp', suits: /14-50|\bev\b|plug-in|50-amp/i, titleOnly: true},
  {yelp: '018', asset: '0a3d6411bba155bd432b1d3ec7c9a409f869eb12-456x1000', alt: 'Electrician at work in a doorway under open ceiling joists', credit: YELP_PAGE, suits: /rewir|rough-in|open ceiling/i},
  {yelp: '021', asset: '3aee232811c4080928a8465939be7730a5cf509b-1000x750', alt: 'Crew replacing old panels in a basement', credit: YELP_PAGE, suits: /panel swap|replace(ment)? (the |a )?panel|service upgrade|replace the/i},
  {yelp: '022', asset: '5a5916160c351fc5eb853a6f908e7ffd91812c23-750x1000', alt: 'New gray panels mounted on a basement wall', credit: YELP_PAGE, suits: /basement|new panels?\b/i},
  {yelp: '023', asset: '7e9c7bf99b001ce20c9c7512181e6ceca77f9443-1000x647', alt: 'Bedroom with a white ceiling fan above the bed', credit: YELP_PAGE, suits: /\bfans?\b|pull chain|bedroom/i},
  {yelp: '027', asset: 'bf74be2b2d5ac69c541a1c75cc24ba68edfb8564-750x1000', alt: 'Outdoor outlet under a cover beside a wooden deck', credit: YELP_PAGE, suits: /outdoor|deck|weather|in-use cover/i},
  {yelp: '040', asset: '684cad612fd34641cfcfb25977f01cf483235690-750x1000', alt: 'Meter bank with conduit runs on the siding of a multi-unit building', credit: 'Photo: George A. on Yelp', suits: /\bmeters?\b|multi-unit|lines enter/i},
  {yelp: '044', asset: 'fad06394854c2003f8eb97d65c6aa25a9d370706-750x1000', alt: 'GFCI outlets under a clear in-use cover on gray siding', credit: YELP_PAGE, suits: /gfci|reset|easy to see|ground-fault/i},
  {yelp: '051', asset: '8fb5f0f3847d5c96b75191e13e908e53a6822ded-1000x750', alt: 'Outdoor outlet under a weatherproof cover on vinyl siding', credit: YELP_PAGE, suits: /outlet|receptacle|at the equipment|outdoor/i},
  {yelp: '058', asset: 'c53b809171fbc285a49a97380d7b540e32b20a8c-750x1000', alt: 'Two-gang wall plate with a stacked rocker switch and a single rocker', credit: YELP_PAGE, suits: /(wall|light|dimmer|smart) switch|switches|wall control|two-function|dimmer|3-way|companion|smart main/i},
  {yelp: '064', asset: 'ca8e112631d856f69ee6bc872ea499f8c05b3bec-751x1000', alt: 'Utility pole and overhead lines behind a brick building', credit: YELP_PAGE, suits: /utility (work|pole|lines?|side)|\bpole\b|comed|service plus/i},
  {yelp: '065', asset: 'c7091b66e5bd2ee95e3e9eae763154360649112b-1000x750', alt: 'Ceiling fan with a light kit among recessed lights in a finished ceiling', credit: YELP_PAGE, suits: /\bfans?\b|receiver|light kit/i},
  {yelp: '067', asset: '901c637a20efa6d7e6a89fb6ff6ac3e806764e6e-750x1000', alt: 'Dark-bladed ceiling fan with a light kit on a short downrod', credit: YELP_PAGE, suits: /\bfans?\b|downrod|pull chain/i},
  {yelp: '082', asset: 'cb77a2800289335cce9ae8a93816778c94349fef-750x1000', alt: 'Wall of lighting control modules fed by vertical conduit', credit: YELP_PAGE, suits: /lighting controls?|smart|wireless|keypad|scene/i},
  {yelp: '083', asset: '0538b26f2adc9463aa63bfcbb4d1fa9a5529f2d0-750x1000', alt: 'Two electric meters on the brick wall of a two-flat', credit: YELP_PAGE, suits: /\bmeters?\b|two-flat|at the service/i},
  {yelp: '085', asset: '61dd2bd944900f1f9b5a29f12900b924eedfe01a-1000x750', alt: 'Garage interior with new outlets on conduit along the walls', credit: YELP_PAGE, suits: /garage/i},
  {yelp: '087', asset: '6307cac9c0f7ce35768823eab47fe3234704a491-750x1000', alt: 'Overhead service drop wires meeting a frame house', credit: YELP_PAGE, suits: /utility (work|pole|lines?|side)|service drop|overhead|lines enter|cable and phone/i},
  {yelp: '091', asset: '932e9a60ab68cf0193cefa788df85f45b494607f-980x1000', alt: 'White flush-mount ceiling fan with a lit light kit', credit: YELP_PAGE, suits: /\bfans?\b|flush|receiver|light kit/i},
  {yelp: '096', asset: '27351df10f62ad7cd697ea460b1fac303d68197c-750x1000', alt: 'Gray breaker panel set into a cut wall opening', credit: YELP_PAGE, suits: /\bpanel\b|own circuit|dedicated circuit|breaker/i},
  {yelp: '097', asset: 'f5d03f6b48b94af69866f4807131f58983ab1873-750x1000', alt: 'Breaker panel with two rows of branch breakers', credit: YELP_PAGE, suits: /breaker|circuit|dedicated/i},
  {yelp: '103', asset: '4206a31ec9e3de4f72ef112012536e23c20899f4-750x1000', alt: 'Finished breaker panel set into a hallway wall', credit: YELP_PAGE, suits: /panel swap|same rating|new panel|\bpanel\b/i},
  {yelp: '108', asset: 'a090cfbc7152c837efa797025299fb7c77154fa8-750x1000', alt: '240-volt dryer outlet and a washer outlet on conduit in a laundry', credit: YELP_PAGE, suits: /dryer|laundry|washer|dedicated outlets?|240/i},
  {yelp: '110', asset: '5b44a5c59fd259ea055b32774f4d9d1b4152ad05-456x1000', alt: 'Wall opened to the studs, with new boxes and cable', credit: YELP_PAGE, suits: /rewir|rough-in|open(ed)? wall|worst circuits|whole building/i},
  {yelp: '111', asset: 'ede6a8d7bfa94c59164d46bb10c6ace91bb038b6-456x1000', alt: 'Ceiling opened between the joists, with new boxes', credit: YELP_PAGE, suits: /ceiling box|rewir|ceiling/i},
]

export const YELP_STAND_INS = YELP.map(({asset, alt, credit, suits, titleOnly}) => ({
  photo: {src: `https://cdn.sanity.io/images/${projectId}/${dataset}/${asset}.jpg`, alt, credit},
  suits,
  titleOnly,
}))
