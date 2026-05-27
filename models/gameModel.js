import { InvalidGameStateError, InvalidGuessLengthError } from '../errors/gameErrors.js'

export class game {
    #remainingGuesses = 6;
    #isWinner = false;
    /**
     * create a new game object 
     * @param {string} word 
     */
    constructor(word) {
        this.word = word;
        this.startedAt = Date.now();
        this.lastActivity = Date.now();
    }


    get remainingGuesses() { return this.#remainingGuesses; }
    get isWinner() { return this.#isWinner; }

    isGameOver() {
        return this.#remainingGuesses === 0 || this.#isWinner;
    }

    /**
     * 
     * @param {string} guess 
     * @returns {{isGameOver:boolean,result:Array<string>}} 
     */
    validateGuess(guess) {

        if (guess.length !== this.word.length) {
            throw new InvalidGuessLengthError(this.word.length, guess.length);
        }

        if (this.isGameOver()) {
            throw new InvalidGameStateError(`game already completeed`);
        }


        const secretChars = this.word.split('');
        const guessChars = guess.split('');
        const result = Array(this.word.length).fill('gray');
        const counts = {};

        // Pass 1: Mark exact matches (greens)
        for (let i = 0; i < this.word.length; i++) {
            if (guessChars[i] === secretChars[i]) {
                result[i] = 'green';
                secretChars[i] = null; // Mark as accounted for
            } else {
                // Count remaining unmatched letters in secret
                const char = secretChars[i];
                counts[char] = (counts[char] || 0) + 1;
            }
        }

        // Pass 2: Mark partial matches (yellows)
        for (let i = 0; i < this.word.length; i++) {
            // Skip already matched greens
            if (result[i] === 'green') continue;

            const char = guessChars[i];
            if (counts[char] > 0) {
                result[i] = 'yellow';
                counts[char]--; // Decrement available count
            }
        }


        this.#isWinner = result.every(color => color === 'green');
        this.lastActivity = Date.now();
        this.#remainingGuesses--;

        return { result, isGameOver: this.isGameOver() };
    }


}

