import AdminManager from "../AdminManager";
import Game from "../GameState";
import { WebSocket, WebSocketServer } from "ws";
import { GameStatus } from "@repo/types";

const server = new WebSocketServer({ port: 3344 });
let wsMock: WebSocket;

const adminManager = AdminManager.getInstance();

jest.setTimeout(10000);

describe("AdminManager", () => {
  console.log("beforeAll");
  beforeAll(async () => {
    server.on("connection", (ws: WebSocket) => {
      ws.send(JSON.stringify({ type: "Admin Server" }));
    });
    wsMock = new WebSocket("ws://localhost:3344");
    wsMock.send = jest.fn();
    await new Promise((resolve) => wsMock.on("open", resolve));
    wsMock.send(
      JSON.stringify({
        type: "ADMIN_CONNECT",
        password: "admin",
      })
    );
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

  test("should start the game", () => {
    adminManager.startGame();

    expect(Game.status).toBe("active");
    expect(Game.bets).toEqual([]);
    expect(Game.winningNumbers).toEqual([]);
  });

  test("should stop the game", () => {
    Game.status = GameStatus.Inactive; // Set initial status as active
    adminManager.stopGame();

    expect(Game.status).toBe("inactive");
  });

  test("should select 20 winning numbers", () => {
    adminManager.selectWinningNumbers([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ]);

    expect(Game.winningNumbers).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ]);
  });

  test("should generate 20 random winning numbers if none provided", () => {
    adminManager.selectWinningNumbers();

    expect(Game.winningNumbers.length).toBe(20);
    Game.winningNumbers.forEach((num) => {
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(80);
    });
  });

  test("should announce results and update user balance", () => {
    // Mock a user placing a bet
    const userBet = {
      socket: wsMock,
      numbers: [1, 2, 3, 4, 5],
      balance: 1000,
    };

    Game.bets.push(userBet);

    // Admin selects winning numbers
    adminManager.selectWinningNumbers([
      1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
    ]);

    adminManager.announceResults();

    // Check if user received updated balance
    const sentMessage = JSON.parse((wsMock.send as jest.Mock).mock.calls[2][0]);
    expect(sentMessage).toEqual(
      expect.objectContaining({
        type: "RESULT",
        matches: 3,
        payout: 1000 + 3 * 50, // Assuming 10$ per match {inital balance + (matches * 50)}
        newBalance: 2150,
      })
    );
  });
});
