import { WebSocket } from "ws";
import { User } from "./User";
import { GameStatus, OutgoingMessages } from "@repo/types";
import AdminManager from "./AdminManager";

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

  public connectUser(ws: WebSocket) {
    const initialBalance: number = 1000;
    const id = ID++;
    const user = new User(id, ws);
    this._user[id] = user;

    user.send({
      type: "CONNECTED",
      balance: initialBalance,
      state: AdminManager.getInstance().state,
    });
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
    ws: WebSocket,
    betNumbers: Number[],
    balance: number,
    amount: number
  ) {
    // const id = ID;

    // const user = new User(id, ws);
    // this._user[id] = user;

    const user = Object.values(this._user).find((u) => u.ws === ws);
    if (!user) {
      ws.send(JSON.stringify({ type: "error", message: "User not found" }));
      return;
    }

    if (AdminManager.getInstance().state === GameStatus.Inactive) {
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
      numbers: betNumbers,
      remainingBalance: user.balance,
    });
    console.log("Bet placed by user");
  }

  public getUserBalance(ws: WebSocket) {
    const user = Object.values(this._user).find((u) => u.ws === ws);
    // const user = new User(id, ws);
    // this._user[id] = user;
    if (!user) {
      ws.send(JSON.stringify({ type: "error", message: "User not found" }));
      return;
    }

    user.send({ type: "BALANCE", balance: user.balance });
  }
}

export default UserManager;
