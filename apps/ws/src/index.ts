import { WebSocket, WebSocketServer } from "ws";
import UserManager from "./UserManager";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws: WebSocket) => {
  ws.on("error", (err) => {
    console.error("WebSocket error", err);
  });

  UserManager.getInstance().connectUser(ws);

  // ws.on("message", (data: string) => {
  //   try {
  //     const message = JSON.parse(data);
  //     if (message.type === "ADMIN_CONNECT") {
  //       AdminManager.getInstance().connectAdmin(ws);
  //     }

  //     if (message.type === "USER_CONNECT") {
  //       UserManager.getInstance().connectUser(ws);
  //     }
  //   } catch (err) {
  //     console.error("Error processing message", err);
  //   }
  // });

  // ws.on("close", () => {
  //   console.log("Connection closed");
  //   if (ws === admin) {
  //     admin = null;
  //     users.forEach((userWs) =>
  //       userWs.send(JSON.stringify({ type: "GAME_PAUSED" }))
  //     );
  //   } else {
  //     users.forEach((userWs, userId) => {
  //       if (userWs === ws) {
  //         users.delete(userId);
  //       }
  //     });
  //   }
  // });
});
