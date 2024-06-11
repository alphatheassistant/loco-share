const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// In-memory data store for users
const users = new Map();

// Function to calculate distance between two coordinates
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle user login
  socket.on('login', (userData) => {
    const { username } = userData;
    users.set(socket.id, { username, socket });
    console.log(`${username} has logged in`);

    // Get user's location
    socket.on('location', (coords) => {
      const { latitude, longitude } = coords;
      const user = users.get(socket.id);
      user.latitude = latitude;
      user.longitude = longitude;

      // Calculate distance between users
      const nearbyUsers = Array.from(users.values()).filter((otherUser) => {
        if (otherUser.socket.id === socket.id) return false; // Skip the current user
        if (!otherUser.latitude || !otherUser.longitude) return false; // Skip users without location

        const distance = getDistance(
          latitude,
          longitude,
          otherUser.latitude,
          otherUser.longitude
        );
        return distance <= 50 * 1000; // 50 meters radius
      });

      // Emit nearby users to the client
      socket.emit('nearby-users', nearbyUsers.map((user) => ({
        id: user.socket.id,
        username: user.username,
      })));
    });
  });

  // Handle file transfer
  socket.on('file-transfer', (data) => {
    const { receiver, name, type, data: fileData } = data;
    const receiverSocket = users.get(receiver)?.socket;

    if (receiverSocket) {
      receiverSocket.emit('incoming-file', {
        sender: users.get(socket.id).username,
        name,
        type,
        data: fileData,
      });
    } else {
      console.log(`User ${receiver} not found`);
    }
  });

  // Handle file transfer response (allow or deny)
  socket.on('file-transfer-response', (response) => {
    const { response: responseType, fileData } = response;
    const { sender, name, type, data } = fileData;
    const senderSocket = users.get(sender)?.socket;

    if (senderSocket) {
      senderSocket.emit('file-transfer-response', {
        responseType,
        name,
        type,
        data,
      });
    } else {
      console.log(`User ${sender} not found`);
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      console.log(`${user.username} has disconnected`);
      users.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
