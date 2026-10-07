const BAD = ["fuck", "shit", "bitch", "cunt", "nigg", "fag", "retard", "kys", "kill yourself", "slut", "whore", "dick", "pussy", "rape"];
export function isFlagged(text: string) {
  const t = text.toLowerCase();
  return BAD.some((w) => t.includes(w));
}
