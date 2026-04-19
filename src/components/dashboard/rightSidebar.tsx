"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MessageCircle,
  Search,
  Users as UsersIcon,
  Crown,
  Star,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface User {
  id: number
  username: string
  email: string
  avatar?: string | null
  novaPoints: number
  isBanned: boolean
}

export default function ModernRightSidebar() {
  const { data: session } = useSession()
  const user = session?.user
  const API = process.env.NEXT_PUBLIC_API_URL!

  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [avatarRefreshAttempted, setAvatarRefreshAttempted] = useState<Record<number, boolean>>({})

  // Charge TOUS les users (no-pagination)
  const fetchUsers = async () => {
    if (!user?.accessToken) return
    setIsLoading(true)
    try {
      const res = await fetch(
        `${API}/api/v1/users/no-pagination`,
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      )
      const list: User[] = await res.json() // directement User[]

      const filtered = list
        .filter((u) => u.id !== user.id && !u.isBanned)
        .sort((a, b) => b.novaPoints - a.novaPoints)

      setUsers(filtered)
    } catch (error) {
      console.error("Erreur chargement utilisateurs :", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [user?.accessToken, user?.id])

  const handleAvatarError = (userId: number) => {
    if (avatarRefreshAttempted[userId]) return
    setAvatarRefreshAttempted((prev) => ({ ...prev, [userId]: true }))
    fetchUsers()
  }

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getUserLevel = (points: number) => {
    if (points >= 2000)
      return { level: "Expert", color: "from-purple-500 to-pink-500", icon: Crown }
    if (points >= 1000)
      return { level: "Avancé", color: "from-blue-500 to-cyan-500", icon: Star }
    if (points >= 500)
      return { level: "Intermédiaire", color: "from-green-500 to-emerald-500", icon: UsersIcon }
    return { level: "Débutant", color: "from-gray-500 to-slate-500", icon: UsersIcon }
  }

  return (
    <aside className="hidden lg:block lg:w-80 xl:w-96 h-screen bg-background border-l border-border shadow-xl fixed right-0">
      <div className="flex h-full flex-col">
        {/* Header + Refresh */}
        <div className="p-6 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl shadow-lg ring-2 ring-background bg-gradient-to-r from-violet-500 to-blue-500 flex items-center justify-center">
                  <UsersIcon className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-background animate-pulse" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-foreground">
                  Nova Connect
                </h2>
                <p className="text-sm text-muted-foreground">Communauté active</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchUsers}
              disabled={isLoading}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          {/* Search */}
          <div className="relative px-6 pb-4">
            <Search className="absolute left-9 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher un membre…"
              className="pl-11 pr-4 py-3 bg-muted/50 border-border rounded-2xl focus:bg-background focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all duration-300 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Stats rapides */}
        <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-pink-50 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <p className="font-bold text-violet-600 text-lg">{users.length}</p>
              <p className="text-xs text-muted-foreground">Membres</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-pink-600 text-lg">{filteredUsers.length}</p>
              <p className="text-xs text-muted-foreground">Actifs</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-blue-600 text-lg">{Math.round(
                users.reduce((sum, u) => sum + u.novaPoints, 0)
              ).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total pts</p>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <ScrollArea className="flex-1 px-4 py-2">
          {filteredUsers.map((u, i) => {
            const lvl = getUserLevel(u.novaPoints)
            const Icon = lvl.icon
            const prog = Math.min((u.novaPoints / 2000) * 100, 100)
            return (
              <div key={u.id} className="group relative flex items-center justify-between gap-3 p-4 bg-card/60 border border-border rounded-2xl hover:bg-card hover:shadow-lg transition-all duration-300">
                {i < 3 && (
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    {i + 1}
                  </div>
                )}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative">
                    <Avatar className="h-11 w-11 ring-2 ring-background shadow-md">
                      {u.avatar ? (
                        <AvatarImage src={u.avatar} onError={() => handleAvatarError(u.id)} />
                      ) : (
                        <AvatarFallback className={`bg-gradient-to-br ${lvl.color} text-white font-semibold text-sm`}>
                          {u.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 p-1 bg-background rounded-full shadow-sm border border-border">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground text-sm truncate">{u.username}</span>
                      {u.novaPoints >= 1000 && (
                        <Badge className={`bg-gradient-to-r ${lvl.color} text-white text-xs px-2 py-0.5 border-0`}>{lvl.level}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{u.novaPoints.toLocaleString()} pts</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${lvl.color} transition-all duration-500`} style={{ width: `${prog}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
                <Link href={`/chat/${u.id}`}>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-violet-50 hover:text-violet-600 transition-all duration-300 group-hover:scale-110">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )
          })}

          {/* Aucun utilisateur trouvé */}
          {filteredUsers.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <UsersIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground mb-1">Aucun membre trouvé</p>
              <p className="text-muted-foreground/70 text-sm">
                {searchTerm ? `Aucun résultat pour "${searchTerm}"` : "La communauté semble vide"}
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </aside>
  )
}

// helper (inchangé)
const getUserLevel = (points: number) => {
  if (points >= 2000) return { level: "Expert",   color: "from-purple-500 to-pink-500",    icon: Crown }
  if (points >= 1000) return { level: "Avancé",   color: "from-blue-500 to-cyan-500",       icon: Star  }
  if (points >= 500)  return { level: "Intermédiaire", color: "from-green-500 to-emerald-500", icon: UsersIcon }
  return { level: "Débutant", color: "from-gray-500 to-slate-500",       icon: UsersIcon }
}
