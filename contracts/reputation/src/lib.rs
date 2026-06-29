#![no_std]

use soroban_sdk::{contract, contractimpl, Env, Symbol};

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {
    pub fn version(_env: Env) -> Symbol {
        Symbol::new(&_env, "reputation_v0")
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::Env;

    #[test]
    fn test_version() {
        let env = Env::default();
        let contract_id = env.register(ReputationContract, ());
        let client = ReputationContractClient::new(&env, &contract_id);

        assert_eq!(client.version(), Symbol::new(&env, "reputation_v0"));
    }
}

