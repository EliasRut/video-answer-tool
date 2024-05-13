export interface AnswerSegment {
  text: string;
  imageUrl: string;
  speechFileUrl: string;
  speechFileDuration: number;
}

export interface Answer {
  segments: AnswerSegment[];
}
