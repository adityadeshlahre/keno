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
      betNumbers: number[];
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
      type: "RESET_GAME";
    }
  | {
      type: "END_GAME";
      winnigNumbers: number[];
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
      type: "RESET_GAME";
    }
  | {
      type: "WINNING_NUMBERS";
      numbers: number[];
    }
  | {
      type: "BET_PLACED";
      betNumbers: number[];
      remainingBalance: number;
    }
  | {
      type: "INSUFFICIENT_FUNDS";
      balance: number;
    }
  | {
      type: "RESULT";
      matches: number;
      wonAmount: number;
      balance: number;
    }
  | {
      type: "WINNING_NUMBERS";
      numbers: number[];
    };

export enum GameStatus {
  "Inactive" = "Inactive",
  "Active" = "Active",
  "GameOver" = "GameOver",
}
