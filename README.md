# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

Server detail pages include a lazy-loaded statistics tab when a manager backend
is configured. The tab reads `/api/storage/server/:id/statistics` and renders
hourly, weekly, monthly, and accumulated weekday availability/player charts.

## Runtime configuration

Optional deployment variables:

- `VITE_FIXED_BACKEND_URL`: manager backend base URL.
- `VITE_FIXED_BACKEND_ADMIN`: SteamID treated as frontend super admin.
- `VITE_STEAM_API_KEY`: enables Steam login.
- `VITE_GLOBAL_INTERCOM_WS_URL`: Global Intercom relay WebSocket URL, for
  example `wss://example.com/ws`. When unset, the chat page stays visible in an
  unconfigured state.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

The repository CI validates linting, tests, the production build, and the Docker
image. Published GitHub releases build and push versioned multi-platform images
to `devidian/rw-manager-frontend` on Docker Hub.

## Embedded map

With `VITE_FIXED_BACKEND_URL` configured, `/embedded-map/:serverId` is a public,
standalone map route suitable for an iframe, for example
`/embedded-map/server-51b6fa813f487c455df7ff04`. It loads only that server's
public `/api/data` map endpoints. Steam sign-in is available on the map itself;
after the OpenID callback it returns to the same embedded route, where the
signed-in player can enable the private "Where have I been?" layer.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

### Server header images

Server headers are loaded through the Manager backend at `GET /api/data/server/:id/header`. Configure the Manager backend URL with HTTPS when serving the frontend over HTTPS. The backend fetches the stored game server URL at `/images/header` over HTTP or HTTPS; no game-server TLS setup is required. Deploy the backend endpoint before the frontend update. Headers require a configured Manager backend.
