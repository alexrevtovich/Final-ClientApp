import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

// Initialize SignalR connection
export const initSignalRConnection = (onChargingStatusUpdate: (stationId: string, count: number) => void): HubConnection => {
  const connection = new HubConnectionBuilder()
    .withUrl("/chathub") // Replace "/chathub" with your SignalR hub endpoint
    .withAutomaticReconnect()
    .build();

  connection.on("broadcastMessage", onChargingStatusUpdate);

  connection.start()
    .then(() => console.log("Connected to SignalR hub."))
    .catch((err) => console.error('Error establishing connection:', err));

  return connection;
};

// Send a message to broadcast charging status
export const sendChargingStatus = (connection: HubConnection, stationId: string, count: number) => {
  connection.send("BroadcastMessageToRoom", stationId, count)
    .catch(err => console.error("Error sending message:", err));
};
