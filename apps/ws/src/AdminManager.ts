import { GameStatus, OutgoingMessages } from "@repo/types";
import gameState from "src/GameState";
import WebSocket from "ws";
import { User } from "./User";
import UserManager from "./UserManager";
import { Admin } from "./Admin";

let ID: number = 0;
export class AdminManager {
  state: GameStatus = GameStatus.Inactive;
  winninNumbers: Number[] = gameState.winningNumbers;
  private _admin: { [key: string]: Admin } = {};
  private static _instance: AdminManager;

  private constructor() {}

  public static getInstance() {
    if (!this._instance) {
      this._instance = new AdminManager();
    }
    return this._instance;
  }

  public connectAdmin(ws: WebSocket) {
    const id = ID++;
    const user = new Admin(id, ws);
    this._admin[id] = user;

    // gameState.bets.push({
    //   socket: ws,
    //   numbers: [],
    //   balance: initialBalance,
    // });

    // Inform the user about their initial balance
    user.send({
      type: "CONNECTED",
      state: this.state,
    });
    ws.on("close", () => this.removeUser(id));
  }

  public removeUser(id: number) {
    delete this._admin[id];
  }

  public startGame() {
    this.state = GameStatus.Active;
    // gameState.bets = []; // Clear any previous bets
    // gameState.winningNumbers = []; // Clear previous winning numbers

    UserManager.getInstance().brodcast({ type: "GAME_STARTED" });
    console.log("Game started");
  }

  public stopGame() {
    this.state = GameStatus.Inactive;
    UserManager.getInstance().brodcast({ type: "GAME_STOPPED" });
  }

  public selectWinningNumbers(numbers?: Number[]) {
    if (numbers && numbers.length === 20) {
      // Use admin-provided numbers
      gameState.winningNumbers = numbers;
    } else {
      // Generate 20 unique random numbers between 1 and 80
      const generatedNumbers = new Set<Number>();
      while (generatedNumbers.size < 20) {
        generatedNumbers.add(Math.floor(Math.random() * 80) + 1);
      }
      gameState.winningNumbers = Array.from(generatedNumbers);
    }

    console.log("Winning numbers selected:", gameState.winningNumbers);
    UserManager.getInstance().brodcast({
      type: "WINNING_NUMBERS",
      numbers: gameState.winningNumbers,
    });
  }

  public announceResults() {
    Object.values(UserManager.getInstance()._user).forEach((user) => {
      const matches = user.betNumbers.filter((num) =>
        gameState.winningNumbers.includes(num)
      ).length;

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

    console.log("Results announced");
  }
}

export default AdminManager;
