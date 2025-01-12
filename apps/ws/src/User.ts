import { GameStatus, IncomingMessages, OutgoingMessages } from "@repo/types";
import { WebSocket } from "ws";
import UserManager from "./UserManager";
import AdminManager from "./AdminManager";

export class User {
  id: number;
  balance: number;
  ws: WebSocket;
  amount: number;
  betNumbers: Number[];

  constructor(id: number, ws: WebSocket) {
    this.id = id;
    this.balance = 1000;
    this.ws = ws;
    this.amount = 0;
    this.betNumbers = [];
    this.inithandler();
  }

  inithandler() {
    this.ws.on("message", (data: string) => {
      try {
        const message: IncomingMessages = JSON.parse(data);
        console.log(message);
        if (message.type === "USER_CONNECT") {
          UserManager.getInstance().connectUser(this.ws);
          console.log("User connected");
        } else {
          this.ws.send(
            JSON.stringify({
              type: "USER_CONNECT",
              message: "Message Failed",
            })
          );
        }

        if (message.type === "BET") {
          if (AdminManager.getInstance().state === GameStatus.Active) {
            this.betNumbers = message.betNumbers;
            UserManager.getInstance().placeBet(
              this.ws,
              this.betNumbers,
              this.balance,
              this.amount
            );

            UserManager.getInstance()._user[this.id]?.send({
              type: "BET_PLACED",
              numbers: this.betNumbers,
              remainingBalance: this.balance,
            });
          } else {
            this.ws.send(JSON.stringify({ type: "GAME_NOT_STARTED_YET" }));
          }
        }
      } catch (err) {
        console.error("Invalid message format", err);
      }
    });
  }

  // bet(ID: string, betNumbers: number[], amount: number) {
  //   if (this.balance < amount) {
  //     this.ws.send(JSON.stringify({ type: "INSUFFICIENT_FUNDS" }));
  //     return;
  //   }
  //   console.log("User placed a bet");
  //   this.ws.send(JSON.stringify({ type: "BET_PLACED", betNumbers }));
  // }

  send(payload: OutgoingMessages) {
    this.ws.send(JSON.stringify(payload));
  }

  won(amount: number, winningNumbers: Number[]) {
    this.balance += amount;
    this.amount = amount;
    this.ws.send(
      JSON.stringify({
        type: "WIN",
        amount: this.amount,
        balance: this.balance,
        winningNumbers,
      })
    );
  }

  lost(winningNumbers: Number[]) {
    this.ws.send(
      JSON.stringify({
        type: "LOSS",
        amount: this.amount,
        balance: this.balance,
        winningNumbers,
      })
    );
  }
}
