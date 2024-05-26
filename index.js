import express from "express";
import cors from "cors";
import { GenerateCode } from "./generate.js";
import fs from "fs";
import path from "path";

const app = express();
const directoryPath = path.join(process.cwd(), "code");

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const { userInput } = req.body;
    //const apiKey = req.headers["openai-api-key"];

    console.log("Query Received: ", userInput);
    //console.log("API Key: ", apiKey);

    const response = await GenerateCode(userInput);

    fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to read directory" });
      }

      const fileList = files.map((file) => ({
        name: file.name,
        type: file.isDirectory() ? "directory" : "file",
      }));

      res.status(200).json({ response, fileList });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Internal Server Error" });
  }
});

app.get("/files", (req, res) => {
  fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to read directory" });
    }

    const fileList = files.map((file) => ({
      name: file.name,
      type: file.isDirectory() ? "directory" : "file",
    }));

    res.status(200).json(fileList);
  });
});

app.get("/download", (req, res) => {
  const { file } = req.query;
  const filePath = path.join(process.cwd(), "code", file);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

app.get("/content", (req, res) => {
  const { file } = req.query;
  const filePath = path.join(directoryPath, file);

  if (fs.existsSync(filePath)) {
    fs.readFile(filePath, { encoding: "utf-8" }, (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to read file content" });
      }
      res.status(200).json({ content: data });
    });
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
