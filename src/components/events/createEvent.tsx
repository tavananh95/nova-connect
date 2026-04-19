// createEvent.tsx
"use client"

import React, { useState } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Upload, X, Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { requireApiBaseUrl, getMissingApiBaseUrlMessage } from "@/lib/api-base-url"

interface CreateEventProps {
  onEventCreated: () => void
  children?: React.ReactNode
}

export default function CreateEvent({ onEventCreated, children }: CreateEventProps) {
  const { data: session } = useSession()
  const user = session?.user
  const [isOpen, setIsOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    max_participants: 1,
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 5 MB",
        variant: "destructive",
      })
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview("")
  }

  const createEvent = async () => {
    if (!user?.accessToken) return
    try {
      const apiBaseUrl = requireApiBaseUrl()
      const formData = new FormData()
      formData.append("title", newEvent.title)
      formData.append("description", newEvent.description)
      formData.append("location", newEvent.location)
      formData.append("date", newEvent.date)
      formData.append("maxParticipants", String(newEvent.max_participants))
      if (imageFile) formData.append("image", imageFile)

      const resp = await axios.post(
        `${apiBaseUrl}/api/v1/events`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      )

      toast({
        title: "✨ Événement créé",
        description: `L'événement "${resp.data.title}" a été ajouté.`,
      })
      // Réinitialise le formulaire
      setNewEvent({
        title: "",
        description: "",
        location: "",
        date: "",
        max_participants: 1,
      })
      removeImage()
      setIsOpen(false)
      onEventCreated()
    } catch (err: any) {
      if (err instanceof Error && err.message === getMissingApiBaseUrlMessage()) {
        toast({
          title: "Erreur de configuration",
          description: getMissingApiBaseUrlMessage(),
          variant: "destructive",
        })
        return
      }
      const msg =
        err?.response?.data?.errors?.[0]?.message || "Erreur inconnue"
      toast({ title: "Erreur", description: msg, variant: "destructive" })
    }
  }

  const defaultTrigger = (
    <Button className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600
                       hover:from-violet-700 hover:via-purple-700 hover:to-pink-700
                       text-white border-0 shadow-xl hover:shadow-2xl
                       transform hover:scale-105 transition-all duration-300
                       px-8 py-6 text-lg rounded-2xl">
      <Plus className="h-5 w-5 mr-3" />
      Créer un événement
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto
                                rounded-3xl border-0 shadow-2xl">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-center
                                  bg-gradient-to-r from-violet-600 to-pink-600
                                  bg-clip-text text-transparent">
            Créer un nouvel événement
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Titre */}
          <div className="grid gap-3">
            <Label htmlFor="title" className="text-sm font-semibold">
              Titre *
            </Label>
            <Input
              id="title"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
              placeholder="Ex: Webinaire Cloud Computing"
              className="rounded-xl py-3"
            />
          </div>

          {/* Description */}
          <div className="grid gap-3">
            <Label htmlFor="description" className="text-sm font-semibold">
              Description *
            </Label>
            <Textarea
              id="description"
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent({ ...newEvent, description: e.target.value })
              }
              placeholder="Décrivez votre événement..."
              rows={4}
              className="rounded-xl"
            />
          </div>

          {/* Upload d'image */}
          <div className="grid gap-3">
            <Label className="text-sm font-semibold">Image de l'événement</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="w-full h-40 object-cover rounded-xl"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-3 right-3"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-xl p-8 text-center">
                <Upload className="h-10 w-10 mx-auto mb-4" />
                <p className="mb-3">Glissez une image ou cliquez pour sélectionner</p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  Choisir une image
                </Label>
                <p className="text-xs mt-2">PNG, JPG jusqu'à 5 MB</p>
              </div>
            )}
          </div>

          {/* Lieu & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3">
              <Label htmlFor="location" className="text-sm font-semibold">
                Lieu *
              </Label>
              <Input
                id="location"
                value={newEvent.location}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, location: e.target.value })
                }
                placeholder="En ligne, Paris..."
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="date" className="text-sm font-semibold">
                Date *
              </Label>
              <Input
                id="date"
                type="datetime-local"
                value={newEvent.date}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, date: e.target.value })
                }
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Nombre max de participants */}
          <div className="grid gap-3">
            <Label
              htmlFor="max_participants"
              className="text-sm font-semibold"
            >
              Nombre maximum de participants
            </Label>
            <Input
              id="max_participants"
              type="number"
              value={newEvent.max_participants}
              onChange={(e) =>
                setNewEvent({
                  ...newEvent,
                  max_participants: Number(e.target.value),
                })
              }
              placeholder="50"
              min={1}
              max={1000}
              className="rounded-xl"
            />
          </div>

          {/* Bouton de soumission */}
          <Button
            onClick={createEvent}
            className="w-full py-6 rounded-xl text-lg font-semibold shadow-lg
                       bg-gradient-to-r from-violet-600 to-pink-600
                       hover:from-violet-700 hover:to-pink-700"
          >
            Créer l'événement
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
