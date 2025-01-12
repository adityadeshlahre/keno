import { GameStatus } from "@repo/types";
import { WebSocket } from "ws";

export interface User {
  socket: WebSocket;
  numbers: Number[];
  balance: number;
}

export interface GameState {
  status: GameStatus;
  bets: { socket: WebSocket; numbers: number[]; balance: number }[];
  winningNumbers: Number[];
}

const gameState: GameState = {
  status: GameStatus.Inactive,
  bets: [],
  winningNumbers: [],
};

export default gameState;
