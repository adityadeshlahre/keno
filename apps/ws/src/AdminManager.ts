import { GameStatus } from "@repo/types";
import Game from "./GameState";
import UserManager from "./UserManager";

export class AdminManager {
  private state: GameStatus = GameStatus.Inactive;
  private winninNumbers: number[] = Game.winningNumbers;
  private static _instance: AdminManager;

  private constructor() {}

  public static getInstance(): AdminManager {
    if (!this._instance) {
      this._instance = new AdminManager();
    }
    return this._instance;
  }

  public GameState(): GameStatus {
    return this.state;
  }

  public ChangeState(state: GameStatus) {
    this.state = state;
  }

  public GameWinningNumbers(): number[] {
    return this.winninNumbers;
  }

  public startGame() {
    this.state = GameStatus.Active;
    Game.bets = [];
    Game.winningNumbers = [];

    UserManager.getInstance().brodcast({ type: "GAME_STARTED" });
  }

  public stopGame() {
    this.state = GameStatus.Inactive;
    UserManager.getInstance().brodcast({ type: "GAME_STOPPED" });
  }

  public resetGame() {
    this.state = GameStatus.Inactive;
    Game.winningNumbers = [];
    Object.values(UserManager.getInstance()._user).forEach((user) => {
      user.wonAmount = 0;
      user.betNumbers = [];
    });
    UserManager.getInstance().brodcast({ type: "RESET_GAME" });
  }

  public selectWinningNumbers(numbers?: number[]) {
    if (numbers && numbers.length === 20) {
      Game.winningNumbers = numbers.map(Number);
    } else {
      const generatedNumbers = new Set<number>();
      while (generatedNumbers.size < 20) {
        generatedNumbers.add(Math.floor(Math.random() * 80) + 1);
      }
      Game.winningNumbers = Array.from(generatedNumbers);
    }

    console.log("Winning numbers selected:", Game.winningNumbers);
    UserManager.getInstance().brodcast({
      type: "WINNING_NUMBERS",
      numbers: Game.winningNumbers,
    });
  }

  public announceResults() {
    const winningSet = new Set(Game.winningNumbers.map(Number));
    const userManager = UserManager.getInstance();

    Object.values(UserManager.getInstance()._user).forEach((user) => {
      if (!user.betNumbers || user.betNumbers.length === 0) {
        console.log(`User ${user.id} has no bets`);
        return;
      }

      const matches: number = user.betNumbers
        .map(Number)
        .filter((num) => winningSet.has(num)).length;

      if (matches > 0) {
        const payout = 50 * matches;
        user.balance += payout;

        user.send({
          type: "RESULT",
          matches: matches,
          wonAmount: payout,
          balance: user.balance,
        });
      }
    });

    Object.values(UserManager.getInstance()._user).forEach((user) => {
      user.betNumbers = [];
      user.wonAmount = 0;
    });
  }
}

export default AdminManager;
