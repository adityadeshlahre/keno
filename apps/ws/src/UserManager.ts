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
    betNumbers: number[]
    // balance?: number,
    // amount?: number
  ) {
    if (!betNumbers || betNumbers.length === 0) {
      console.log(`Invalid bet numbers provided by user ${id}`);
      ws.send(
        JSON.stringify({ type: "error", message: "No bet numbers provided" })
      );
      return;
    }

    const user =
      this._user[id] || Object.values(this._user).find((u) => u.ws === ws);

    if (!user) {
      ws.send(JSON.stringify({ type: "error", message: "User not found" }));
      return;
    }

    if (user.betNumbers.length === 20) {
      user.send({
        type: "error",
        message: "You have already placed MAX number of bet",
      });
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
    user.betNumbers = [...betNumbers];

    user.send({
      type: "BET_PLACED",
      betNumbers: user.betNumbers,
      remainingBalance: user.balance,
    });
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
