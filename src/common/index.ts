import dedent from 'dedent'

export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king'

export type Cell = Pos & {
    piece: Piece | null
    background: 'white' | 'black'
    selected?: boolean
}

export type CellN = Omit<Cell, 'piece'> & {
    piece: Piece
}

export type Piece = {
    type: PieceType
    color: 'white' | 'black'
    moved?: boolean
}

export type Chessboard = Cell[][]

export const PIECE_TO_STRING: Record<PieceType, string> = {
    pawn:   'P',
    rook:   'R',
    knight: 'N',
    bishop: 'B',
    queen:  'Q',
    king:   'K',
}

export const PIECE_FROM_STRING: Record<string, PieceType> = {
    P: 'pawn',
    R: 'rook',
    N: 'knight',
    B: 'bishop',
    Q: 'queen',
    K: 'king',
}

export const pieceToString = (piece: Piece | null): string => {
    if (piece === null) return '.'
    const str = PIECE_TO_STRING[piece.type]
    return piece.color === 'white' ? str : str.toLowerCase()
}
export const pieceFromString = (str: string): Piece | null => {
    if (str === '.') return null
    const piece = PIECE_FROM_STRING[str.toUpperCase()]
    const color = str === str.toUpperCase() ? 'white' : 'black'
    return { type: piece, color }
}

export const chessboardToString = (chessboard: Chessboard): string => chessboard
    .map(row => row
        .map(cell => pieceToString(cell.piece))
        .join('')
    )
    .join('\n')

export const chessboardFromString = (str: string): Chessboard => str
    .trim()
    .split('\n')
    .map((row, r) => row
        .split('')
        .map((str, c): Cell => ({
            piece: pieceFromString(str),
            background: (r + c) % 2 === 0 ? 'white' : 'black',
            r,
            c,
        }))
    )

export const createInitialChessboard = (): Chessboard => chessboardFromString(dedent`
    rnbqkbnr
    pppppppp
    ........
    ........
    ........
    ........
    PPPPPPPP
    RNBQKBNR
`)

export type Player = 'white' | 'black'

export interface Pos {
    r: number
    c: number
}

export const isSamePos = (pos1: Pos, pos2: Pos): boolean => (
    pos1.r === pos2.r && pos1.c === pos2.c
)

export type CellSelector = (cell: Cell) => boolean

export const insideChessboard = (r: number, c: number): boolean => (
    r >= 0 && r < 8 && c >= 0 && c < 8
)

export type MoveCalculator = (cell: CellN, chessboard: Chessboard) => Pos[]

export const canTake = (self: Piece, target: Piece): boolean => {
    if (self.color === target.color) return false
    if (target.type === 'king') return true
    if (target.type === 'pawn') return self.type === 'knight'
    if (target.type === 'knight') return self.type === 'bishop'
    if (target.type === 'bishop') return self.type === 'rook'
    if (target.type === 'rook') return self.type === 'queen'
    if (target.type === 'queen') return self.type === 'pawn'
    return false
}

export const pawnMoveCalculator = ({ piece, r, c }: CellN, chessboard: Chessboard): Pos[] => {
    const moves: Pos[] = []
    const dr = piece.color === 'white' ? -1 : 1
    
    const r1 = r + dr
    if (! chessboard[r1][c].piece) {
        moves.push({ r: r1, c })
        if (! piece.moved) {
            const r2 = r1 + dr
            if (! chessboard[r2][c].piece) moves.push({ r: r2, c })
        }
    }
    for (const dc of [ -1, 1 ]) {
        if (! insideChessboard(r + dr, c + dc)) continue
        const target = chessboard[r + dr][c + dc].piece
        if (target && canTake(piece, target)) {
            moves.push({ r: r + dr, c: c + dc })
        }
    }
    return moves
}

