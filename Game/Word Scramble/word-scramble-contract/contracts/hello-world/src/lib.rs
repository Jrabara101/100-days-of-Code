#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec, Symbol, symbol_short};

#[contracttype]
#[derive(Clone)]
pub struct PlayerScore {
    pub player: Address,
    pub score: u32,
    pub level: u32,
}

const LEADERBOARD: Symbol = symbol_short!("LDRBOARD");
const MAX_ENTRIES: u32 = 10;

#[contract]
pub struct WordScrambleContract;

#[contractimpl]
impl WordScrambleContract {
    // Submit a score — caller must sign the transaction
    pub fn submit_score(env: Env, player: Address, score: u32, level: u32) {
        player.require_auth();

        let mut board: Vec<PlayerScore> = env
            .storage()
            .persistent()
            .get(&LEADERBOARD)
            .unwrap_or(Vec::new(&env));

        // Update existing entry or push new one
        let mut found = false;
        for i in 0..board.len() {
            let entry = board.get(i).unwrap();
            if entry.player == player {
                if score > entry.score {
                    board.set(i, PlayerScore { player: player.clone(), score, level });
                }
                found = true;
                break;
            }
        }

        if !found {
            board.push_back(PlayerScore { player, score, level });
        }

        // Keep only top MAX_ENTRIES by score
        let len = board.len();
        for i in 0..len {
            for j in 0..len - 1 - i {
                let a = board.get(j).unwrap();
                let b = board.get(j + 1).unwrap();
                if a.score < b.score {
                    board.set(j, b);
                    board.set(j + 1, a);
                }
            }
        }

        if board.len() > MAX_ENTRIES {
            let mut trimmed = Vec::new(&env);
            for i in 0..MAX_ENTRIES {
                trimmed.push_back(board.get(i).unwrap());
            }
            board = trimmed;
        }

        env.storage().persistent().set(&LEADERBOARD, &board);
    }

    // Get the full leaderboard
    pub fn get_leaderboard(env: Env) -> Vec<PlayerScore> {
        env.storage()
            .persistent()
            .get(&LEADERBOARD)
            .unwrap_or(Vec::new(&env))
    }

    // Get a single player's score
    pub fn get_score(env: Env, player: Address) -> u32 {
        let board: Vec<PlayerScore> = env
            .storage()
            .persistent()
            .get(&LEADERBOARD)
            .unwrap_or(Vec::new(&env));

        for i in 0..board.len() {
            let entry = board.get(i).unwrap();
            if entry.player == player {
                return entry.score;
            }
        }
        0
    }
}
