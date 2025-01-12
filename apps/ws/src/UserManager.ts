import { WebSocket } from "ws";
import { User } from "./User";
import { GameStatus, OutgoingMessages } from "@repo/types";
import AdminManager from "./AdminManager";
import Game from "./GameState";

let ID: number = 0;
export class UserManager {
  public _user: { [key: string]: User } = {};

  private static _instance: UserManager;

  private constructor() {}

  public static getInstance() {
    if (!this._instance) {
      this._instance = new UserManager();
    }
    return this._instance;
  }

  public connectUser(ws: WebSocket, isAdmin?: boolean) {
    const initialBalance: number = 1000;
    const id = ID;
    const user = new User(id, ws, isAdmin ? true : false);
    this._user[id] = user;

    user.send({
      type: "CONNECTED",
      balance: initialBalance,
      state: AdminManager.getInstance().GameState(),
    });
    ID++;
    ws.on("close", () => this.removeUser(id));
  }

  public announceResults() {
    const winningSet = new Set(Game.winningNumbers);

    Object.values(this._user).forEach((user) => {
      const uniqueBets = new Set(user.betNumbers);
      console.log("Unique Bets:", uniqueBets);
      const matches = [...uniqueBets].filter((num) =>
        winningSet.has(num)
      ).length;

      console.log("Matches:", matches);

      if (matches > 0) {
        const payout = 50 * matches;
        user.balance += payout;

        // Send result to the individual user
        user.send({
          type: "RESULT",
          matches: matches,
          amountWon: payout,
          balance: user.balance,
        });
      }
    });
  }

  public brodcast(message: OutgoingMessages, id?: number) {
    Object.keys(this._user).forEach((userId) => {
      const user = this._user[userId] as User;
      if (id !== user.id && user.ws.readyState === WebSocket.OPEN) {
        user.send(message);
      }
    });
  }

  public removeUser(id: number) {
    delete this._user[id];
  }

  public placeBet(
    id: number,
    ws: WebSocket,
    betNumbers: number[],
    balance?: number,
    amount?: number
  ) {
    const user = this._user[id];
    if (!user) {
      ws.send(JSON.stringify({ type: "error", message: "User not found" }));
      return;
    }

    if (AdminManager.getInstance().GameState() === GameStatus.Inactive) {
      user.send({ type: "error", message: "Game is not active" });
      return;
    }

    const betAmount = 50 * betNumbers.length;
    if (user.balance < betAmount) {
      user.send({ type: "error", message: "Insufficient funds" });
      return;
    }

    user.balance -= betAmount;
    user.betNumbers = betNumbers;

    user.send({
      type: "BET_PLACED",
      betNumbers: betNumbers,
      remainingBalance: user.balance,
    });
    console.log("Bet placed by user");
  }

  public getUserBalance(ws: WebSocket) {
    const user = Object.values(this._user).find((u) => u.ws === ws);
    if (!user) {
      ws.send(JSON.stringify({ type: "error", message: "User not found" }));
      return;
    }

    user.send({ type: "BALANCE", balance: user.balance });
  }
}

export default UserManager;
