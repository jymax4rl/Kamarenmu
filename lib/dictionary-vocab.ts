export const PARTS_OF_SPEECH = [
  "NOUN", "VERB", "ADJECTIVE", "ADVERB", "PRONOUN",
  "AUXILIARY", "PARTICLE", "INTERJECTION", "CONJUNCTION",
  "POSTPOSITION", "NUMERAL", "EXPRESSION", "PROVERB",
  "IDIOM", "TITLE", "NAME", "QUESTION_WORD",
] as const;

export const WORD_TYPES = [
  "WORD", "PHRASE", "SENTENCE", "PROVERB",
  "IDIOM", "EXPRESSION", "GRAMMAR_RULE", "CONVERSATION",
] as const;

export const DIALECTS = [
  "MALI", "SENEGAL", "MAURITANIA", "GAMBIA", "DIASPORA", "UNKNOWN",
] as const;

export const SEMANTIC_CATEGORIES = [
  "FAMILY", "ANIMALS", "FOOD", "AGRICULTURE", "NATURE",
  "WEATHER", "BODY", "EMOTIONS", "RELIGION", "POLITICS",
  "TRADE", "MUSIC", "ORAL_TRADITION", "WARFARE", "HISTORY",
  "TIME", "NUMBERS", "COLORS", "EDUCATION", "TECHNOLOGY",
  "TRANSPORT", "HOME", "CLOTHING", "HEALTH", "MARRIAGE",
  "SOCIAL_RELATIONS", "SPIRITUALITY", "WORK", "TOOLS",
  "MOVEMENT", "COMMUNICATION", "THOUGHT", "GEOGRAPHY",
  "ROYALTY", "CULTURE", "FESTIVALS", "DAILY_LIFE",
] as const;

export const FREQUENCY_LEVELS = [
  "VERY_COMMON", "COMMON", "UNCOMMON", "RARE", "ARCHAIC",
] as const;

export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number];
export type WordType = (typeof WORD_TYPES)[number];
export type Dialect = (typeof DIALECTS)[number];
export type SemanticCategory = (typeof SEMANTIC_CATEGORIES)[number];
export type FrequencyLevel = (typeof FREQUENCY_LEVELS)[number];

/** Human-readable label for display */
export function labelOf(value: string): string {
  return value.replace(/_/g, " ");
}
