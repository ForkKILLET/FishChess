<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
    type Cell,
    type CellN,
    type CellSelector,
    type Game,
    createInitialChessboard,
    getMoves,
    isSamePos,
    doMove,
    isBeingChecked,
} from '../common'
import Chessboard from './Chessboard.vue'
import packageJson from '../../package.json'
import dedent from 'dedent'

const game = reactive({} as Game)

const messages = reactive([] as string[])
const addMessage = (message: string) => messages.push(message)

const startGame = () => {
    addMessage('Game started!')
    game.state = 'playing'
    game.activePlayer = 'white'
    game.activePlayerIsBeingChecked = false
    game.chessboard = createInitialChessboard()
}

const dropGame = () => {
    addMessage('Game dropped.')
    game.state = 'finished'
}

const finishGame = () => {
    game.state = 'finished'
    if (game.activePlayerIsBeingChecked) {
        addMessage('Checkmate!')
    }
    else {
        addMessage('Stalemate!')
    }
}

const selectedCell = ref<Cell | null>(null)

const selector = computed((): CellSelector => {
    const target = selectedCell.value
    if (! target) {
        return cell => {
            const { piece } = cell
            if (! piece) return false
            if (piece.color !== game.activePlayer) return false
            const moves = getMoves(cell as CellN, game.chessboard, true)
            return moves.length > 0
        }
    }
    else {  
        const moves = getMoves(target as CellN, game.chessboard, true)
        return cell => moves.some(move => isSamePos(move, cell))
    }
})

const onSelect = (target: Cell) => {
    if (! selectedCell.value) {
        target.selected = true
        selectedCell.value = target
    }
    else {
        target.selected = false

        const self = selectedCell.value as CellN
        self.selected = false

        doMove(self, target, game.chessboard)

        selectedCell.value = null
        game.activePlayer = game.activePlayer === 'white' ? 'black' : 'white'

        game.activePlayerIsBeingChecked = isBeingChecked(game.activePlayer, game.chessboard)

        const allPossibleMoves = game.chessboard
            .flatMap(row => row)
            .filter(cell => cell.piece && cell.piece.color === game.activePlayer)
            .flatMap(cell => getMoves(cell as CellN, game.chessboard, true))

        if (! allPossibleMoves.length) {
            finishGame()
        }
    }
}

const deSelect = () => {
    if (selectedCell.value) {
        selectedCell.value.selected = false
        selectedCell.value = null
    }
}

addMessage(dedent`
    Welcome to Fish Chess! (<i>v${packageJson.version}, <a href="//github.com/ForkKILLET/FishChess">GitHub</a></i>) <br />
`)
startGame()
</script>

<template>
    <div class="game">
        <Chessboard
            :chessboard="game.chessboard"
            :class="{
                [`${game.activePlayer}-is-being-checked`]: game.activePlayerIsBeingChecked,
            }"
            :selector="selector"
            @select="onSelect"
            @contextmenu.prevent="deSelect"
        />
        <div class="sidebar">
            <div class="toolbar box">
                <button v-if="game.state === 'finished'" @click="startGame">New Game</button>
                <button v-else="game.state === 'playing'" @click="dropGame">Drop Game</button>
            </div>
            <div class="messages box">
                <div v-for="message in messages" class="message" v-html="message"></div>
            </div>
        </div>
    </div>
</template>

<style>
.game {
    display: flex;
    width: 100%;
}

.sidebar {
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    margin-left: 20px;
    font-size: 14px;
}

.toolbar {
    padding: 10px;
}

.messages {
    flex-grow: 1;
    margin-top: 10px;
    padding: 10px;
    font-family: sans-serif;
}
</style>
