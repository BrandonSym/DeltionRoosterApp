import { WifiPlugin } from '@/services/wifi-plugin';
export type Point = { x: number; y: number; distance: number };

// -------------------------
// 🔹 Trilateration functions
// -------------------------
export function trilaterate3(
  A: Point | undefined,
  B: Point | undefined,
  C: Point | undefined
): { x: number; y: number } | null {
  if (!A || !B || !C) return null;
  const ax = A.x, ay = A.y, ad = A.distance;
  const bx = B.x, by = B.y, bd = B.distance;
  const cx = C.x, cy = C.y, cd = C.distance;

  const denom = 2 * ((bx - ax) * (cy - ay) - (cx - ax) * (by - ay));
  if (Math.abs(denom) < 1e-6) return null;

  const W = ad * ad - bd * bd - ax * ax + bx * bx - ay * ay + by * by;
  const Z = ad * ad - cd * cd - ax * ax + cx * cx - ay * ay + cy * cy;

  const x = (W * (cy - ay) - Z * (by - ay)) / denom;
  const y = (Z * (bx - ax) - W * (cx - ax)) / denom;

  if (!isFinite(x) || !isFinite(y)) return null;
  return { x, y };
}

export function solveMultilateration(points: Point[]): { x: number; y: number } | null {
  if (points.length < 3) return null;

  const ref = points[0];
  const rows: number[][] = [];
  const rhs: number[] = [];

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const ai = 2 * (ref.x - p.x);
    const bi = 2 * (ref.y - p.y);
    const ci =
      ref.x * ref.x -
      p.x * p.x +
      (ref.y * ref.y - p.y * p.y) +
      (p.distance * p.distance - ref.distance * ref.distance);
    rows.push([ai, bi]);
    rhs.push(ci);
  }

  let ata00 = 0,
    ata01 = 0,
    ata11 = 0;
  let atb0 = 0,
    atb1 = 0;

  for (let i = 0; i < rows.length; i++) {
    const [a, b] = rows[i];
    const c = rhs[i];
    ata00 += a * a;
    ata01 += a * b;
    ata11 += b * b;
    atb0 += a * c;
    atb1 += b * c;
  }

  const det = ata00 * ata11 - ata01 * ata01;
  if (Math.abs(det) < 1e-9) return null;

  const X = (atb0 * ata11 - atb1 * ata01) / det;
  const Y = (ata00 * atb1 - ata01 * atb0) / det;
  if (!isFinite(X) || !isFinite(Y)) return null;

  return { x: X, y: Y };
}

// -------------------------
// 🔹 RSSI to distance
// -------------------------
export function rssiToDistance(rssi: number, A = -40, n = 3): number {
  // d = 10^((A - RSSI) / (10*n))
  return Math.pow(10, (A - rssi) / (10 * n));
}

// -------------------------
// 🔹 Known Access Point positions (example)
// -------------------------
const AP_POSITIONS: Record<string, { x: number; y: number }> = {
  // "00:11:22:33:44:55": { x: 0, y: 0 },
  // "66:77:88:99:AA:BB": { x: 5, y: 0 },
};

// -------------------------
// 🔹 Wi-Fi scan and locate
// -------------------------
export async function scanAndLocate(): Promise<{ x: number; y: number } | null> {
  const res = await WifiPlugin.scanNetworks();
  const networks = res.networks;

  const points = networks
    .map((n) => {
      const pos = AP_POSITIONS[n.BSSID];
      if (!pos) return undefined;
      return { x: pos.x, y: pos.y, distance: rssiToDistance(n.level) };
    })
    .filter((p): p is { x: number; y: number; distance: number } => !!p);

  if (points.length < 3) return null;

  if (points.length === 3) {
    return trilaterate3(points[0], points[1], points[2]);
  } else {
    return solveMultilateration(points);
  }
}

// -------------------------
// 🔹 API base URL + helper functions
// -------------------------
const BASE_URL = import.meta.env.VITE_FETCH_URL;

// ✅ Fetch all groups
export async function fetchGroups() {
  try {
    const res = await fetch(`${BASE_URL}/groups`);
    const data = await res.json();
    console.log('Fetched groups:', data);
    return data;
  } catch (err) {
    console.error('Error fetching groups:', err);
    return [];
  }
}

// ✅ Fetch all rooms
export async function fetchRooms() {
  try {
    const res = await fetch(`${BASE_URL}/rooms`);
    const data = await res.json();
    console.log('Fetched rooms:', data);
    return data;
  } catch (err) {
    console.error('Error fetching rooms:', err);
    return [];
  }
}

// ✅ Fetch roster for a group or room
export async function fetchRoster(query: string, type: 'group' | 'room', date: string) {
  try {
    const url = `${BASE_URL}/roster?${type}=${encodeURIComponent(query)}&date=${date}`;
    console.log('Fetching roster from:', url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    console.log('Roster data:', data);
    return data;
  } catch (err) {
    console.error('Error fetching roster:', err);
    return null;
  }
}
