import "./App.css";
import styles from "./App.module.css";

import { useEffect, useState } from "react";

import { Answer } from "../shared/Answer";
import { CanvasRenderer } from "./CanvasRenderer";
import mockData from "./mockData";
import { HtmlRenderer } from "./HtmlRenderer";

// This is needed to handle closure in startNewSegment
let externalActiveSegment = 0;

function App() {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [answer, setAnswer] = useState<Answer | undefined>(undefined);
  const [activeSegment, setActiveSegment] = useState<number>(0);
  const [isUsingCanvasRenderer, setIsUsingCanvasRenderer] =
    useState<boolean>(false);
  const [hasFinished, setHasFinished] = useState<boolean>(false);

  const startNewSegment = () => {
    const audio = new Audio(
      answer!.segments[externalActiveSegment].speechFileUrl
    );
    audio.onended = () => {
      if (externalActiveSegment < answer!.segments.length - 1) {
        setActiveSegment((prev) => prev + 1);
        externalActiveSegment++;
        startNewSegment();
      } else {
        setHasFinished(true);
      }
    };
    audio.play();
  };

  useEffect(() => {
    if (answer && !isLoading && !isUsingCanvasRenderer) {
      startNewSegment();
    }
  }, [answer, isLoading, isUsingCanvasRenderer]);

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
                setIsUsingCanvasRenderer(false);
                setIsLoading(true);
                const response = await fetch("/question", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ question, saveImagesLocally: true }),
                });
                const data = (await response.json()) as Answer;
                setAnswer(data);
                setIsLoading(false);

                // Mock for prototyping
                // const soundFileIds = mockData.segments.map(
                //   (segment) =>
                //     segment.speechFileUrl.split("/").pop()?.split(".")[0]
                // );
                // fetch("http://localhost:3000/video", {
                //   method: "POST",
                //   headers: {
                //     "Content-Type": "application/json",
                //   },
                //   body: JSON.stringify({
                //     videoId: "b2hyw3os1sc46m8lgqviso",
                //     soundFileIds,
                //   }),
                // }).then((response) => {
                //   console.log(response);
                // });

                // setAnswer(mockData);
                // setIsLoading(false);
              }}
            >
              Generate Preview
            </button>
            <button
              className={styles.getAnswerButton}
              onClick={async () => {
                // setAnswer(dummyAnswer);
                setIsUsingCanvasRenderer(true);
                setIsLoading(true);
                const response = await fetch("/question", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ question, saveImagesLocally: true }),
                });
                const data = (await response.json()) as Answer;
                setAnswer(data);
                setIsLoading(false);

                // Mock for prototyping
                // const soundFileIds = mockData.segments.map(
                //   (segment) =>
                //     segment.speechFileUrl.split("/").pop()?.split(".")[0]
                // );
                // fetch("http://localhost:3000/video", {
                //   method: "POST",
                //   headers: {
                //     "Content-Type": "application/json",
                //   },
                //   body: JSON.stringify({
                //     videoId: "b2hyw3os1sc46m8lgqviso",
                //     soundFileIds,
                //   }),
                // }).then((response) => {
                //   console.log(response);
                // });

                // setAnswer(mockData);
                // setIsLoading(false);
              }}
            >
              Generate Video
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
            {answer.segments.map((segment, index) => (
              <img
                src={segment.imageUrl}
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
    if (isUsingCanvasRenderer) {
      return (
        <div className="App">
          <CanvasRenderer answer={answer} />
        </div>
      );
    } else {
      return (
        <div className="App">
          <div className={styles.container}>
            <HtmlRenderer segment={answer.segments[activeSegment]} />
          </div>
          {hasFinished ? (
            <div className={styles.buttonWrapper}>
              <button
                onClick={() => {
                  externalActiveSegment = 0;
                  setHasFinished(false);
                  setActiveSegment(0);
                  startNewSegment();
                }}
              >
                Replay
              </button>
            </div>
          ) : (
            <div className={styles.buttonWrapper}></div>
          )}
          <div className={styles.buttonWrapper}>
            <button
              onClick={() => {
                externalActiveSegment = 0;
                setHasFinished(false);
                setActiveSegment(0);
                setAnswer(undefined);
                setIsLoading(false);
              }}
            >
              Restart
            </button>
          </div>
        </div>
      );
    }
  }
}

export default App;
