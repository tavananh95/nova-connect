"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"
import type { EventItem, EventParticipant } from "@/types/event"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { CalendarDays, MapPin, Users, ArrowLeft, Clock, Sparkles, UserCheck, UserX } from "lucide-react"

export default function EventDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user
  const [event, setEvent] = useState<EventItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribed, setSubscribed] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [imageRefreshAttempted, setImageRefreshAttempted] = useState(false)

  const fetchEvent = async () => {
    if (!user?.accessToken) return
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${id}`, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      })
      const data = res.data
      setEvent(data)
      setSubscribed(data.participants.some((p: EventParticipant) => String(p.id) === String(user.id)))
    } catch (error) {
      console.error("Erreur chargement de l'événement :", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger l'événement",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    setActionLoading(true)
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${id}/subscribe`,
        {},
        {
          headers: { Authorization: `Bearer ${user?.accessToken}` },
        },
      )
      toast({
        title: "🎉 Inscription réussie !",
        description: "Vous participez maintenant à cet événement",
      })
      fetchEvent()
    } catch (err) {
      toast({
        title: "Erreur d'inscription",
        description: "Impossible de vous inscrire à cet événement",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setActionLoading(true)
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${id}/unsubscribe`,
        {},
        {
          headers: { Authorization: `Bearer ${user?.accessToken}` },
        },
      )
      toast({
        title: "Désinscription réussie",
        description: "Vous ne participez plus à cet événement",
      })
      fetchEvent()
    } catch (err) {
      toast({
        title: "Erreur de désinscription",
        description: "Impossible de vous désinscrire",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    fetchEvent()
  }, [user?.accessToken])

  const handleEventImageError = () => {
    if (imageRefreshAttempted) return
    setImageRefreshAttempted(true)
    fetchEvent()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-violet-200 to-pink-200 rounded-full animate-pulse"></div>
          <p className="text-gray-600 font-medium">Chargement de l'événement...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <p className="text-gray-600 font-medium">Événement introuvable</p>
          <Button onClick={() => router.back()} variant="outline" className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    )
  }

  const participationRate = (event.participants.length / event.max_participants) * 100
  const isEventFull = event.participants.length >= event.max_participants

  return (
    <div className="min-h-screen  from-slate-50 via-white to-blue-50">
      <div className="container max-w-4xl mx-auto p-6 space-y-8">
        {/* Bouton retour */}
        <Button onClick={() => router.back()} variant="ghost" className="mb-4 hover:bg-white/80 rounded-xl">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux événements
        </Button>

        {/* Header avec badge */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-pink-100 rounded-full text-sm font-medium text-violet-700">
            <Sparkles className="h-4 w-4" />
            Détails de l'événement
          </div>
        </div>

        {/* Image principale */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          <img
            src={event.image || "/placeholder.svg?height=400&width=800"}
            alt={event.title}
            className="w-full h-80 object-cover"
            onError={handleEventImageError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">{event.title}</h1>
            <div className="flex items-center gap-4 text-white/90">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                {subscribed ? "Vous participez" : "Événement ouvert"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">À propos de cet événement</h2>
                <p className="text-gray-700 leading-relaxed text-lg">{event.description}</p>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Participants ({event.participants.length})</h2>
                </div>

                {event.participants.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {event.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 p-4 bg-gray-50/80 rounded-2xl hover:bg-gray-100/80 transition-colors"
                      >
                        <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                          {participant.avatar ? (
                            <AvatarImage
                              src={participant.avatar || "/placeholder-post.svg"}
                              onError={handleEventImageError}
                            />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold">
                              {participant.username ? participant.username[0].toUpperCase() : "?"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">{participant.username}</p>
                          <p className="text-sm text-gray-500">Participant</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Aucun participant pour le moment</p>
                    <p className="text-sm text-gray-400 mt-1">Soyez le premier à vous inscrire !</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informations de l'événement */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-6">
                <h3 className="font-bold text-gray-900 text-lg">Informations</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <CalendarDays className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Date</p>
                      <p className="text-gray-600">
                        {new Date(event.date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="h-4 w-4" />
                        {new Date(event.date).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-violet-100 rounded-xl">
                      <MapPin className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Lieu</p>
                      <p className="text-gray-600">{event.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-xl">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Participants</p>
                      <p className="text-gray-600">
                        {event.participants.length} / {event.max_participants}
                      </p>
                      {isEventFull && (
                        <Badge variant="destructive" className="mt-1 text-xs">
                          Complet
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bouton d'action */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                {subscribed ? (
                  <Button
                    onClick={handleUnsubscribe}
                    disabled={actionLoading}
                    variant="outline"
                    className="w-full py-6 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
                  >
                    <UserX className="h-5 w-5 mr-2" />
                    {actionLoading ? "Désinscription..." : "Se désinscrire"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubscribe}
                    disabled={actionLoading || isEventFull}
                    className="w-full py-6 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserCheck className="h-5 w-5 mr-2" />
                    {actionLoading ? "Inscription..." : isEventFull ? "Événement complet" : "S'inscrire à l'événement"}
                  </Button>
                )}

                {!subscribed && !isEventFull && (
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Rejoignez {event.participants.length} autres participants
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
