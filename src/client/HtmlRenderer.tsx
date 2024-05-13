import { AnswerSegment } from "../shared/Answer";
import styles from "./HtmlRenderer.module.css";

export interface HtmlRendererProps {
  segment: AnswerSegment;
}

export const HtmlRenderer = ({ segment }: HtmlRendererProps) => {
  return (
    <div className={styles.segment}>
      <p className={styles.text}>{segment.text}</p>
      <img
        key={segment.imageUrl}
        src={segment.imageUrl}
        alt="segment"
        className={styles.image}
        style={{
          animationDuration: `${segment.speechFileDuration}s`,
        }}
      />
    </div>
  );
};
