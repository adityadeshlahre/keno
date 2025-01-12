import { WebSocket, WebSocketServer } from "ws";
import { GameState, IncomingMessages } from "@repo/types/";

const wss = new WebSocketServer({ port: 8080 });

const users = new Map<number, WebSocket>();
let admin: WebSocket | null = null;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

let ID: number = 0;

wss.on("connection", (ws: WebSocket) => {
  ws.on("error", (err) => {
    console.error("WebSocket error", err);
  });

  ws.on("message", (data: string) => {
    try {
      const message = JSON.parse(data);
      handleIncomingMessage(ws, message);
    } catch (err) {
      console.error("Invalid message format", err);
    }
  });

  ws.on("close", () => {
    console.log("Connection closed");
    if (ws === admin) {
      admin = null;
      users.forEach((userWs) =>
        userWs.send(JSON.stringify({ type: "GAME_PAUSED" }))
      );
    } else {
      users.forEach((userWs, userId) => {
        if (userWs === ws) {
          users.delete(userId);
        }
      });
    }
  });
});

function handleIncomingMessage(ws: WebSocket, message: IncomingMessages) {
  const { type } = message;

  switch (type) {
    case "ADMIN_CONNECT":
      if (message?.password === ADMIN_PASSWORD) {
        admin = ws;
        console.log("Admin connected");
        ws.send(JSON.stringify({ type: "ADMIN_CONNECTED" }));
      } else {
        ws.send(JSON.stringify({ type: "error", message: "Invalid password" }));
      }
      break;

    case "USER_CONNECT":
      ID++;
      users.set(ID, ws);
      console.log(`User ${ID + 1} connected`);
      ws.send(JSON.stringify({ type: "USER_CCONNECTED", userId: ID }));
      break;

    default:
      ws.send(
        JSON.stringify({ type: "error", message: "Unknown message type" })
      );
      break;
  }
}
