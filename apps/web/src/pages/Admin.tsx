import { GameStatus } from "@repo/types/";
import { useSocket } from "@/hooks/use-socket";
import { useEffect, useState } from "react";

const Admin = () => {
  return <AdminButton />;
};

export default Admin;

const AdminButton = () => {
  const { socket, loading } = useSocket();
  const [adminSetup, setAdminSetup] = useState<boolean>(false);
  const [currentGameStatus, setCurrentGameStatus] = useState<GameStatus>(
    GameStatus.Inactive
  );
  const [currentAdminUserId, setCurrentAdminUserId] = useState<number>();
  const [winnigNumbers, setWinnigNumbers] = useState<string[]>(
    Array(20).fill("")
  );

  useEffect(() => {
    if (!loading && socket) {
      socket.onmessage = (event: any) => {
        const data = JSON.parse(event.data);

        if (data.type === "CONNECTED") {
          setCurrentGameStatus(data.state);
        }

        if (data.type === "ADMIN_CONNECTED") {
          setCurrentAdminUserId(data.userId);
          setAdminSetup(true);
        }
      };
    }
  }, [socket, loading]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-black text-white flex flex-col justify-center text-base">
        <div className="flex justify-center"> connecting... </div>
      </div>
    );
  }

  const handleNumberChange = (index: number, value: string) => {
    if (value === "") {
      setWinnigNumbers((prev) => {
        const newNumbers = [...prev];
        newNumbers[index] = value;
        return newNumbers;
      });
    } else {
      const num = parseInt(value);
      if (!isNaN(num) && num >= 0 && num <= 80) {
        setWinnigNumbers((prev) => {
          const newNumbers = [...prev];
          newNumbers[index] = value;
          return newNumbers;
        });
      }
    }
  };

  const handleEndGame = () => {
    const filledNumbers = winnigNumbers
      .filter((num) => num !== "")
      .map((num) => parseInt(num, 10));
    socket?.send(
      JSON.stringify({
        type: "END_GAME",
        winnigNumbers: filledNumbers,
      })
    );
  };

  return (
    <div className="w-screen h-screen bg-black text-white flex flex-col justify-center">
      <div className="text-2xl flex justify-center">
        currentGameStatus : {currentGameStatus}
      </div>
      <div className="text-2xl flex justify-center">
        currentAdminUserId : {currentAdminUserId}
      </div>
      <br />
      {adminSetup ? (
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              socket?.send(JSON.stringify({ type: "RESET_GAME" }));
            }}
          >
            Reset Game
          </button>
          <br />
          <button
            onClick={() => {
              socket?.send(JSON.stringify({ type: "START_GAME" }));
            }}
          >
            Start Game
          </button>
          <br />
          <button
            onClick={() => {
              socket?.send(JSON.stringify({ type: "STOP_GAME" }));
            }}
          >
            Stop Game
          </button>
          <br />

          <div>
            <button
              onClick={() => {
                socket?.send(JSON.stringify({ type: "END_GAME" }));
              }}
            >
              End Game
            </button>
          </div>
          <br />
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-5 gap-4 mb-4">
              {winnigNumbers.map((num, index) => (
                <input
                  key={index}
                  type="number"
                  min="0"
                  max="80"
                  value={num}
                  onChange={(e) => handleNumberChange(index, e.target.value)}
                  className="p-2 border border-gray-400 rounded text-black"
                />
              ))}
            </div>
            <button onClick={handleEndGame}>
              End Game(Setted Winning Numbers)
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              socket?.send(
                JSON.stringify({ type: "ADMIN_CONNECT", password: "admin" })
              );
            }}
          >
            connect as Admin
          </button>
        </div>
      )}
    </div>
  );
};
