# Welcome to your Lovable project

The public “Join as a server” page explains the three independent participation routes: authenticated OZ Tools WebSocket, `[rw-servers]` description marker, or a Steam-verified `/info.contact` owner approval. Contact-owned master-list servers can be approved from the signed-in dashboard. The database-player table shows the local DBID before the player name.

The bilingual privacy policy in `src/content/legal.ts` describes consent-filtered player exports, transient master-list entries, stored-server conditions and verified operator removal. Review the text against the deployed data flows before publication.

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
Player names in the live player list, server details, and global statistics open
a profile by the backend's player mapping ObjectId. Playtime is
shown when the server's native player data exposes it.

Signed-in users can join additional public Global Intercom channels. The
manager backend stores their subscriptions and the browser rejoins them after
sign-in and WebSocket reconnect. `global` and `web` remain subscribed by default.

## Runtime configuration

Optional deployment variables:

- `VITE_FIXED_BACKEND_URL`: manager backend base URL.
- `VITE_FIXED_BACKEND_ADMIN`: SteamID treated as frontend super admin.
- The super-admin sidebar includes **Server duplicates** when the backend exposes
  the duplicate review and merge API. Matches are suggestions only; merging
  selected entries requires a confirmation and retains the oldest server ID.
  Groups support selecting all sources; the compact detail table renders
  formatted server names and highlights online and offline status.
- Steam login is available for players in a consent-filtered export, verified server contacts, and the configured superadmin. Guests can browse saved server details and the public list.
  Its optional persona-name lookup uses `STEAM_API_KEY` on the backend only.
- `VITE_GLOBAL_INTERCOM_WS_URL`: Global Intercom relay WebSocket URL, for
  example `wss://example.com/ws`. When unset, the chat page stays visible in an
  unconfigured state.

## How can I deploy this project?

The repository CI validates linting, tests, the production build, and the Docker
image. RC tags and published GitHub releases build and push versioned
multi-platform images to `devidian/rw-manager-frontend` on Docker Hub.

Player profiles require sign-in. The backend exposes stable mapping IDs and
masks private or unchecked player names and UIDs as `**PRIVATE**`; private
history is readable only by the same player after verified Steam login.
Guests see only the first and last digit of public Steam IDs. This frontend
requires the matching player identity backend contract.
Direct local game queries display anonymous live rows without profile links.

## Embedded map

When the renderer publishes `satelliteTileUrl`, both the embedded and regular
map offer a satellite base-layer toggle. Without satellite tiles the control
stays hidden. Player profiles read the backend's cached server history and
display per-server playtime where available.

With `VITE_FIXED_BACKEND_URL` configured, `/embedded-map/:serverId` is a public,
standalone map route suitable for an iframe, for example
`/embedded-map/server-51b6fa813f487c455df7ff04`. It loads only that server's
public `/api/data` map endpoints. Steam sign-in is available on the map itself;
after the OpenID callback it returns to the same embedded route, where the
signed-in player can enable the private "Where have I been?" layer.

For the copy actions in the map context menu, grant the embedded document
clipboard access:

```html
<iframe
  src="https://rw-servers.omega-zirkel.de/embedded-map/server-51b6fa813f487c455df7ff04"
  allow="clipboard-write"
  title="Rising World map"
></iframe>
```

If the embedding site uses `sandbox`, it must also permit the capabilities it
needs. When clipboard access is denied, the map presents the value in a
selectable in-page field for manual copying.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

### Server header images

Server headers are loaded through the Manager backend at `GET /api/data/server/:id/header`. Configure the Manager backend URL with HTTPS when serving the frontend over HTTPS. The backend fetches the stored game server URL at `/images/header` over HTTP or HTTPS; no game-server TLS setup is required. Deploy the backend endpoint before the frontend update. Headers require a configured Manager backend.
