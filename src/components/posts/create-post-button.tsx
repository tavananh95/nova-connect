"use client"

import { useState } from "react"
import axios from "axios"
import { Plus, ImageIcon, X } from "lucide-react"
import Image from "next/image"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { mutatePosts } from "@/hooks/usePosts"
import { getMissingApiBaseUrlMessage, requireApiBaseUrl } from "@/lib/api-base-url"

export function CreatePostButton() {
  const { data: session } = useSession()
  const token = session?.user.accessToken

  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    setFile(f)
    if (f) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(f)
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !token) return

    setIsSubmitting(true)

    // Préparation du FormData
    const formData = new FormData()
    formData.append("content", caption)  
    formData.append("image", file)       

    try {
      const apiBaseUrl = requireApiBaseUrl()

      const { status, data } = await axios.post(
        `${apiBaseUrl}/api/v1/posts`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (status === 200 || status === 201) {
        // Invalide et rafraîchit le cache SWR
       await mutatePosts(undefined, true) // force un re-fetch complet depuis l'API
        clearFile()
        setCaption("")
        setOpen(false)
      } else {
        console.error("Publication inattendue :", status, data)
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === getMissingApiBaseUrlMessage()) {
        console.error("Erreur configuration API:", err.message)
        return
      }
      console.error(
        "Erreur création post:",
        "status=", err.response?.status,
        "data=", err.response?.data,
        "message=", err.message
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 bg-gradient-to-r from-violet-300 to-pink-100 rounded-full text-sm font-medium text-violet-700 mb-4">
          <Plus className="h-4 w-4" />
          Créer un post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un nouveau post</DialogTitle>
          <DialogDescription>
            Partagez une photo avec votre communauté
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!preview ? (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="image" className="text-left">
                Image
              </Label>
              <label
                htmlFor="image"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
              >
                <div className="pt-5 pb-6 flex flex-col items-center">
                  <ImageIcon className="w-8 h-8 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Cliquez pour sélectionner</span> ou glissez-déposez
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG ou JPEG</p>
                </div>
                <input
                  id="image"
                  type="file"
                  accept="image/png, image/jpeg"
                  className="hidden"
                  onChange={onFileChange}
                />
              </label>
            </div>
          ) : (
            <div className="relative">
              <div className="w-full h-64 rounded-lg overflow-hidden relative">
                <Image
                  src={preview}
                  alt="Prévisualisation"
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={clearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="grid w-full gap-1.5">
            <Label htmlFor="caption" className="text-left">
              Légende
            </Label>
            <Textarea
              id="caption"
              placeholder="Écrivez une légende…"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="text-foreground"
            />
          </div>

          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!file || isSubmitting}>
              {isSubmitting ? "Publication en cours…" : "Publier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
