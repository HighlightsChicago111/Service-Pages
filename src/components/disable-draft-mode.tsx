'use client'

import {useIsPresentationTool} from 'next-sanity/hooks'

export function DisableDraftMode() {
  const isPresentationTool = useIsPresentationTool()
  if (isPresentationTool) return null
  return <a className="disable-draft" href="/api/draft-mode/disable">Disable draft mode</a>
}
