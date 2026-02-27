// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VoterRegistry {
    address public owner;
    address public electionController;

    struct Voter {
        bool isRegistered;
        uint constituencyId;
    }

    mapping(bytes32 => Voter) public voters;
    uint public voterCount;

    event VoterRegistered(bytes32 indexed voterHash, uint constituencyId);

    modifier onlyOwnerOrController() {
        require(msg.sender == owner || msg.sender == electionController, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setElectionController(address _controller) external {
        require(msg.sender == owner, "Only owner can set controller");
        electionController = _controller;
    }

    function registerVoter(bytes32 voterHash, uint constituencyId) external onlyOwnerOrController {
        require(!voters[voterHash].isRegistered, "Voter already registered");
        voters[voterHash] = Voter({
            isRegistered: true,
            constituencyId: constituencyId
        });
        voterCount++;
        emit VoterRegistered(voterHash, constituencyId);
    }

    function isEligible(bytes32 voterHash) external view returns (bool) {
        return voters[voterHash].isRegistered;
    }

    function getVoterConstituency(bytes32 voterHash) external view returns (uint) {
        require(voters[voterHash].isRegistered, "Not registered");
        return voters[voterHash].constituencyId;
    }

    function getVoterCount() external view returns (uint) {
        return voterCount;
    }
}
