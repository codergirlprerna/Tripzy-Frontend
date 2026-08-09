import { useState } from 'react'
import { Trip, TripRole } from '@/types/trip'
import { setMemberRole, removeMember } from '@/lib/trips'
import { useAuth } from '@/context/AuthContext'
import Spinner from '@/components/Spinner'

type Props = {
  trip: Trip
  onClose: () => void
}

const ROLE_LABELS: Record<TripRole, string> = {
  owner: 'Owner',
  editor: 'Editor',
  viewer: 'Viewer',
}

export default function MembersModal({ trip, onClose }: Props) {
  const { currentUser } = useAuth()
  const [busyUid, setBusyUid] = useState<string | null>(null)
  const myRole = currentUser ? trip.members[currentUser.uid]?.role : undefined
  const isOwner = myRole === 'owner'

  async function handleRoleChange(uid: string, role: TripRole) {
    setBusyUid(uid)
    await setMemberRole(trip.id, uid, role)
    setBusyUid(null)
  }

  async function handleRemove(uid: string) {
    setBusyUid(uid)
    await removeMember(trip.id, uid)
    setBusyUid(null)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-4 py-8">
      <div className="sticker-card max-h-[80vh] w-full max-w-[420px] overflow-y-auto p-7 shadow-hard">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-[20px] font-extrabold">Trip members</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-ink text-[16px] font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {trip.memberIds.map((uid) => {
            const member = trip.members[uid]
            if (!member) return null
            const isSelf = uid === currentUser?.uid

            return (
              <div key={uid} className="flex items-center justify-between gap-2 border-b border-ink/10 pb-3">
                <div>
                  <div className="text-[14px] font-bold">
                    {member.name} {isSelf && <span className="text-[11px] font-medium text-[#a39fb0]">(you)</span>}
                  </div>
                </div>

                {isOwner && member.role !== 'owner' ? (
                  <div className="flex items-center gap-2">
                    {busyUid === uid && <Spinner />}
                    <select
                      value={member.role}
                      disabled={busyUid === uid}
                      onChange={(e) => handleRoleChange(uid, e.target.value as TripRole)}
                      className="rounded-lg border-2 border-ink px-2 py-1 text-[12px] font-semibold outline-none disabled:opacity-60"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleRemove(uid)}
                      disabled={busyUid === uid}
                      className="text-[11px] font-bold text-[#c9403a] disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className="rounded-full border-2 border-ink bg-paper-dim px-3 py-1 text-[11px] font-bold">
                    {ROLE_LABELS[member.role]}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {!isOwner && (
          <p className="mt-4 text-[12px] font-medium text-[#a39fb0]">
            Only the trip owner can change roles or remove people.
          </p>
        )}
      </div>
    </div>
  )
}