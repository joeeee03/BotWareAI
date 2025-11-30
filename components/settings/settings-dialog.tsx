"use client"

import { useState } from "react"
import { MessageSquare, Clock } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemplatesTab } from "./templates-tab"
import { ScheduledMessagesTab } from "./scheduled-messages-tab"

interface SettingsDialogProps {
  userEmail: string
  displayName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  activeTab?: string
  onTabChange?: (tab: string) => void
  onDisplayNameUpdate?: (name: string) => void
}

export function SettingsDialog({ 
  userEmail, 
  displayName,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  activeTab: controlledActiveTab,
  onTabChange: controlledOnTabChange,
  onDisplayNameUpdate
}: SettingsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [internalActiveTab, setInternalActiveTab] = useState("templates")
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab
  const setActiveTab = controlledOnTabChange || setInternalActiveTab

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Configuración</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Programados</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="templates" className="h-full m-0">
              <TemplatesTab />
            </TabsContent>

            <TabsContent value="scheduled" className="h-full m-0">
              <ScheduledMessagesTab />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
