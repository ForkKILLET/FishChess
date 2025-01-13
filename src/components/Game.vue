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
    FISH_TAKING_MATRIX,
    takingMatrixToString,
    takingMatrixFromString,
    createEmptyChessboard,
} from '../common'
import Chessboard from './Chessboard.vue'
import packageJson from '../../package.json'
import dedent from 'dedent'

const game = reactive<Game>({
    state: 'finished',
    activePlayer: 'white',
    activePlayerIsBeingChecked: false,
    chessboard: createEmptyChessboard(),
    takingMatrix: FISH_TAKING_MATRIX,
})

const messages = reactive([] as string[])
const addMessage = (message: string) => messages.push(message)

const startGame = () => {
    addMessage('Game started!')
    selectedCell.value = null
    game.state = 'playing'
    game.activePlayer = 'white'
    game.activePlayerIsBeingChecked = false
    game.chessboard = createInitialChessboard()
    takingMatrixParsingResult.value = { type: 'idle' }
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
            const moves = getMoves(cell as CellN, game, true)
            return moves.length > 0
        }
    }
    else {  
        const moves = getMoves(target as CellN, game, true)
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

        game.activePlayerIsBeingChecked = isBeingChecked(game.activePlayer, game)

        const allPossibleMoves = game.chessboard
            .flatMap(row => row)
            .filter(cell => cell.piece && cell.piece.color === game.activePlayer)
            .flatMap(cell => getMoves(cell as CellN, game, true))

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

const activeTab = ref<'messages' | 'settings'>('messages')

const takingMatrixEl = ref<HTMLPreElement | null>(null)
const takingMatrixParsingResult = ref<
    | { type: 'error', error: string }
    | { type: 'ok' }
    | { type: 'idle' }
>({  type: 'idle' })

const submitTakingMatrix = () => {
    if (game.state === 'playing') return
    try {
        const takingMatrix = takingMatrixFromString(takingMatrixEl.value!.innerHTML.replace(/<br>/g, '\n'))
        game.takingMatrix = takingMatrix
        takingMatrixParsingResult.value = { type: 'ok' }
    }
    catch (error) {
        takingMatrixParsingResult.value = { type: 'error', error: (error as Error).message }
    }
}
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
                
                <button @click="activeTab = 'settings'">Settings</button>
                <button @click="activeTab = 'messages'">Messages</button>
            </div>
            <div class="messages box">
                <template v-if="activeTab === 'messages'">
                    <div v-for="message in messages" class="message" v-html="message"></div>
                </template>
                <template v-else-if="activeTab === 'settings'">
                    <div>Taking Matrix</div>
                    <pre
                        ref="takingMatrixEl"
                        contenteditable="true"
                        spellcheck="false"
                    >{{ takingMatrixToString(game.takingMatrix) }}</pre>
                    <button :disabled="game.state === 'playing'" @click="submitTakingMatrix">Submit</button>
                    <div v-if="takingMatrixParsingResult.type === 'error'" class="taking-matrix-parsing-error">{{ takingMatrixParsingResult }}</div>
                    <div v-else-if="takingMatrixParsingResult.type === 'ok'">Modified!</div>
                </template>
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
.toolbar button {
    margin-right: 10px;
}

.messages {
    flex-grow: 1;
    margin-top: 10px;
    padding: 10px;
    font-family: sans-serif;
}

.taking-matrix-parsing-error {
    color: #f00;
}
</style>
