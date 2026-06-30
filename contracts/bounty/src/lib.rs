#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token::TokenClient,
    vec, Address, Env, IntoVal, MuxedAddress, String, Symbol, Val,
};

const MIN_TTL: u32 = 17_280;
const EXTEND_TO: u32 = 518_400;
const MIN_RATING: u32 = 1;
const MAX_RATING: u32 = 5;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Status {
    Open,
    Claimed,
    Completed,
    Disputed,
    Refunded,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountyConfig {
    pub id: u64,
    pub client: Address,
    pub solver: Option<Address>,
    pub title: String,
    pub description: String,
    pub amount: i128,
    pub deadline: u64,
    pub status: Status,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Token,
    ReputationContract,
    NextBountyId,
    Bounty(u64),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum BountyError {
    InvalidAmount = 1,
    DeadlineNotFuture = 2,
    BountyNotFound = 3,
    IdOverflow = 4,
    BountyNotOpen = 5,
    DeadlinePassed = 6,
    BountyNotClaimed = 7,
    DeadlineNotPassed = 8,
    MissingSolver = 9,
    InvalidRating = 10,
}

#[contractevent(topics = ["BountyPosted"])]
pub struct BountyPosted {
    pub bounty_id: u64,
    pub client: Address,
    pub amount: i128,
    pub deadline: u64,
}

#[contractevent(topics = ["BountyClaimed"])]
pub struct BountyClaimed {
    pub bounty_id: u64,
    pub solver: Address,
}

#[contractevent(topics = ["BountyDisputed"])]
pub struct BountyDisputed {
    pub bounty_id: u64,
    pub client: Address,
}

#[contractevent(topics = ["BountyCompleted"])]
pub struct BountyCompleted {
    pub bounty_id: u64,
    pub client: Address,
    pub solver: Address,
    pub rating: u32,
}

#[contract]
pub struct BountyContract;

#[contractimpl]
impl BountyContract {
    pub fn __constructor(env: Env, token: Address, reputation_contract: Address) {
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage()
            .instance()
            .set(&DataKey::ReputationContract, &reputation_contract);
        env.storage().instance().set(&DataKey::NextBountyId, &1u64);
    }

    pub fn post_bounty(
        env: Env,
        client: Address,
        title: String,
        description: String,
        amount: i128,
        deadline: u64,
    ) -> Result<u64, BountyError> {
        if amount <= 0 {
            return Err(BountyError::InvalidAmount);
        }
        if deadline <= env.ledger().timestamp() {
            return Err(BountyError::DeadlineNotFuture);
        }

        client.require_auth();

        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let escrow_address: MuxedAddress = env.current_contract_address().into();
        TokenClient::new(&env, &token).transfer(&client, &escrow_address, &amount);

        let bounty_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextBountyId)
            .unwrap();
        let next_bounty_id = bounty_id.checked_add(1).ok_or(BountyError::IdOverflow)?;
        env.storage()
            .instance()
            .set(&DataKey::NextBountyId, &next_bounty_id);

        let bounty = BountyConfig {
            id: bounty_id,
            client: client.clone(),
            solver: None,
            title,
            description,
            amount,
            deadline,
            status: Status::Open,
        };
        let bounty_key = DataKey::Bounty(bounty_id);
        env.storage().persistent().set(&bounty_key, &bounty);
        extend_bounty_ttl(&env, &bounty_key);

        BountyPosted {
            bounty_id,
            client,
            amount,
            deadline,
        }
        .publish(&env);

        Ok(bounty_id)
    }

    pub fn claim_bounty(
        env: Env,
        bounty_id: u64,
        solver: Address,
    ) -> Result<BountyConfig, BountyError> {
        solver.require_auth();

        let bounty_key = DataKey::Bounty(bounty_id);
        let mut bounty = read_bounty(&env, bounty_id)?;

        if bounty.status != Status::Open {
            return Err(BountyError::BountyNotOpen);
        }
        if env.ledger().timestamp() > bounty.deadline {
            return Err(BountyError::DeadlinePassed);
        }

        bounty.solver = Some(solver.clone());
        bounty.status = Status::Claimed;

        env.storage().persistent().set(&bounty_key, &bounty);
        extend_bounty_ttl(&env, &bounty_key);

        BountyClaimed { bounty_id, solver }.publish(&env);

        Ok(bounty)
    }

    pub fn dispute_bounty(env: Env, bounty_id: u64) -> Result<BountyConfig, BountyError> {
        let bounty_key = DataKey::Bounty(bounty_id);
        let mut bounty = read_bounty(&env, bounty_id)?;

        bounty.client.require_auth();

        if bounty.status != Status::Claimed {
            return Err(BountyError::BountyNotClaimed);
        }

        let client = bounty.client.clone();
        bounty.solver = None;
        bounty.status = Status::Open;

        env.storage().persistent().set(&bounty_key, &bounty);
        extend_bounty_ttl(&env, &bounty_key);

        BountyDisputed { bounty_id, client }.publish(&env);

        Ok(bounty)
    }

    pub fn complete_bounty(
        env: Env,
        bounty_id: u64,
        rating: u32,
    ) -> Result<BountyConfig, BountyError> {
        let bounty_key = DataKey::Bounty(bounty_id);
        let mut bounty = read_bounty(&env, bounty_id)?;

        bounty.client.require_auth();

        if bounty.status != Status::Claimed {
            return Err(BountyError::BountyNotClaimed);
        }
        if !(MIN_RATING..=MAX_RATING).contains(&rating) {
            return Err(BountyError::InvalidRating);
        }

        let solver = bounty.solver.clone().ok_or(BountyError::MissingSolver)?;
        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let payout_to: MuxedAddress = solver.clone().into();
        TokenClient::new(&env, &token).transfer(
            &env.current_contract_address(),
            &payout_to,
            &bounty.amount,
        );

        let reputation_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::ReputationContract)
            .unwrap();
        let _: Val = env.invoke_contract(
            &reputation_contract,
            &Symbol::new(&env, "update_score"),
            vec![&env, solver.into_val(&env), rating.into_val(&env)],
        );

        bounty.status = Status::Completed;

        env.storage().persistent().set(&bounty_key, &bounty);
        extend_bounty_ttl(&env, &bounty_key);

        BountyCompleted {
            bounty_id,
            client: bounty.client.clone(),
            solver,
            rating,
        }
        .publish(&env);

        Ok(bounty)
    }

    pub fn refund_bounty(env: Env, bounty_id: u64) -> Result<BountyConfig, BountyError> {
        let bounty_key = DataKey::Bounty(bounty_id);
        let mut bounty = read_bounty(&env, bounty_id)?;

        bounty.client.require_auth();

        if bounty.status != Status::Open {
            return Err(BountyError::BountyNotOpen);
        }
        if env.ledger().timestamp() <= bounty.deadline {
            return Err(BountyError::DeadlineNotPassed);
        }

        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let escrow = env.current_contract_address();
        let refund_to: MuxedAddress = bounty.client.clone().into();
        TokenClient::new(&env, &token).transfer(&escrow, &refund_to, &bounty.amount);

        bounty.status = Status::Refunded;

        env.storage().persistent().set(&bounty_key, &bounty);
        extend_bounty_ttl(&env, &bounty_key);

        Ok(bounty)
    }

    pub fn get_bounty(env: Env, bounty_id: u64) -> Result<BountyConfig, BountyError> {
        read_bounty(&env, bounty_id)
    }

    pub fn get_bounty_count(env: Env) -> u64 {
        let next_bounty_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextBountyId)
            .unwrap_or(1);
        next_bounty_id.saturating_sub(1)
    }
}

