"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { NotificationsSettings } from "./notifications-settings"
import { Bell } from "lucide-react"

interface NotificationsDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function NotificationsDialog({ 
  open,
  onOpenChange
}: NotificationsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto mt-4">
          <NotificationsSettings />
        </div>
      </DialogContent>
    </Dialog>
  )
}
