const VoterRegistry = artifacts.require("VoterRegistry");
const VotingBooth = artifacts.require("VotingBooth");
const ResultsTallier = artifacts.require("ResultsTallier");

module.exports = async function (deployer) {
    // We don't deploy ElectionController here as it's meant to be deployed
    // dynamically per election from the backend, or we can deploy a master one.
    // For the sake of simplicity, we just deploy the foundational contracts.
    await deployer.deploy(VoterRegistry);
    const registry = await VoterRegistry.deployed();

    await deployer.deploy(VotingBooth);
    const booth = await VotingBooth.deployed();

    await deployer.deploy(ResultsTallier);
    const tallier = await ResultsTallier.deployed();
};
