import express from "express";
import ViteExpress from "vite-express";
import OpenAI from "openai";
import Groq from "groq-sdk";
import generateAnswer from "./generateAnswer.js";
import bodyParser from "body-parser";
import uploadVideo from "./uploadVideo.js";
import { VideoRequest } from "../shared/VideoRequest.js";
import generateVideo from "./generateVideo.js";
import fs from "fs";

const openai = new OpenAI();
const groq = new Groq();

const app = express();
app.use(["/question", "/video"], bodyParser.urlencoded({ extended: false }));
app.use(["/question", "/video"], bodyParser.json());

app.post("/question", (req, res) => {
  const question = req.body.question;
  const saveImagesLocally = req.body.saveImagesLocally || false;
  try {
    generateAnswer(groq, openai, question, saveImagesLocally).then((answer) => {
      console.log("Answer generated!");
      console.log(answer);
      res.json(answer);
    });
  } catch (error) {
    console.error("Error generating answer", error);
    res.status(500).send("Error generating answer");
  }
});

app.post("/upload", express.raw({ type: "*/*", limit: "1gb" }), (req, res) => {
  const buffer = req.body;
  console.log(buffer);

  uploadVideo(buffer).then((url) => {
    console.log("Video generated!");
    res.json({ url });
  });
});

app.post("/video", (req, res) => {
  const { videoId, soundFileIds } = req.body as VideoRequest;
  // Check that the file exists
  const videoFilepath = `./public/videos/${videoId}.webm`;
  if (!fs.existsSync(videoFilepath)) {
    throw new Error(`Video file ${videoFilepath} not found`);
  }

  const soundFileBasePath = "./public/audio/";
  const soundFileExtension = ".mp3";
  const soundFilePaths = soundFileIds.map(
    (soundFileId) => `${soundFileBasePath}${soundFileId}${soundFileExtension}`
  );
  for (const soundFilePath of soundFilePaths) {
    if (!fs.existsSync(soundFilePath)) {
      throw new Error(`Sound file ${soundFilePath} not found`);
    }
  }
  generateVideo(videoId, videoFilepath, soundFilePaths).then((videoUrl) => {
    console.log("Video generated!");
    res.json({ videoUrl });
  });
});

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000...")
);
