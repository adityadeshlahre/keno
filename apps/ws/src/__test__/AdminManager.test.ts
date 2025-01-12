import { AdminController } from "src/controllers/AdminManager";
import gameState from "../GameState";
import { WebSocket, WebSocketServer } from "ws";

const server = new WebSocketServer({ port: 3344 });
let wsMock: WebSocket;

const adminController = AdminController.getInstance();

jest.setTimeout(10000);

describe("AdminController", () => {
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
    gameState.status = "inactive";
    gameState.bets = [];
    gameState.winningNumbers = [];
  });

  test("should start the game", () => {
    adminController.startGame();

    expect(gameState.status).toBe("active");
    expect(gameState.bets).toEqual([]);
    expect(gameState.winningNumbers).toEqual([]);
  });

  test("should stop the game", () => {
    gameState.status = "active"; // Set initial status as active
    adminController.stopGame();

    expect(gameState.status).toBe("inactive");
  });

  test("should select 20 winning numbers", () => {
    adminController.selectWinningNumbers([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ]);

    expect(gameState.winningNumbers).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ]);
  });

  test("should generate 20 random winning numbers if none provided", () => {
    adminController.selectWinningNumbers();

    expect(gameState.winningNumbers.length).toBe(20);
    gameState.winningNumbers.forEach((num) => {
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

    gameState.bets.push(userBet);

    // Admin selects winning numbers
    adminController.selectWinningNumbers([
      1, 2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
    ]);

    adminController.announceResults();

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
