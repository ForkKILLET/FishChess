<script setup lang="ts">
import { pieceToString, type Cell } from '../common'

defineProps<{
    cell: Cell
    selectable: boolean
}>()

const emit = defineEmits<{
    select: [ Cell ]
}>()
</script>

<template>
    <div
        class="cell"
        :class="[
            cell.piece?.color,
            `bg-${cell.background}`,
            cell.piece ? null : 'empty',
            selectable ? 'selectable' : null,
            cell.selected ? 'selected' : null,
            ...cell.piece ? [
                `piece-${cell.piece.type}`,
                `piece-${cell.piece.color}`
            ] : [],
        ]"
        @click="selectable && emit('select', cell)"
    >
        <template v-if="cell.piece">
            <img
                class="piece"
                :src="`./pieces/${ pieceToString(cell.piece) }.svg`"
            />
        </template>
    </div>
</template>

<style>
.cell {
    width: 50px;
    height: 50px;

    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}

.piece {
    width: 42px;
    height: 42px;
    display: flex;
    justify-content: center;
    align-items: center;

    font-weight: bold;
    font-size: 40px;
}

.cell.selectable {
    cursor: pointer;
}

.cell.selectable::before,
.cell.selected::before {
    content: '';
    position: absolute;
    display: block;
    width: 35px;
    height: 35px;
    border: 5px solid;
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 80%, 20% 100%, 80% 100%, 100% 80%, 100% 20%, 80% 0%, 20% 0%, 0% 20%);
}

.cell.selectable.bg-white::before {
    border-color: #888;
}
.cell.selectable.bg-black::before {
    border-color: #ccc;
}
.cell.selected.bg-white::before {
    border-color: #f0f;
}
.cell.selected.bg-black::before {
    border-color: rgb(255, 156, 255);
}

.cell.bg-white {
    background-color: #f0d9b5;
}

.cell.bg-black {
    background-color: #b58863;
}

.chessboard.white-is-being-checked .piece-king.piece-white::after,
.chessboard.black-is-being-checked .piece-king.piece-black::after {
    content: '';
    position: absolute;
    z-index: 1;
    top: -2px;
    right: -2px;

    display: flex;
    justify-content: center;
    align-items: center;

    width: 16px;
    height: 16px;
    rotate: 45deg;

    background-color: #f00;
    color: #fff;
    font-size: 16px;
}
</style>