export const createMoveCalculatorFromDeltas = (deltas: Pos[], limit = Infinity): MoveCalculator => {
    return ({ piece, r: r0, c: c0 }: CellN, chessboard: Chessboard): Pos[] => {
        const moves: Pos[] = []
        for (const { r: dr, c: dc } of deltas) {
            for (let i = 1; i <= limit; i++) {
                const r = r0 + i * dr
                const c = c0 + i * dc
                if (! insideChessboard(r, c)) break
                const target = chessboard[r][c].piece
                if (target) {
                    if (canTake(piece, target)) moves.push({ r, c })
                    break
                }
                moves.push({ r, c })
            }
        }
        return moves
    }
}

export const ROOK_DELTAS: Pos[] = [
    { r: 1, c: 0 },
    { r: -1, c: 0 },
    { r: 0, c: 1 },
    { r: 0, c: -1 },
]
export const BISHOP_DELTAS: Pos[] = [
    { r: 1, c: 1 },
    { r: -1, c: 1 },
    { r: 1, c: -1 },
    { r: -1, c: -1 },
]
export const KNIGHT_DELTAS: Pos[] = [
    { r: 2, c: 1 },
    { r: 2, c: -1 },
    { r: -2, c: 1 },
    { r: -2, c: -1 },
    { r: 1, c: 2 },
    { r: 1, c: -2 },
    { r: -1, c: 2 },
    { r: -1, c: -2 },
]
export const QUEEN_DELTAS: Pos[] = [ ...ROOK_DELTAS, ...BISHOP_DELTAS ]

export const rookMoveCalculator = createMoveCalculatorFromDeltas(ROOK_DELTAS)
export const bishopMoveCalculator = createMoveCalculatorFromDeltas(BISHOP_DELTAS)
export const knightMoveCalculator = createMoveCalculatorFromDeltas(KNIGHT_DELTAS, 1)
export const queenMoveCalculator = createMoveCalculatorFromDeltas(QUEEN_DELTAS)
export const kingMoveCalculator = createMoveCalculatorFromDeltas(QUEEN_DELTAS, 1)

export const MOVE_CALCULATORS: Record<PieceType, MoveCalculator> = {
    pawn: pawnMoveCalculator,
    rook: rookMoveCalculator,
    knight: knightMoveCalculator,
    bishop: bishopMoveCalculator,
    queen: queenMoveCalculator,
    king: kingMoveCalculator,
}

export const getMoves = (cell: CellN, chessboard: Chessboard, cannotBeChecked: boolean): Pos[] => {
    const moves = MOVE_CALCULATORS[cell.piece.type](cell, chessboard)
    return cannotBeChecked
        ? moves.filter(move => {
            const newChessboard = tryMove(cell, move, chessboard)
            const isSafe = ! isBeingChecked(cell.piece.color, newChessboard)
            return isSafe
        })
        : moves
}

export const isBeingChecked = (player: Player, chessboard: Chessboard) => {
    const king = chessboard
        .flat()
        .find(cell => cell.piece?.type === 'king' && cell.piece.color === player)
    if (! king) return false

    return chessboard
        .flat()
        .filter((cell): cell is CellN => !! cell.piece && cell.piece.color !== player)
        .some(cell => getMoves(cell, chessboard, false).some(pos => isSamePos(pos, king)))
}

export const cloneChessboard = (chessboard: Chessboard): Chessboard => chessboard
    .map(row => row
        .map((cell): Cell => ({
            ...cell,
            piece: cell.piece ? { ...cell.piece } : null,
        })
    ))

export const doMove = (self: CellN, target: Pos, chessboard: Chessboard) => {
    self.piece.moved = true
    if (self.piece.type === 'pawn' && (self.r === 0 || self.r === 7)) {
        self.piece.type = 'queen'
    }
    chessboard[target.r][target.c].piece = self.piece
    chessboard[self.r][self.c].piece = null
}

export const tryMove = (self: CellN, target: Pos, chessboard: Chessboard): Chessboard => {
    const newChessboard = cloneChessboard(chessboard)
    doMove(newChessboard[self.r][self.c] as CellN, target, newChessboard)
    return newChessboard
}

export type Game = {
    state: 'playing' | 'finished'
    chessboard: Chessboard
    activePlayer: Player
    activePlayerIsBeingChecked: boolean
}