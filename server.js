// server.js — Node + Express + Socket.io
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 3000;

// Statische Files (index.html, script.js, …)
app.use(express.static("public"));

/* ──────────────────────────────────────────
   Game-State
────────────────────────────────────────── */
let players = {};      // { socketId: { x, z, isChaser } }
let chaserId = null;   // ID des aktuellen Fängers

/* ──────────────────────────────────────────
   Socket-Events
────────────────────────────────────────── */
io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // Spawn-Daten
  players[socket.id] = { x: 0, z: 0, isChaser: false };

  // Erster Spieler ⇒ Chaser
  if (!chaserId) {
    chaserId = socket.id;
    players[chaserId].isChaser = true;
  }

  io.emit("updatePlayers", players);

  /* Spielerbewegung */
  socket.on("playerMove", ({ x, z }) => {
    if (!players[socket.id]) return;
    players[socket.id].x = x;
    players[socket.id].z = z;

    // Fang-Logik – nur prüfen, wenn dieser Spieler Chaser ist
    if (players[socket.id].isChaser) {
      for (const id in players) {
        if (id === socket.id) continue;
        const dx = players[id].x - x;
        const dz = players[id].z - z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 1.5) {                 // Tag-Radius
          players[socket.id].isChaser = false;
          players[id].isChaser = true;
          chaserId = id;
          break;
        }
      }
    }

    io.emit("updatePlayers", players);
  });

  /* Disconnect */
  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    const wasChaser = players[socket.id]?.isChaser;
    delete players[socket.id];

    // Neuen Chaser wählen, falls nötig
    if (wasChaser) {
      const ids = Object.keys(players);
      chaserId = ids[0] || null;
      if (chaserId) players[chaserId].isChaser = true;
    }

    io.emit("updatePlayers", players);
  });
});

/* ──────────────────────────────────────────
   Kick-off
────────────────────────────────────────── */
http.listen(PORT, () => {
  console.log(`🚀 Server live @ http://localhost:${PORT}`);
});
