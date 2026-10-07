/** A photographed plate's name from its components, biggest first: "Pilav", "Pilav ve Somon", "Pilav, Somon ve Brokoli". */
export function plateName(componentNames: string[]): string {
  const names = componentNames.slice(0, 3);
  const name = names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} ve ${names[names.length - 1]}`;
  return name.slice(0, 120);
}
