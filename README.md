# VideoJet

A multi-party video conferencing web application built for online classrooms. Teachers create and host meetings, students join with a meeting ID and password, and administrators manage users and classes. Audio and video are carried over WebRTC through a Selective Forwarding Unit (SFU), with Socket.IO handling signaling, presence, and chat.

## Overview

VideoJet was built to support remote teaching for a school. It models the basic roles of a school — administrators, teachers, and students — and gives each the views and permissions it needs:

- Administrators register users and manage schools and classes.
- Teachers create meetings and host them.
- Students join active meetings using a meeting ID and a one-time password.

The application is server-rendered with EJS and uses session-based authentication. Real-time media is decoupled from the application server: the Node server handles auth, meeting lifecycle, and signaling, while the actual audio/video routing is offloaded to an external Ion-SFU instance.

## Features

- Email/password authentication with hashed passwords (bcrypt) and persistent sessions.
- Role-based access control (admin, teacher, student) enforced through route middleware.
- Meeting creation with a UUID room key and a randomized numeric join password.
- Multi-party audio and video over WebRTC, scaled through an SFU rather than a peer-to-peer mesh.
- Audio-only fallback when no webcam is detected.
- In-call controls: mute/unmute, camera on/off, and live mute/video state shared to all participants.
- Real-time text chat and a live participant list.
- Responsive video grid that adapts its layout to the number of participants.

## Architecture

The system separates signaling from media transport, which is the main reason it scales beyond a handful of participants.

### Signaling and application server

`index.js` runs an Express server and a Socket.IO server on the same HTTP server. Socket.IO is responsible for everything except the media itself:

- Room membership and presence (`join-room`, `user-connected`, `userDisconnected`).
- Chat message fan-out.
- Mute/unmute and camera on/off state propagation.
- Mapping each published media stream back to the user that owns it, so names can be rendered on the correct video tile.

Meeting state is held in memory in two collections — `pending_meetings` (created but not started) and `started_meetings` (live) — defined in `src/container/meetings.js`. Rooms clean themselves up when the last participant disconnects.

### Media transport (SFU)

Media is handled client-side by `ion-sdk-js`, which connects to an Ion-SFU server over WebSocket (`public/worker.js`). Each client publishes a single local stream (VGA, VP8) to the SFU and subscribes to the tracks the SFU forwards back. Because every client only uploads once regardless of room size, the SFU model avoids the quadratic connection growth of a full peer-to-peer mesh.

The client reconciles two independent event streams: Socket.IO presence events (who is in the room) and SFU `ontrack` events (which media belongs to which stream). Tracks that arrive before the local client has finished initializing are queued and replayed in order.

### Authentication

Authentication uses Passport with a local strategy (`passport-config.js`). Passwords are compared against bcrypt hashes, and users are serialized into the session by ID. Two middleware guards, `CheckAuth` and `CheckNotAuth` (`src/middleware.js`), protect routes and redirect based on session state.

### Data

User and class records are stored as JSON files under `db/` and read/written through small manager modules (`Managers/`). The user store is reloaded periodically so updates are picked up without a restart. This is a lightweight store suited to the project's scale, not a production database.

## Tech stack

- **Runtime:** Node.js, Express
- **Real-time:** Socket.IO (signaling), WebRTC via Ion-SFU and `ion-sdk-js` (media)
- **Auth:** Passport (local strategy), bcrypt, express-session
- **Views:** EJS, jQuery, Bootstrap
- **Storage:** JSON files

## Getting started

### Prerequisites

- Node.js and npm
- Access to an Ion-SFU server (the SFU WebSocket URL is configured in `public/worker.js`)

### Installation

```bash
git clone https://github.com/Suchismit4/VideoJet.git
cd VideoJet
npm install
```

### Configuration

Create a `.env` file in the project root:

```
SESSION_SECRET=your-session-secret
PORT=3030
```

Create the user store at `db/users_secure.json` (this file is gitignored). Passwords must be bcrypt hashes:

```json
{
  "users": [
    {
      "id": "1",
      "email": "admin@example.com",
      "password": "<bcrypt-hash>",
      "f_name": "Admin",
      "l_name": "User",
      "type": "admin"
    }
  ]
}
```

The `type` field accepts `admin`, `classTeacher`, or `student`.

If you are running your own Ion-SFU instance, update the WebSocket URL at the top of `public/worker.js`.

### Run

```bash
npm run dev    # development with nodemon
npm start      # production
```

The server listens on `http://localhost:3030`.

## Project structure

```
index.js                  Express + Socket.IO server, room/signaling logic
passport-config.js        Passport local strategy
src/
  routes/router.js        All HTTP routes (auth, meetings, admin)
  middleware.js           Auth guards
  container/meetings.js   In-memory meeting state
Managers/                 User, class, school, and error logic
public/
  worker.js               SFU client (publish/subscribe, in-call controls)
  script.js               Socket.IO client (presence, chat, UI)
  helpers/elements.js     DOM helpers for media tiles
views/                    EJS templates
db/                       JSON data store
mockups/                  UI design mockups
```

## Notes and limitations

- Meeting state is in-memory, so it does not survive a server restart and does not scale horizontally without a shared store.
- Media transport depends on a reachable Ion-SFU server; the application server does not relay media itself.
- The JSON file store is intended for the project's original scale and would be replaced by a database in a production deployment.

## License

MIT
