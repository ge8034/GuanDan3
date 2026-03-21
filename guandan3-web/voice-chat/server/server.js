const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port: PORT });

const rooms = new Map();
const clients = new Map();

console.log(`信令服务器启动在端口 ${PORT}`);

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  clients.set(clientId, { ws, roomId: null, userId: null, userName: null });

  console.log(`客户端连接: ${clientId}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(clientId, data);
    } catch (error) {
      console.error('消息解析错误:', error);
      sendError(ws, '消息格式错误');
    }
  });

  ws.on('close', () => {
    handleDisconnect(clientId);
  });

  ws.on('error', (error) => {
    console.error(`客户端错误 ${clientId}:`, error);
    handleDisconnect(clientId);
  });
});

function handleMessage(clientId, data) {
  const client = clients.get(clientId);
  if (!client) return;

  switch (data.type) {
    case 'create_room':
      handleCreateRoom(clientId, data);
      break;
    case 'join_room':
      handleJoinRoom(clientId, data);
      break;
    case 'leave_room':
      handleLeaveRoom(clientId);
      break;
    case 'offer':
      handleOffer(clientId, data);
      break;
    case 'answer':
      handleAnswer(clientId, data);
      break;
    case 'ice_candidate':
      handleIceCandidate(clientId, data);
      break;
    case 'toggle_mute':
      handleToggleMute(clientId, data);
      break;
    case 'end_call':
      handleEndCall(clientId);
      break;
    default:
      console.log(`未知消息类型: ${data.type}`);
  }
}

function handleCreateRoom(clientId, data) {
  const client = clients.get(clientId);
  const roomId = uuidv4();

  const room = {
    id: roomId,
    members: new Map(),
    createdAt: Date.now()
  };

  room.members.set(clientId, {
    userId: data.userId || clientId,
    userName: data.userName || `用户${clientId.substring(0, 8)}`,
    isMuted: false,
    joinedAt: Date.now()
  });

  rooms.set(roomId, room);
  client.roomId = roomId;
  client.userId = data.userId || clientId;
  client.userName = data.userName || `用户${clientId.substring(0, 8)}`;

  sendToClient(clientId, {
    type: 'room_created',
    roomId: roomId,
    members: getRoomMembers(roomId)
  });

  console.log(`房间创建: ${roomId}, 创建者: ${client.userName}`);
}

function handleJoinRoom(clientId, data) {
  const client = clients.get(clientId);
  const room = rooms.get(data.roomId);

  if (!room) {
    sendError(client.ws, '房间不存在');
    return;
  }

  if (room.members.size >= 50) {
    sendError(client.ws, '房间已满');
    return;
  }

  room.members.set(clientId, {
    userId: data.userId || clientId,
    userName: data.userName || `用户${clientId.substring(0, 8)}`,
    isMuted: false,
    joinedAt: Date.now()
  });

  client.roomId = data.roomId;
  client.userId = data.userId || clientId;
  client.userName = data.userName || `用户${clientId.substring(0, 8)}`;

  sendToClient(clientId, {
    type: 'room_joined',
    roomId: data.roomId,
    members: getRoomMembers(data.roomId)
  });

  broadcastToRoom(data.roomId, {
    type: 'user_joined',
    userId: client.userId,
    userName: client.userName,
    clientId: clientId
  }, clientId);

  console.log(`用户加入房间: ${client.userName} -> ${data.roomId}`);
}

function handleLeaveRoom(clientId) {
  const client = clients.get(clientId);
  if (!client || !client.roomId) return;

  const room = rooms.get(client.roomId);
  if (room) {
    room.members.delete(clientId);

    broadcastToRoom(client.roomId, {
      type: 'user_left',
      userId: client.userId,
      userName: client.userName,
      clientId: clientId
    });

    if (room.members.size === 0) {
      rooms.delete(client.roomId);
      console.log(`房间已清空并删除: ${client.roomId}`);
    }
  }

  client.roomId = null;
  sendToClient(clientId, { type: 'room_left' });

  console.log(`用户离开房间: ${client.userName}`);
}

function handleOffer(clientId, data) {
  const client = clients.get(clientId);
  if (!client || !client.roomId) return;

  const room = rooms.get(client.roomId);
  if (!room) return;

  const targetClient = findClientByUserId(data.targetUserId);
  if (!targetClient) return;

  sendToClient(targetClient.clientId, {
    type: 'offer',
    offer: data.offer,
    senderId: client.userId,
    senderName: client.userName,
    senderClientId: clientId
  });
}

function handleAnswer(clientId, data) {
  const client = clients.get(clientId);
  if (!client || !client.roomId) return;

  const targetClient = findClientByUserId(data.targetUserId);
  if (!targetClient) return;

  sendToClient(targetClient.clientId, {
    type: 'answer',
    answer: data.answer,
    senderId: client.userId
  });
}

function handleIceCandidate(clientId, data) {
  const client = clients.get(clientId);
  if (!client || !client.roomId) return;

  const targetClient = findClientByUserId(data.targetUserId);
  if (!targetClient) return;

  sendToClient(targetClient.clientId, {
    type: 'ice_candidate',
    candidate: data.candidate,
    senderId: client.userId
  });
}

function handleToggleMute(clientId, data) {
  const client = clients.get(clientId);
  if (!client || !client.roomId) return;

  const room = rooms.get(client.roomId);
  if (!room) return;

  const member = room.members.get(clientId);
  if (member) {
    member.isMuted = data.isMuted;

    broadcastToRoom(client.roomId, {
      type: 'user_muted',
      userId: client.userId,
      isMuted: data.isMuted
    });
  }
}

function handleEndCall(clientId) {
  const client = clients.get(clientId);
  if (!client || !client.roomId) return;

  broadcastToRoom(client.roomId, {
    type: 'call_ended',
    userId: client.userId
  });

  handleLeaveRoom(clientId);
}

function handleDisconnect(clientId) {
  const client = clients.get(clientId);
  if (!client) return;

  if (client.roomId) {
    const room = rooms.get(client.roomId);
    if (room) {
      room.members.delete(clientId);

      broadcastToRoom(client.roomId, {
        type: 'user_left',
        userId: client.userId,
        userName: client.userName,
        clientId: clientId
      });

      if (room.members.size === 0) {
        rooms.delete(client.roomId);
        console.log(`房间已清空并删除: ${client.roomId}`);
      }
    }
  }

  clients.delete(clientId);
  console.log(`客户端断开连接: ${clientId}`);
}

function sendToClient(clientId, data) {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(data));
  }
}

function sendError(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'error',
      message: message
    }));
  }
}

function broadcastToRoom(roomId, data, excludeClientId = null) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.members.forEach((member, clientId) => {
    if (clientId !== excludeClientId) {
      sendToClient(clientId, data);
    }
  });
}

function getRoomMembers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];

  return Array.from(room.members.values()).map(member => ({
    userId: member.userId,
    userName: member.userName,
    isMuted: member.isMuted,
    joinedAt: member.joinedAt
  }));
}

function findClientByUserId(userId) {
  for (const [clientId, client] of clients.entries()) {
    if (client.userId === userId) {
      return { clientId, ...client };
    }
  }
  return null;
}

setInterval(() => {
  const now = Date.now();
  rooms.forEach((room, roomId) => {
    room.members.forEach((member, clientId) => {
      const client = clients.get(clientId);
      if (client && client.ws.readyState !== WebSocket.OPEN) {
        room.members.delete(clientId);
        broadcastToRoom(roomId, {
          type: 'user_left',
          userId: member.userId,
          userName: member.userName,
          clientId: clientId
        });
      }
    });

    if (room.members.size === 0) {
      rooms.delete(roomId);
      console.log(`房间已清空并删除: ${roomId}`);
    }
  });
}, 30000);

console.log('信令服务器运行中...');
