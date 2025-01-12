import { GameStatus } from "@repo/types";
import { WebSocket } from "ws";

export interface User {
  socket: WebSocket;
  betNumbers: number[];
  balance: number;
}

export interface GameState {
  status: GameStatus;
  bets: { socket: WebSocket; numbers: number[]; balance: number }[];
  winningNumbers: number[];
}

const Game: GameState = {
  status: GameStatus.Inactive,
  bets: [],
  winningNumbers: [],
};

export default Game;
