export function foldSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-PE");
}

export function searchTokens(query: string) {
  return foldSearchText(query).trim().split(/\s+/).filter(Boolean);
}

export function matchesCatalogSearch(text: string, query: string) {
  const foldedText = foldSearchText(text);
  const compactText = foldedText.replace(/[^\p{L}\p{N}]/gu, "");
  return searchTokens(query).every((token) => {
    const compactToken = token.replace(/[^\p{L}\p{N}]/gu, "");
    return foldedText.includes(token) || Boolean(compactToken && compactText.includes(compactToken));
  });
}

export function catalogFamilyMode(familyCount: number) {
  return familyCount <= 6 ? "chips" as const : "folders" as const;
}
