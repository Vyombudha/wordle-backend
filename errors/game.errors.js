import { AppError } from './base.errors.js';


export class InvalidGuessLength extends AppError {
    constructor(expectedLength, receivedLength) {
        super(`Expected Guess Length ${expectedLength}, got ${receivedLength}`, 400);
    }
}

export class Invalid extends AppError {
    constructor(reason) {
        super(`Invalid Game state: ${reason}`, 422);
    }
}

export class StreakNotFound extends AppError {
    constructor() {
        super(`User Streak Not Found!, Try Re-Logging`, 404);
    }
}


export class NotFound extends AppError {
    constructor(gameID) {
        super(`Game ID:${gameID} not found!`, 404);
    }
}

export class InvalidGuess extends AppError {
    constructor(guess) {
        super(`The Guess Word, ${guess} isn't a valid guess`, 400);
    }
}

