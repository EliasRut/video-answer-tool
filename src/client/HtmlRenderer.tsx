import { Answer, AnswerSegment } from "../shared/Answer";
import styles from "./HtmlRenderer.module.css";

interface HtmlSegmentProps {
  segment: AnswerSegment;
  isFirstSegment: boolean;
  isLastSegment: boolean;
  displayDelaySec: number;
  zIndexBase: number;
}

export interface HtmlRendererProps {
  answer: Answer;
  replayCounter: number;
}

const HtmlSegment = ({
  isFirstSegment,
  isLastSegment,
  segment,
  displayDelaySec,
  zIndexBase,
}: HtmlSegmentProps) => {
  return (
    <div
      className={[
        styles.segment,
        ...(isFirstSegment
          ? [styles.first]
          : isLastSegment
          ? [styles.last]
          : []),
      ].join(" ")}
      style={{
        animationDuration: `${segment.speechFileDuration}s`,
        animationDelay: `${displayDelaySec + 0.5}s`,
        zIndex: zIndexBase * 10 + 1,
      }}
    >
      <img
        key={segment.imageUrl}
        src={segment.imageUrl}
        alt="segment"
        className={styles.image}
        style={{
          animationDuration: `${segment.speechFileDuration}s`,
          animationDelay: `${displayDelaySec + 0.5}s`,
          zIndex: zIndexBase * 10 + 2,
        }}
      />
      <p className={styles.text} style={{ zIndex: zIndexBase * 10 + 3 }}>
        {segment.text}
      </p>
    </div>
  );
};

export const HtmlRenderer = ({ answer, replayCounter }: HtmlRendererProps) => {
  const displayDelaySecs: number[] = [];
  let totalDelaySec = 0;
  answer.segments.forEach((segment) => {
    displayDelaySecs.push(totalDelaySec);
    totalDelaySec += segment.speechFileDuration;
  });
  return (
    <div className={styles.container}>
      {answer.segments.map((segment, index) => (
        <HtmlSegment
          key={`${replayCounter}_${index}`}
          segment={segment}
          isFirstSegment={index === 0}
          isLastSegment={index === answer.segments.length - 1}
          displayDelaySec={displayDelaySecs[index]}
          zIndexBase={answer.segments.length - index}
        />
      ))}
    </div>
  );
};
