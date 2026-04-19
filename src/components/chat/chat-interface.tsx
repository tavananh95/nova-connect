"use client"

import React, { useState, useEffect, useRef } from "react"
import axios from "axios"
import { io, Socket } from "socket.io-client"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, MessageCircle, Users } from "lucide-react"

interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  senderAvatar?: string
  timestamp: string
  isRead: boolean
  isOwn: boolean
}

export default function ChatInterface() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const token = session?.user?.accessToken
  const API = process.env.NEXT_PUBLIC_API_URL!
  const WS  = process.env.NEXT_PUBLIC_WS_URL!
  const { otherUserId } = useParams()

  const [partnerName, setPartnerName] = useState("Utilisateur")
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [avatarRefreshAttempted, setAvatarRefreshAttempted] = useState<Record<string, boolean>>({})
  const endRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  // 1) Charger le nom de l’interlocuteur
  useEffect(() => {
    if (!token || !otherUserId) return
    axios
      .get<{ username: string; firstName?: string; lastName?: string }>(
        `${API}/api/v1/users/${otherUserId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((res) => {
        // préférer prénom + nom si dispo
        const { username, firstName, lastName } = res.data
        setPartnerName(
          firstName && lastName ? `${firstName} ${lastName}` : username
        )
      })
      .catch((err) => console.error("GET partner error:", err))
  }, [API, token, otherUserId])

  // Helper : formater l’heure
  const fmtTime = (iso: string) => {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ""
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 2) Normalisation en Message, en utilisant partnerName
  const normalize = (raw: any): Message => {
    const sid = String(raw.senderId ?? raw.sender_id ?? "")
    const isOwn = sid === String(userId)
    const sname = isOwn ? "Vous" : partnerName
    const sav = raw.senderAvatar ?? raw.sender_avatar
    const ts = raw.timestamp ?? raw.createdAt ?? raw.created_at ?? new Date().toISOString()

    return {
      id: String(raw.id),
      content: String(raw.content),
      senderId: sid,
      senderName: sname,
      senderAvatar: sav,
      timestamp: ts,
      isRead: Boolean(raw.is_read ?? raw.isRead),
      isOwn,
    }
  }

  const fetchConversation = async () => {
    if (!token || !otherUserId) return
    try {
      const res = await axios.get<any[]>(`${API}/api/v1/messages/conversation/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const normalized = res.data.map(normalize)
      setMessages(normalized)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setMessages([])
      } else {
        console.error("GET conversation error:", err)
      }
    }
  }

  // 3) Charger l’historique (REST)
  useEffect(() => {
    fetchConversation()
  }, [API, token, otherUserId, partnerName])

  const handleAvatarError = (senderId: string) => {
    if (!senderId) return
    if (avatarRefreshAttempted[senderId]) return
    setAvatarRefreshAttempted((prev) => ({ ...prev, [senderId]: true }))
    fetchConversation()
  }

  // 4) Charger le nombre de non-lus
  useEffect(() => {
    if (!token) return
    axios
      .get<{ count: number }>(`${API}/api/v1/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setUnreadCount(r.data.count))
      .catch((err) => console.error("GET unread-count error:", err))
  }, [API, token])

  // 5) WebSocket temps réel
  useEffect(() => {
    if (!userId) return
    const socket = io(WS, { auth: { userId: String(userId) } })
    socketRef.current = socket

    socket.on("private:message", (raw: any) => {
      const msg = normalize(raw)
      if (msg.senderId === otherUserId) {
        setMessages((m) => [...m, msg])
        setUnreadCount((c) => c + 1)
      }
    })

    socket.on("private:message:sent", (raw: any) => {
      const msg = normalize(raw)
      setMessages((m) => [...m, msg])
      setIsLoading(false)
      endRef.current?.scrollIntoView({ behavior: "smooth" })
    })

    socket.on("private:message:read", ({ readerId }: { readerId: string }) => {
      if (String(readerId) === otherUserId) {
        setMessages((m) => m.map((x) => ({ ...x, isRead: true })))
        setUnreadCount(0)
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [WS, userId, otherUserId, partnerName])

  // Scroll automatique
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Envoi via WS
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isLoading || !socketRef.current) return
    setIsLoading(true)
    socketRef.current.emit(
      "private:message",
      { receiverId: otherUserId, content: newMessage },
      // ack callback facultatif
      () => {}
    )
    setNewMessage("")
  }

  // Marquer tout comme lu
  const markAllAsRead = () => {
    socketRef.current?.emit("private:message:read", { senderId: otherUserId })
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5" />
            <CardTitle className="text-lg">Chat Nova Connect</CardTitle>
          </div>
          {/* <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-white/20 cursor-pointer"
                onClick={markAllAsRead}
              >
                {unreadCount} non lu
                {unreadCount > 1 && "s"}
              </Badge>
            )}
            <Users className="h-4 w-4" />
          </div> */}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${
                m.isOwn ? "flex-row-reverse" : "flex-row"
              }`}
            >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {m.senderAvatar ? (
                    <AvatarImage src={m.senderAvatar} onError={() => handleAvatarError(m.senderId)} />
                  ) : (
                  <AvatarFallback className="bg-gradient-to-r from-purple-400 to-blue-400 text-white text-xs">
                    {m.senderName.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div
                className={`flex flex-col max-w-[70%] ${
                  m.isOwn ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500 font-medium">
                    {m.senderName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {fmtTime(m.timestamp)}
                  </span>
                  {!m.isOwn && !m.isRead && (
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  )}
                </div>
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    m.isOwn
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                      : "bg-white border border-gray-200 text-gray-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gray-300 animate-pulse" />
              </Avatar>
              <div className="bg-white border px-4 py-2 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <form
          onSubmit={handleSend}
          className="border-t bg-white p-4 flex items-center gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message…"
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
