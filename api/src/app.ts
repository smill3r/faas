import express from "express";
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/api", (req, res) => {
  res.send(`Hello from Node.js API on port ${PORT} on container ${process.env.ID}`);
  console.log(`Request handled by instance on port ${PORT} on container ${process.env.ID}`);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
