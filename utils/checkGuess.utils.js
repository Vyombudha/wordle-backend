import { InvalidGameStateError, InvalidGuessLengthError } from '../errors/game.errors.js';

/**
 * @typedef {object} game
 * @property {string} targetWord
 * @property {string} guess
 * @property {number} remainingGuesses
 * @property {boolean} isWinner
 */

/**
 * this checks game state variables to determine, if the game has been completed or not
 * @param {number} remainingGuesses 
 * @param {boolean} isWinner 
 * @returns {boolean}
 */
const checkGameState = (remainingGuesses, isWinner) => {
 return remainingGuesses === 0 || isWinner;
}



/**
 * @param {game} game - current game state object
 * @returns {{
 *   result: string[],
 *   remainingGuesses: number,
 *   isWinner: boolean,
 *   isGameOver: boolean
 * }}
 */
export default function validateGuess(game) {
    
    let { remainingGuesses, isWinner, guess, targetWord } = game;
    if (guess.length !== targetWord.length) {
        throw new InvalidGuessLengthError(targetWord.length, guess.length);
    }

    if (checkGameState(remainingGuesses, isWinner)) {
        throw new InvalidGameStateError(`game already completed`);
    }


    const secretChars = targetWord.split('');
    const guessChars = guess.split('');
    const result = Array(targetWord.length).fill('gray');
    const counts = {};

    // Pass 1: Mark exact matches (greens)
    for (let i = 0; i < targetWord.length; i++) {
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
    for (let i = 0; i < targetWord.length; i++) {
        // Skip already matched greens
        if (result[i] === 'green') continue;

        const char = guessChars[i];
        if (counts[char] > 0) {
            result[i] = 'yellow';
            counts[char]--; // Decrement available count
        }
    }


    let newIsWinner = result.every(color => color === 'green');
    let newRemainingGuesses = remainingGuesses - 1;

    return {
        result,
        remainingGuesses: newRemainingGuesses,
        isWinner: newIsWinner,
        isGameOver: checkGameState(remainingGuesses, isWinner)
    };
}


