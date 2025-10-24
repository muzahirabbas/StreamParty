
# StreamParty 🚀

A modern, self-hostable, peer-to-peer streaming platform. Share your screen and chat with guests in real-time, all powered by WebRTC and a lightweight Cloudflare Worker backend.

<div align="center">

[![StreamParty Demo](https://img.youtube.com/vi/EKNL_f0QXCY/0.jpg)](https://www.youtube.com/watch?v=EKNL_f0QXCY)

*(Click the image above to watch the demo tutorial)*
</div>

-----

## ✨ Features

  * **Peer-to-Peer Streaming:** Uses WebRTC for ultra-low-latency, direct screen sharing (video + audio) from the host to guests. No central media server needed.
  * **Two-Way Audio:** Guests can enable their microphones to talk back to the streamer, creating a collaborative session.
  * **Real-Time Chat:** A live chat box allows all participants to communicate via text.
  * **Persistent Chat History:** Reloading or rejoining a stream link restores your chat history for that specific room, saved in your browser's `localStorage`.
  * **Modern & Responsive UI:** Built with React and Tailwind CSS, featuring a persistent light/dark mode toggle that remembers your choice.
  * **Rich Player Controls:**
      * **Fullscreen Mode:** Immerse yourself in the stream.
      * **Mute/Unmute:** Toggle your own microphone.
      * **Hide Video:** A "stream off" button that hides the video (and mutes its audio) to save resources or just chat.
      * **Screen Orientation Lock:** Lock the screen orientation in fullscreen for a stable mobile viewing experience.
  * **Simple & Secure:** No sign-ups needed. Just start a stream, share the unique link, and you're live.
  * **Infinitely Scalable Backend:** The signaling backend is a tiny, serverless Cloudflare Worker that only brokers the initial connection.

-----

## 🛠️ Tech Stack

  * **Frontend:** React.js (with Hooks & Context), Vite, Tailwind CSS
  * **Backend:** Cloudflare Workers (for WebRTC signaling)
  * **Core Tech:** WebRTC (for peer connections) & WebSockets (for signaling)

-----

## 📁 Project Structure

This repository is a monorepo containing the two parts of the application:

```
StreamParty/
├── backend/   # The Cloudflare Worker signaling server
└── frontend/  # The React.js + Vite frontend application
```

-----

## 🚀 Getting Started (Self-Hosting)

You can host your own instance of StreamParty for free using Cloudflare Workers and Cloudflare Pages.

### Prerequisites

  * Node.js (v18+ recommended)
  * A Cloudflare account
  * `npm` or `yarn`
  * **Wrangler CLI:** The command-line tool for Cloudflare.
    ```bash
    npm install -g wrangler
    ```

### Step 1: Deploy the Backend (Cloudflare Worker)

The backend is responsible for "introducing" the streamer and the guests so they can form a direct WebRTC connection.

1.  Navigate to the backend directory:

    ```bash
    cd backend
    ```

2.  Log in to your Cloudflare account (this will open a browser):

    ```bash
    wrangler login
    ```

3.  Install the worker's dependencies:

    ```bash
    npm install
    ```

4.  Deploy the worker to your Cloudflare account:

    ```bash
    wrangler deploy
    ```

5.  After deployment, Wrangler will output a URL for your worker (e.g., `https://your-worker-name.your-subdomain.workers.dev`). **Copy this URL.**

### Step 2: Configure and Run the Frontend (React App)

The frontend is the web app your users will see.

1.  Navigate to the frontend directory:

    ```bash
    cd ../frontend
    ```

2.  Install the frontend's dependencies:

    ```bash
    npm install
    ```

3.  Create a local environment file. This file will tell your frontend how to find your backend.

    Create a new file named `.env.local` in the `frontend/` directory.

4.  Add the worker URL you copied from Step 1 into this file:

    ```env
    # File: frontend/.env.local
    VITE_WORKER_URL="https://your-worker-name.your-subdomain.workers.dev"
    ```

5.  You're all set\! Run the app locally:

    ```bash
    npm run dev
    ```

6.  **To Deploy:** To deploy your frontend (e.g., to Cloudflare Pages), run the build command and upload the generated `dist` folder:

    ```bash
    npm run build
    ```

-----

## 🧐 How to Use

### As a Streamer:

1.  Open the app (e.g., `http://localhost:5173`).
2.  Enter your name and check the "Share Mic" box if you want to talk.
3.  Click **"Start Stream"**.
4.  Your browser will ask for permission to share your screen. Select the screen, window, or tab you want to stream.
5.  Your stream will begin. On the stream page, **copy the link** from the share box and send it to your guests.

### As a Guest:

1.  Open the unique stream link provided by the streamer (e.G., `.../?room=ABC123`).
2.  You will be prompted to join.
3.  Enter your name and check "Join with Mic" if you want to talk.
4.  Click **"Join"**.
5.  You will be connected to the stream and the live chat.

-----

## 📄 License

This project is licensed under the MIT License.
