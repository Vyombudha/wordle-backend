import { hardWords } from '../data/hardWords.data.js';
import { easyWords } from '../data/easyWords.data.js';
import { VALID_WORDS } from '../data/validWords.data.js';
import { validateGuess } from '../utils/checkGuess.utils.js';
import { GameMode } from '@prisma/client';

import prisma from "../db/prisma.js";
import * as  GameError from '../errors/game.errors.js';


/**
 * Take the current game difficulty, create a new gameId and game Object. Finally, stores it in gameState Map\
 * @param {object} user - the user who created the game
 * @param {boolean} isHardMode -  current game diffculty parameter
 * @returns {String} gameID
 */
export async function startGame(user, isHardMode = false) {

    let mode = isHardMode ? GameMode.HARD : GameMode.EASY;
    let validAnswerArray = (isHardMode) ? hardWords : easyWords;
    let word = validAnswerArray[Math.floor(Math.random() * validAnswerArray.length)];

    // insert into DB
    const game = await prisma.game.create({
        data: {
            userId: user.id,
            targetWord: word,
            mode
        }
    });

    return game.id;
}

/**
 * returns new gameID
 * @param {object} user - user who owns the game
 * @param {boolean} isHardMode  difficulty of next game 
 * @returns {string} next gameID
 */
export async function nextGame(user, isHardMode = false) {
    return startGame(user, isHardMode);
}

/**
 * @param {object} user - user who owns the game
 * @param {strings} gameID - the game to be deleted 
 */
export async function deleteGame(user, gameID) {

    // Findga the game AND verify ownership (Prevents IDOR)
    const game = await prisma.game.findFirst({
        where: {
            id: gameID,
            userId: user.id
        }
    });

    // NULL on either authorization error or game ID not found
    if (game === null) throw new GameError.NotFound(gameID);

    // Safe Delete From game ID
    await prisma.game.delete({
        where: {
            id: game.id
        }
    });
}

/**
 * @param {object} user - the user who owns the game 
 * @param {string} guess - the guess word for current chance
 * @param {string} gameID -the ID of current game
 * @returns 
 */
export async function makeGuess(user, guess, gameID) {
    if (!VALID_WORDS.has(guess)) throw new GameError.InvalidGuess(guess);


    // 1. Find the game AND verify ownership (Prevents IDOR)
    const game = await prisma.game.findFirst({
        where: {
            id: gameID,
            userId: user.id
        }
    });


    if (game === null) throw new GameError.NotFound(gameID)

    if (game.isCompleted) {
        throw new GameError.Invalid(`game already completed`);
    }

    if (guess.length !== game.targetWord.length) {
        throw new GameError.InvalidGuessLength(game.targetWord.length, guess.length);
    }


    const output = validateGuess(game, guess);

    // game isn't completed yet, skip the complex streak logic 
    if (!output.isCompleted) {

        const mutatedGame = await prisma.game.update({
            where: {
                id: game.id
            },
            data: {
                guesses: output.guesses,
                remainingGuesses: output.remainingGuesses
            }
        });

        // create a new streak if not found, unlikely cause createuser already initiates this row
        const mutatedStreak = await prisma.streak.upsert({
            where: {
                userId: game.userId
            },
            create: {
                userId: game.userId
            },
            update: {}
        });


        // Sanitize the streak data
        const {
            userId,    // strip out
            ...sanitizedStreak
        } = mutatedStreak;

        // send data directly
        return {
            mutatedGame,
            mutatedStreak: sanitizedStreak
        };

    }

    // update the game & game streak logic now
    const { mutatedGame, mutatedStreak } = await prisma.$transaction(async (tx) => {
        const mutatedGame = await tx.game.update({
            where: {
                id: game.id,
            },
            data: {
                isCompleted: output.isCompleted,
                isWinner: output.isWinner,
                guesses: output.guesses,
                remainingGuesses: output.remainingGuesses,
            }
        });

        const streak = await tx.streak.findUnique({
            where: {
                userId: mutatedGame.userId
            }
        });

        if (streak === null) throw new GameError.StreakNotFound();


        const isHardMode = (mutatedGame.mode === GameMode.HARD);
        const currentKey = (isHardMode) ? 'hardCurrentStreak' : 'easyCurrentStreak';
        const maxKey = (isHardMode) ? 'hardMaxStreak' : 'easyMaxStreak';

        const isWinnerAndCompleted = (mutatedGame.isCompleted && mutatedGame.isWinner);


        const newCurrentStreak = (isWinnerAndCompleted) ? streak[currentKey] + 1 : 0;
        const newMaxStreak = Math.max(streak[maxKey], newCurrentStreak);


        const mutatedStreak = await tx.streak.update({
            where: {
                id: streak.id
            },
            data: {
                [currentKey]: newCurrentStreak,
                [maxKey]: newMaxStreak
            }
        });

        return {
            mutatedGame,
            mutatedStreak
        };

    });



    // Sanitize the streak data
    const {
        userId,    // strip out
        ...sanitizedStreak
    } = mutatedStreak;

    // send data directly
    return {
        mutatedGame,
        mutatedStreak: sanitizedStreak
    };
}








