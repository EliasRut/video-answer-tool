import fs from "fs";

async function uploadVideo(videoDataBlob: any): Promise<string> {
  const uid =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  const filepath = `./public/videos/${uid}.webm`;
  fs.writeFileSync(filepath, videoDataBlob);
  return `http://localhost:3000/videos/${uid}.webm`;
}

export default uploadVideo;
