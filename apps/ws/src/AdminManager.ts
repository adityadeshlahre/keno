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
    // Game.bets = []; // Clear any previous bets
    // Game.winningNumbers = []; // Clear previous winning numbers

    UserManager.getInstance().brodcast({ type: "GAME_STARTED" });
    console.log("Game started");
  }

  public stopGame() {
    this.state = GameStatus.Inactive;
    UserManager.getInstance().brodcast({ type: "GAME_STOPPED" });
  }

  public selectWinningNumbers(numbers?: number[]) {
    if (numbers && numbers.length === 20) {
      // Use admin-provided numbers
      Game.winningNumbers = numbers;
    } else {
      // Generate 20 unique random numbers between 1 and 80
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
}

export default AdminManager;
