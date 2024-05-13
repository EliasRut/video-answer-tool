import Groq from "groq-sdk";
import OpenAI from "openai";
import html2plaintext from "html2plaintext";
import fs from "fs";
import { Answer } from "../shared/Answer.js";
import { ErrorResponse } from "../shared/ErrorResponse.js";
import mp3Duration from "mp3-duration";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { sleep } from "../shared/sleep.js";

async function downloadImage(url: string, filepath: string) {
  let res: any;

  console.log("Downloading image", url);
  for (let i = 0; i < 10; i++) {
    try {
      res = await fetch(url);
      break;
    } catch (error) {
      console.error("Error downloading image, retrying. Error was ", error);
      await sleep(1000);
    }
  }
  if (!res || !res.body) {
    throw new Error("Failed to download image");
  }
  const body = res.body as any;
  const fileStream = fs.createWriteStream(filepath, { flags: "wx" });
  await finished(Readable.fromWeb(body).pipe(fileStream));
}

async function generateAnswer(
  groq: Groq,
  openai: OpenAI,
  question: string,
  saveImagesLocally: boolean
): Promise<Answer | ErrorResponse> {
  // Search for the article on Wikipedia
  const wikiBaseUrl = `https://en.wikipedia.org/w/api.php`;
  const params = {
    action: "query",
    generator: "search",
    gsrsearch: question,
    prop: "pageprops|info",
    gsrlimit: "3",
    gsrnamespace: "0",
    ppprop: "disambiguation",
    inprop: "url",
    format: "json",
    formatversion: "2",
  };
  const searchUrl = `${wikiBaseUrl}?${new URLSearchParams(params)}`;
  let response: Response | undefined = undefined;
  let retryCount = 0;
  while (retryCount < 3 && !response) {
    try {
      response = await fetch(searchUrl);
    } catch (error) {
      console.error("Error fetching search results from Wikipedia", error);
    }
  }
  if (!response) {
    return { errorMessage: "Failed to fetch search results from Wikipedia" };
  }
  const searchData = await response.json();
  const searchResults = searchData.query.pages;
  if (!searchResults) {
    return { errorMessage: "No search results found on Wikipedia" };
  }
  const firstSearchResult = searchResults[0];
  const articleTitle = firstSearchResult.title;
  const transformedArticleTitle = articleTitle.replace(/ /g, "_");

  const articleUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&&disabletoc=1&page=${transformedArticleTitle}`;
  // Fetch the article from Wikipedia
  response = undefined;
  retryCount = 0;
  while (retryCount < 3 && !response) {
    try {
      response = await fetch(articleUrl);
    } catch (error) {
      console.error("Error fetching article from Wikipedia", error);
    }
  }
  if (!response) {
    return { errorMessage: "Failed to fetch article from Wikipedia" };
  }
  const articleData = await response.json();
  console.log(articleData);
  const articleText = articleData.parse.text["*"];
  const images: string[] = articleText.match(/<img[^>]+>/g);
  const imageAltTexts: string[] = images.map((image: string) => {
    const altText = image.match(/alt="([^"]+)"/);
    return (altText && altText[1]) || "";
  });
  const imageBaseUrl = `https://en.wikipedia.org/w/index.php?title=Special:Redirect/file/File:`;
  const imageUrls: string[] = images
    .map((image: string) => {
      const imageUrl = image.match(/src="([^"]+)"/);
      const url = (imageUrl && imageUrl[1]) || "";
      console.log(url);
      return url;
    })
    .map((imageUrl) => {
      // Base url: https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Donald_Trump_official_portrait_%28cropped%29.jpg/113px-Donald_Trump_official_portrait_%28cropped%29.jpg
      // Target url: https://en.wikipedia.org/wiki/Donald_Trump#/media/File:Donald_Trump_official_portrait_(cropped).jpg
      const fileName = imageUrl.split("/").pop();
      let cleanedFileName = fileName;
      if (cleanedFileName?.indexOf("px-") !== -1) {
        cleanedFileName = cleanedFileName!.split("px-")[1];
      }
      cleanedFileName = cleanedFileName?.replace("svg.png", "svg");

      return `${imageBaseUrl}${cleanedFileName}`;
    });
  const imageMap = imageAltTexts.reduce((acc, altText, index) => {
    if (!altText || `${altText}` === "null" || `${altText}` === "undefined") {
      return acc;
    }
    acc[altText] = imageUrls[index];
    return acc;
  }, {} as Record<string, string>);
  console.log(imageMap);

  const plainText = html2plaintext(articleText);
  // Limit the number of characters to 8000
  const articleTextLimit = plainText.substring(0, 8000);

  const message = `### Answer the following question based on a wikipedia article with three sentences with corresponding images. A list of image alt texts is provided to select from. Try to start with an overview and end on something recent.
  #### Format: Use the following json format: {"segments": [{"text": string, "image": number}, {"text": string, "image": number}, {"text": string, "image": number}]}.
  ### Images: ${Object.keys(imageMap)
    .map((imageAlt, index) => `${index}: "${imageAlt}"`)
    .join(", ")}
  ### Article: ${articleTextLimit}
  ### Question: ${question}`;

  const completion = await groq.chat.completions.create({
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: message,
      },
    ],
    model: "llama3-70b-8192",
  });

  const result = completion.choices[0].message.content;
  const resultJson = JSON.parse(result || "{}");
  const segments: { text: string; image: number }[] = resultJson.segments;

  const selectedImageUrls = segments.map((segment) => {
    return imageUrls[segment.image] || "";
  });
  // const downloadedImageUrls: string[] = ["", "", ""];
  const speechFilePaths: string[] = ["", "", ""];
  const speechFileUrls: string[] = ["", "", ""];
  console.log(segments);

  const audioPromises = [];
  for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
    const segment = segments[segmentIndex];
    const audioPromise = openai.audio.speech
      .create({
        model: "tts-1",
        voice: "alloy",
        input: segment.text,
      })
      .then((response) => {
        return response.arrayBuffer();
      })
      .then((buffer) => {
        const uid =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);
        const fileName = `${uid}.mp3`;
        const speechFilePath = `./public/audio/${fileName}`;
        speechFilePaths[segmentIndex] = speechFilePath;

        // generate uid for the audio file
        const speechFileUrl = `http://localhost:3000/audio/${fileName}`;
        speechFileUrls[segmentIndex] = speechFileUrl;
        fs.writeFileSync(speechFilePath, Buffer.from(buffer));
      });
    audioPromises.push(audioPromise);
  }
  await Promise.all(audioPromises);

  const speechFileDurations = await Promise.all(
    speechFilePaths.map((speechFilePath) => {
      return new Promise<number>((resolve, reject) => {
        mp3Duration(speechFilePath, function (err: Error, duration: number) {
          if (err) return reject(err);
          resolve(duration);
        });
      });
    })
  );

  const downloadedImageUrls = saveImagesLocally
    ? await Promise.all(
        selectedImageUrls.map((imageUrl, index) => {
          const uid =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
          const imageUrlFileType = imageUrl.split(".").pop();
          const fileName = `${uid}.${imageUrlFileType}`;
          const filePath = `./public/images/${fileName}`;
          return downloadImage(imageUrl, filePath).then(() => {
            return `http://localhost:3000/images/${fileName}`;
          });
        })
      )
    : selectedImageUrls;

  return {
    segments: segments.map((text, index) => {
      return {
        text: text.text,
        imageUrl: downloadedImageUrls[index],
        speechFileUrl: speechFileUrls[index],
        speechFileDuration: speechFileDurations[index],
      };
    }),
  };
}

export default generateAnswer;
