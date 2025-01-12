import UserController from "../UserManager";
import Game from "../GameState";
import { WebSocket, WebSocketServer } from "ws";
import { GameStatus } from "@repo/types";

const server = new WebSocketServer({ port: 1122 });
let wsMock: WebSocket;

const userController = UserController.getInstance();

jest.setTimeout(10000);

let ID: number = 0;

describe("UserController", () => {
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
  });

  test("should connect a user with an initial balance", () => {
    userController.connectUser(wsMock);

    const user = Game.bets.find((user) => user.socket === wsMock);

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
    Game.status = GameStatus.Inactive;
    userController.connectUser(wsMock);

    const betNumbers = [1, 2, 3, 4, 5];
    userController.placeBet(ID, wsMock, betNumbers); //bet placed

    const user = Game.bets.find((user) => user.socket === wsMock);
    console.log(user?.numbers);
    expect(user?.numbers).toEqual(betNumbers);
    expect(user?.balance).toBe(1000 - 50 * betNumbers.length); // 10$ per number
    const sentMessage = JSON.parse((wsMock.send as jest.Mock).mock.calls[2][0]);

    expect(sentMessage).toEqual(
      expect.objectContaining({
        type: "BET_PLACED",
        numbers: betNumbers,
        remainingBalance: user?.balance,
      })
    );
  });

  test("should reject bet if game is inactive", () => {
    Game.status = GameStatus.Inactive;
    userController.connectUser(wsMock);

    const betNumbers = [1, 2, 3, 4, 5];
    userController.placeBet(ID, wsMock, betNumbers);

    const sentMessage = JSON.parse((wsMock.send as jest.Mock).mock.calls[4][0]);
    expect(sentMessage).toEqual(
      expect.objectContaining({
        type: "error",
        message: "Game is not active",
      })
    );
  });

  test("should reject bet if user has insufficient funds", () => {
    userController.connectUser(wsMock);
    Game.status = GameStatus.Active;
    const range = Array.from({ length: 80 }, (_, i) => i + 1); // [1, 2, ..., 80]
    const shuffled = range.sort(() => Math.random() - 0.5); // Shuffle the array
    const betNumbers = shuffled.slice(0, 21); // Pick the first 21 numbers
    userController.placeBet(ID, wsMock, betNumbers);
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
    userController.connectUser(wsMock);

    userController.getUserBalance(wsMock);

    const sentMessage = JSON.parse((wsMock.send as jest.Mock).mock.calls[8][0]);
    expect(sentMessage).toEqual(
      expect.objectContaining({
        type: "BALANCE",
        balance: 1000,
      })
    );
  });

  test("should disconnect a user", () => {
    userController.connectUser(wsMock);

    userController.removeUser(1);

    const user = Game.bets.find((user) => user.socket === wsMock);

    expect(user).toBeUndefined();
    console.log("User disconnected successfully");
  });
});
