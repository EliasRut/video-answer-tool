import { AnswerSegment } from "../shared/Answer";
import { FONT_SIZE } from "./constants";

export const getLines = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) => {
  var words = text.split(" ");
  var lines = [];
  var currentLine = words[0];
  ctx.font = `${FONT_SIZE}px Arial`;

  for (var i = 1; i < words.length; i++) {
    var word = words[i];
    var width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

export const preloadImages = (segments: AnswerSegment[]) => {
  const imagePromises: Promise<HTMLImageElement>[] = [];

  segments.forEach((segment) => {
    const image = new Image();
    imagePromises.push(
      new Promise((resolve) => {
        image.onload = () => {
          resolve(image);
        };
      })
    );
    image.crossOrigin = "anonymous";
    image.src = segment.imageUrl;
  });

  return Promise.all(imagePromises);
};
