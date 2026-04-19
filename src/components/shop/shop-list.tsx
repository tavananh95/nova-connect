"use client"

import Image from "next/image"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, ShoppingCart, DollarSign, Info, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useShopActions } from "@/hooks/use-shop-actions"
import type { ShopItem } from "@/types/shop-items"

interface ShopListProps {
  shopItems: ShopItem[]
  isLoading: boolean
  error: Error | undefined
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onActionSuccess: () => void
  onImageExpired: () => void
}

export default function ShopList({
  shopItems,
  isLoading,
  error,
  currentPage,
  totalPages,
  onPageChange,
  onActionSuccess,
  onImageExpired,
}: ShopListProps) {
  const { data: session } = useSession()
  const user = session?.user

  const { handlePurchase } = useShopActions({ onActionSuccess })
  const [imageRefreshAttempted, setImageRefreshAttempted] = useState<Record<number, boolean>>({})

  const handleImageError = (itemId: number) => {
    if (imageRefreshAttempted[itemId]) return
    setImageRefreshAttempted((prev) => ({ ...prev, [itemId]: true }))
    onImageExpired()
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <Skeleton className="w-full h-48 rounded-t-lg" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
        <AlertCircle className="h-5 w-5" />
        <p>Erreur de chargement des articles : {error.message}</p>
      </div>
    )
  }

  if (!shopItems || shopItems.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="text-6xl">🛍️</div>
          <h3 className="text-xl font-semibold text-foreground">Aucun article disponible pour l'instant</h3>
          <p className="text-muted-foreground">Revenez plus tard ou contactez l'administrateur.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shopItems.map((item) => {
          const isPurchased = typeof item.client_id === "number" && item.client_id !== null
          const isPurchasedByMe = isPurchased && item.client_id === user?.id

          return (
            <Card
              key={item.id}
              className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700"
            >
              <div className="relative w-full h-48 bg-muted dark:bg-slate-700">
                <Image
                  src={item.image || "/placeholder.svg?height=192&width=384"}
                  alt={item.name}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-500 hover:scale-105"
                  onError={() => handleImageError(item.id)}
                />
                {isPurchased && (
                  <Badge
                    className={`absolute top-3 right-3 text-sm px-3 py-1 rounded-full ${
                      isPurchasedByMe ? "bg-green-500 text-white" : "bg-red-500 text-white opacity-90"
                    }`}
                  >
                    {isPurchasedByMe ? "Acheté" : "Vendu"}
                  </Badge>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <h3 className="text-xl font-bold text-foreground line-clamp-1">{item.name}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2 min-h-[40px]">{item.description}</p>
                <div className="flex items-center justify-between pt-2">
                  <Badge className="bg-primary/10 text-primary text-lg font-semibold px-3 py-1 rounded-full">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {item.price.toFixed(2)}
                  </Badge>
                  {!isPurchased ? (
                    <Button
                      onClick={() => handlePurchase(item.id)}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Acheter
                    </Button>
                  ) : (
                    <Button disabled variant="secondary">
                      <Info className="mr-2 h-4 w-4" />
                      {isPurchasedByMe ? "Déjà acheté" : "Indisponible"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Page précédente</span>
          </Button>
          <span className="text-sm font-medium text-foreground">
            Page {currentPage} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Page suivante</span>
          </Button>
        </div>
      )}
    </>
  )
}
