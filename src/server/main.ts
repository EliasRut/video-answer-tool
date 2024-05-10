import express from "express";
import ViteExpress from "vite-express";
import OpenAI from "openai";
import Groq from "groq-sdk";
import generateAnswer from "./generateAnswer.js";
import bodyParser from "body-parser";

const openai = new OpenAI();
const groq = new Groq();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/question", (req, res) => {
  const question = req.body.question;
  generateAnswer(groq, openai, question).then((answer) => {
    console.log("Answer generated!");
    console.log(answer);
    res.json(answer);
  });
});

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on port 3000...")
);
