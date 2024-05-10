const OpenAI = require("openai");
const Groq = require("groq-sdk");
const generateAnswer = require("./generateAnswer");

const openai = new OpenAI();
const groq = new Groq();

const question = "Who is Donald Trump?";
generateAnswer(groq, openai, question).then((answer) => {
  console.log("Answer generated!");
  console.log(answer);
});
