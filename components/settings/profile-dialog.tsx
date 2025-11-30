"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProfileTab } from "./profile-tab"
import { User } from "lucide-react"

interface ProfileDialogProps {
  userEmail: string
  displayName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onDisplayNameUpdate?: (name: string) => void
}

export function ProfileDialog({ 
  userEmail, 
  displayName,
  open,
  onOpenChange,
  onDisplayNameUpdate
}: ProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Mi Perfil
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto mt-4">
          <ProfileTab 
            userEmail={userEmail} 
            initialDisplayName={displayName}
            onDisplayNameUpdate={onDisplayNameUpdate}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
