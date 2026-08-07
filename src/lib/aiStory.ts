import { Trip } from '@/types/trip'
import { Entry } from '@/types/entry'

/**
 * MOCK IMPLEMENTATION — this does not call any AI model right now.
 *
 * It builds a templated narrative from the trip's own data (locations,
 * captions, member names, entry count) so the feature is fully usable and
 * demoable today, without needing a backend or an API key wired up yet.
 *
 * TO SWAP IN A REAL MODEL LATER:
 * Do NOT call an LLM API directly from this frontend file — that would mean
 * shipping a secret API key to every browser. Instead:
 *   1. Stand up a small backend endpoint (e.g. a Cloud Function) that accepts
 *      { tripTitle, location, dayCount, memberNames, entrySummaries } and
 *      holds the actual API key server-side.
 *   2. That endpoint calls the model (e.g. Anthropic's /v1/messages) with a
 *      prompt built from that data and returns { story: string }.
 *   3. Replace the body of `generateTripStory` below with a `fetch()` to
 *      that endpoint, keeping the same function signature so no caller needs
 *      to change.
 */
export async function generateTripStory(trip: Trip, entries: Entry[]): Promise<string> {
  // Simulated latency so the loading state in the UI is exercised realistically.
  await new Promise((resolve) => setTimeout(resolve, 1100))

  const photoEntries = entries.filter((e) => e.type === 'photo')
  const voiceEntries = entries.filter((e) => e.type === 'voice')
  const memberNames = Object.values(trip.members).map((m) => m.name)
  const namedLocations = Array.from(
    new Set(entries.map((e) => e.locationName).filter((loc): loc is string => Boolean(loc))),
  )
  const captions = entries.map((e) => e.caption).filter((c) => c && c.trim().length > 0)

  const openers = [
    `Somewhere between departure and the first photo, ${trip.title} stopped being a plan on a calendar and became a trip.`,
    `${trip.title} started the way most good ones do — with a group chat, a countdown, and no idea what would actually happen.`,
    `By the time the first entry landed, ${trip.title} was already writing itself.`,
  ]
  const opener = openers[Math.abs(hashString(trip.id)) % openers.length]

  const crewLine =
    memberNames.length > 1
      ? `${memberNames.slice(0, -1).join(', ')} and ${memberNames[memberNames.length - 1]} made up the crew.`
      : memberNames.length === 1
        ? `${memberNames[0]} documented it solo.`
        : ''

  const placeLine =
    namedLocations.length > 0
      ? `The trail of photos moved through ${namedLocations.slice(0, 4).join(', ')}${
          namedLocations.length > 4 ? ', and a few other spots along the way' : ''
        }.`
      : `${trip.location} was home base for the whole trip.`

  const mediaLine = [
    photoEntries.length > 0 ? `${photoEntries.length} photo${photoEntries.length === 1 ? '' : 's'}` : null,
    voiceEntries.length > 0 ? `${voiceEntries.length} voice note${voiceEntries.length === 1 ? '' : 's'}` : null,
  ]
    .filter(Boolean)
    .join(' and ')
  const mediaSentence = mediaLine ? `It added up to ${mediaLine} by the end.` : ''

  const captionLine =
    captions.length > 0
      ? `One moment summed it up: "${captions[0]}"`
      : ''

  const closers = [
    `Not a bad way to spend ${trip.startDate === trip.endDate ? 'a day' : 'a few days'}.`,
    `Worth doing again, honestly.`,
    `The photos will fade a little, but this one's staying in the group chat forever.`,
  ]
  const closer = closers[Math.abs(hashString(trip.id + 'closer')) % closers.length]

  return [opener, crewLine, placeLine, mediaSentence, captionLine, closer].filter(Boolean).join(' ')
}

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return hash
}