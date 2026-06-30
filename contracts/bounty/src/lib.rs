#![no_std]

use soroban_sdk::{contract, contractimpl, Env, Symbol};

#[contract]
pub struct BountyContract;

#[contractimpl]
impl BountyContract {
    pub fn version(_env: Env) -> Symbol {
        Symbol::new(&_env, "bounty_v0")
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::Env;

    #[test]
    fn test_version() {
        let env = Env::default();
        let contract_id = env.register(BountyContract, ());
        let client = BountyContractClient::new(&env, &contract_id);

        assert_eq!(client.version(), Symbol::new(&env, "bounty_v0"));
    }
}
