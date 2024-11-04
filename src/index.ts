import { WebSocketServer, WebSocket } from "ws";
const wss = new WebSocketServer({ port: 8080 });

const roomsMap = new Map<string, Set<string>>();
const sockets = new Map<string, any>();

function generateRandomId() {
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

wss.on("connection", (ws) => {
  console.log("New client connected");

  const id = generateRandomId();
  sockets.set(id, { socket: ws });
  console.log("peers and their id's are:", sockets);

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("message", (data: any) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case "joined-room":
          handleJoinRoom(ws, message.roomId, id);
          break;
        case "offer":
          handleOffer(message);
          break;
        case "answer":
          handleAnswer(message);
          break;
        case "ice-candidate":
          handleIceCandidate(message);
          break;
        default:
          console.error("Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  ws.on("close", () => {
    sockets.delete(id);
    roomsMap.forEach((peerSet, roomId) => {
      if (peerSet.has(id)) {
        peerSet.delete(id);
        if (peerSet.size === 0) {
          roomsMap.delete(roomId);
        }
      }
    });
    console.log("Client disconnected", id);
  });
});

function handleJoinRoom(ws: WebSocket, roomId: string, socketId: string) {
  if (!roomsMap.has(roomId)) {
    roomsMap.set(roomId, new Set());
  }
  const socketSet = roomsMap.get(roomId)!;
  socketSet.add(socketId);

  // Send existing peers to the new peer
  const socketArray = Array.from(socketSet).filter((id) => id !== socketId);
  ws.send(
    JSON.stringify({
      type: "presentSocketInRoom",
      mySocketId: socketId,
      sockets: socketArray,
    }),
  );

  console.log(`Peer ${socketId} joined room ${roomId}`, socketArray);
}

function handleOffer(message: any) {
  const receiver = sockets.get(message.rsid);
  if (receiver && receiver.socket.readyState === WebSocket.OPEN) {
    receiver.socket.send(
      JSON.stringify({
        type: "offer",
        offer: message.offer,
        ssid: message.ssid,
        rsid: message.rsid,
        senderPeerId: message.senderPeerId,
        receiverPeerId: message.receiverPeerId,
        isNegotation: message.isNegotation,
      }),
    );
  }
}

function handleAnswer(message: any) {
  const sender = sockets.get(message.ssid);

  if (sender && sender.socket.readyState === WebSocket.OPEN) {
    sender.socket.send(
      JSON.stringify({
        type: "answer",
        answer: message.answer,
        ssid: message.ssid,
        rsid: message.rsid,
        senderPeerId: message.senderPeerId,
        receiverPeerId: message.receiverPeerId,
        isNegotation: message.isNegotation,
      }),
    );
  }
}

function handleIceCandidate(message: any) {
  let receiver;
  if (message.sender) {
    receiver = sockets.get(message.rsid);
  } else {
    receiver = sockets.get(message.ssid);
    console.log("ice candidiate is here", message);
  }
  if (receiver && receiver.socket.readyState === WebSocket.OPEN) {
    receiver.socket.send(
      JSON.stringify({
        type: "ice-candidate",
        candidate: message.candidate,
        ssid: message.ssid,
        rsid: message.rsid,
        receiverPeerId: message.receiverPeerId,
        senderPeerId: message.senderPeerId,
        sender: message.sender,
      }),
    );
  }
}

console.log("WebSocket server is running on ws://localhost:8080");
