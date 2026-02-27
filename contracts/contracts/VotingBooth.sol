// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VotingBooth {
    address public owner;
    address public electionController;
    address public resultsTallier;

    mapping(bytes32 => bool) public hasVoted;
    
    // constituencyId => candidateId => voteCount
    mapping(uint => mapping(uint => uint)) public voteCounts;

    event VoteCast(bytes32 indexed voterHash, uint indexed candidateId, uint indexed constituencyId);

    modifier onlyOwnerOrController() {
        require(msg.sender == owner || msg.sender == electionController, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setElectionControllerAndTallier(address _controller, address _tallier) external {
        require(msg.sender == owner, "Only owner can set addresses");
        electionController = _controller;
        resultsTallier = _tallier;
    }

    function submitVote(bytes32 voterHash, uint candidateId, uint constituencyId) external onlyOwnerOrController {
        require(!hasVoted[voterHash], "Already voted");
        
        hasVoted[voterHash] = true;
        voteCounts[constituencyId][candidateId]++;

        emit VoteCast(voterHash, candidateId, constituencyId);
    }

    function getVoteCount(uint constituencyId, uint candidateId) external view returns (uint) {
        require(msg.sender == resultsTallier || msg.sender == electionController || msg.sender == owner, "Not authorized to read vote counts directly");
        return voteCounts[constituencyId][candidateId];
    }
}
