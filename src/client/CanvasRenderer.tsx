import { useEffect, useRef, useState } from "react";
import { Answer, AnswerSegment } from "../shared/Answer";
import styles from "./CanvasRenderer.module.css";
import {
  FONT_SIZE,
  SCREEN_CAPTURE_MIME_TYPE,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "./constants";
import { getLines, preloadImages } from "./helpers";

export interface CanavsRendererProps {
  answer: Answer;
}

const ZOOM_LEVEL = 0.1;

const renderSegment = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  textLines: string[],
  progress: number
) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  // Keep aspect ratio but cover the whole canvas
  const scaleFactor = image.height / VIDEO_HEIGHT;
  const aspectRatio = image.width / image.height;
  //   const scaledWidth = VIDEO_WIDTH;
  const scaledWidth = VIDEO_WIDTH * scaleFactor;
  const scaledXPos = (image.width - scaledWidth) / 2;
  //   const scaledYPos = (VIDEO_HEIGHT - scaledHeight) / 2;
  //   const sourceXOffset = ;
  const zoomedXPos = scaledXPos * (1 + ZOOM_LEVEL * progress);
  const zoomedYPos = image.height * (ZOOM_LEVEL * progress);
  const zoomedWidth = scaledWidth * (1 - ZOOM_LEVEL * progress);
  const zoomedHeight = image.height * (1 - ZOOM_LEVEL * progress);
  ctx.drawImage(
    image,
    zoomedXPos,
    zoomedYPos,
    zoomedWidth,
    zoomedHeight,
    0,
    0,
    VIDEO_WIDTH,
    VIDEO_HEIGHT
  );

  // Draw semi-transparent overlay behind text
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  const padding = VIDEO_WIDTH * 0.025;
  const lineHeight = FONT_SIZE * 1.25;
  const firstLineYPos =
    VIDEO_HEIGHT - textLines.length * lineHeight - padding + 0.25 * lineHeight;
  ctx.fillRect(
    padding,
    firstLineYPos - 2 * padding - 0.25 * lineHeight,
    VIDEO_WIDTH - 2 * padding,
    textLines.length * lineHeight + 2 * padding
  );

  ctx.font = `${FONT_SIZE}px Arial`;
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  for (let i = 0; i < textLines.length; i++) {
    ctx.fillText(textLines[i], VIDEO_WIDTH / 2, firstLineYPos + i * lineHeight);
  }
};

interface AnimationLoopProps {
  canvas: HTMLCanvasElement;
  vid: HTMLVideoElement;
  images: HTMLImageElement[];
  textLines: string[][];
  answer: Answer;
}

const startAnimationLoop = (props: AnimationLoopProps) => {
  const ctx = props.canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const startTime = Date.now();
  const playbackTime = props.answer.segments.reduce(
    (sum, segment) => sum + segment.speechFileDuration,
    0
  );
  const segmentStartTimes: number[] = [];
  let summedTime = startTime;
  props.answer.segments.forEach((segment) => {
    segmentStartTimes.push(summedTime);
    summedTime += segment.speechFileDuration * 1000;
  });

  const chunks: any[] = [];

  const recorder = new MediaRecorder(ctx.canvas.captureStream(60));

  recorder.ondataavailable = (evt: any) => {
    // store our final video's chunks
    if (evt.data.size > 0) {
      chunks.push(evt.data);
    }
  };
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: recorder.mimeType });
    console.log(blob);
    const objectUrl = URL.createObjectURL(blob);
    fetch("http://localhost:3000/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: blob,
    })
      .then((res) => {
        return res.json();
      })
      .then((resJson) => {
        const { url } = resJson;
        console.log(url);
        const uid = url.split("/").pop().split(".")[0];
        return uid;
      })
      .then((uid) => {
        fetch("http://localhost:3000/video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoId: uid,
            soundFileIds: props.answer.segments.map(
              (segment) => segment.speechFileUrl.split("/").pop()?.split(".")[0]
            ),
          }),
        })
          .then((response) => {
            console.log(response);
            return response.json();
          })
          .then((resJson) => {
            const { videoUrl } = resJson;
            (document.getElementById("vid") as HTMLVideoElement).src = videoUrl;
          });
      });
    //     })
  };

  animationLoopStep({
    ...props,
    ctx,
    startTime,
    endTime: summedTime,
    segmentStartTimes,
    recorder,
    // canvas2videoInstance,
  });

  recorder.start();

  //   recorder.start();

  //   setTimeout(() => recorder.stop(), 3000);
};

interface AnimationLoopStepProps extends AnimationLoopProps {
  ctx: CanvasRenderingContext2D;
  startTime: number;
  endTime: number;
  segmentStartTimes: number[];
  recorder: MediaRecorder;
  //   canvas2videoInstance: Canvas2Video;
}

const fakeAnimationLoop = (mainCanvas: HTMLCanvasElement) => {
  const aCtx = mainCanvas.getContext("2d")!;
  aCtx.fillStyle = "blue";

  const w = mainCanvas.width;
  const h = mainCanvas.height;
  const draw = () => {
    aCtx.fillRect(0, 0, w, h);
    requestAnimationFrame(draw);
  };

  draw();
};

const animationLoopStep = (props: AnimationLoopStepProps) => {
  const {
    ctx,
    images,
    textLines,
    answer,
    startTime,
    endTime,
    segmentStartTimes,
  } = props;
  const now = Date.now();
  if (now > endTime) {
    props.recorder.stop();

    return;
  }

  const currentSegment = segmentStartTimes.findLastIndex(
    (segmentStartTime) => now >= segmentStartTime
  );

  const timePassedInSegment = now - segmentStartTimes[currentSegment];
  const segmentProgressPercent =
    timePassedInSegment /
    (answer.segments[currentSegment].speechFileDuration * 1000);

  renderSegment(
    ctx,
    images[currentSegment],
    textLines[currentSegment],
    segmentProgressPercent
  );
  requestAnimationFrame(() => animationLoopStep(props));
};

// Renders the content with text and images in a canvas
export const CanvasRenderer = ({ answer }: CanavsRendererProps) => {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [textLines, setTextLines] = useState<string[][]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const vid = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!canvas.current) {
      return;
    }
    const ctx = canvas.current.getContext("2d");
    if (!ctx) {
      return;
    }
    setTextLines(
      answer.segments.map((segment) =>
        getLines(ctx, segment.text, VIDEO_WIDTH * 0.9)
      )
    );
  }, [canvas.current, answer.segments, setTextLines]);

  // Preload images
  useEffect(() => {
    preloadImages(answer.segments).then((images) => {
      setImages(images);
    });
  }, [answer.segments, setImages]);

  useEffect(() => {
    if (!canvas.current || images.length === 0 || textLines.length === 0) {
      return;
    }
    startAnimationLoop({
      canvas: canvas.current,
      vid: vid.current!,
      images,
      textLines,
      answer,
    });
  }, [canvas.current, images, textLines]);

  return (
    <div className={styles.container}>
      <canvas
        className={styles.canvas}
        ref={canvas}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
      {/*<video ref={vid} controls></video> */}
    </div>
  );
};
