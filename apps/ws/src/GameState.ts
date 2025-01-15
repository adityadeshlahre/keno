import { GameStatus } from "@repo/types";
import { WebSocket } from "ws";

export interface User {
  socket: WebSocket;
  placedBets: { number: number; amount: number }[];
  balance: number;
}

export interface GameState {
  status: GameStatus;
  player: {
    socket: WebSocket;
    placedBets: { number: number; amount: number }[];
    balance: number;
  }[];
  winningNumbers: number[];
}

const Game: GameState = {
  status: GameStatus.Inactive,
  player: [],
  winningNumbers: [],
};

export default Game;
