import { requireApiBaseUrl } from "@/lib/api-base-url"

const API_BASE_URL = requireApiBaseUrl()

// Fonction utilitaire pour les appels API
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Erreur API: ${response.status}`)
  }

  return response.json()
}

// API pour les commentaires
export const commentsApi = {
  // Récupérer les commentaires d'un post
  getComments: (postId: number) => apiCall(`/api/v1/posts/${postId}/comments`),

  // Créer un nouveau commentaire
  createComment: (postId: number, content: string) =>
    apiCall(`/api/v1/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  // Liker/unliker un commentaire
  toggleCommentLike: (commentId: number) => apiCall(`/api/v1/comments/${commentId}/like`, { method: "POST" }),

  // Supprimer un commentaire
  deleteComment: (commentId: number) => apiCall(`/api/v1/comments/${commentId}`, { method: "DELETE" }),
}

// API pour les posts
export const postsApi = {
  // Récupérer tous les posts
  getPosts: () => apiCall("/api/v1/posts"),

  // Récupérer un post spécifique
  getPost: (id: number) => apiCall(`/api/v1/posts/${id}`),

  // Créer un nouveau post
  createPost: (formData: FormData) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

    return fetch(`${API_BASE_URL}/api/v1/posts`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then((res) => {
      if (!res.ok) {
        throw new Error(`Erreur API: ${res.status}`)
      }
      return res.json()
    })
  },

  // Liker/unliker un post
  toggleLike: (id: number) => apiCall(`/api/v1/posts/${id}/like`, { method: "POST" }),

  // Supprimer un post
  deletePost: (id: number) => apiCall(`/api/v1/posts/${id}`, { method: "DELETE" }),
}
