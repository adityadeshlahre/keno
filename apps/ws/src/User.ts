import { GameStatus, IncomingMessages, OutgoingMessages } from "@repo/types";
import { WebSocket } from "ws";
import UserManager from "./UserManager";
import AdminManager from "./AdminManager";

export class User {
  public id: number;
  public balance: number;
  public ws: WebSocket;
  public wonAmount: number;
  public isAdmin: boolean;
  public bets: { numbers: number[]; amount: number }[];

  constructor(id: number, ws: WebSocket, isAdmin: boolean) {
    this.id = id;
    this.balance = 1000;
    this.ws = ws;
    this.wonAmount = 0;
    this.isAdmin = isAdmin;
    this.bets = [];
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
        // } else {
        //   this.ws.send(
        //     JSON.stringify({
        //       type: "USER_CONNECT",
        //       message: "Message Failed",
        //     })
        //   );
        // }

        if (message.type === "ADMIN_CONNECT" && message.password === "admin") {
          const existingUser = Object.values(userManager._user).find(
            (u) => u.ws === this.ws
          );

          if (existingUser) {
            if (!existingUser.isAdmin) {
              existingUser.isAdmin = true;
              adminManager.addAdmin(existingUser);
              console.log(`User ${existingUser.id} upgraded to admin`);
            }

            this.ws.send(
              JSON.stringify({
                type: "ADMIN_CONNECTED",
                userId: existingUser.id,
              })
            );
          } else {
            userManager.connectUser(this.ws, true);
            this.ws.send(
              JSON.stringify({ type: "ADMIN_CONNECTED", userId: this.id })
            );
          }
        }

        if (this.isAdmin && message.type === "START_GAME") {
          if (adminManager.GameState() === GameStatus.Inactive) {
            adminManager.startGame();
            this.ws.send(JSON.stringify({ type: "GAME_STARTED" }));
          }
        }

        if (this.isAdmin && message.type === "STOP_GAME") {
          if (adminManager.GameState() === GameStatus.Active) {
            adminManager.stopGame();
            this.ws.send(JSON.stringify({ type: "GAME_STOPPED" }));
          }
        }

        if (this.isAdmin && message.type === "END_GAME") {
          if (adminManager.GameState() === GameStatus.Inactive) {
            if (
              this.bets.length !== 0 ||
              this.bets.every(
                (bet) => bet.numbers.length === 0 || bet.amount === 0
              )
            ) {
              // improtant condtion you missed
              adminManager.selectWinningNumbers(message.winnigNumbers);
              this.ws.send(JSON.stringify({ type: "GAME_ENDED" }));
              adminManager.announceResults();
            }
            adminManager.endGame();

            // else {
            //   this.ws.send(
            //     JSON.stringify({
            //       type: "BET_NEXT_ROUND",
            //       message: "Bet in next round.",
            //     })
            //   );
            // }
          }
        }

        if (this.isAdmin && message.type === "RESET_GAME") {
          if (adminManager.GameState() === GameStatus.GameOver) {
            adminManager.resetGame();
            adminManager.ChangeState(GameStatus.Inactive);
            this.ws.send(JSON.stringify({ type: "GAME_RESET" }));
          }
        }

        if (message.type === "BET") {
          if (adminManager.GameState() === GameStatus.Active) {
            userManager.placeBet(
              this.id,
              this.ws,
              message.betNumbers
              // this.balance,
              // this.amount
            );
          } else if (adminManager.GameState() === GameStatus.Inactive) {
            this.ws.send(JSON.stringify({ type: "GAME_NOT_ACTIVE" }));
          } else if (adminManager.GameState() === GameStatus.GameOver) {
            this.ws.send(JSON.stringify({ type: "GAME_OVER" }));
          } else {
            this.ws.send(JSON.stringify({ type: "GAME_NOT_STARTED_YET" }));
          }
        }

        if (message.type === "UNBET") {
          if (adminManager.GameState() === GameStatus.Active) {
            userManager.unPlaceBet(
              this.id,
              this.ws,
              message.unBetNumbers
              // this.balance,
              // this.amount
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

        if (message.type === "CLEAR_BET") {
          userManager.clearBetsOfUser(this.id, this.ws);
        }
      } catch (err) {
        console.error("Invalid message format", err);
      }
    });
  }

  send(payload: OutgoingMessages) {
    this.ws.send(JSON.stringify(payload));
  }

  won(wonAmount: number, winningNumbers: number[]) {
    this.balance += wonAmount;
    this.wonAmount = wonAmount;
    this.ws.send(
      JSON.stringify({
        type: "WIN",
        wonAmount: this.wonAmount,
        balance: this.balance,
        winningNumbers,
      })
    );
  }

  lost(winningNumbers: number[]) {
    this.ws.send(
      JSON.stringify({
        type: "LOSS",
        wonAmount: this.wonAmount,
        balance: this.balance,
        winningNumbers,
      })
    );
  }

  restBets() {
    this.bets = [];
    this.ws.send(
      JSON.stringify({
        type: "BETS_CLEARED",
        message: "Cleard all previous bets of user",
        balance: this.balance,
      })
    );
  }
}
