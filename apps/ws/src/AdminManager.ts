import { GameStatus } from "@repo/types";
import Game from "./GameState";
import UserManager from "./UserManager";
import { User } from "./User";

export class AdminManager {
  private state: GameStatus = GameStatus.Inactive;
  private winninNumbers: number[] = Game.winningNumbers;
  private static _instance: AdminManager;
  private _admins: User[] = [];

  private constructor() {}

  public static getInstance(): AdminManager {
    if (!this._instance) {
      this._instance = new AdminManager();
    }
    return this._instance;
  }

  public addAdmin(user: User) {
    if (!this._admins.some((admin) => admin.id === user.id)) {
      this._admins.push(user);
      console.log(`User ${user.id} added as admin`);
    }
  }

  public isAdmin(user: User): boolean {
    return this._admins.some((admin) => admin.id === user.id);
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
    Game.player = [];
    Game.winningNumbers = [];
    UserManager.getInstance().brodcast({ type: "GAME_STARTED" });
  }

  public stopGame() {
    this.state = GameStatus.Inactive;
    UserManager.getInstance().brodcast({ type: "GAME_STOPPED" });
  }

  public endGame() {
    this.state = GameStatus.GameOver;
    UserManager.getInstance().brodcast({ type: "GAME_ENDED" });
  }

  public resetGame() {
    this.state = GameStatus.Inactive;
    Game.winningNumbers = [];
    Object.values(UserManager.getInstance()._user).forEach((user) => {
      user.wonAmount = 0;
      user.bets = [];
    });
    UserManager.getInstance().brodcast({ type: "GAME_RESET" });
  }

  public selectWinningNumbers(numbers?: number[]) {
    if (numbers && numbers.length === 20) {
      Game.winningNumbers = numbers.map(Number);
    } else if (numbers && numbers.length < 20) {
      const generatedNumbers = new Set<number>(numbers);
      while (generatedNumbers.size < 20) {
        const randomNumber = Math.floor(Math.random() * 80) + 1;
        generatedNumbers.add(randomNumber);
      }
      Game.winningNumbers = Array.from(generatedNumbers);
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
    // const userManager = Object.values(UserManager.getInstance()._user);

    Object.values(UserManager.getInstance()._user).forEach((user) => {
      if (!user.bets || user.bets.length === 0) {
        console.log(`User ${user.id} has no bets`);
        return;
      }

      const betMap = new Map<number, number>();
      user.bets.forEach((bet) => {
        bet.numbers.forEach((num) => {
          betMap.set(num, bet.amount);
        });
      });

      let totalPayout = 0;
      const matchedNumbers: number[] = [];

      winningSet.forEach((winningNumber) => {
        if (betMap.has(winningNumber)) {
          const betAmount = betMap.get(winningNumber) || 0;
          totalPayout += betAmount * 2; // Double the bet amount for payout
          matchedNumbers.push(winningNumber);
        }
      });

      if (totalPayout > 0) {
        // user.balance += totalPayout;

        user.send({
          type: "RESULT",
          numberOfMatches: matchedNumbers.length,
          playerMatchedNumbers: matchedNumbers,
          playerBettedNumbers: Array.from(betMap.keys()),
          wonAmount: totalPayout,
        });

        user.won(totalPayout, Game.winningNumbers);
      } else {
        user.lost(Game.winningNumbers);
      }
    });

    Object.values(UserManager.getInstance()._user).forEach((user) => {
      user.bets = [];
      user.wonAmount = 0;
    });
  }
}

export default AdminManager;
