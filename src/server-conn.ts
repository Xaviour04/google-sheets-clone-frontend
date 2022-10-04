import type {
  ServerLookUpResponse,
  TableConfig,
} from './server-response-interfaces';

let pingTimerSetTimeOutID: NodeJS.Timeout;
const pingInterval = 30_000; // 30,000 ms = 30 sec;

function pingServer(connection: WebSocket, duration: number) {
  pingTimerSetTimeOutID = setTimeout(
    () => pingServer(connection, duration),
    duration,
  );
}

export function connectWS(
  id: string,
  on?: {
    open?: () => void;
    close?: () => void;
    message?: (message: ServerLookUpResponse) => void;
  },
): WebSocket {
  const connection = new WebSocket(
    `ws://${window.location.host}/connect-ws/${id}`,
  );

  connection.onopen = () => {
    pingTimerSetTimeOutID = setTimeout(
      () => pingServer(connection, pingInterval),
      pingInterval,
    );

    on?.open && on.open();
  };

  connection.onclose = () => on?.close && on.close();

  connection.onmessage = ({ data }) => {
    if (!data) return;
    const jsonData = JSON.parse(data);

    if (Object.keys(jsonData).includes('error')) {
      console.error(`Server Error: ${jsonData['error']}`);
      return;
    }

    const content = jsonData as ServerLookUpResponse;
    on?.message && on.message(content);
  };

  connection.onerror = console.error;

  return connection;
}