fn read_bounty(env: &Env, bounty_id: u64) -> Result<BountyConfig, BountyError> {
    let bounty_key = DataKey::Bounty(bounty_id);
    env.storage()
        .persistent()
        .get(&bounty_key)
        .ok_or(BountyError::BountyNotFound)
}

fn extend_bounty_ttl(env: &Env, bounty_key: &DataKey) {
    env.storage().instance().extend_ttl(MIN_TTL, EXTEND_TO);
    env.storage()
        .persistent()
        .extend_ttl(bounty_key, MIN_TTL, EXTEND_TO);
}

#[cfg(test)]
mod test {
    use super::*;
    use reputation_contract::{ReputationContract, ReputationContractClient, ReputationData};
    use soroban_sdk::{
        testutils::{Address as _, Ledger as _},
        token::StellarAssetClient,
        Env,
    };

    fn setup() -> (
        Env,
        BountyContractClient<'static>,
        StellarAssetClient<'static>,
        Address,
    ) {
        let (env, bounty_client, token_admin_client, contract_id, _) = setup_with_reputation();
        (env, bounty_client, token_admin_client, contract_id)
    }

    fn setup_with_reputation() -> (
        Env,
        BountyContractClient<'static>,
        StellarAssetClient<'static>,
        Address,
        ReputationContractClient<'static>,
    ) {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(1_700_000_000);

        let token_admin = Address::generate(&env);
        let asset = env.register_stellar_asset_contract_v2(token_admin);
        let token_admin_client = StellarAssetClient::new(&env, &asset.address());

        let bounty_contract_id = Address::generate(&env);
        let reputation_contract_id = env.register(ReputationContract, (&bounty_contract_id,));
        let reputation_client = ReputationContractClient::new(&env, &reputation_contract_id);
        env.register_at(
            &bounty_contract_id,
            BountyContract,
            (&asset.address(), &reputation_contract_id),
        );
        let bounty_client = BountyContractClient::new(&env, &bounty_contract_id);

        (
            env,
            bounty_client,
            token_admin_client,
            bounty_contract_id,
            reputation_client,
        )
    }

