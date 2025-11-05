<template>
    <div class="map-maker">
        <!-- Header -->
        <div class="header">
            <h1>Map Maker</h1>
            <div class="floor-selector">
                <label>Floor:</label>
                <select v-model="selectedFloor">
                    <option v-for="floor in floors" :key="floor.id" :value="floor.id">{{ floor.name }}</option>
                </select>
            </div>
        </div>

        <!-- Controls -->
        <div class="controls">
            <button @click="startAddingRoom" class="btn-primary"
                :disabled="isDrawingRoom || isDrawingDoor || isDrawingWalkway">Add Room</button>
            <button @click="startAddingDoor" class="btn-primary"
                :disabled="isDrawingRoom || isDrawingDoor || isDrawingWalkway">Add Door</button>
            <button @click="startAddingWalkway" class="btn-primary"
                :disabled="isDrawingRoom || isDrawingDoor || isDrawingWalkway">Add Walkway</button>

            <button @click="cancelDrawing" class="btn-secondary"
                v-if="isDrawingRoom || isDrawingDoor || isDrawingWalkway">Cancel</button>
            <button @click="finishDoor" class="btn-secondary" v-if="isDrawingDoor && currentPoints.length === 2">Finish
                Door</button>
            <button @click="finishWalkway" class="btn-secondary"
                v-if="isDrawingWalkway && currentPoints.length > 1">Finish Walkway</button>

            <button @click="exportMap" class="btn-secondary">Export JSON</button>
        </div>

        <!-- Drawing Instructions -->
        <div v-if="isDrawingRoom || isDrawingDoor || isDrawingWalkway" class="drawing-instructions">
            <p v-if="isDrawingRoom">Click grid points to draw a room. Click first point to close shape.</p>
            <p v-if="isDrawingDoor">Click exactly 2 points to draw a door. Click "Finish Door" when done.</p>
            <p v-if="isDrawingWalkway">Click points to draw walkway centers (walkways run through middle of tiles).
                Click "Finish Walkway" when done.</p>
            <p>Points: {{ currentPoints.length }}</p>
        </div>

        <!-- Canvas -->
        <div class="map-container">
            <!-- Bind width/height to ensure canvas internal pixel size matches what we calculate -->
            <canvas ref="canvas" :width="CANVAS_WIDTH" :height="CANVAS_HEIGHT" @click="handleCanvasClick"
                @mousemove="handleMouseMove" class="map-canvas"></canvas>
        </div>

        <!-- Rooms List -->
        <div class="rooms-list">
            <h2>Rooms on {{ currentFloorName }}</h2>
            <div v-if="currentFloorRooms.length === 0" class="empty-state">
                No rooms added yet.
            </div>
            <div v-for="room in currentFloorRooms" :key="room.id" class="room-card">
                <div class="room-header">
                    <div class="room-name" :style="{ borderLeft: `4px solid ${room.color}` }">{{ room.name }}</div>
                    <button @click="deleteRoom(room.id)" class="btn-delete">Delete</button>
                </div>
                <div class="room-details">{{ room.points.length }} points</div>
            </div>

            <h2>Doors</h2>
            <div v-if="currentFloorDoors.length === 0" class="empty-state">
                No doors yet.
            </div>
            <div v-for="door in currentFloorDoors" :key="door.id" class="room-card">
                <div class="room-header">
                    <div class="room-name" :style="{ borderLeft: `4px solid ${door.color}` }">
                        From {{ getRoomNameById(door.fromRoom) }} → {{ getRoomNameById(door.toRoom) }} ({{ door.type }})
                    </div>
                    <button @click="deleteDoor(door.id)" class="btn-delete">Delete</button>
                </div>
                <div class="room-details">{{ door.points.length }} points</div>
            </div>

            <h2>Walkways</h2>
            <div v-if="currentFloorWalkways.length === 0" class="empty-state">
                No walkways yet.
            </div>
            <div v-for="w in currentFloorWalkways" :key="w.id" class="room-card">
                <div class="room-header">
                    <div class="room-name" :style="{ borderLeft: `4px solid ${w.color}` }">Walkway {{ w.id }}</div>
                    <button @click="deleteWalkway(w.id)" class="btn-delete">Delete</button>
                </div>
                <div class="room-details">{{ w.points.length }} points</div>
            </div>
        </div>

        <!-- Room Modal -->
        <div v-if="showRoomModal" class="modal-overlay" @click="closeModal">
            <div class="modal" @click.stop>
                <h2>Name Your Room</h2>
                <div class="modal-content">
                    <input type="text" v-model="customRoomName" placeholder="Room name" class="form-input" />
                </div>
                <div class="modal-actions">
                    <button @click="closeModal" class="btn-secondary">Cancel</button>
                    <button @click="saveRoom" class="btn-primary" :disabled="!canSaveRoom">Save Room</button>
                </div>
            </div>
        </div>

        <!-- Door Modal -->
        <div v-if="showDoorModal" class="modal-overlay" @click="closeDoorModal">
            <div class="modal" @click.stop>
                <h2>Select Rooms for Door</h2>
                <div class="modal-content">
                    <label>From Room:</label>
                    <select v-model="selectedFromRoom" class="form-input">
                        <option v-for="room in currentFloorRooms" :key="room.id" :value="room.id">{{ room.name }}
                        </option>
                    </select>
                    <label>To Room:</label>
                    <select v-model="selectedToRoom" class="form-input">
                        <option v-for="room in currentFloorRooms" :key="room.id" :value="room.id">{{ room.name }}
                        </option>
                    </select>
                    <label>Type:</label>
                    <select v-model="selectedDoorType" class="form-input">
                        <option value="door">Door</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button @click="closeDoorModal" class="btn-secondary">Cancel</button>
                    <button @click="saveDoor" class="btn-primary"
                        :disabled="!selectedFromRoom || !selectedToRoom">Save</button>
                </div>
            </div>
        </div>

    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue'
