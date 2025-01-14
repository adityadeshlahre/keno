import UserManager from "../UserManager";
import Game from "../GameState";
import { WebSocket, WebSocketServer } from "ws";
import { GameStatus } from "@repo/types";

const server = new WebSocketServer({ port: 1122 });
let wsMock: WebSocket;

const userManager = UserManager.getInstance();

jest.setTimeout(10000);

// eslint-disable-next-line prefer-const
let ID: number = 0;
const INITIAL_BALANCE = 1000;
const BET_COST_PER_NUMBER = 50;

describe("UserManager", () => {
  beforeAll(async () => {
    server.on("connection", (ws: WebSocket) => {
      ws.send(JSON.stringify({ type: "User Server" }));
    });
    wsMock = new WebSocket("ws://localhost:1122");
    wsMock.send = jest.fn();
    // Reset game state before each test
    await new Promise((resolve) => wsMock.on("open", resolve));
  });

  afterAll(() => {
    wsMock.close();
    server.close();
  });

  beforeEach(() => {
    // Reset game state before each test
    Game.status = GameStatus.Inactive;
    Game.bets = [];
    Game.winningNumbers = [];
    userManager._user = {};
  });

  test("should connect a user with an initial balance", () => {
    userManager.connectUser(wsMock);

    const user = Object.values(userManager._user).find(
      (user) => user.ws === wsMock
    );

    expect(user).toBeDefined();
    expect(user?.balance).toBe(1000);

    const sentMessage = JSON.parse((wsMock.send as jest.Mock).mock.calls[0][0]);

    expect(sentMessage).toEqual(
      expect.objectContaining({
        type: "CONNECTED",
        balance: 1000,
      })
    );
  });

  test("should allow user to place a bet", () => {
    const user = userManager._user[ID];
    Game.status = GameStatus.Inactive;
    userManager.connectUser(wsMock);

    const betNumbers = [1, 2, 3, 4, 5];
    userManager.placeBet(ID, wsMock, betNumbers);

    // const user = Object.values(userManager._user).find(
    //   (user) => user.ws === wsMock
    // );

    expect(user?.betNumbers).toEqual(betNumbers);
    expect(user?.balance).toBe(
      INITIAL_BALANCE - BET_COST_PER_NUMBER * betNumbers.length
    ); // 10$ per number
    const sentMessage = JSON.parse((wsMock.send as jest.Mock).mock.calls[1][0]);

    expect(sentMessage).toEqual(
      expect.objectContaining({
        type: "BET_PLACED",
        betNumbers: betNumbers,
        remainingBalance: user?.balance,
      })
    );
  });

  test("should reject bet if game is inactive", () => {
    Game.status = GameStatus.Inactive;
    userManager.connectUser(wsMock);

    const betNumbers = [1, 2, 3, 4, 5];
    userManager.placeBet(ID, wsMock, betNumbers);

    const sentMessage = JSON.parse((wsMock.send as jest.Mock).mock.calls[4][0]);
    expect(sentMessage).toEqual(
      expect.objectContaining({
        type: "error",
        message: "Game is not active",
      })
    );
  });

  test("should reject bet if user has insufficient funds", () => {
    userManager.connectUser(wsMock);
    Game.status = GameStatus.Active;
    const range = Array.from({ length: 80 }, (_, i) => i + 1); // [1, 2, ..., 80]
    const shuffled = range.sort(() => Math.random() - 0.5); // Shuffle the array
    const betNumbers = shuffled.slice(0, 21); // Pick the first 21 numbers
    userManager.placeBet(ID, wsMock, betNumbers);
    const sentMessage = JSON.parse((wsMock.send as jest.Mock).mock.calls[6][0]);
    console.log(sentMessage);
    expect(sentMessage).toEqual(
      expect.objectContaining({
        type: "error",
        message: "Insufficient funds",
      })
    );
  });

  test("should allow user to check balance", () => {
    userManager.connectUser(wsMock);

    userManager.getUserBalance(wsMock);

    const sentMessage = JSON.parse((wsMock.send as jest.Mock).mock.calls[8][0]);
    expect(sentMessage).toEqual(
      expect.objectContaining({
        type: "BALANCE",
        balance: 1000,
      })
    );
  });

  test("should disconnect a user", () => {
    userManager.connectUser(wsMock);

    userManager.removeUser(ID);

    const user = Object.values(userManager._user).find(
      (user) => user.id === ID
    );

    expect(user).toBeUndefined();
    console.log("User disconnected successfully");
  });
});
