#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token::TokenClient,
    Address, Env, MuxedAddress, String,
};

const MIN_TTL: u32 = 17_280;
const EXTEND_TO: u32 = 518_400;

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

#[contract]
pub struct BountyContract;

#[contractimpl]
impl BountyContract {
    pub fn __constructor(env: Env, token: Address) {
        env.storage().instance().set(&DataKey::Token, &token);
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

    pub fn get_bounty(env: Env, bounty_id: u64) -> Result<BountyConfig, BountyError> {
        read_bounty(&env, bounty_id)
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
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(1_700_000_000);

        let token_admin = Address::generate(&env);
        let asset = env.register_stellar_asset_contract_v2(token_admin);
        let token_admin_client = StellarAssetClient::new(&env, &asset.address());

        let contract_id = env.register(BountyContract, (&asset.address(),));
        let bounty_client = BountyContractClient::new(&env, &contract_id);

        (env, bounty_client, token_admin_client, contract_id)
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
