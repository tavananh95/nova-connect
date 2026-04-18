# Nova Connect
# Déploiement Frontend (Next.js) sur AWS Amplify

## 1. Flux global frontend

1. L'utilisateur ouvre `https://main.dk9lkc5yg76k.amplifyapp.com/`.
2. Le DNS résout le domaine frontend vers Amplify Hosting (distribution CloudFront).
3. Amplify sert le frontend Next.js (pages, assets, rendu SSR si nécessaire).
4. Le frontend appelle l'API backend via `https://co-64d04bd0e3a543c9a00182d31e71a818.ecs.eu-west-1.on.aws`.
5. Le domaine du back end pointe vers l'ALB, puis l'ALB distribue vers ECS/Fargate.

Résumé trafic:
- Frontend: Utilisateur -> CloudFront/Amplify
- API: Frontend (navigateur) -> ALB -> ECS/Fargate

## 2. Prérequis

- Dépôt Git (GitHub/GitLab/Bitbucket) contenant ce frontend.
- Projet AWS avec accès Amplify + gestion DNS.
- Backend déjà exposé publiquement via ALB (HTTPS).
- Certificats TLS valides (gérés par Amplify pour frontend, ACM/ALB pour API).

## 3. Variables d'environnement nécessaires (Amplify)

Configurer dans Amplify Console -> App settings -> Environment variables:

- `NEXT_PUBLIC_API_URL=https://co-64d04bd0e3a543c9a00182d31e71a818.ecs.eu-west-1.on.aws`
  - Base URL de l'API REST appelée par le frontend.
  - Utilisée dans le code: oui (massivement).

- `NEXT_PUBLIC_WS_URL=https://co-64d04bd0e3a543c9a00182d31e71a818.ecs.eu-west-1.on.aws`
  - Endpoint WebSocket pour le chat temps réel.
  - Utilisée dans le code: oui.

- `NEXTAUTH_URL=https://main.dk9lkc5yg76k.amplifyapp.com`
  - URL publique du frontend pour NextAuth (callbacks/cookies/contexte d'hôte).
  - Pas utilisée directement dans le code mais utilisée par NextAuth au runtime.

- `NEXTAUTH_SECRET=<secret_fort>`
  - Secret de signature/chiffrement des sessions JWT NextAuth.
  - Pas utilisée directement dans le code mais utilisée par NextAuth au runtime.

## 4. Étapes de déploiement (Git -> Amplify)

1. Pousser le code sur la branche cible:
   - `main`
2. Dans Amplify:
   - `New app` -> `Host web app`
   - Connecter le provider Git
   - Sélectionner repo + branche.
3. Vérifier l'utilisation du fichier `amplify.yml` du repo.
4. Ajouter les variables d'environnement listées ci-dessus.
5. Lancer le premier déploiement.
6Vérifier après déploiement:
   - login NextAuth
   - appels API vers le back end via load balancer.
6. Configurer CORS côté backend pour autoriser l'origine frontend `https://main.dk9lkc5yg76k.amplifyapp.com/`.

## 5. Pourquoi Amplify et pas S3 statique ?

Amplify est le bon choix ici car ce frontend n'est pas un simple site statique:

- Projet Next.js App Router avec logique serveur (ex: route NextAuth `/api/auth/[...nextauth]`).
- Authentification NextAuth nécessite un runtime serveur pour gérer sessions/cookies/callbacks.
- CI/CD Git intégré (build à chaque push), previews de branches, domaine/SSL simplifiés.
- Support natif du déploiement Next.js moderne sans refactor majeur.

S3 statique conviendrait seulement pour un site 100% exportable (`next export`) sans runtime serveur.
Dans l'état actuel du code, passer en S3 statique demanderait une refonte de l'auth et des routes serveur.


## 🚀 Features

- ⚡️ Next.js 15 with App Router
- 🔐 NextAuth.js for authentication
- 🎨 Tailwind CSS for styling
- 📱 Responsive design
- 🌙 Dark mode support
- 🎯 TypeScript for type safety
- 📝 Form handling with React Hook Form
- ✅ Form validation with Zod
- 🎭 Radix UI components
- 📅 Date handling with date-fns
- 🔄 Real-time updates
- 🎨 Beautiful UI components with shadcn/ui

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- pnpm (recommended) or npm

## 🛠️ Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/nova-connect.git
cd nova-connect
```

2. Install dependencies:

```bash
pnpm install
# or
npm install
```

3. Create a `.env.local` file in the root directory and add your environment variables:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
# Add other required environment variables
```

## 🚀 Development

To start the development server:

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗️ Building for Production

To create a production build:

```bash
pnpm build
# or
npm run build
```

To start the production server:

```bash
pnpm start
# or
npm start
```

## 🧪 Testing

Run the linter:

```bash
pnpm lint
# or
npm run lint
```

## 📁 Project Structure

```
nova-connect/
├── src/
│   ├── app/          # App router pages and layouts
│   ├── components/   # React components
│   ├── lib/          # Utility functions and configurations
│   └── styles/       # Global styles
├── public/           # Static assets
└── ...config files
```

## 🛠️ Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Authentication:** NextAuth.js
- **Form Handling:** React Hook Form + Zod
- **Date Handling:** date-fns
- **Icons:** Lucide React
- **Animation:** Motion

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/getting-started/introduction)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives/overview/introduction)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Vercel](https://vercel.com) for the amazing Next.js framework
- [shadcn/ui](https://ui.shadcn.com) for the beautiful UI components
- All the open-source contributors who made this possible