import { StorageService, type Room, type Door } from '@/services/storage'

interface Point { x: number; y: number }
interface Walkway { id: string; floor: string; points: Point[]; color: string }

export default defineComponent({
    setup() {
        const canvas = ref<HTMLCanvasElement | null>(null)
        const GRID_SIZE = 50
        const CANVAS_WIDTH = 1000
        const CANVAS_HEIGHT = 800

        const selectedFloor = ref('ground')
        const isDrawingRoom = ref(false)
        const isDrawingDoor = ref(false)
        const isDrawingWalkway = ref(false)
        const currentPoints = ref<Point[]>([])
        const mousePos = ref<Point | null>(null)

        const showRoomModal = ref(false)
        const customRoomName = ref('')
        const canSaveRoom = computed(() => customRoomName.value.trim() !== '')

        const showDoorModal = ref(false)
        const selectedFromRoom = ref<string | null>(null)
        const selectedToRoom = ref<string | null>(null)
        const selectedDoorType = ref<'door'>('door')

        const floors = computed(() => StorageService.getFloors())
        const currentFloorName = computed(() => floors.value.find(f => f.id === selectedFloor.value)?.name || selectedFloor.value)
        const currentFloorRooms = ref<Room[]>([])
        const currentFloorDoors = ref<Door[]>([])
        const currentFloorWalkways = ref<Walkway[]>([])

        const reloadData = () => {
            currentFloorRooms.value = StorageService.getRooms(selectedFloor.value)
            currentFloorDoors.value = StorageService.getDoors(selectedFloor.value)
            try { currentFloorWalkways.value = StorageService.getWalkways ? StorageService.getWalkways(selectedFloor.value) : [] } catch { currentFloorWalkways.value = [] }
            nextTick(render)
        }

        const drawGrid = (ctx: CanvasRenderingContext2D) => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
            ctx.strokeStyle = '#ddd'
            ctx.lineWidth = 1
            for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke() }
            for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke() }
        }

        const drawRooms = (ctx: CanvasRenderingContext2D) => {
            currentFloorRooms.value.forEach(room => {
                if (!room.points || room.points.length < 3) return
                ctx.fillStyle = (room.color || '#93c5fd') + '40'
                ctx.strokeStyle = room.color || '#3b82f6'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(room.points[0].x * GRID_SIZE, room.points[0].y * GRID_SIZE)
                room.points.forEach(p => ctx.lineTo(p.x * GRID_SIZE, p.y * GRID_SIZE))
                ctx.closePath()
                ctx.fill()
                ctx.stroke()
                const cx = room.points.reduce((s, p) => s + p.x, 0) / room.points.length * GRID_SIZE
                const cy = room.points.reduce((s, p) => s + p.y, 0) / room.points.length * GRID_SIZE
                ctx.fillStyle = '#000'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'
                ctx.fillText(room.name, cx, cy)
            })
        }

        const drawDoors = (ctx: CanvasRenderingContext2D) => {
            currentFloorDoors.value.forEach(door => {
                if (!door.points || door.points.length < 2) return
                ctx.strokeStyle = door.color || '#f59e0b'
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.moveTo(door.points[0].x * GRID_SIZE, door.points[0].y * GRID_SIZE)
                door.points.forEach(p => ctx.lineTo(p.x * GRID_SIZE, p.y * GRID_SIZE))
                ctx.stroke()
            })
        }

        const drawWalkways = (ctx: CanvasRenderingContext2D) => {
            currentFloorWalkways.value.forEach(w => {
                if (!w.points || w.points.length < 2) return
                ctx.strokeStyle = w.color || '#06b6d4'
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.moveTo(w.points[0].x * GRID_SIZE, w.points[0].y * GRID_SIZE)
                w.points.forEach(p => ctx.lineTo(p.x * GRID_SIZE, p.y * GRID_SIZE))
                ctx.stroke()
            })
        }

        const drawCurrentShape = (ctx: CanvasRenderingContext2D) => {
            if (currentPoints.value.length === 0 && !mousePos.value) return
            ctx.strokeStyle = '#3b82f6'; ctx.fillStyle = '#3b82f640'; ctx.lineWidth = 2
            if (currentPoints.value.length > 0) {
                ctx.beginPath()
                ctx.moveTo(currentPoints.value[0].x * GRID_SIZE, currentPoints.value[0].y * GRID_SIZE)
                currentPoints.value.forEach(p => ctx.lineTo(p.x * GRID_SIZE, p.y * GRID_SIZE))
                if (mousePos.value) ctx.lineTo(mousePos.value.x * GRID_SIZE, mousePos.value.y * GRID_SIZE)
                ctx.stroke()
            }
            currentPoints.value.forEach((p, i) => {
                ctx.fillStyle = i === 0 ? '#ef4444' : '#3b82f6'
                ctx.beginPath(); ctx.arc(p.x * GRID_SIZE, p.y * GRID_SIZE, 5, 0, Math.PI * 2); ctx.fill()
            })
        }

        const render = () => {
            if (!canvas.value) return
            const ctx = canvas.value.getContext('2d')
            if (!ctx) return
            drawGrid(ctx)
            drawWalkways(ctx)
            drawRooms(ctx)
            drawDoors(ctx)
            drawCurrentShape(ctx)
        }

        const screenToCanvasPixel = (clientX: number, clientY: number) => {
            if (!canvas.value) return { x: 0, y: 0 }
            const rect = canvas.value.getBoundingClientRect()
            const scaleX = canvas.value.width / rect.width
            const scaleY = canvas.value.height / rect.height
            const x = (clientX - rect.left) * scaleX
            const y = (clientY - rect.top) * scaleY
            return { x, y }
        }

        const snapToGridIntersection = (clientX: number, clientY: number): Point => {
            const pix = screenToCanvasPixel(clientX, clientY)
            return { x: Math.round(pix.x / GRID_SIZE), y: Math.round(pix.y / GRID_SIZE) }
        }

        const snapToGridCenter = (clientX: number, clientY: number): Point => {
            const pix = screenToCanvasPixel(clientX, clientY)
            const rawX = pix.x / GRID_SIZE
            const rawY = pix.y / GRID_SIZE
            const cx = Math.round(rawX - 0.5) + 0.5
            const cy = Math.round(rawY - 0.5) + 0.5
            return { x: cx, y: cy }
        }

        const isPointInPolygon = (pt: Point, poly: Point[]) => {
            let inside = false
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                const xi = poly[i].x, yi = poly[i].y
                const xj = poly[j].x, yj = poly[j].y
                const intersect = ((yi > pt.y) !== (yj > pt.y)) &&
                    (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi)
                if (intersect) inside = !inside
            }
            return inside
        }

        const handleCanvasClick = (e: MouseEvent) => {
            if (isDrawingRoom.value) {
                const p = snapToGridIntersection(e.clientX, e.clientY)
                if (currentPoints.value.length >= 3) {
                    const first = currentPoints.value[0]
                    const d = Math.hypot(p.x - first.x, p.y - first.y)
                    if (d < 0.5) { showRoomModal.value = true; return }
                }
                currentPoints.value.push(p); render(); return
            }
            if (isDrawingDoor.value) {
                if (currentPoints.value.length >= 2) return
                const p = snapToGridIntersection(e.clientX, e.clientY)
                currentPoints.value.push(p); render(); return
            }
            if (isDrawingWalkway.value) {
                const p = snapToGridCenter(e.clientX, e.clientY)
                currentPoints.value.push(p); render(); return
            }
            const clickPt = snapToGridIntersection(e.clientX, e.clientY)
            for (const r of currentFloorRooms.value) {
                if (isPointInPolygon(clickPt, r.points)) {
                    alert(`Room: ${r.name}`)
                    return
                }
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (isDrawingRoom.value) {
                mousePos.value = snapToGridIntersection(e.clientX, e.clientY); render()
            } else if (isDrawingDoor.value) {
                mousePos.value = snapToGridIntersection(e.clientX, e.clientY); render()
            } else if (isDrawingWalkway.value) {
                mousePos.value = snapToGridCenter(e.clientX, e.clientY); render()
            } else {
                mousePos.value = null
            }
        }

        const startAddingRoom = () => { isDrawingRoom.value = true; isDrawingDoor.value = false; isDrawingWalkway.value = false; currentPoints.value = []; mousePos.value = null }
        const startAddingDoor = () => { isDrawingDoor.value = true; isDrawingRoom.value = false; isDrawingWalkway.value = false; currentPoints.value = []; mousePos.value = null }
        const startAddingWalkway = () => { isDrawingWalkway.value = true; isDrawingRoom.value = false; isDrawingDoor.value = false; currentPoints.value = []; mousePos.value = null }

        const cancelDrawing = () => { isDrawingRoom.value = false; isDrawingDoor.value = false; isDrawingWalkway.value = false; currentPoints.value = []; mousePos.value = null; render() }

        const saveRoom = () => {
            if (!customRoomName.value.trim()) return
            const copyPoints = JSON.parse(JSON.stringify(currentPoints.value))
            StorageService.addRoom({
                id: `room-${Date.now()}`,
                name: customRoomName.value.trim(),
                floor: selectedFloor.value,
                points: copyPoints,
                color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
                isClassroom: false
            })
            closeModal()
            cancelDrawing()
            reloadData()
        }
        const closeModal = () => { showRoomModal.value = false; customRoomName.value = '' }

        const finishDoor = () => {
            if (currentPoints.value.length !== 2) { alert('Doors need exactly 2 points'); return }
            selectedFromRoom.value = currentFloorRooms.value[0]?.id ?? null
            selectedToRoom.value = currentFloorRooms.value[1]?.id ?? currentFloorRooms.value[0]?.id ?? null
            showDoorModal.value = true
        }
        const saveDoor = () => {
            if (!selectedFromRoom.value || !selectedToRoom.value) return
            const copyPoints = JSON.parse(JSON.stringify(currentPoints.value))
            StorageService.addDoor({
                id: `door-${Date.now()}`,
                fromRoom: selectedFromRoom.value,
                toRoom: selectedToRoom.value,
                points: copyPoints,
                type: 'door',
                color: '#f59e0b'
            })
            closeDoorModal()
            cancelDrawing()
            reloadData()
        }
        const closeDoorModal = () => {
            showDoorModal.value = false
            selectedFromRoom.value = null
            selectedToRoom.value = null
            selectedDoorType.value = 'door'
        }

        const finishWalkway = () => {
            if (currentPoints.value.length < 2) { alert('Walkway needs at least 2 points'); return }
            const copyPoints = JSON.parse(JSON.stringify(currentPoints.value))
            try { StorageService.addWalkway({ id: `walkway-${Date.now()}`, floor: selectedFloor.value, points: copyPoints, color: '#06b6d4' }) }
            catch (err) { console.error('Failed to save walkway', err) }
            cancelDrawing()
            reloadData()
        }

        const deleteRoom = (id: string) => { if (!confirm('Delete room?')) return; StorageService.deleteRoom(id); reloadData() }
        const deleteDoor = (id: string) => { if (!confirm('Delete door?')) return; StorageService.deleteDoor(id); reloadData() }
        const deleteWalkway = (id: string) => { if (!confirm('Delete walkway?')) return; StorageService.deleteWalkway(id); reloadData() }

        const getRoomNameById = (id: string) => currentFloorRooms.value.find(r => r.id === id)?.name || id

        const exportMap = () => {
            const data = StorageService.exportData()
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `map-${selectedFloor.value}-${Date.now()}.json`
            a.click()
            URL.revokeObjectURL(url)
        }

        onMounted(() => {
            if (canvas.value) {
                canvas.value.width = CANVAS_WIDTH
                canvas.value.height = CANVAS_HEIGHT
            }
            reloadData()
        })

        watch(selectedFloor, () => reloadData())

        return {
            canvas,
            selectedFloor,
            CANVAS_WIDTH,
            CANVAS_HEIGHT,
            GRID_SIZE,
            floors,
            currentFloorName,
            currentFloorRooms,
            currentFloorDoors,
            currentFloorWalkways,
            isDrawingRoom,
            isDrawingDoor,
            isDrawingWalkway,
            currentPoints,
            mousePos,
            showRoomModal,
            customRoomName,
            canSaveRoom,
            showDoorModal,
            selectedFromRoom,
            selectedToRoom,
            selectedDoorType,
            startAddingRoom,
            startAddingDoor,
            startAddingWalkway,
            cancelDrawing,
            handleCanvasClick,
            handleMouseMove,
            finishRoom: () => { showRoomModal.value = true },
            saveRoom,
            closeModal,
            finishDoor,
            saveDoor,
            closeDoorModal,
            finishWalkway,
            deleteRoom,
            deleteDoor,
            deleteWalkway,
            exportMap,
            getRoomNameById
        }
    }
})
</script>



