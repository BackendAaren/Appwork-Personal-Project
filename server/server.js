import express from "express";
const app = express();

app.get("/receive", async (req, res) => {
  try {
    const result = await collection.findOneAndDelete({});
    const message = result.value;
    if (!message) {
      return res.status(204).send("No messages available");
    }
    console.log("Message retrieved from MongoDB:", message);
    res.json({ message });
  } catch (error) {
    console.error("Failed to retrieve message from MongoDB", error);
    res.status(500).send("Failed to retrieve message");
  }
});

const port = 6001;
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
