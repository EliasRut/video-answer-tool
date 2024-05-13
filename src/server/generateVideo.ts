import fs from "fs";
import { VideoRequest } from "../shared/VideoRequest.js";
import FFmpeg from "fluent-ffmpeg";

import util from "util";
import { exec as execCallback } from "child_process";

const exec = util.promisify(execCallback);

async function generateVideo(
  videoId: string,
  videoPath: string,
  soundFilePaths: string[]
): Promise<string> {
  const audioInputCommand = soundFilePaths
    .map((soundFilePath) => `-i ${soundFilePath}`)
    .join(" ");
  const audioFilter = `-filter_complex "[1:a][2:a][3:a]concat=n=3:a=1:v=0"`;
  let command = `ffmpeg -i ${videoPath} ${audioInputCommand} ${audioFilter} -c:v libx264 -c:a aac ./public/videos/${videoId}.mp4`;
  console.log(`Starting command: ${command}`);
  const { stdout, stderr } = await exec(command);
  console.log("stdout:", stdout);
  console.log("stderr:", stderr);
  return "http://localhost:3000/videos/" + videoId + ".mp4";
}

export default generateVideo;
