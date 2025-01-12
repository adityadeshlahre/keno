import { WebSocket } from "ws";

export interface User {
  socket: WebSocket;
  numbers: number[];
  balance: number;
}

export interface GameState {
  status: "active" | "inactive";
  bets: { socket: WebSocket; numbers: number[]; balance: number }[];
  winningNumbers: number[];
}

const gameState: GameState = {
  status: "inactive",
  bets: [],
  winningNumbers: [],
};

export default gameState;
