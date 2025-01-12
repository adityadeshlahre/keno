export type IncomingMessages =
  | {
      type: "ADMIN_CONNECT";
      password: string;
    }
  | {
      type: "USER_CONNECT";
    }
  | {
      type: "BET";
      betNumbers: Number[];
    }
  | {
      type: "BALANCE";
    }
  | {
      type: "START_GAME";
    }
  | {
      type: "STOP_GAME";
    }
  | {
      type: "END_GAME";
      winnigNumbers: Number[];
    };

export type OutgoingMessages =
  | {
      type: "BALANCE";
      balance: number;
    }
  | {
      type: string;
      message: string;
    }
  | {
      type: "CONNECTED";
      balance?: number;
      state: GameStatus;
    }
  | {
      type: "GAME_STARTED";
    }
  | {
      type: "GAME_STOPPED";
    }
  | {
      type: "WINNING_NUMBERS";
      numbers: Number[];
    }
  | {
      type: "BET_PLACED";
      numbers: Number[];
      remainingBalance: number;
    }
  | {
      type: "INSUFFICIENT_FUNDS";
      balance: number;
    }
  | {
      type: "RESULT";
      matches: number;
      amountWon: number;
      balance: number;
    }
  | {
      type: "WINNING_NUMBERS";
      numbers: Number[];
    };

export enum GameStatus {
  "Inactive",
  "Active",
  "GameOver",
}
