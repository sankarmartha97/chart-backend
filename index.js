const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const cors = require("cors");
const siofu = require("socketio-file-upload");

const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const router = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const room = 'test';
app.use(cors());
app.use(router);


io.on("connect", (socket) => {
  const uploader = new siofu();
  uploader.dir = "uploads";
  uploader.listen(socket);

  uploader.on("saved", function (event) {console.log("saved..");console.log(event.file.name);});
  uploader.on("error", function (data) {console.log("Error: "); });

  socket.on("join", ({ name }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    socket.join(user.room);

    socket.emit("message", {
      user: "Sankar",
      message: `${user.name}, Hi i am Sankar, Welcome to Sankar's Chart room.`,
      type: 'text'
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "Sankar", message: `${user.name} has joined!`, type: "text"});

    callback();
  });

  socket.on("sendMessage", (message, type, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, message: message ,type: type});

    callback();
  });

  socket.on("sendFileMessage", (message, file, filename, type, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, message: message, file:file, filename: filename, type: type});

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: "Admin",
        message: `${user.name} has left.`,
      });
    }
  });
});

server.listen(process.env.PORT || 80, () =>
  console.log(`Server has started.`)
);
