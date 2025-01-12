import gameState from "src/GameState";

import { WebSocket } from "ws";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sendMessage(ws: WebSocket, message: any) {
  ws.send(JSON.stringify(message));
}

export class UserManager {
  state = gameState.status;
  winningBets = gameState.winningNumbers;
  bets = gameState.bets;

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
    gameState.bets.push({
      socket: ws,
      numbers: [],
      balance: initialBalance,
    });

    // Inform the user about their initial balance
    sendMessage(ws, { type: "CONNECTED", balance: initialBalance });
    console.log("User connected");
  }

  public placeBet(ws: WebSocket, betNumbers: number[]) {
    const user = gameState.bets.find((user) => user.socket === ws);
    if (!user) {
      sendMessage(ws, { type: "error", message: "User not found" });
      return;
    }

    if (gameState.status === "inactive") {
      sendMessage(ws, { type: "error", message: "Game is not active" });
      return;
    }

    const betAmount = 50 * betNumbers.length; // $10 per number
    if (user.balance < betAmount) {
      sendMessage(ws, { type: "error", message: "Insufficient funds" });
      return;
    }

    // Deduct the bet amount from the user's balance
    user.balance -= betAmount;
    user.numbers = betNumbers; // Store the user's bet

    // Confirm the bet placement to the user
    sendMessage(ws, {
      type: "BET_PLACED",
      numbers: betNumbers,
      remainingBalance: user.balance,
    });
    console.log("Bet placed by user");
  }

  public getUserBalance(ws: WebSocket) {
    const user = gameState.bets.find((user) => user.socket === ws);
    if (!user) {
      sendMessage(ws, { type: "error", message: "User not found" });
      return;
    }

    // Send the user's balance to them
    sendMessage(ws, { type: "BALANCE", balance: user.balance });
  }

  public disconnectUser(ws: WebSocket) {
    const userIndex = gameState.bets.findIndex((user) => user.socket === ws);
    if (userIndex !== -1) {
      gameState.bets.splice(userIndex, 1); // Remove the user from the bets array
    }

    console.log("User disconnected");
  }
}

export default UserManager;
