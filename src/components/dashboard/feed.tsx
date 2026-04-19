"use client"

import { useState } from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import axios from "axios"
import { mutate } from "swr"
import { API_BASE, usePosts } from "@/hooks/usePosts"
import type { Post } from "@/types/post"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import CommentDialog from "@/components/posts/CommentDialog"
import { Heart, MessageCircle, Download, MoreHorizontal, AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function Feed() {
  const { data: session } = useSession()
  const { posts, isLoading, error } = usePosts()
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [animatedLikes, setAnimatedLikes] = useState<Record<number, boolean>>({})
  const [imageRefreshAttempted, setImageRefreshAttempted] = useState<Record<number, boolean>>({})

  const token = session?.user.accessToken

  const hasLiked = (post: Post): boolean => {
    return Array.isArray(post.likes) && post.likes.some((like: any) => like.userId === session?.user.id)
  }

  const handleLike = async (postId: number, alreadyLiked: boolean) => {
    if (!token) return

    // Animation de like
    if (!alreadyLiked) {
      setAnimatedLikes((prev) => ({ ...prev, [postId]: true }))
      setTimeout(() => {
        setAnimatedLikes((prev) => ({ ...prev, [postId]: false }))
      }, 1000)
    }

    try {
      const url = `${API_BASE}/api/v1/posts/${postId}/${alreadyLiked ? "unlike" : "like"}`
      await axios.post(
        url,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      await mutate(`${API_BASE}/api/v1/posts`)
    } catch (err) {
      console.error("Erreur like/unlike :", err)
    }
  }

  const handleDelete = async (postId: number) => {
    if (!token) return

    const confirmDelete = confirm("Supprimer ce post ?")
    if (!confirmDelete) return

    try {
      await axios.delete(`${API_BASE}/api/v1/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      await mutate(`${API_BASE}/api/v1/posts`)
    } catch (err) {
      console.error("Erreur suppression :", err)
    }
  }

  const handleDownload = async (post: Post) => {
    try {
      if (post.image) {
        // Télécharger l'image
        const response = await fetch(post.image)
        if (!response.ok) {
          await mutate(`${API_BASE}/api/v1/posts`)
          throw new Error(`Image download failed with status ${response.status}`)
        }
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url

        // Extraire l'extension du fichier ou utiliser jpg par défaut
        const path = new URL(post.image).pathname
        const extension = path.split(".").pop()?.toLowerCase() || "jpg"
        const fileName = `post-${post.id}-image.${extension}`

        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        // Télécharger le contenu du post en tant que fichier texte
        const content = `Post de ${post.user?.firstName} ${post.user?.lastName} (@${post.user?.username})
Date: ${new Date(post.createdAt).toLocaleString("fr-FR")}

${typeof post.content === "string" ? post.content : JSON.stringify(post.content, null, 2)}`

        const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `post-${post.id}.txt`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error)
      alert("Erreur lors du téléchargement du fichier")
    }
  }

  const handlePostImageError = async (postId: number) => {
    if (imageRefreshAttempted[postId]) return
    setImageRefreshAttempted((prev) => ({ ...prev, [postId]: true }))
    await mutate(`${API_BASE}/api/v1/posts`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "à l'instant"
    if (diffMins < 60) return `il y a ${diffMins} min`
    if (diffHours < 24) return `il y a ${diffHours}h`
    if (diffDays < 7) return `il y a ${diffDays}j`

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6">
        <header className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Fil d'actualité
          </h1>
          <p className="text-muted-foreground text-lg">Découvrez ce que partagent vos amis</p>
        </header>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden border-2 border-blue-100">
              <CardHeader className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex items-center gap-3 text-red-700">
          <AlertCircle className="h-6 w-6" />
          <p className="text-lg font-semibold">Erreur de chargement : {error.message}</p>
        </div>
      </div>
    )
  }

  if (!Array.isArray(posts) || posts.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-6">
        <header className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Fil d'actualité
          </h1>
          <p className="text-muted-foreground text-lg">Découvrez ce que partagent vos amis</p>
        </header>
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-6">📭</div>
          <h3 className="text-2xl font-bold mb-4 text-blue-900">Aucun post pour l'instant</h3>
          <p className="text-blue-700 text-lg">Soyez le premier à partager quelque chose avec la communauté !</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Fil d'actualité
        </h1>
        <p className="text-muted-foreground text-lg">Découvrez ce que partagent vos amis</p>
      </header>
      <div className="space-y-8">
        {posts.map((post: Post) => (
          <Card
            key={post.id}
            className="overflow-hidden border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1"
          >
            <CardHeader className="p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 ring-4 ring-blue-200 ring-offset-2">
                    <AvatarImage
                      src={post.user?.avatar || post.user?.firstName }
                      alt={post.user?.firstName || "Avatar"}
                      onError={() => handlePostImageError(post.id)}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg">
                      {(post.user?.firstName || "??")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-lg text-blue-900">
                      {post.user?.firstName && post.user?.lastName
                        ? `${post.user.firstName} ${post.user.lastName}`
                        : "Utilisateur inconnu"}
                    </div>
                    <div className="text-sm text-blue-600 flex items-center gap-2">
                      <span className="font-medium">@{post.user?.username || "anonyme"}</span>
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-400"></span>
                      <span title={new Date(post.createdAt).toLocaleString()}>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {session?.user.id === post.user?.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-red-100">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDelete(post.id)}
                        className="text-red-600 cursor-pointer font-semibold"
                      >
                        🗑️ Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {typeof post.content === "string" ? (
                <p className="mb-6 text-lg leading-relaxed whitespace-pre-line">{post.content}</p>
              ) : (
                <pre className="text-sm text-muted-foreground bg-gray-100 p-4 rounded-xl mb-6 overflow-auto border">
                  {JSON.stringify(post.content, null, 2)}
                </pre>
              )}
              {post.image && (
                <div className="rounded-2xl overflow-hidden mb-4 border-2 border-gray-200 shadow-lg">
                  <Image
                    src={post.image || "/placeholder.svg"}
                    alt="Contenu du post"
                    width={600}
                    height={300}
                    className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                    onError={() => handlePostImageError(post.id)}
                  />
                </div>
              )}
            </CardContent>
            <Separator className="bg-gradient-to-r from-blue-200 to-purple-200 h-0.5" />
            <CardFooter className="p-4">
              <div className="flex justify-between w-full">
                <Button
                  variant="ghost"
                  size="lg"
                  className={`flex items-center gap-3 text-base rounded-full px-6 py-3 ${
                    hasLiked(post) ? "text-red-500 bg-red-50 hover:bg-red-100" : "hover:bg-blue-50"
                  }`}
                  onClick={() => handleLike(post.id, hasLiked(post))}
                >
                  <Heart
                    className={`h-5 w-5 ${
                      hasLiked(post) ? "fill-red-500 text-red-500" : ""
                    } ${animatedLikes[post.id] ? "animate-bounce" : ""}`}
                  />
                  {Array.isArray(post.likes) && post.likes.length > 0 && (
                    <span className="font-semibold">{post.likes.length}</span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="flex items-center gap-3 text-base rounded-full px-6 py-3 hover:bg-blue-50"
                  onClick={() => setSelectedPostId(post.id)}
                >
                  <MessageCircle className="h-5 w-5" />
                  {post.comments?.length > 0 && <span className="font-semibold">{post.comments.length}</span>}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="rounded-full p-3 h-12 w-12 hover:bg-green-50"
                  onClick={() => handleDownload(post)}
                  title={post.image ? "Télécharger l'image" : "Télécharger le contenu"}
                >
                  <Download className="h-5 w-5" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      {selectedPostId && (
        <CommentDialog postId={selectedPostId} open={!!selectedPostId} onClose={() => setSelectedPostId(null)} />
      )}
    </div>
  )
}