    #[test]
    fn test_post_bounty() {
        let (env, bounty_client, token_admin_client, contract_id) = setup();
        let client = Address::generate(&env);
        token_admin_client.mint(&client, &1_000);

        let title = String::from_str(&env, "Build profile page");
        let description = String::from_str(&env, "Create solver profile route");
        let deadline = env.ledger().timestamp() + 86_400;

        let bounty_id = bounty_client.post_bounty(&client, &title, &description, &250, &deadline);
        let bounty = bounty_client.get_bounty(&bounty_id);

        assert_eq!(bounty_id, 1);
        assert_eq!(bounty_client.get_bounty_count(), 1);
        assert_eq!(
            bounty,
            BountyConfig {
                id: 1,
                client: client.clone(),
                solver: None,
                title,
                description,
                amount: 250,
                deadline,
                status: Status::Open,
            }
        );
        assert_eq!(token_admin_client.balance(&client), 750);
        assert_eq!(token_admin_client.balance(&contract_id), 250);
    }

    #[test]
    fn test_claim_bounty() {
        let (env, bounty_client, token_admin_client, _) = setup();
        let client = Address::generate(&env);
        let solver = Address::generate(&env);
        token_admin_client.mint(&client, &1_000);

        let title = String::from_str(&env, "Build bounty detail");
        let description = String::from_str(&env, "Create claim action");
        let deadline = env.ledger().timestamp() + 86_400;
        let bounty_id = bounty_client.post_bounty(&client, &title, &description, &300, &deadline);

        let bounty = bounty_client.claim_bounty(&bounty_id, &solver);

        assert_eq!(
            bounty,
            BountyConfig {
                id: bounty_id,
                client,
                solver: Some(solver),
                title,
                description,
                amount: 300,
                deadline,
                status: Status::Claimed,
            }
        );
        assert_eq!(bounty_client.get_bounty(&bounty_id), bounty);
    }

    #[test]
    fn test_claim_bounty_rejects_non_open_bounty() {
        let (env, bounty_client, token_admin_client, _) = setup();
        let client = Address::generate(&env);
        let solver = Address::generate(&env);
        let second_solver = Address::generate(&env);
        token_admin_client.mint(&client, &1_000);

        let bounty_id = bounty_client.post_bounty(
            &client,
            &String::from_str(&env, "Claim once"),
            &String::from_str(&env, "Only one solver can claim"),
            &300,
            &(env.ledger().timestamp() + 86_400),
        );
        bounty_client.claim_bounty(&bounty_id, &solver);

        assert_eq!(
            bounty_client.try_claim_bounty(&bounty_id, &second_solver),
            Err(Ok(BountyError::BountyNotOpen))
        );
    }

