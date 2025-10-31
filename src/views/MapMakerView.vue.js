import { defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue';
import { StorageService } from '@/services/storage';
debugger; /* PartiallyEnd: #3632/script.vue */
const __VLS_export = defineComponent({
    setup() {
        const canvas = ref(null);
        const selectedFloor = ref('ground');
        const GRID_SIZE = 50;
        const CANVAS_WIDTH = 1000;
        const CANVAS_HEIGHT = 800;
        const isDrawingRoom = ref(false);
        const isDrawingDoor = ref(false);
        const currentPoints = ref([]);
        const mousePos = ref(null);
        const showRoomModal = ref(false);
        const customRoomName = ref('');
        const canSaveRoom = computed(() => customRoomName.value.trim() !== '');
        const showDoorModal = ref(false);
        const selectedFromRoom = ref(null);
        const selectedToRoom = ref(null);
        const selectedDoorType = ref('hallway');
        const floors = computed(() => StorageService.getFloors());
        const currentFloorName = computed(() => floors.value.find(f => f.id === selectedFloor.value)?.name || '');
        const currentFloorRooms = ref([]);
        const currentFloorDoors = ref([]);
        const reloadData = () => {
            currentFloorRooms.value = StorageService.getRooms(selectedFloor.value);
            currentFloorDoors.value = StorageService.getDoors(selectedFloor.value);
            nextTick(render);
        };
        const drawGrid = (ctx) => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.strokeStyle = '#ddd';
            for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, CANVAS_HEIGHT);
                ctx.stroke();
            }
            for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(CANVAS_WIDTH, y);
                ctx.stroke();
            }
        };
        const drawRooms = (ctx) => {
            currentFloorRooms.value.forEach(room => {
                if (room.points.length < 3)
                    return;
                ctx.fillStyle = room.color + '40';
                ctx.strokeStyle = room.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(room.points[0].x * GRID_SIZE, room.points[0].y * GRID_SIZE);
                room.points.forEach(p => ctx.lineTo(p.x * GRID_SIZE, p.y * GRID_SIZE));
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // room name
                const cx = room.points.reduce((s, p) => s + p.x, 0) / room.points.length * GRID_SIZE;
                const cy = room.points.reduce((s, p) => s + p.y, 0) / room.points.length * GRID_SIZE;
                ctx.fillStyle = '#000';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(room.name, cx, cy);
            });
        };
        const drawDoors = (ctx) => {
            currentFloorDoors.value.forEach(door => {
                if (door.points.length < 2)
                    return;
                ctx.strokeStyle = door.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(door.points[0].x * GRID_SIZE, door.points[0].y * GRID_SIZE);
                door.points.forEach(p => ctx.lineTo(p.x * GRID_SIZE, p.y * GRID_SIZE));
                ctx.stroke();
            });
        };
        const drawCurrentShape = (ctx) => {
            if (currentPoints.value.length === 0)
                return;
            ctx.strokeStyle = '#3b82f6';
            ctx.fillStyle = '#3b82f640';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(currentPoints.value[0].x * GRID_SIZE, currentPoints.value[0].y * GRID_SIZE);
            currentPoints.value.forEach(p => ctx.lineTo(p.x * GRID_SIZE, p.y * GRID_SIZE));
            if (mousePos.value)
                ctx.lineTo(mousePos.value.x * GRID_SIZE, mousePos.value.y * GRID_SIZE);
            ctx.stroke();
            currentPoints.value.forEach((p, i) => {
                ctx.fillStyle = i === 0 ? '#ef4444' : '#3b82f6';
                ctx.beginPath();
                ctx.arc(p.x * GRID_SIZE, p.y * GRID_SIZE, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        };
        const render = () => {
            if (!canvas.value)
                return;
            const ctx = canvas.value.getContext('2d');
            if (!ctx)
                return;
            drawGrid(ctx);
            drawRooms(ctx);
            drawDoors(ctx);
            drawCurrentShape(ctx);
        };
        const screenToGrid = (x, y) => {
            if (!canvas.value)
                return { x: 0, y: 0 };
            const rect = canvas.value.getBoundingClientRect();
            // compute scaling factor if CSS scaled canvas
            const scaleX = canvas.value.width / rect.width;
            const scaleY = canvas.value.height / rect.height;
            return {
                x: Math.round((x - rect.left) * scaleX / GRID_SIZE),
                y: Math.round((y - rect.top) * scaleY / GRID_SIZE)
            };
        };
        const handleCanvasClick = (e) => {
            const point = screenToGrid(e.clientX, e.clientY);
            if (isDrawingRoom.value) {
                if (currentPoints.value.length >= 3) {
                    const first = currentPoints.value[0];
                    if (Math.hypot(first.x - point.x, first.y - point.y) < 0.5) {
                        finishRoom();
                        return;
                    }
                }
                currentPoints.value.push(point);
            }
            else if (isDrawingDoor.value) {
                currentPoints.value.push(point);
            }
            render();
        };
        const handleMouseMove = (e) => {
            if (!isDrawingRoom.value && !isDrawingDoor.value)
                return;
            mousePos.value = screenToGrid(e.clientX, e.clientY);
            render();
        };
        const startAddingRoom = () => { isDrawingRoom.value = true; currentPoints.value = []; mousePos.value = null; };
        const startAddingDoor = () => { isDrawingDoor.value = true; currentPoints.value = []; mousePos.value = null; };
        const cancelDrawing = () => { isDrawingRoom.value = false; isDrawingDoor.value = false; currentPoints.value = []; mousePos.value = null; render(); };
        const finishRoom = () => { showRoomModal.value = true; };
        const saveRoom = () => {
            if (!customRoomName.value.trim())
                return;
            StorageService.addRoom({
                id: `room-${Date.now()}`,
                name: customRoomName.value,
                floor: selectedFloor.value,
                points: currentPoints.value,
                color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                isClassroom: false
            });
            closeModal();
            cancelDrawing();
            reloadData();
        };
        const closeModal = () => { showRoomModal.value = false; customRoomName.value = ''; };
        const finishDoor = () => { showDoorModal.value = true; };
        const saveDoor = () => {
            if (!selectedFromRoom.value || !selectedToRoom.value)
                return;
            StorageService.addDoor({
                id: `door-${Date.now()}`,
                fromRoom: selectedFromRoom.value,
                toRoom: selectedToRoom.value,
                points: currentPoints.value,
                type: selectedDoorType.value,
                color: selectedDoorType.value === 'door' ? '#f59e0b' : '#10b981'
            });
            closeDoorModal();
            cancelDrawing();
            reloadData();
        };
        const closeDoorModal = () => {
            showDoorModal.value = false;
            selectedFromRoom.value = null;
            selectedToRoom.value = null;
            selectedDoorType.value = 'hallway';
        };
        const deleteRoom = (id) => {
            if (confirm('Delete room?')) {
                StorageService.deleteRoom(id);
                reloadData();
            }
        };
        const deleteDoor = (id) => {
            if (confirm('Delete door?')) {
                StorageService.deleteDoor(id);
                reloadData();
            }
        };
        const exportMap = () => {
            const data = StorageService.exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `map-${selectedFloor.value}-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        };
        const getRoomNameById = (id) => StorageService.getRooms(selectedFloor.value).find(r => r.id === id)?.name || id;
        onMounted(() => {
            if (canvas.value) {
                canvas.value.width = CANVAS_WIDTH;
                canvas.value.height = CANVAS_HEIGHT;
                reloadData();
            }
        });
        watch(selectedFloor, () => reloadData());
        return {
            canvas, selectedFloor, floors, currentFloorName, currentFloorRooms, currentFloorDoors,
            isDrawingRoom, isDrawingDoor, currentPoints, mousePos,
            showRoomModal, customRoomName, canSaveRoom,
            showDoorModal, selectedFromRoom, selectedToRoom, selectedDoorType,
            startAddingRoom, startAddingDoor, cancelDrawing, handleCanvasClick, handleMouseMove,
            finishRoom, saveRoom, closeModal,
            finishDoor, saveDoor, closeDoorModal,
            deleteRoom, deleteDoor, exportMap,
            getRoomNameById
        };
    }
});
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        const canvas = ref(null);
        const selectedFloor = ref('ground');
        const GRID_SIZE = 50;
        const CANVAS_WIDTH = 1000;
        const CANVAS_HEIGHT = 800;
        const isDrawingRoom = ref(false);
        const isDrawingDoor = ref(false);
        const currentPoints = ref([]);
        const mousePos = ref(null);
        const showRoomModal = ref(false);
        const customRoomName = ref('');
        const canSaveRoom = computed(() => customRoomName.value.trim() !== '');
        const showDoorModal = ref(false);
        const selectedFromRoom = ref(null);
        const selectedToRoom = ref(null);
        const selectedDoorType = ref('hallway');
        const floors = computed(() => StorageService.getFloors());
        const currentFloorName = computed(() => floors.value.find(f => f.id === selectedFloor.value)?.name || '');
        const currentFloorRooms = ref([]);
        const currentFloorDoors = ref([]);
        const reloadData = () => {
            currentFloorRooms.value = StorageService.getRooms(selectedFloor.value);
            currentFloorDoors.value = StorageService.getDoors(selectedFloor.value);
            nextTick(render);
        };
        const drawGrid = (ctx) => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.strokeStyle = '#ddd';
            for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, CANVAS_HEIGHT);
                ctx.stroke();
            }
            for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(CANVAS_WIDTH, y);
                ctx.stroke();
            }
        };
        const drawRooms = (ctx) => {
            currentFloorRooms.value.forEach(room => {
                if (room.points.length < 3)
                    return;
                ctx.fillStyle = room.color + '40';
                ctx.strokeStyle = room.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(room.points[0].x * GRID_SIZE, room.points[0].y * GRID_SIZE);
                room.points.forEach(p => ctx.lineTo(p.x * GRID_SIZE, p.y * GRID_SIZE));
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // room name
                const cx = room.points.reduce((s, p) => s + p.x, 0) / room.points.length * GRID_SIZE;
                const cy = room.points.reduce((s, p) => s + p.y, 0) / room.points.length * GRID_SIZE;
                ctx.fillStyle = '#000';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(room.name, cx, cy);
            });
        };
        const drawDoors = (ctx) => {
            currentFloorDoors.value.forEach(door => {
                if (door.points.length < 2)
                    return;
                ctx.strokeStyle = door.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(door.points[0].x * GRID_SIZE, door.points[0].y * GRID_SIZE);
                door.points.forEach(p => ctx.lineTo(p.x * GRID_SIZE, p.y * GRID_SIZE));
                ctx.stroke();
            });
        };
        const drawCurrentShape = (ctx) => {
            if (currentPoints.value.length === 0)
                return;
            ctx.strokeStyle = '#3b82f6';
            ctx.fillStyle = '#3b82f640';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(currentPoints.value[0].x * GRID_SIZE, currentPoints.value[0].y * GRID_SIZE);
            currentPoints.value.forEach(p => ctx.lineTo(p.x * GRID_SIZE, p.y * GRID_SIZE));
            if (mousePos.value)
                ctx.lineTo(mousePos.value.x * GRID_SIZE, mousePos.value.y * GRID_SIZE);
            ctx.stroke();
            currentPoints.value.forEach((p, i) => {
                ctx.fillStyle = i === 0 ? '#ef4444' : '#3b82f6';
                ctx.beginPath();
                ctx.arc(p.x * GRID_SIZE, p.y * GRID_SIZE, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        };
        const render = () => {
            if (!canvas.value)
                return;
            const ctx = canvas.value.getContext('2d');
            if (!ctx)
                return;
            drawGrid(ctx);
            drawRooms(ctx);
            drawDoors(ctx);
            drawCurrentShape(ctx);
        };
        const screenToGrid = (x, y) => {
            if (!canvas.value)
                return { x: 0, y: 0 };
            const rect = canvas.value.getBoundingClientRect();
            // compute scaling factor if CSS scaled canvas
            const scaleX = canvas.value.width / rect.width;
            const scaleY = canvas.value.height / rect.height;
            return {
                x: Math.round((x - rect.left) * scaleX / GRID_SIZE),
                y: Math.round((y - rect.top) * scaleY / GRID_SIZE)
            };
        };
        const handleCanvasClick = (e) => {
            const point = screenToGrid(e.clientX, e.clientY);
            if (isDrawingRoom.value) {
                if (currentPoints.value.length >= 3) {
                    const first = currentPoints.value[0];
                    if (Math.hypot(first.x - point.x, first.y - point.y) < 0.5) {
                        finishRoom();
                        return;
                    }
                }
                currentPoints.value.push(point);
            }
            else if (isDrawingDoor.value) {
                currentPoints.value.push(point);
            }
            render();
        };
        const handleMouseMove = (e) => {
            if (!isDrawingRoom.value && !isDrawingDoor.value)
                return;
            mousePos.value = screenToGrid(e.clientX, e.clientY);
            render();
        };
        const startAddingRoom = () => { isDrawingRoom.value = true; currentPoints.value = []; mousePos.value = null; };
        const startAddingDoor = () => { isDrawingDoor.value = true; currentPoints.value = []; mousePos.value = null; };
        const cancelDrawing = () => { isDrawingRoom.value = false; isDrawingDoor.value = false; currentPoints.value = []; mousePos.value = null; render(); };
        const finishRoom = () => { showRoomModal.value = true; };
        const saveRoom = () => {
            if (!customRoomName.value.trim())
                return;
            StorageService.addRoom({
                id: `room-${Date.now()}`,
                name: customRoomName.value,
                floor: selectedFloor.value,
                points: currentPoints.value,
                color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                isClassroom: false
            });
            closeModal();
            cancelDrawing();
            reloadData();
        };
        const closeModal = () => { showRoomModal.value = false; customRoomName.value = ''; };
        const finishDoor = () => { showDoorModal.value = true; };
        const saveDoor = () => {
            if (!selectedFromRoom.value || !selectedToRoom.value)
                return;
            StorageService.addDoor({
                id: `door-${Date.now()}`,
                fromRoom: selectedFromRoom.value,
                toRoom: selectedToRoom.value,
                points: currentPoints.value,
                type: selectedDoorType.value,
                color: selectedDoorType.value === 'door' ? '#f59e0b' : '#10b981'
            });
            closeDoorModal();
            cancelDrawing();
            reloadData();
        };
        const closeDoorModal = () => {
            showDoorModal.value = false;
            selectedFromRoom.value = null;
            selectedToRoom.value = null;
            selectedDoorType.value = 'hallway';
        };
        const deleteRoom = (id) => {
            if (confirm('Delete room?')) {
                StorageService.deleteRoom(id);
                reloadData();
            }
        };
        const deleteDoor = (id) => {
            if (confirm('Delete door?')) {
                StorageService.deleteDoor(id);
                reloadData();
            }
        };
        const exportMap = () => {
            const data = StorageService.exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `map-${selectedFloor.value}-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        };
        const getRoomNameById = (id) => StorageService.getRooms(selectedFloor.value).find(r => r.id === id)?.name || id;
        onMounted(() => {
            if (canvas.value) {
                canvas.value.width = CANVAS_WIDTH;
                canvas.value.height = CANVAS_HEIGHT;
                reloadData();
            }
        });
        watch(selectedFloor, () => reloadData());
        return {
            canvas, selectedFloor, floors, currentFloorName, currentFloorRooms, currentFloorDoors,
            isDrawingRoom, isDrawingDoor, currentPoints, mousePos,
            showRoomModal, customRoomName, canSaveRoom,
            showDoorModal, selectedFromRoom, selectedToRoom, selectedDoorType,
            startAddingRoom, startAddingDoor, cancelDrawing, handleCanvasClick, handleMouseMove,
            finishRoom, saveRoom, closeModal,
            finishDoor, saveDoor, closeDoorModal,
            deleteRoom, deleteDoor, exportMap,
            getRoomNameById
        };
    }
});
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['floor-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['floor-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-delete']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-delete']} */ ;
/** @type {__VLS_StyleScopedClasses['drawing-instructions']} */ ;
/** @type {__VLS_StyleScopedClasses['rooms-list']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['form-group']} */ ;
/** @type {__VLS_StyleScopedClasses['map-maker']} */ ;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['map-canvas']} */ ;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "map-maker" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "header" },
});
__VLS_asFunctionalElement(__VLS_elements.h1, __VLS_elements.h1)({});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "floor-selector" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
__VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
    value: (__VLS_ctx.selectedFloor),
});
// @ts-ignore
[selectedFloor,];
for (const [floor] of __VLS_getVForSourceType((__VLS_ctx.floors))) {
    // @ts-ignore
    [floors,];
    __VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
        key: (floor.id),
        value: (floor.id),
    });
    (floor.name);
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "controls" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.startAddingRoom) },
    ...{ class: "btn-primary" },
    disabled: (__VLS_ctx.isDrawingRoom || __VLS_ctx.isDrawingDoor),
});
// @ts-ignore
[startAddingRoom, isDrawingRoom, isDrawingDoor,];
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.startAddingDoor) },
    ...{ class: "btn-primary" },
    disabled: (__VLS_ctx.isDrawingRoom || __VLS_ctx.isDrawingDoor),
});
// @ts-ignore
[isDrawingRoom, isDrawingDoor, startAddingDoor,];
if (__VLS_ctx.isDrawingRoom || __VLS_ctx.isDrawingDoor) {
    // @ts-ignore
    [isDrawingRoom, isDrawingDoor,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.cancelDrawing) },
        ...{ class: "btn-secondary" },
    });
    // @ts-ignore
    [cancelDrawing,];
}
if (__VLS_ctx.isDrawingDoor && __VLS_ctx.currentPoints.length > 1) {
    // @ts-ignore
    [isDrawingDoor, currentPoints,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.finishDoor) },
        ...{ class: "btn-secondary" },
    });
    // @ts-ignore
    [finishDoor,];
}
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.exportMap) },
    ...{ class: "btn-secondary" },
});
// @ts-ignore
[exportMap,];
if (__VLS_ctx.isDrawingRoom || __VLS_ctx.isDrawingDoor) {
    // @ts-ignore
    [isDrawingRoom, isDrawingDoor,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "drawing-instructions" },
    });
    if (__VLS_ctx.isDrawingRoom) {
        // @ts-ignore
        [isDrawingRoom,];
        __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({});
    }
    if (__VLS_ctx.isDrawingDoor) {
        // @ts-ignore
        [isDrawingDoor,];
        __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({});
    }
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({});
    (__VLS_ctx.currentPoints.length);
    // @ts-ignore
    [currentPoints,];
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "map-container" },
});
__VLS_asFunctionalElement(__VLS_elements.canvas, __VLS_elements.canvas)({
    ...{ onClick: (__VLS_ctx.handleCanvasClick) },
    ...{ onMousemove: (__VLS_ctx.handleMouseMove) },
    ref: "canvas",
    ...{ class: "map-canvas" },
});
/** @type {typeof __VLS_ctx.canvas} */ ;
// @ts-ignore
[handleCanvasClick, handleMouseMove, canvas,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "rooms-list" },
});
__VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({});
(__VLS_ctx.currentFloorName);
// @ts-ignore
[currentFloorName,];
if (__VLS_ctx.currentFloorRooms.length === 0) {
    // @ts-ignore
    [currentFloorRooms,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "empty-state" },
    });
}
for (const [room] of __VLS_getVForSourceType((__VLS_ctx.currentFloorRooms))) {
    // @ts-ignore
    [currentFloorRooms,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        key: (room.id),
        ...{ class: "room-card" },
    });
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "room-header" },
    });
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "room-name" },
        ...{ style: ({ borderLeft: `4px solid ${room.color}` }) },
    });
    (room.name);
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.deleteRoom(room.id);
                // @ts-ignore
                [deleteRoom,];
            } },
        ...{ class: "btn-delete" },
    });
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "room-details" },
    });
    (room.points.length);
}
__VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({});
if (__VLS_ctx.currentFloorDoors.length === 0) {
    // @ts-ignore
    [currentFloorDoors,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "empty-state" },
    });
}
for (const [door] of __VLS_getVForSourceType((__VLS_ctx.currentFloorDoors))) {
    // @ts-ignore
    [currentFloorDoors,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        key: (door.id),
        ...{ class: "room-card" },
    });
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "room-header" },
    });
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "room-name" },
        ...{ style: ({ borderLeft: `4px solid ${door.color}` }) },
    });
    (__VLS_ctx.getRoomNameById(door.fromRoom));
    (__VLS_ctx.getRoomNameById(door.toRoom));
    (door.type);
    // @ts-ignore
    [getRoomNameById, getRoomNameById,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.deleteDoor(door.id);
                // @ts-ignore
                [deleteDoor,];
            } },
        ...{ class: "btn-delete" },
    });
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "room-details" },
    });
    (door.points.length);
}
if (__VLS_ctx.showRoomModal) {
    // @ts-ignore
    [showRoomModal,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ onClick: (__VLS_ctx.closeModal) },
        ...{ class: "modal-overlay" },
    });
    // @ts-ignore
    [closeModal,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal" },
    });
    __VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({});
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "modal-content" },
    });
    __VLS_asFunctionalElement(__VLS_elements.input)({
        type: "text",
        value: (__VLS_ctx.customRoomName),
        placeholder: "Room name",
        ...{ class: "form-input" },
    });
    // @ts-ignore
    [customRoomName,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "modal-actions" },
    });
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.closeModal) },
        ...{ class: "btn-secondary" },
    });
    // @ts-ignore
    [closeModal,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.saveRoom) },
        ...{ class: "btn-primary" },
        disabled: (!__VLS_ctx.canSaveRoom),
    });
    // @ts-ignore
    [saveRoom, canSaveRoom,];
}
if (__VLS_ctx.showDoorModal) {
    // @ts-ignore
    [showDoorModal,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ onClick: (__VLS_ctx.closeDoorModal) },
        ...{ class: "modal-overlay" },
    });
    // @ts-ignore
    [closeDoorModal,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ onClick: () => { } },
        ...{ class: "modal" },
    });
    __VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({});
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "modal-content" },
    });
    __VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
    __VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
        value: (__VLS_ctx.selectedFromRoom),
        ...{ class: "form-input" },
    });
    // @ts-ignore
    [selectedFromRoom,];
    for (const [room] of __VLS_getVForSourceType((__VLS_ctx.currentFloorRooms))) {
        // @ts-ignore
        [currentFloorRooms,];
        __VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
            key: (room.id),
            value: (room.id),
        });
        (room.name);
    }
    __VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
    __VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
        value: (__VLS_ctx.selectedToRoom),
        ...{ class: "form-input" },
    });
    // @ts-ignore
    [selectedToRoom,];
    for (const [room] of __VLS_getVForSourceType((__VLS_ctx.currentFloorRooms))) {
        // @ts-ignore
        [currentFloorRooms,];
        __VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
            key: (room.id),
            value: (room.id),
        });
        (room.name);
    }
    __VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({});
    __VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
        value: (__VLS_ctx.selectedDoorType),
        ...{ class: "form-input" },
    });
    // @ts-ignore
    [selectedDoorType,];
    __VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
        value: "door",
    });
    __VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
        value: "hallway",
    });
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "modal-actions" },
    });
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.closeDoorModal) },
        ...{ class: "btn-secondary" },
    });
    // @ts-ignore
    [closeDoorModal,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.saveDoor) },
        ...{ class: "btn-primary" },
        disabled: (!__VLS_ctx.selectedFromRoom || !__VLS_ctx.selectedToRoom),
    });
    // @ts-ignore
    [selectedFromRoom, selectedToRoom, saveDoor,];
}
/** @type {__VLS_StyleScopedClasses['map-maker']} */ ;
/** @type {__VLS_StyleScopedClasses['header']} */ ;
/** @type {__VLS_StyleScopedClasses['floor-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['drawing-instructions']} */ ;
/** @type {__VLS_StyleScopedClasses['map-container']} */ ;
/** @type {__VLS_StyleScopedClasses['map-canvas']} */ ;
/** @type {__VLS_StyleScopedClasses['rooms-list']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['room-card']} */ ;
/** @type {__VLS_StyleScopedClasses['room-header']} */ ;
/** @type {__VLS_StyleScopedClasses['room-name']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-delete']} */ ;
/** @type {__VLS_StyleScopedClasses['room-details']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['room-card']} */ ;
/** @type {__VLS_StyleScopedClasses['room-header']} */ ;
/** @type {__VLS_StyleScopedClasses['room-name']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-delete']} */ ;
/** @type {__VLS_StyleScopedClasses['room-details']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-input']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
export default {};
