
export class InvalidGuessLengthError extends Error {
    constructor(expectedLength, receivedLength) {
        super(`Expected Guess Length ${expectedLength}, got ${receivedLength}`);
        this.name = 'InvalidGuessLengthError';
    }
}

export class InvalidGameStateError extends Error {
    constructor(reason) {
        super(`Invalid Game state: ${reason}`);
        this.name = "InvalidGameStateError";
    }
}

export class GameNotFoundError extends Error {
    constructor(gameID) {
        super(`Game ID:${gameID} not found!`);
        this.name = "GameNotFoundError";
    }
}