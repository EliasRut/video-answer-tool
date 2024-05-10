import "./App.css";
import styles from "./App.module.css";

import { useEffect, useState } from "react";

import { Answer } from "../shared/Answer";

const dummyAnswer = {
  segments: [
    "Donald Trump was the 45th President of the United States, serving from 2017 to 2021. He is a businessman, media personality, and politician who became known for his populist and nationalist policies.",
    "Trump's importance lies in his unconventional political style, which fueled widespread controversy and protests throughout his presidency.",
    "His presidency was marked by numerous controversies, tweets, and policies that had a significant impact on American politics and society, with many of his actions still influencing the country today.",
  ],
  imageUrls: [
    "//upload.wikimedia.org/wikipedia/commons/thumb/5/56/Donald_Trump_official_portrait.jpg/220px-Donald_Trump_official_portrait.jpg",
    "//upload.wikimedia.org/wikipedia/commons/thumb/9/90/Donald_Trump_speaking_at_CPAC_2011_by_Mark_Taylor.jpg/220px-Donald_Trump_speaking_at_CPAC_2011_by_Mark_Taylor.jpg",
    "//upload.wikimedia.org/wikipedia/commons/thumb/d/d9/White_House_Press_Briefing_%2849666120807%29.jpg/220px-White_House_Press_Briefing_%2849666120807%29.jpg",
  ],
  speechFileUrls: [
    "http://localhost:3000/public/audio/e0pyim2l90pbtg6bl0grun.mp3",
    "http://localhost:3000/public/audio/47wtc3glzml0bt1wib6538i.mp3",
    "http://localhost:3000/public/audio/otqbxe8s2t72frw13lp5cl.mp3",
  ],
  speechFileLengths: [5, 5, 5],
};

let externalActiveSegment = 0;

function App() {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [answer, setAnswer] = useState<Answer | undefined>(undefined);
  const [activeSegment, setActiveSegment] = useState<number>(0);

  const startNewSegment = () => {
    const audio = new Audio(answer!.speechFileUrls[externalActiveSegment]);
    audio.onended = () => {
      if (externalActiveSegment < answer!.speechFileUrls.length - 1) {
        setActiveSegment((prev) => prev + 1);
        externalActiveSegment++;
        startNewSegment();
      }
    };
    audio.play();
  };

  useEffect(() => {
    if (answer && !isLoading) {
      startNewSegment();
    }
  }, [answer, isLoading]);

  if (!isLoading && !answer) {
    return (
      <div className="App">
        <div className={styles.container}>
          <div>
            <input
              className={styles.questionInput}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <div>
            <button
              className={styles.getAnswerButton}
              onClick={async () => {
                // setAnswer(dummyAnswer);
                setIsLoading(true);
                const response = await fetch("/question", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ question }),
                });
                const data = (await response.json()) as Answer;
                setAnswer(data);
                // setIsLoading(false);
              }}
            >
              Generate Answer
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="App">
        <div className={styles.container}>
          <div>Loading...</div>
        </div>
        {answer && (
          <div className={styles.imagePreloader}>
            {answer.imageUrls.map((imageUrl, index) => (
              <img
                src={imageUrl}
                alt="segment"
                {...(index === 0 ? { onLoad: () => setIsLoading(false) } : {})}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  if (answer) {
    console.log(`Audio length: ${answer.speechFileDurations[activeSegment]}s`);
    return (
      <div className="App">
        <div className={styles.container}>
          <div className={styles.segment}>
            <p className={styles.text}>{answer.segments[activeSegment]}</p>
            <img
              key={answer.imageUrls[activeSegment]}
              src={answer.imageUrls[activeSegment]}
              alt="segment"
              className={styles.image}
              style={{
                animationDuration: `${answer.speechFileDurations[activeSegment]}s`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default App;
