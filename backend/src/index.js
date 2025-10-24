
/**
 * Durable Object (DO) for a single PeerStream room.
 * It manages WebSocket connections and relays signaling messages.
 */
export class PeerStreamRoom {
    constructor(state, env) {
        this.state = state;
        // We use in-memory properties, not state.storage, for ephemeral rooms.
        this.streamer = null; // WebSocket connection for the streamer
        this.viewers = new Map(); // key: WebSocket, value: { clientId, name }
        this.env = env;
    }

    // Handles HTTP requests, primarily for WebSocket upgrades.
    async fetch(request) {
        const url = new URL(request.url);

        // This DO only handles WebSocket upgrades.
        if (request.headers.get("Upgrade") !== "websocket") {
            return new Response("Expected websocket", { status: 400 });
        }

        // Generate a random client ID for this connection.
        const clientId = crypto.randomUUID();
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        // We accept the WebSocket connection right away.
        await this.handleWebSocket(server, clientId);

        // Return the client end to the runtime.
        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }

    // Handles WebSocket session logic.
    async handleWebSocket(ws, clientId) {
        // Accept the connection.
        ws.accept();

        // Register event handlers.
        ws.addEventListener("message", (event) => {
            this.handleMessage(ws, clientId, event.data);
        });

        ws.addEventListener("close", (event) => {
            this.handleClose(ws, clientId);
        });

        ws.addEventListener("error", (event) => {
            console.error("WebSocket error:", event.error);
            this.handleClose(ws, clientId);
        });
    }

    // Process incoming WebSocket messages.
    handleMessage(ws, clientId, message) {
        try {
            const data = JSON.parse(message);
            // console.log(`DO received ${data.type} from ${clientId}`);

            switch (data.type) {
                case 'init_streamer':
                    // This WS is the streamer.
                    this.streamer = ws;
                    console.log(`Streamer ${clientId} connected.`);
                    break;

                case 'init_viewer':
                    // This WS is a viewer.
                    const viewerName = data.name || "Guest";
                    this.viewers.set(ws, { clientId, name: viewerName });
                    console.log(`Viewer ${viewerName} (${clientId}) connected.`);
                    // Notify the streamer
                    if (this.streamer && this.streamer.readyState === WebSocket.OPEN) {
                        this.streamer.send(JSON.stringify({
                            type: 'viewer_joined',
                            viewerId: clientId,
                            name: viewerName
                        }));
                    }
                    break;

                case 'offer':
                    // Streamer sending offer to a specific viewer.
                    const viewerWs = this.findViewerWs(data.to);
                    if (viewerWs) {
                        viewerWs.send(JSON.stringify({
                            type: 'offer',
                            offer: data.offer
                        }));
                    }
                    break;

                case 'answer':
                    // Viewer sending answer back to streamer.
                    if (this.streamer && this.streamer.readyState === WebSocket.OPEN) {
                        this.streamer.send(JSON.stringify({
                            type: 'answer',
                            answer: data.answer,
                            from: clientId
                        }));
                    }
                    break;

                case 'ice':
                    if (ws === this.streamer) {
                        // ICE from streamer, broadcast to specific viewer
                        const vWs = this.findViewerWs(data.to);
                        if (vWs) {
                            vWs.send(JSON.stringify({
                                type: 'ice',
                                candidate: data.candidate
                            }));
                        }
                    } else {
                        // ICE from viewer, send to streamer
                        if (this.streamer && this.streamer.readyState === WebSocket.OPEN) {
                            this.streamer.send(JSON.stringify({
                                type: 'ice',
                                candidate: data.candidate,
                                from: clientId
                            }));
                        }
                    }
                    break;
            }
        } catch (err) {
            console.error("Failed to parse message or handle:", err);
        }
    }

    // Handle WebSocket close/error.
    handleClose(ws, clientId) {
        if (ws === this.streamer) {
            console.log("Streamer disconnected.");
            this.streamer = null;
            // Notify all viewers streamer has left
            this.viewers.forEach((viewer, vWs) => {
                if (vWs.readyState === WebSocket.OPEN) {
                    vWs.send(JSON.stringify({ type: 'streamer_left' }));
                    vWs.close(1000, "Streamer left");
                }
            });
            this.viewers.clear();
        } else if (this.viewers.has(ws)) {
            const viewer = this.viewers.get(ws);
            console.log(`Viewer ${viewer.name} (${clientId}) disconnected.`);
            this.viewers.delete(ws);
            // Notify streamer
            if (this.streamer && this.streamer.readyState === WebSocket.OPEN) {
                this.streamer.send(JSON.stringify({
                    type: 'viewer_left',
                    viewerId: clientId
                }));
            }
        }
    }

    // Helper to find a viewer's WebSocket by their clientId.
    findViewerWs(clientId) {
        for (const [ws, viewer] of this.viewers.entries()) {
            if (viewer.clientId === clientId) {
                return ws;
            }
        }
        return null;
    }
}

// CORS headers to allow the Pages site to call the Worker
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // For MVP, '*' is fine. For prod, lock to Pages URL.
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Main Worker entrypoint.
 */
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // 1. API endpoint to create a new room.
        if (url.pathname === '/create-room' && request.method === 'POST') {
            const roomId = crypto.randomUUID();
            return new Response(JSON.stringify({ roomId }), {
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders // Add CORS headers to the actual response
                },
            });
        }

        // 2. WebSocket signaling endpoint.
        if (url.pathname === '/ws') {
            const roomId = url.searchParams.get('room');
            if (!roomId) {
                return new Response("Missing 'room' query parameter", { status: 400 });
            }

            // Get the Durable Object stub for this room.
            const id = env.ROOMS.idFromName(roomId);
            const stub = env.ROOMS.get(id);

            // Forward the WebSocket request to the DO.
            return stub.fetch(request);
        }

        // 3. Not found
        return new Response("Not found. This is the PeerStream worker backend.", { 
            status: 404,
            headers: { ...corsHeaders }
        });
    },
};
