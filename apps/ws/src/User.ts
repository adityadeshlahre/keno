import { GameStatus, IncomingMessages, OutgoingMessages } from "@repo/types";
import { WebSocket } from "ws";
import UserManager from "./UserManager";
import AdminManager from "./AdminManager";

export class User {
  public id: number;
  public balance: number;
  public ws: WebSocket;
  public amount: number;
  public isAdmin: boolean;
  public betNumbers: number[];

  constructor(id: number, ws: WebSocket, isAdmin: boolean) {
    this.id = id;
    this.balance = 1000;
    this.ws = ws;
    this.amount = 0;
    this.isAdmin = isAdmin;
    this.betNumbers = [];
    this.inithandler();
  }

  inithandler() {
    const adminManager = AdminManager.getInstance();
    const userManager = UserManager.getInstance();

    this.ws.on("message", (data: string) => {
      try {
        const message: IncomingMessages = JSON.parse(data);
        console.log(message);
        // if (message.type === "USER_CONNECT") {
        //   userManager.connectUser(this.ws);
        //   console.log("User connected");
        // } else {
        //   this.ws.send(
        //     JSON.stringify({
        //       type: "USER_CONNECT",
        //       message: "Message Failed",
        //     })
        //   );
        // }

        if (message.type === "ADMIN_CONNECT" && message.password === "admin") {
          userManager.connectUser(this.ws, true);
          console.log("Admin connected");
          this.ws.send(
            JSON.stringify({ type: "ADMIN_CONNECTED", userId: this.id })
          );
        }

        if (this.isAdmin && message.type === "START_GAME") {
          if (adminManager.GameState() === GameStatus.Inactive) {
            adminManager.ChangeState(GameStatus.Active);
            adminManager.startGame();
            this.ws.send(JSON.stringify({ type: "GAME_STARTED" }));
          }
        }

        if (this.isAdmin && message.type === "STOP_GAME") {
          if (adminManager.GameState() === GameStatus.Active) {
            adminManager.ChangeState(GameStatus.Inactive);
            adminManager.stopGame();
            this.ws.send(JSON.stringify({ type: "GAME_STOPPED" }));
          }
        }

        if (this.isAdmin && message.type === "END_GAME") {
          if (adminManager.GameState() === GameStatus.Inactive) {
            adminManager.ChangeState(GameStatus.GameOver);
            if (this.betNumbers !== message.winnigNumbers) {
              adminManager.selectWinningNumbers(message.winnigNumbers);
            }
            this.ws.send(JSON.stringify({ type: "GAME_ENDED" }));
            userManager.announceResults();
          }
        }

        if (this.isAdmin && message.type === "RESET_GAME") {
          if (adminManager.GameState() === GameStatus.GameOver) {
            adminManager.ChangeState(GameStatus.Inactive);
            this.ws.send(JSON.stringify({ type: "GAME_RESET" }));
          }
        }

        if (message.type === "BET") {
          if (adminManager.GameState() === GameStatus.Active) {
            this.betNumbers = message.betNumbers;
            userManager.placeBet(
              this.id,
              this.ws,
              this.betNumbers,
              this.balance,
              this.amount
            );
          } else if (adminManager.GameState() === GameStatus.Inactive) {
            this.ws.send(JSON.stringify({ type: "GAME_NOT_ACTIVE" }));
          } else if (adminManager.GameState() === GameStatus.GameOver) {
            this.ws.send(JSON.stringify({ type: "GAME_OVER" }));
          } else {
            this.ws.send(JSON.stringify({ type: "GAME_NOT_STARTED_YET" }));
          }
        }

        if (message.type === "BALANCE") {
          userManager.getUserBalance(this.ws);
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

  won(amount: number, winningNumbers: number[]) {
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

  lost(winningNumbers: number[]) {
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
