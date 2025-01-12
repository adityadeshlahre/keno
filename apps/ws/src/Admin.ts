import WebSocket from "ws";
import AdminManager from "./AdminManager";
import { GameStatus, IncomingMessages, OutgoingMessages } from "@repo/types";

export class Admin {
  id: number;
  ws: WebSocket;

  constructor(id: number, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
    this.inithandler();
  }

  inithandler() {
    this.ws.on("message", (data: string) => {
      try {
        const message: IncomingMessages = JSON.parse(data);
        console.log(message);
        if (message.type === "ADMIN_CONNECT" && message.password === "admin") {
          AdminManager.getInstance().connectAdmin(this.ws);
          console.log("Admin connected");
          this.ws.send(
            JSON.stringify({ type: "ADMIN_CONNECTED", userId: this.id })
          );
        } else {
          this.ws.send(
            JSON.stringify({ type: "AUTH", message: "Invalid password" })
          );
        }

        if (message.type === "START_GAME") {
          if (AdminManager.getInstance().state === GameStatus.Inactive) {
            AdminManager.getInstance().startGame();
          } else {
            this.ws.send(JSON.stringify({ type: "GAME_ALREADY_STARTED" }));
          }
        }

        if (message.type === "STOP_GAME") {
          if (AdminManager.getInstance().state === GameStatus.Active) {
            AdminManager.getInstance().stopGame();
          } else {
            this.ws.send(JSON.stringify({ type: "GAME_ALREADY_STOPPED" }));
          }
        }

        if (message.type === "END_GAME") {
          AdminManager.getInstance().state = GameStatus.GameOver;
          AdminManager.getInstance().selectWinningNumbers(
            message.winnigNumbers
          );
          this.ws.send(JSON.stringify({ type: "GAME_ENDED" }));
          AdminManager.getInstance().announceResults();
        }
      } catch (err) {
        console.error("Invalid message format", err);
      }
    });
  }

  send(payload: OutgoingMessages) {
    this.ws.send(JSON.stringify(payload));
  }
}
