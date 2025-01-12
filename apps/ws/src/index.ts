import { WebSocket, WebSocketServer } from "ws";
import { GameStatus, IncomingMessages } from "@repo/types/";
import UserManager from "./UserManager";
import AdminManager from "./AdminManager";

const wss = new WebSocketServer({ port: 8080 });

const users = new Map<number, WebSocket>();
let admin: WebSocket | null = null;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

const userManager = UserManager.getInstance();
const adminManager = AdminManager.getInstance();

wss.on("connection", (ws: WebSocket) => {
  ws.on("error", (err) => {
    console.error("WebSocket error", err);
  });

  adminManager.connectAdmin(ws);
  userManager.connectUser(ws);

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