    #[test]
    fn test_claim_bounty_rejects_expired_bounty() {
        let (env, bounty_client, token_admin_client, _) = setup();
        let client = Address::generate(&env);
        let solver = Address::generate(&env);
        token_admin_client.mint(&client, &1_000);

        let deadline = env.ledger().timestamp() + 100;
        let bounty_id = bounty_client.post_bounty(
            &client,
            &String::from_str(&env, "Expired claim"),
            &String::from_str(&env, "Cannot claim after deadline"),
            &300,
            &deadline,
        );
        env.ledger().set_timestamp(deadline + 1);

        assert_eq!(
            bounty_client.try_claim_bounty(&bounty_id, &solver),
            Err(Ok(BountyError::DeadlinePassed))
        );
    }

    #[test]
    fn test_complete_bounty_and_reputation_update() {
        let (env, bounty_client, token_admin_client, contract_id, reputation_client) =
            setup_with_reputation();
        let client = Address::generate(&env);
        let solver = Address::generate(&env);
        token_admin_client.mint(&client, &1_000);

        let title = String::from_str(&env, "Ship escrow flow");
        let description = String::from_str(&env, "Release funds and update reputation");
        let deadline = env.ledger().timestamp() + 86_400;
        let bounty_id = bounty_client.post_bounty(&client, &title, &description, &300, &deadline);
        bounty_client.claim_bounty(&bounty_id, &solver);

        let completed = bounty_client.complete_bounty(&bounty_id, &5);

        assert_eq!(
            completed,
            BountyConfig {
                id: bounty_id,
                client,
                solver: Some(solver.clone()),
                title,
                description,
                amount: 300,
                deadline,
                status: Status::Completed,
            }
        );
        assert_eq!(token_admin_client.balance(&contract_id), 0);
        assert_eq!(token_admin_client.balance(&solver), 300);
        assert_eq!(
            reputation_client.get_score(&solver),
            ReputationData {
                solver,
                completed: 1,
                disputed: 0,
                score: 100,
            }
        );
    }

    #[test]
    fn test_complete_bounty_rejects_unclaimed_bounty() {
        let (env, bounty_client, token_admin_client, _) = setup();
        let client = Address::generate(&env);
        token_admin_client.mint(&client, &1_000);

        let bounty_id = bounty_client.post_bounty(
            &client,
            &String::from_str(&env, "Unclaimed completion"),
            &String::from_str(&env, "Cannot complete before claim"),
            &300,
            &(env.ledger().timestamp() + 86_400),
        );

        assert_eq!(
            bounty_client.try_complete_bounty(&bounty_id, &5),
            Err(Ok(BountyError::BountyNotClaimed))
        );
    }

    #[test]
    fn test_complete_bounty_rejects_invalid_rating() {
        let (env, bounty_client, token_admin_client, _) = setup();
        let client = Address::generate(&env);
        let solver = Address::generate(&env);
        token_admin_client.mint(&client, &1_000);

        let bounty_id = bounty_client.post_bounty(
            &client,
            &String::from_str(&env, "Invalid rating"),
            &String::from_str(&env, "Rating must be one through five"),
            &300,
            &(env.ledger().timestamp() + 86_400),
        );
        bounty_client.claim_bounty(&bounty_id, &solver);

        assert_eq!(
            bounty_client.try_complete_bounty(&bounty_id, &0),
            Err(Ok(BountyError::InvalidRating))
        );
        assert_eq!(
            bounty_client.try_complete_bounty(&bounty_id, &6),
            Err(Ok(BountyError::InvalidRating))
        );
    }

    #[test]
    fn test_dispute_reopens_bounty() {
        let (env, bounty_client, token_admin_client, _) = setup();
        let client = Address::generate(&env);
        let first_solver = Address::generate(&env);
        let second_solver = Address::generate(&env);
        token_admin_client.mint(&client, &1_000);

        let title = String::from_str(&env, "Fix mobile layout");
        let description = String::from_str(&env, "Improve bounty card responsiveness");
        let deadline = env.ledger().timestamp() + 86_400;
        let bounty_id = bounty_client.post_bounty(&client, &title, &description, &300, &deadline);
        bounty_client.claim_bounty(&bounty_id, &first_solver);

        let reopened = bounty_client.dispute_bounty(&bounty_id);

        assert_eq!(
            reopened,
            BountyConfig {
                id: bounty_id,
                client,
                solver: None,
                title,
                description,
                amount: 300,
                deadline,
                status: Status::Open,
            }
        );

        let claimed_again = bounty_client.claim_bounty(&bounty_id, &second_solver);
        assert_eq!(claimed_again.solver, Some(second_solver));
        assert_eq!(claimed_again.status, Status::Claimed);
    }

