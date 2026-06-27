import { hardWords } from '../data/hardWords.data.js';
import { easyWords } from '../data/easyWords.data.js';
import { VALID_WORDS } from '../data/validWords.data.js';
import { validateGuess } from '../utils/checkGuess.utils.js';
import { GameMode, Prisma } from '@prisma/client';

import prisma from "../config/prisma.config.js";
import * as  GameError from '../errors/game.errors.js';


/**
 * @typedef {object} User
 * @property {string} email
 * @property {number} id
 */


/**
 * Take the current game difficulty, create a new gameId and game state
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
 * Skips current game by setting isCompleted:true and isWinner:false. 
 * Finally, returns new gameID
 * @param {User} user - user who owns the game
 * @param {string}  gameID - id of the game to skip
 * @param {boolean} isHardMode  difficulty of next game 
 * @returns {string} next gameID
 */
export async function nextGame(user, gameID, isHardMode = false) {

    try {
        await prisma.game.update({
            where: {
                id: gameID,
                userId: user.id
            },
            data: {
                isCompleted: true,
                isWinner: false,
            }
        });
    } catch (error) {
        if (error.code === 'P2025') {
            throw new GameError.NotFound(gameID);
        }
        throw error;
    }

    return startGame(user, isHardMode);
}

/**
 * @param {User} user - user who owns the game
 * 
 * @param {strings} gameID - the game to be deleted 
 */
export async function deleteGame(user, gameID) {

    // Find the game AND verify ownership (Prevents IDOR)
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
 * @param {User} user - the user who owns the game 
 * @param {string} guess - the guess word for current chance
 * @param {string} gameID -the ID of current game
 * @returns {Promise<void>}
 */
export async function makeGuess(user, guess, gameID) {
    guess = guess.toUpperCase().trim();
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

        // send data directly
        return {
            result: output.result,
            isGameOver: mutatedGame.isCompleted,
            isWinner: mutatedGame.isWinner
        };

    }

    // update the game & game streak logic now
    const mutatedGame = await prisma.$transaction(async (tx) => {
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

        return mutatedGame;
    });



    // send data
    return {
        result: output.result,
        isGameOver: mutatedGame.isCompleted,
        isWinner: mutatedGame.isWinner
    };
}

export async function getGame(user, gameID) {
    const game = await prisma.game.findFirst({
        where: {
            id: gameID,
            userId: user.id
        },
    });

    if (!game) throw new GameError.NotFound(gameID);

    return game.isCompleted
        ? game
        : { ...game, targetWord: 'In Progress' };
}


export async function getAllGames(user) {
    // query
    const games = await prisma.game.findMany({
        where: { userId: user.id },
        select: {
            id: true,
            targetWord: true,
            isWinner: true,
            isCompleted: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
    });


    const gameHistory = games.map(game => {
        if (!game.isCompleted) return { ...game, targetWord: 'In Progress' };
        return game;
    });

    return gameHistory;
}
