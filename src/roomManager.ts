import WebSocket from "ws";

class roomManager {
  roomId: string;
  senderSocket: WebSocket;
  receiverSocket: WebSocket | null;

  constructor(roomId: string, senderSocket: WebSocket) {
    (this.roomId = roomId),
      (this.senderSocket = senderSocket),
      (this.receiverSocket = null);
  }

  addReceiver(receiverSocket: WebSocket) {
    this.receiverSocket = receiverSocket;
  }

  toSender(data: any) {
    this.senderSocket.send(JSON.stringify(data));
  }
  toReceiver(data: any) {
    this.receiverSocket?.send(JSON.stringify(data));
  }

  sendIceCandidate(ws: WebSocket, data: any) {
    if (ws === this.senderSocket) {
      this.toReceiver(data);
    } else if (ws === this.receiverSocket) {
      this.toSender(data);
    }
  }
}

export default roomManager;
