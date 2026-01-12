// Helper compartilhado para mapeamento UUID <-> number
class IdMapper {
  private uuidToNumberMap = new Map<string, number>();
  private numberToUuidMap = new Map<number, string>();
  private nextId = 1;

  uuidToNumber(uuid: string): number {
    if (!this.uuidToNumberMap.has(uuid)) {
      this.uuidToNumberMap.set(uuid, this.nextId);
      this.numberToUuidMap.set(this.nextId, uuid);
      this.nextId++;
    }
    return this.uuidToNumberMap.get(uuid)!;
  }

  numberToUuid(num: number): string | undefined {
    return this.numberToUuidMap.get(num);
  }

  clear(): void {
    this.uuidToNumberMap.clear();
    this.numberToUuidMap.clear();
    this.nextId = 1;
  }
}

export const idMapper = new IdMapper();



