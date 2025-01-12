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
      type: "END_GAME";
      wiinnigNumbers: Number[];
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
      type: "BET_PLACED";
      numbers: Number[];
      remainingBalance: number;
    };

export enum GameState {
  Inactive,
  Active,
  GameOver,
}

export type Bet = {
  betNumbers: Number[];
};
