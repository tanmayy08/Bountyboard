#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, Vec};

const MIN_TTL: u32 = 17_280;
const EXTEND_TO: u32 = 518_400;
const MAX_RATING: u32 = 5;
const SCORE_MULTIPLIER: u32 = 20;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationData {
    pub solver: Address,
    pub completed: u32,
    pub disputed: u32,
    pub score: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    BountyContract,
    Reputation(Address),
    RatingSum(Address),
    Solvers,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ReputationError {
    InvalidRating = 1,
    ScoreOverflow = 2,
}

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {
    pub fn __constructor(env: Env, bounty_contract: Address) {
        env.storage()
            .instance()
            .set(&DataKey::BountyContract, &bounty_contract);
    }

    pub fn update_score(
        env: Env,
        solver: Address,
        rating: u32,
    ) -> Result<ReputationData, ReputationError> {
        if rating == 0 || rating > MAX_RATING {
            return Err(ReputationError::InvalidRating);
        }

        let bounty_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::BountyContract)
            .unwrap();
        bounty_contract.require_auth();

        let mut reputation = read_reputation(&env, &solver);
        let rating_sum_key = DataKey::RatingSum(solver.clone());
        let previous_rating_sum: u32 = env.storage().persistent().get(&rating_sum_key).unwrap_or(0);

        reputation.completed = reputation
            .completed
            .checked_add(1)
            .ok_or(ReputationError::ScoreOverflow)?;
        let rating_sum = previous_rating_sum
            .checked_add(rating)
            .ok_or(ReputationError::ScoreOverflow)?;
        reputation.score = rating_sum
            .checked_mul(SCORE_MULTIPLIER)
            .ok_or(ReputationError::ScoreOverflow)?
            / reputation.completed;

        let reputation_key = DataKey::Reputation(solver.clone());
        env.storage().persistent().set(&reputation_key, &reputation);
        env.storage().persistent().set(&rating_sum_key, &rating_sum);
        remember_solver(&env, &solver);
        extend_reputation_ttl(&env, &reputation_key, &rating_sum_key);

        Ok(reputation)
    }

    pub fn get_score(env: Env, solver: Address) -> ReputationData {
        read_reputation(&env, &solver)
    }

    pub fn get_leaderboard(env: Env) -> Vec<(Address, u32)> {
        let solvers: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Solvers)
            .unwrap_or(Vec::new(&env));
        let mut leaderboard = Vec::new(&env);

        for solver in solvers.iter() {
            let reputation = read_reputation(&env, &solver);
            insert_leaderboard_entry(&mut leaderboard, solver, reputation.score);
        }

        leaderboard
    }
}

fn read_reputation(env: &Env, solver: &Address) -> ReputationData {
    let reputation_key = DataKey::Reputation(solver.clone());
    env.storage()
        .persistent()
        .get(&reputation_key)
        .unwrap_or(ReputationData {
            solver: solver.clone(),
            completed: 0,
            disputed: 0,
            score: 0,
        })
}

fn remember_solver(env: &Env, solver: &Address) {
    let mut solvers: Vec<Address> = env
        .storage()
        .instance()
        .get(&DataKey::Solvers)
        .unwrap_or(Vec::new(env));

    if !solvers.contains(solver) {
        solvers.push_back(solver.clone());
        env.storage().instance().set(&DataKey::Solvers, &solvers);
    }
}

fn insert_leaderboard_entry(leaderboard: &mut Vec<(Address, u32)>, solver: Address, score: u32) {
    let mut index = 0;
    while index < leaderboard.len() {
        let (_, existing_score) = leaderboard.get_unchecked(index);
        if score > existing_score {
            break;
        }
        index += 1;
    }
    leaderboard.insert(index, (solver, score));
}

fn extend_reputation_ttl(env: &Env, reputation_key: &DataKey, rating_sum_key: &DataKey) {
    env.storage().instance().extend_ttl(MIN_TTL, EXTEND_TO);
    env.storage()
        .persistent()
        .extend_ttl(reputation_key, MIN_TTL, EXTEND_TO);
    env.storage()
        .persistent()
        .extend_ttl(rating_sum_key, MIN_TTL, EXTEND_TO);
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    fn setup() -> (Env, ReputationContractClient<'static>, Address) {
        let env = Env::default();
        env.mock_all_auths();

        let bounty_contract = Address::generate(&env);
        let contract_id = env.register(ReputationContract, (&bounty_contract,));
        let client = ReputationContractClient::new(&env, &contract_id);

        (env, client, bounty_contract)
    }

    #[test]
    fn test_update_score_creates_solver_reputation() {
        let (env, client, _) = setup();
        let solver = Address::generate(&env);

        let reputation = client.update_score(&solver, &5);

        assert_eq!(
            reputation,
            ReputationData {
                solver,
                completed: 1,
                disputed: 0,
                score: 100,
            }
        );
    }

    #[test]
    fn test_reputation_score_calculation() {
        let (env, client, _) = setup();
        let solver = Address::generate(&env);

        client.update_score(&solver, &5);
        let reputation = client.update_score(&solver, &3);

        assert_eq!(reputation.completed, 2);
        assert_eq!(reputation.disputed, 0);
        assert_eq!(reputation.score, 80);
        assert_eq!(client.get_score(&solver), reputation);
    }

    #[test]
    fn test_get_score_returns_empty_reputation_for_new_solver() {
        let (env, client, _) = setup();
        let solver = Address::generate(&env);

        assert_eq!(
            client.get_score(&solver),
            ReputationData {
                solver,
                completed: 0,
                disputed: 0,
                score: 0,
            }
        );
    }

    #[test]
    fn test_get_leaderboard_sorts_by_score_descending() {
        let (env, client, _) = setup();
        let low_solver = Address::generate(&env);
        let high_solver = Address::generate(&env);

        client.update_score(&low_solver, &2);
        client.update_score(&high_solver, &5);

        let leaderboard = client.get_leaderboard();

        assert_eq!(leaderboard.len(), 2);
        assert_eq!(leaderboard.get_unchecked(0), (high_solver, 100));
        assert_eq!(leaderboard.get_unchecked(1), (low_solver, 40));
    }

    #[test]
    fn test_rejects_invalid_rating() {
        let (env, client, _) = setup();
        let solver = Address::generate(&env);

        assert_eq!(
            client.try_update_score(&solver, &0),
            Err(Ok(ReputationError::InvalidRating))
        );
        assert_eq!(
            client.try_update_score(&solver, &6),
            Err(Ok(ReputationError::InvalidRating))
        );
    }
}
