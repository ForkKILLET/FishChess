<script setup lang="ts">
import ChessboardCell from './Cell.vue'
import { type Cell, type Chessboard, type CellSelector } from '../common'

defineProps<{
    chessboard: Chessboard
    selector: CellSelector
}>()

const emit = defineEmits<{
    select: [ Cell ]
}>()
</script>

<template>
    <div class="chessboard">
        <div v-for="row, r in chessboard" class="row">
            <ChessboardCell
                v-for="cell, c in row"
                :key="`${r},${c}`"
                :cell="cell"
                :selectable="selector(cell)"
                @select="ev => emit('select', ev)"
            />
        </div>
    </div>
</template>

<style>
.chessboard {
    cursor: default;
}

.row {
    display: flex;
}
</style>