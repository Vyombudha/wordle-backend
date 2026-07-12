import Game from "@prisma/client";

/**
 * this checks game state variables to determine, if the game has been completed or not
 * @param {number} remainingGuesses 
 * @param {boolean} isWinner 
 * @returns {boolean}
 */
const checkGameState = (remainingGuesses, isWinner) => remainingGuesses === 0 || isWinner;


/**
 * @param {Game} game - current game state object
 * @param {string} guess - guess for this move
 * @returns {{
 *   result: string[],
 *   remainingGuesses: number,
 *   isWinner: boolean,
 *   isCompleted: boolean,
 *   guesses : string[]
 * }}
 */
export function validateGuess(game, guess) {

    let { remainingGuesses, targetWord } = game;


    const newGuesses = [...game.guesses, guess];
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
        guesses: newGuesses,
        remainingGuesses: newRemainingGuesses,
        isWinner: newIsWinner,
        isCompleted: checkGameState(newRemainingGuesses, newIsWinner)
    };
}


