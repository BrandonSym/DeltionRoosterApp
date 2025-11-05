export interface Floor {
  id: string
  name: string
  mapSections: any[]
}

export interface AccessPoint {
  id: string
  floor: string
  x: number
  y: number
  macAddress: string
}

export interface CalibrationPoint {
  id: string
  floor: string
  x: number
  y: number
  realWorldX: number
  realWorldY: number
}

export interface Room {
  id: string
  name: string
  floor: string
  points: { x: number; y: number }[]
  color: string
  isClassroom: boolean
}

export interface Door {
  id: string
  fromRoom: string
  toRoom: string
  points: { x: number; y: number }[]
  type: 'door'
  color: string
}

export interface Walkway {
  id: string
  floor: string
  points: { x: number; y: number }[]
  color: string
}

export interface PositioningData {
  floors: Floor[]
  accessPoints: AccessPoint[]
  calibrationData: CalibrationPoint[]
  rooms: Room[]
  doors: Door[]
  walkways: Walkway[]
  settings: { gridSizeMeters: number }
}

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
  walkways: [],
  settings: { gridSizeMeters: 1 }
}

export const StorageService = {
  getData(): PositioningData {
    const raw = localStorage.getItem('positioningData')
    if (raw) return JSON.parse(raw)
    return defaultData
  },

  saveData(data: PositioningData) { localStorage.setItem('positioningData', JSON.stringify(data)) },

  getFloors(): Floor[] { return this.getData().floors },

  getRooms(floorId?: string): Room[] {
    const data = this.getData()
    return floorId ? data.rooms.filter(r => r.floor === floorId) : data.rooms
  },
  addRoom(room: Room) { const data = this.getData(); data.rooms.push(room); this.saveData(data) },
  deleteRoom(id: string) { const data = this.getData(); data.rooms = data.rooms.filter(r => r.id !== id); this.saveData(data) },

  getDoors(floorId?: string): Door[] {
    const data = this.getData()
    return floorId ? data.doors.filter(d => data.rooms.find(r => r.id === d.fromRoom)?.floor === floorId) : data.doors
  },
  addDoor(door: Door) { const data = this.getData(); data.doors.push(door); this.saveData(data) },
  deleteDoor(id: string) { const data = this.getData(); data.doors = data.doors.filter(d => d.id !== id); this.saveData(data) },

  getWalkways(floorId?: string): Walkway[] {
    const data = this.getData()
    return floorId ? data.walkways.filter(w => w.floor === floorId) : data.walkways
  },
  addWalkway(walkway: Walkway) { const data = this.getData(); data.walkways.push(walkway); this.saveData(data) },
  updateWalkway(id: string, updates: Partial<Walkway>) {
    const data = this.getData()
    const index = data.walkways.findIndex(w => w.id === id)
    if (index !== -1) { data.walkways[index] = { ...data.walkways[index], ...updates }; this.saveData(data) }
  },
  deleteWalkway(id: string) { const data = this.getData(); data.walkways = data.walkways.filter(w => w.id !== id); this.saveData(data) },

  exportData(): string { return JSON.stringify(this.getData(), null, 2) }
}
