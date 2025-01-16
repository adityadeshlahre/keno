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
      betNumbers: { numbers: number[]; amount: number };
    }
  | {
      type: "UNBET";
      unBetNumbers: { numbers: number[]; amount: number };
    }
  | {
      type: "CLEAR_BET";
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
      type: "ADMIN_CONNECTED";
      userId: number;
    }
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
      type: "GAME_ENDED";
    }
  | {
      type: "RESET_GAME";
    }
  | {
      type: "BETS_CLEARED";
    }
  | {
      type: "WIN";
      wonAmount: number;
      balance: number;
      winningNumbers: number[];
    }
  | {
      type: "LOSS";
      wonAmount: number;
      balance: number;
      winningNumbers: number[];
    }
  | {
      type: "BET_PLACED";
      bets: { numbers: number[]; amount: number }[];
      remainingBalance: number;
    }
  | {
      type: "BET_UNPLACED";
      bets: { numbers: number[]; amount: number }[];
      remainingBalance: number;
    }
  | {
      type: "INSUFFICIENT_FUNDS";
      balance: number;
    }
  | {
      type: "RESULT";
      numberOfMatches: number;
      playerMatchedNumbers: number[];
      playerBettedNumbers: number[];
      wonAmount: number;
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
