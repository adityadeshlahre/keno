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
    const existingUser = Object.values(this._user).find((u) => u.ws === ws);

    if (existingUser) {
      if (isAdmin && !AdminManager.getInstance().isAdmin(existingUser)) {
        existingUser.isAdmin = true;
        AdminManager.getInstance().addAdmin(existingUser);
      }
      ws.send(
        JSON.stringify({
          type: "CONNECTED",
          balance: existingUser.balance,
          state: AdminManager.getInstance().GameState(),
        })
      );
      return;
    }

    // new user
    const id = ID;
    const user = new User(id, ws, isAdmin ? true : false);
    this._user[id] = user;

    if (isAdmin) {
      AdminManager.getInstance().addAdmin(user);
    } else {
      this._user[id] = user;
    }

    user.send({
      type: "CONNECTED",
      balance: user.balance,
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
    userBets: { numbers: number[]; amount: number }
    // balance?: number,
    // amount?: number
  ) {
    if (!userBets || userBets.numbers.length === 0) {
      console.log(`Invalid bet numbers provided by user ${id}`);
      ws.send(
        JSON.stringify({ type: "error", message: "No bet numbers provided" })
      );
      return;
    }

    const user = this._user[id];

    // const user = Object.values(this._user).find((u) => u.ws === ws);

    if (!user) {
      ws.send(JSON.stringify({ type: "error", message: "User not found" }));
      return;
    }

    const receivedBetsCount = new Set(userBets.numbers).size;
    const existingBetsCount = new Set(user.bets.flatMap((bet) => bet.numbers))
      .size;

    console.log(existingBetsCount, "**", receivedBetsCount);

    if (receivedBetsCount + existingBetsCount > 20) {
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

    const totalBetAmount = userBets.numbers.length * userBets.amount;

    if (user.balance < totalBetAmount) {
      user.send({ type: "error", message: "Insufficient funds" });
      return;
    }

    // userBets.numbers.forEach((number) => {
    if (user.balance >= totalBetAmount) {
      user.balance -= totalBetAmount;
      console.log(`Deducted ${userBets.amount} for number ${userBets.numbers}`);
    } else {
      user.send({
        type: "error",
        message: `Insufficient funds for placing bet on number ${userBets.numbers}`,
      });
      return;
    }
    // });

    const existingBetAmount = user.bets.find(
      (x) => x.amount === userBets.amount
    );

    if (existingBetAmount) {
      existingBetAmount.numbers = Array.from(
        new Set([...existingBetAmount.numbers, ...userBets.numbers])
      );
    } else {
      // Add new bet if no existing bet with the same amount
      user.bets.push(userBets);
    }

    console.log(user.bets);

    user.send({
      type: "BET_PLACED",
      bets: user.bets,
      remainingBalance: user.balance,
    });
  }

  public unPlaceBet(
    id: number,
    ws: WebSocket,
    userBets: { numbers: number[]; amount: number }
    // balance?: number,
    // amount?: number
  ) {
    if (!userBets || userBets.numbers.length === 0) {
      console.log(`Invalid bet numbers provided by user ${id}`);
      ws.send(
        JSON.stringify({ type: "error", message: "No bet numbers provided" })
      );
      return;
    }

    const user = this._user[id];

    // const user = Object.values(this._user).find((u) => u.ws === ws);

    if (!user) {
      ws.send(JSON.stringify({ type: "error", message: "User not found" }));
      return;
    }

    const { numbers: numbersToRemove, amount } = userBets;

    const existingBet = user.bets.find((bet) => bet.amount === amount);

    if (!existingBet) {
      user.send({
        type: "error",
        message: "No bet found for the specified amount",
      });
      return;
    }

    // Remove the specified numbers from the bet's numbers array
    existingBet.numbers = existingBet.numbers.filter(
      (num) => !numbersToRemove.includes(num)
    );

    // Refund the user for the removed numbers
    const refundAmount = numbersToRemove.length * amount;
    user.balance += refundAmount;

    // Remove the bet object entirely if no numbers remain
    if (existingBet.numbers.length === 0) {
      user.bets = user.bets.filter((bet) => bet !== existingBet);
    }

    console.log(`Removed numbers ${numbersToRemove} from user ${id}'s bets`);

    console.log(user.bets);

    user.send({
      type: "BET_UNPLACED",
      bets: user.bets,
      remainingBalance: user.balance,
    });
  }

  public getUserBalance(ws: WebSocket) {
    const user = Object.values(this._user).find((u) => u.ws === ws);
    if (!user) {
      ws.send(JSON.stringify({ type: "error", message: "User not found" }));
      return;
    }

    user.send({ type: "USER_BALANCE", balance: user.balance });
  }

  public clearBetsOfUser(id: number, ws: WebSocket) {
    const user = this._user[id];

    // const user = Object.values(this._user).find((u) => u.ws === ws);

    if (!user || !user.bets || user.bets.length === 0) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "No bets to clear for this user.",
        })
      );
      return;
    }

    const refundAmount = user.bets.reduce((total, bet) => {
      return total + bet.numbers.length * bet.amount;
    }, 0);

    if (user) {
      user.balance += refundAmount;
    }

    user?.restBets();
    console.log(`Refunded ${refundAmount} to user with ID ${id}.`);
  }
}

export default UserManager;