    #[test]
    fn test_dispute_bounty_rejects_unclaimed_bounty() {
        let (env, bounty_client, token_admin_client, _) = setup();
        let client = Address::generate(&env);
        token_admin_client.mint(&client, &1_000);

        let bounty_id = bounty_client.post_bounty(
            &client,
            &String::from_str(&env, "Unclaimed"),
            &String::from_str(&env, "No solver yet"),
            &300,
            &(env.ledger().timestamp() + 86_400),
        );

        assert_eq!(
            bounty_client.try_dispute_bounty(&bounty_id),
            Err(Ok(BountyError::BountyNotClaimed))
        );
    }

    #[test]
    fn test_refund_on_deadline() {
        let (env, bounty_client, token_admin_client, contract_id) = setup();
        let client = Address::generate(&env);
        token_admin_client.mint(&client, &1_000);

        let title = String::from_str(&env, "Expired open bounty");
        let description = String::from_str(&env, "Refund after deadline");
        let deadline = env.ledger().timestamp() + 100;
        let bounty_id = bounty_client.post_bounty(&client, &title, &description, &400, &deadline);

        assert_eq!(token_admin_client.balance(&client), 600);
        assert_eq!(token_admin_client.balance(&contract_id), 400);

        env.ledger().set_timestamp(deadline + 1);
        let refunded = bounty_client.refund_bounty(&bounty_id);

        assert_eq!(
            refunded,
            BountyConfig {
                id: bounty_id,
                client: client.clone(),
                solver: None,
                title,
                description,
                amount: 400,
                deadline,
                status: Status::Refunded,
            }
        );
        assert_eq!(token_admin_client.balance(&client), 1_000);
        assert_eq!(token_admin_client.balance(&contract_id), 0);
    }

    #[test]
    fn test_refund_rejects_before_deadline_passes() {
        let (env, bounty_client, token_admin_client, _) = setup();
        let client = Address::generate(&env);
        token_admin_client.mint(&client, &1_000);

        let bounty_id = bounty_client.post_bounty(
            &client,
            &String::from_str(&env, "Too early"),
            &String::from_str(&env, "Cannot refund before deadline"),
            &300,
            &(env.ledger().timestamp() + 86_400),
        );

        assert_eq!(
            bounty_client.try_refund_bounty(&bounty_id),
            Err(Ok(BountyError::DeadlineNotPassed))
        );
    }

    #[test]
    fn test_refund_rejects_claimed_bounty() {
        let (env, bounty_client, token_admin_client, _) = setup();
        let client = Address::generate(&env);
        let solver = Address::generate(&env);
        token_admin_client.mint(&client, &1_000);

        let deadline = env.ledger().timestamp() + 100;
        let bounty_id = bounty_client.post_bounty(
            &client,
            &String::from_str(&env, "Claimed"),
            &String::from_str(&env, "Cannot refund claimed bounty"),
            &300,
            &deadline,
        );
        bounty_client.claim_bounty(&bounty_id, &solver);
        env.ledger().set_timestamp(deadline + 1);

        assert_eq!(
            bounty_client.try_refund_bounty(&bounty_id),
            Err(Ok(BountyError::BountyNotOpen))
        );
    }

    #[test]
    fn test_post_bounty_rejects_invalid_amount() {
        let (env, bounty_client, _, _) = setup();
        let client = Address::generate(&env);

        assert_eq!(
            bounty_client.try_post_bounty(
                &client,
                &String::from_str(&env, "Invalid"),
                &String::from_str(&env, "Invalid amount"),
                &0,
                &(env.ledger().timestamp() + 100),
            ),
            Err(Ok(BountyError::InvalidAmount))
        );
    }

    #[test]
    fn test_post_bounty_rejects_past_deadline() {
        let (env, bounty_client, _, _) = setup();
        let client = Address::generate(&env);

        assert_eq!(
            bounty_client.try_post_bounty(
                &client,
                &String::from_str(&env, "Expired"),
                &String::from_str(&env, "Past deadline"),
                &100,
                &env.ledger().timestamp(),
            ),
            Err(Ok(BountyError::DeadlineNotFuture))
        );
    }
}
