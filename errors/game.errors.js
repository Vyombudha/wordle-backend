
export class InvalidGuessLengthError extends Error {
    constructor(expectedLength, receivedLength) {
        super(`Expected Guess Length ${expectedLength}, got ${receivedLength}`);
        this.name = 'InvalidGuessLengthError';
        this.statusCode = 400;
    }
}

export class InvalidGameStateError extends Error {
    constructor(reason) {
        super(`Invalid Game state: ${reason}`);
        this.name = "InvalidGameStateError";
        this.statusCode = 422;
    }
}

export class GameNotFoundError extends Error {
    constructor(gameID) {
        super(`Game ID:${gameID} not found!`);
        this.name = "GameNotFoundError";
        this.statusCode = 404;
    }
}

export class InvalidGuessError extends Error {
    constructor(guess) {
        super(`The Guess Word, ${guess} isn't a valid guess`);
        this.name = 'InvalidGuessError';
        this.statusCode = 400;
    }
}