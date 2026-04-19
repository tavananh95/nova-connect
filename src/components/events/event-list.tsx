"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MapPin, Users, CalendarDays, Plus, Trash2, Search, Sparkles, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { EventItem } from "@/types/event"
import Link from "next/link"
import CreateEvent from "./createEvent" // Notre nouveau composant

export default function ModernEventList() {
  const { data: session } = useSession()
  const user = session?.user
  const [events, setEvents] = useState<EventItem[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [imageRefreshAttempted, setImageRefreshAttempted] = useState<Record<string, boolean>>({})

  const fetchEvents = async () => {
    if (!user?.accessToken) return
    setIsLoading(true)
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      })
      const data = res.data?.data || []
      setEvents(data)
      setFilteredEvents(data)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les événements",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [user?.accessToken])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredEvents(events)
    } else {
      setFilteredEvents(events.filter((e) => e.title.toLowerCase().includes(query.toLowerCase())))
    }
  }

  const deleteEvent = async (id: string) => {
    if (!user?.accessToken) return
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${id}`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      })
      toast({ title: "Succès", description: "Événement supprimé." })
      fetchEvents()
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'événement",
        variant: "destructive",
      })
    }
  }

  const isEventCreator = (e: EventItem) => e.creator_id === user?.id || e.created_by === user?.id

  const handleImageError = (eventId: string) => {
    if (imageRefreshAttempted[eventId]) return
    setImageRefreshAttempted((prev) => ({ ...prev, [eventId]: true }))
    fetchEvents()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/10 dark:from-background dark:to-muted/20">
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 pb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-pink-100 dark:from-violet-950/50 dark:to-pink-950/50 rounded-full text-violet-700 dark:text-violet-400">
            <Sparkles className="h-4 w-4" />
            Découvrez nos événements
          </div>
          <h1 className="text-4xl font-bold text-foreground">Événements à venir</h1>
          <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
            Rejoignez notre communauté pour des rencontres passionnantes, des ateliers enrichissants et des moments
            inoubliables.
          </p>
        </div>

        {/* Recherche */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un événement..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg rounded-2xl shadow-lg bg-card border-border focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all duration-300"
            />
          </div>
          {searchQuery && (
            <p className="text-center text-muted-foreground mt-3">
              {filteredEvents.length} événement
              {filteredEvents.length > 1 ? "s" : ""} pour "{searchQuery}"
            </p>
          )}
        </div>

        {/* Bouton de création */}
        <div className="flex justify-center">
          <CreateEvent onEventCreated={fetchEvents} />
        </div>

        {/* Liste */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400" />
            <p className="ml-4 text-lg text-muted-foreground">Chargement des événements...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card className="text-center py-16 shadow-lg rounded-3xl bg-card border-border">
            <CardContent>
              <CalendarDays className="h-10 w-10 text-violet-600 dark:text-violet-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {searchQuery ? "Aucun événement trouvé" : "Aucun événement pour le moment"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? `Aucun résultat pour "${searchQuery}"` : "Soyez le premier à créer un événement"}
              </p>
              {!searchQuery && (
                <CreateEvent onEventCreated={fetchEvents}>
                  <Button
                    variant="outline"
                    className="border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/50 bg-transparent"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le premier événement
                  </Button>
                </CreateEvent>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredEvents.map((event) => (
              <Link key={event.id} href={`/event/${event.id}`} className="block group">
                <Card className="shadow-lg rounded-3xl overflow-hidden bg-card border-border hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
                  <CardContent className="flex flex-col lg:flex-row gap-6 p-6">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="w-full lg:w-64 h-40 object-cover rounded-2xl shadow-md group-hover:shadow-lg transition-shadow duration-300"
                      onError={() => handleImageError(event.id)}
                    />
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-xl font-bold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {event.title}
                          </h2>
                          <p className="text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                        </div>
                        {isEventCreator(event) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                            onClick={(e) => {
                              e.preventDefault()
                              if (confirm("Voulez-vous vraiment supprimer cet événement ?")) {
                                deleteEvent(event.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span>{new Date(event.date).toLocaleDateString("fr-FR")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span>
                            {event.participants?.length || 0} / {event.max_participants}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        {!isEventCreator(event) && (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white shadow-md"
                          >
                            Participer
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
