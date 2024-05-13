// TikTok aspect ration is 9:16 (1080x1920)
export const ASPECT_RATIO = 1080 / 1920;

export const MAX_VIDEO_HEIGHT = 1920;

export const VIDEO_HEIGHT = MAX_VIDEO_HEIGHT / 2; // Up to 1920;
export const VIDEO_WIDTH = VIDEO_HEIGHT * ASPECT_RATIO;

export const MAX_FONT_SIZE = 60;

export const FONT_SIZE = (VIDEO_HEIGHT / MAX_VIDEO_HEIGHT) * MAX_FONT_SIZE;
export const SCREEN_CAPTURE_MIME_TYPE = "video/webm;codecs=h264";
