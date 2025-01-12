import gameState from "src/GameState";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function broadcastToAll(message: { type: string; [key: string]: any }) {
  gameState.bets.forEach((user) => {
    user.socket.send(JSON.stringify(message));
  });
}

export class AdminController {
  private _admin: { [key: string]: { id: string } } = {};
  private static _instance: AdminController;

  private authenticatedClients: Set<WebSocket> = new Set();

  private constructor() {}

  public static getInstance() {
    if (!this._instance) {
      this._instance = new AdminController();
    }
    return this._instance;
  }

  startGame() {
    // Set game status to active
    gameState.status = "active";
    gameState.bets = []; // Clear any previous bets
    gameState.winningNumbers = []; // Clear previous winning numbers

    console.log("Game started");
    broadcastToAll({ type: "gameStarted" });
  }

  stopGame() {
    // Set game status to inactive
    gameState.status = "inactive";
    console.log("Game stopped");
    broadcastToAll({ type: "gameStopped" });
  }

  selectWinningNumbers(numbers?: number[]) {
    if (numbers && numbers.length === 20) {
      // Use admin-provided numbers
      gameState.winningNumbers = numbers;
    } else {
      // Generate 20 unique random numbers between 1 and 80
      const generatedNumbers = new Set<number>();
      while (generatedNumbers.size < 20) {
        generatedNumbers.add(Math.floor(Math.random() * 80) + 1);
      }
      gameState.winningNumbers = Array.from(generatedNumbers);
    }

    console.log("Winning numbers selected:", gameState.winningNumbers);
    broadcastToAll({
      type: "winningNumbers",
      numbers: gameState.winningNumbers,
    });
  }

  announceResults() {
    gameState.bets.forEach((user) => {
      const matches = user.numbers.filter((num) =>
        gameState.winningNumbers.includes(num),
      ).length;

      // Payout calculation: Bet amount + (Bet amount * matches)
      const payout = user.balance + 50 * matches;

      // Update user balance
      user.balance += payout;

      // Send result to user
      user.socket.send(
        JSON.stringify({
          type: "RESULT",
          matches,
          payout,
          newBalance: user.balance,
        }),
      );
    });

    console.log("Results announced");
  }
}
