// Shared mine UUID resolver and mappings
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const DEFAULT_MINE_ID = "47d2d435-8bae-49ca-b8d2-b6e71b407e9b";

export const MINE_ID_MAP: Record<string, string> = {
  "M1": "47d2d435-8bae-49ca-b8d2-b6e71b407e9b",
  "fallback-mine-a": "47d2d435-8bae-49ca-b8d2-b6e71b407e9b",
  "Mine A": "47d2d435-8bae-49ca-b8d2-b6e71b407e9b",
  "M2": "5b8238d0-bfdb-443a-a0ce-fc384cd491fe",
  "fallback-mine-b": "5b8238d0-bfdb-443a-a0ce-fc384cd491fe",
  "Mine B": "5b8238d0-bfdb-443a-a0ce-fc384cd491fe",
  "M3": "84e0c034-2657-4e92-9f2c-920e419d80f4",
  "fallback-mine-c": "84e0c034-2657-4e92-9f2c-920e419d80f4",
  "Mine C": "84e0c034-2657-4e92-9f2c-920e419d80f4",
  "M4": "3dc40de3-85d1-48fc-bedd-a43567660ef2",
  "fallback-mine-d": "3dc40de3-85d1-48fc-bedd-a43567660ef2",
  "Mine D": "3dc40de3-85d1-48fc-bedd-a43567660ef2",
  "M5": "16c8fab9-fe38-42bf-bdb1-d08b7a898320",
  "fallback-mine-e": "16c8fab9-fe38-42bf-bdb1-d08b7a898320",
  "Mine E": "16c8fab9-fe38-42bf-bdb1-d08b7a898320",
  "M6": "a704ccc4-ad9d-4b42-a0bf-30819956c826",
  "fallback-mine-f": "a704ccc4-ad9d-4b42-a0bf-30819956c826",
  "Mine F": "a704ccc4-ad9d-4b42-a0bf-30819956c826",
};

export function resolveMineId(mineId: string | null | undefined): string {
  if (!mineId) return DEFAULT_MINE_ID;
  if (MINE_ID_MAP[mineId]) return MINE_ID_MAP[mineId];
  if (UUID_REGEX.test(mineId)) return mineId;
  return DEFAULT_MINE_ID;
}
