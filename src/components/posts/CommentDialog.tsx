"use client"
import { Comment, Props } from "@/types/comment"
import { useEffect, useState } from "react"
import axios from "axios"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export default function CommentDialog({ postId, open, onClose }: Props) {
  const { data: session } = useSession()
  const token = session?.user.accessToken
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [avatarRefreshAttempted, setAvatarRefreshAttempted] = useState<Record<number, boolean>>({})

  const fetchComments = async () => {
    if (!token) return
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setComments(res.data.comments || [])
    } catch (err) {
      console.error("Erreur chargement commentaires", err)
    }
  }

  const handleComment = async () => {
    if (!newComment.trim() || !token) return
    setLoading(true)
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/posts/${postId}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setNewComment("")
      fetchComments()
    } catch (err) {
      console.error("Erreur création commentaire", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!token) return
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/posts/${postId}/comments/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchComments()
    } catch (err) {
      console.error("Erreur suppression commentaire", err)
    }
  }

  useEffect(() => {
    if (open) fetchComments()
  }, [open])

  const handleAvatarError = (userId?: number) => {
    if (!userId) return
    if (avatarRefreshAttempted[userId]) return
    setAvatarRefreshAttempted((prev) => ({ ...prev, [userId]: true }))
    fetchComments()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Commentaires</DialogTitle>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto space-y-4 mt-2">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage
                    src={comment.user?.avatar || comment.user?.username?.[0]?.toUpperCase()}
                    onError={() => handleAvatarError(comment.user?.id)}
                  />
                  <AvatarFallback className="text-xs font-bold text-white bg-gradient-to-br from-blue-500 to-purple-600 border border-white/20">
                    {comment.user?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm text-foreground">
                    {comment.user.username}
                  </div>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
              </div>

              {session?.user.id === comment.user?.id && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Supprimer
                </button>
              )}
            </div>
          ))}

          {!comments.length && (
            <p className="text-muted-foreground text-sm">
              Aucun commentaire pour l’instant.
            </p>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <Textarea
            placeholder="Ajouter un commentaire…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="text-foreground"
          />
          <Button onClick={handleComment} disabled={!newComment.trim() || loading}>
            {loading ? "Envoi..." : "Commenter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
