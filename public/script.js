const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 3000;
app.use(express.static("public"));

let players = {};
let chaserId = null;

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);
  players[socket.id] = { x: 0, z: 0, isChaser: false };

  if (Object.keys(players).length === 1) {
    chaserId = socket.id;
    players[socket.id].isChaser = true;
  }

  io.emit("updatePlayers", players);

  socket.on("playerMove", (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].z = data.z;

      // Catching logic
      if (players[socket.id].isChaser) {
        for (const id in players) {
          if (id !== socket.id) {
            const dx = players[id].x - data.x;
            const dz = players[id].z - data.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 1.5) {
              players[socket.id].isChaser = false;
              players[id].isChaser = true;
              chaserId = id;
              break;
            }
          }
        }
      }

      io.emit("updatePlayers", players);
    }
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    delete players[socket.id];

    if (socket.id === chaserId) {
      const remaining = Object.keys(players);
      if (remaining.length > 0) {
        chaserId = remaining[0];
        players[chaserId].isChaser = true;
      }
    }

    io.emit("updatePlayers", players);
  });
});

http.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});
