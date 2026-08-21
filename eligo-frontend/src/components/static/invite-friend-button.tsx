"use client"

import { toast } from "sonner"

export function InviteFriendButton() {
  return (
    <button
      onClick={() => toast.info("Referral link copied to clipboard! Share it with friends.")}
      className="w-full py-2.5 px-4 rounded-[5px] bg-amber-800 text-white text-sm font-semibold text-center hover:bg-amber-900 transition-colors cursor-pointer"
    >
      Invite a Friend
    </button>
  )
}
