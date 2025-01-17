import { useState, useEffect, useRef } from "react";
import VanillaTilt from "vanilla-tilt";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { GameStatus } from "@repo/types";
import { useSocket } from "./../hooks/use-socket";

const MAX_SELECTIONS = 20;
// const BET_AMOUNTS = [10, 20, 50, 100];
const BET_AMOUNTS = [50];

//need to fix the edge case of the bet amount if(wrong Number) is removed which does not exist in the bet array, leads to wrong balance deduction + duplication of the bet amount

const KenoBoard = () => {
  const { socket, loading } = useSocket();
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectedBet, setSelectedBet] = useState<number>(BET_AMOUNTS[0]);
  const [currentSelecetdBet, setCurrentSelectedBet] = useState<number>(
    BET_AMOUNTS[0]
  ); // wiil be sent to ws
  const [currentSelecetdNumber, setCurrentSelectedNumber] = useState<
    number | null
  >(null); // wiil be sent to ws
  const [currentGameStatus, setCurrentGameStatus] = useState<GameStatus>(
    GameStatus.Inactive
  );
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [theBets, setTheBets] = useState<
    {
      number: number[];
      amount: number;
    }[]
  >([{ number: [], amount: currentSelecetdBet }]);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && socket) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.onmessage = (event: any) => {
        const data = JSON.parse(event.data);
        if (data.type === "CONNECTED") {
          setCurrentBalance(data.balance);
          setCurrentGameStatus(data.state);
        }

        if (data.type === "USER_BALANCE") {
          setCurrentBalance(data.balance);
        }

        if (data.type === "GAME_STOPPED") {
          setCurrentGameStatus(GameStatus.Inactive);
          toast.error("Game is stopped");
        }

        if (data.type === "GAME_STARTED") {
          setCurrentGameStatus(GameStatus.Active);
          toast.success("Game is started");
        }

        if (data.type === "GAME_ENDED") {
          setCurrentGameStatus(GameStatus.Inactive);
          setSelectedNumbers([]);
          toast.success("Game is ended");
        }

        if (data.type === "GAME_RESET") {
          setCurrentGameStatus(GameStatus.Inactive);
          toast.success("Game is restarted");
        }

        if (data.type === "GAME_NOT_ACTIVE") {
          toast.error("Game is not active");
        }

        if (data.type === "RESULT") {
          toast.success(`You won $${data.wonAmount}`);
          toast.success(`numberOfMatches: ${data.numberOfMatches}`);
          toast.success(
            `playerMatches: ${data.playerMatchedNumbers.join(", ")}`
          );
          toast.success(
            `playerBetterNumbers: ${data.playerBetNumbers.join(", ")}`
          );
        }

        if (data.type === "WIN") {
          toast.success(`You won $${data.wonAmount}`);
          toast.success(`Updated balance: $${data.balance}`);
          setCurrentBalance(data.balance);
        }

        if (data.type === "LOSS") {
          toast.success(`You won $${data.wonAmount}`);
          toast.success(`Updated balance: $${data.balance}`);
        }

        if (data.type === "INSUFFICIENT_FUNDS") {
          toast.error("Insufficient funds");
        }

        if (data.type === "BET_PLACED") {
          toast.success("Bet placed");
        }
      };
    }
  }, [socket, loading]);

  useEffect(() => {
    if (boardRef.current) {
      VanillaTilt.init(boardRef.current, {
        max: 10,
        speed: 400,
        glare: true,
        "max-glare": 0.2,
      });
    }

    console.log("Keno board initialized");
  }, []);

  const handleNumberClick = (number: number) => {
    console.log("Number clicked:", number);

    if (!selectedBet) {
      toast.error("Please select a bet amount first");
      return;
    }

    const isDeselected =
      selectedNumbers.includes(number) || currentSelecetdNumber === number;

    setCurrentSelectedNumber((prev) => {
      if (prev === number) {
        return null;
      }
      return number;
    });

    setSelectedNumbers((prev) => {
      if (prev.includes(number)) {
        console.log("Number deselected:", number);
        return prev.filter((n) => n !== number);
      }

      if (prev.length >= MAX_SELECTIONS) {
        console.log("Maximum selections reached");
        toast.error(`Maximum ${MAX_SELECTIONS} numbers allowed`);
        return prev;
      }

      console.log("Number selected:", number);
      return [...prev, number];
    });

    setTheBets((prev) => {
      const existingBet = prev.find((bet) => bet.amount === selectedBet);

      if (existingBet) {
        // If number exists, toggle it (add/remove)
        if (existingBet.number.includes(number)) {
          return prev.map((bet) =>
            bet.amount === selectedBet
              ? { ...bet, number: bet.number.filter((n) => n !== number) }
              : bet
          );
        }

        if (existingBet.number.length >= MAX_SELECTIONS) {
          toast.error(`Maximum ${MAX_SELECTIONS} numbers allowed`);
          return prev;
        }

        return prev.map((bet) =>
          bet.amount === selectedBet
            ? { ...bet, number: [...bet.number, number] }
            : bet
        );
      }

      // If no bet exists for the selectedBet, create a new one
      return [...prev, { number: [number], amount: selectedBet }];
    });

    if (isDeselected) {
      console.log("Sending UNBET to socket");
      socket.send(
        JSON.stringify({
          type: "UNBET",
          unBetNumbers: { numbers: [number], amount: selectedBet },
        })
      );
    } else {
      console.log("Sending BET to socket");
      socket.send(
        JSON.stringify({
          type: "BET",
          betNumbers: { numbers: [number], amount: selectedBet },
        })
      );
    }

    socket.send(JSON.stringify({ type: "BALANCE" }));
  };

  const handleBetSelection = (amount: number) => {
    console.log("Bet amount selected:", amount);
    setSelectedBet(amount);
    setCurrentSelectedBet(amount);
    setTheBets((prev) => {
      const existingBet = prev.find((bet) => bet.amount === amount);

      if (!existingBet) {
        // Add a new bet entry if it doesn't exist
        return [...prev, { number: [], amount }];
      }

      return prev;
    });
    toast.success(`Bet amount set to $${amount}`);
  };

  const clearSelections = () => {
    console.log("Clearing selections");
    socket.send(JSON.stringify({ type: "CLEAR_BET" }));
    setSelectedNumbers([]);
    setTheBets([]);
    toast.success("Selections cleared");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-purple-900 to-gray-900">
      {/* Bet Selection */}
      <div className="mb-2 px-6 py-2 rounded-sm font-bold text-lg bg-gray-800 text-white">
        currentGameStatus : {currentGameStatus}
      </div>
      <div className="mb-2 px-6 py-2 rounded-sm font-bold text-lg bg-gray-800 text-white">
        currentBalance : {currentBalance}
      </div>
      <div className="mb-6 flex gap-4">
        {BET_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => {
              if (currentGameStatus === GameStatus.Active) {
                handleBetSelection(amount);
              } else {
                toast.error("Game is not active");
              }
            }}
            className={`
              px-6 py-2 rounded-full font-bold text-lg transition-all duration-300
              ${selectedBet === amount ? "betting-amount-selected" : "bg-gray-800 text-white hover:bg-gray-700"}
            `}
          >
            ${amount}
          </button>
        ))}
      </div>

      <div
        ref={boardRef}
        className="keno-board p-6 rounded-xl shadow-2xl max-w-3xl w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-white tracking-wider">KENO</h1>
          <div className="text-white">
            Selected: {selectedNumbers.length}/{MAX_SELECTIONS}
          </div>
        </div>

        <div className="grid grid-cols-10 gap-1.5 bg-black/50 p-4 rounded-lg">
          {Array.from({ length: 80 }, (_, i) => i + 1).map((number) => (
            <button
              key={number}
              onClick={() => {
                if (currentGameStatus === GameStatus.Active) {
                  handleNumberClick(number);
                } else {
                  toast.error("Game is not active");
                }
              }}
              className={`
                number-cell
                aspect-square
                flex
                items-center
                justify-center
                text-base
                font-bold
                rounded-full
                transition-all
                duration-300
                ${
                  selectedNumbers.includes(number)
                    ? "number-selected"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }
              `}
            >
              {number}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={clearSelections}
        className="mt-8 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full"
      >
        Clear Selections
      </Button>
    </div>
  );
};

export default KenoBoard;
