// Enum for kinds of types of items
export enum SurveyControlType {
  text,
  radio,
  checkbox,
  description
}

export enum TestItemType {
  sectionHeader,
  question,
  example,
  training
}

// Types of string for kinds of test
export type TestUrl =
  'ab-test' | 'acr-test' | 'mushra-test' | 'ape-test' | 'hearing-test' | 'audio-labeling' |
  'image-labeling' | 'image-ab' | 'video-labeling' | 'video-ab';
