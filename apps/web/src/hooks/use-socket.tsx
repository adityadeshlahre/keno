import { useState, useEffect } from "react";

const WS_URL = `wss://${process.env.WS_URL}:8080`;
export function useSocket(): { socket: WebSocket; loading: boolean } {
  const [socket, setSocket] = useState<WebSocket>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("connected to server");
      setLoading(false);
    };

    ws.onclose = () => {
      console.log("disconnected from server");
      setLoading(true);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  return { socket: socket as WebSocket, loading };
}
