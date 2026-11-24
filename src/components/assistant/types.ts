export type JarvisLanguage = 'kn' | 'en';
export interface JarvisMessage {
  role: 'user' | 'assistant';
  content: string;
}
