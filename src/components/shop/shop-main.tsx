"use client"

import { Button } from "@/components/ui/button"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Search, ShoppingBag } from "lucide-react"
import ShopList from "@/components/shop/shop-list"
import { useShopItems } from "@/hooks/use-shop-items"
import { useSession } from "next-auth/react"

export default function ShopMain() {
  const session = useSession()
  const user = session?.data?.user

  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9 // You can adjust this number
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { shopItems, isLoading, error, meta, mutate } = useShopItems({
    page: currentPage,
    perPage: itemsPerPage,
    searchQuery,
    refreshTrigger,
  })

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleActionSuccess = useCallback(() => {
    // Trigger a re-fetch of shop items after a successful action (e.g., purchase)
    setRefreshTrigger((prev) => prev + 1)
    mutate() // Also trigger SWR revalidation
  }, [mutate])

  const handleImageExpired = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
    mutate()
  }, [mutate])

  if (session.status === "loading") {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (session.status === "unauthenticated" || !user?.accessToken) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <div className="text-4xl">🔒</div>
          <p className="text-muted-foreground">Connectez-vous pour accéder à la boutique</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 dark:from-slate-950 dark:to-slate-800/20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Boutique Nova
            </h1>
            <p className="text-muted-foreground text-lg">Découvrez et achetez des articles uniques</p>
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
            <ShoppingBag className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-background/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>

          {searchQuery && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>
                Recherche pour : <strong>"{searchQuery}"</strong>
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="h-6 px-2 text-xs">
                Effacer
              </Button>
            </div>
          )}
        </div>

        {/* Shop List */}
        <ShopList
          shopItems={shopItems}
          isLoading={isLoading}
          error={error}
          currentPage={currentPage}
          totalPages={meta?.lastPage || 1}
          onPageChange={handlePageChange}
          onActionSuccess={handleActionSuccess}
          onImageExpired={handleImageExpired}
        />
      </div>
    </div>
  )
}
