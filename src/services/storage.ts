export interface MapSection {
  id: string;
  name: string;
  image: string;
  x: number;
  y: number;
  widthMeters: number;
  heightMeters: number;
  pixelsPerMeter: number;
}

export interface Floor {
  id: string;
  name: string;
  mapSections: MapSection[];
}

export interface AccessPoint {
  id: string;
  bssid: string;
  name: string;
  ssid: string;
  floor: string;
  x: number;
  y: number;
  color: string;
}

export interface CalibrationPoint {
  id: string;
  floor: string;
  x: number;
  y: number;
  measurements: { bssid: string; rssi: number }[];
}

export interface Room {
  id: string;
  name: string;
  floor: string;
  points: { x: number; y: number }[];
  color: string;
  isClassroom: boolean;
}

export interface Door {
  id: string;
  fromRoom: string;
  toRoom: string;
  points: { x: number; y: number }[]; // line/path of the door or hallway
  type: "door" | "hallway";
  color: string;
}

export interface PositioningData {
  floors: Floor[];
  accessPoints: AccessPoint[];
  calibrationData: CalibrationPoint[];
  rooms: Room[];
  doors: Door[];
  settings: {
    gridSizeMeters: number;
  };
}

const STORAGE_KEY = "indoor_positioning_data";

const defaultData: PositioningData = {
  floors: [
    { id: "ground", name: "Ground Floor", mapSections: [] },
    { id: "floor-1", name: "Floor 1", mapSections: [] },
    { id: "floor-2", name: "Floor 2", mapSections: [] },
    { id: "floor-3", name: "Floor 3", mapSections: [] },
  ],
  accessPoints: [],
  calibrationData: [],
  rooms: [],
  doors: [],
  settings: {
    gridSizeMeters: 1,
  },
};

export const StorageService = {
  getData(): PositioningData {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      parsed.floors ||= [];
      parsed.accessPoints ||= [];
      parsed.calibrationData ||= [];
      parsed.rooms ||= [];
      parsed.doors ||= [];
      parsed.settings ||= { gridSizeMeters: 1 };
      return parsed;
    }
    return { ...defaultData };
  },

  saveData(data: PositioningData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  // Floor operations
  getFloors(): Floor[] {
    return this.getData().floors;
  },

  getFloor(floorId: string): Floor | undefined {
    return this.getData().floors.find((f) => f.id === floorId);
  },

  updateFloor(floorId: string, updates: Partial<Floor>): void {
    const data = this.getData();
    const index = data.floors.findIndex((f) => f.id === floorId);
    if (index !== -1) {
      data.floors[index] = { ...data.floors[index], ...updates };
      this.saveData(data);
    }
  },

  // Room operations
  getRooms(floorId?: string): Room[] {
    const data = this.getData();
    data.rooms ||= [];
    return floorId ? data.rooms.filter((r) => r.floor === floorId) : data.rooms;
  },

  addRoom(room: Room): void {
    const data = this.getData();
    data.rooms ||= [];
    data.rooms.push(room);
    this.saveData(data);
  },

  updateRoom(id: string, updates: Partial<Room>): void {
    const data = this.getData();
    const idx = data.rooms.findIndex((r) => r.id === id);
    if (idx !== -1) {
      data.rooms[idx] = { ...data.rooms[idx], ...updates };
      this.saveData(data);
    }
  },

  deleteRoom(id: string): void {
    const data = this.getData();
    data.rooms ||= [];
    data.rooms = data.rooms.filter((r) => r.id !== id);
    this.saveData(data);
  },

  // Door operations
  getDoors(floorId?: string): Door[] {
    const data = this.getData();
    data.doors ||= [];
    return floorId
      ? data.doors.filter((d) => {
          const fromRoom = data.rooms.find((r) => r.id === d.fromRoom);
          return fromRoom?.floor === floorId;
        })
      : data.doors;
  },

  addDoor(door: Door): void {
    const data = this.getData();
    data.doors ||= [];
    data.doors.push(door);
    this.saveData(data);
  },

  updateDoor(id: string, updates: Partial<Door>): void {
    const data = this.getData();
    const idx = data.doors.findIndex((d) => d.id === id);
    if (idx !== -1) {
      data.doors[idx] = { ...data.doors[idx], ...updates };
      this.saveData(data);
    }
  },

  deleteDoor(id: string): void {
    const data = this.getData();
    data.doors ||= [];
    data.doors = data.doors.filter((d) => d.id !== id);
    this.saveData(data);
  },

  // Map Section operations
  addMapSection(floorId: string, section: MapSection): void {
    const data = this.getData();
    const floor = data.floors.find((f) => f.id === floorId);
    if (floor) {
      floor.mapSections ||= [];
      floor.mapSections.push(section);
      this.saveData(data);
    }
  },

  updateMapSection(floorId: string, sectionId: string, updates: Partial<MapSection>): void {
    const data = this.getData();
    const floor = data.floors.find((f) => f.id === floorId);
    if (floor) {
      floor.mapSections ||= [];
      const idx = floor.mapSections.findIndex((s) => s.id === sectionId);
      if (idx !== -1) {
        floor.mapSections[idx] = { ...floor.mapSections[idx], ...updates };
        this.saveData(data);
      }
    }
  },

  deleteMapSection(floorId: string, sectionId: string): void {
    const data = this.getData();
    const floor = data.floors.find((f) => f.id === floorId);
    if (floor) {
      floor.mapSections ||= [];
      floor.mapSections = floor.mapSections.filter((s) => s.id !== sectionId);
      this.saveData(data);
    }
  },

  // Access Point operations
  getAccessPoints(floorId?: string): AccessPoint[] {
    const data = this.getData();
    data.accessPoints ||= [];
    return floorId ? data.accessPoints.filter((ap) => ap.floor === floorId) : data.accessPoints;
  },

  addAccessPoint(ap: AccessPoint): void {
    const data = this.getData();
    data.accessPoints ||= [];
    data.accessPoints.push(ap);
    this.saveData(data);
  },

  updateAccessPoint(id: string, updates: Partial<AccessPoint>): void {
    const data = this.getData();
    data.accessPoints ||= [];
    const idx = data.accessPoints.findIndex((ap) => ap.id === id);
    if (idx !== -1) {
      data.accessPoints[idx] = { ...data.accessPoints[idx], ...updates };
      this.saveData(data);
    }
  },

  deleteAccessPoint(id: string): void {
    const data = this.getData();
    data.accessPoints ||= [];
    data.accessPoints = data.accessPoints.filter((ap) => ap.id !== id);
    this.saveData(data);
  },

  // Calibration operations
  getCalibrationPoints(floorId?: string): CalibrationPoint[] {
    const data = this.getData();
    data.calibrationData ||= [];
    return floorId ? data.calibrationData.filter((cp) => cp.floor === floorId) : data.calibrationData;
  },

  addCalibrationPoint(point: CalibrationPoint): void {
    const data = this.getData();
    data.calibrationData ||= [];
    data.calibrationData.push(point);
    this.saveData(data);
  },

  clearCalibrationData(): void {
    const data = this.getData();
    data.calibrationData ||= [];
    data.calibrationData = [];
    this.saveData(data);
  },

  // Export/Import
  exportData(): string {
    return JSON.stringify(this.getData(), null, 2);
  },

  importData(jsonString: string): void {
    try {
      const data = JSON.parse(jsonString);
      this.saveData(data);
    } catch {
      throw new Error("Invalid JSON data");
    }
  },

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