<style scoped>
/* same styles as your previous grid version */
.map-maker {
    padding: 1rem;
    max-width: 1400px;
    margin: 0 auto;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.header h1 {
    font-size: 1.75rem;
    color: #2c3e50;
}

.floor-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.floor-selector label {
    font-weight: 500;
    color: #2c3e50;
}

.floor-selector select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.controls {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.btn-primary,
.btn-secondary,
.btn-delete {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
    min-height: 44px;
}

.btn-primary {
    background: #3b82f6;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: #2563eb;
}

.btn-primary:disabled {
    background: #9ca3af;
    cursor: not-allowed;
}

.btn-secondary {
    background: #6b7280;
    color: white;
}

.btn-secondary:hover {
    background: #4b5563;
}

.btn-delete {
    background: #ef4444;
    color: white;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
}

.btn-delete:hover {
    background: #dc2626;
}

.drawing-instructions {
    background: #dbeafe;
    color: #1e40af;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
}

.drawing-instructions p {
    margin: 0.25rem 0;
}

.map-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    margin-bottom: 1.5rem;
    overflow-x: auto;
}

.map-canvas {
    border: 1px solid #ddd;
    cursor: crosshair;
    display: block;
    /* do not force width:100% here — width/height are handled with attributes */
}

.rooms-list {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
}

.rooms-list h2 {
    font-size: 1.25rem;
    color: #2c3e50;
    margin-bottom: 1rem;
}

.empty-state {
    text-align: center;
    padding: 2rem;
    color: #7f8c8d;
}

.room-card {
    background: #f9fafb;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 0.75rem;
}

.room-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.room-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #2c3e50;
    padding-left: 0.75rem;
}

.room-details {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: #7f8c8d;
    padding-left: 0.75rem;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal h2 {
    font-size: 1.5rem;
    color: #2c3e50;
    margin-bottom: 1.5rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    font-weight: 500;
    color: #2c3e50;
    margin-bottom: 0.5rem;
}

.form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
}

.modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
}

@media (max-width: 768px) {
    .map-maker {
        padding: 0.75rem;
    }

    .header {
        flex-direction: column;
        align-items: flex-start;
    }

    .controls {
        flex-direction: column;
    }

    .btn-primary,
    .btn-secondary {
        width: 100%;
    }

    .map-canvas {
        max-width: 100%;
    }
}
</style>
