// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./VotingBooth.sol";

contract ResultsTallier {
    address public owner;
    address public electionController;
    VotingBooth public votingBooth;

    struct Result {
        uint candidateId;
        uint voteCount;
        uint constituencyId;
    }

    mapping(uint => mapping(uint => Result)) public finalResults; // constituencyId => candidateId => Result
    bool public isFinalized;

    event ResultsFinalized(uint[] constituencyIds, uint[] candidateIds, uint[] voteCounts);

    modifier onlyOwnerOrController() {
        require(msg.sender == owner || msg.sender == electionController, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setElectionControllerAndVotingBooth(address _controller, address _votingBooth) external {
        require(msg.sender == owner, "Only owner can set addresses");
        electionController = _controller;
        votingBooth = VotingBooth(_votingBooth);
    }

    function finalizeResults(uint[] calldata constituencyIds, uint[] calldata candidateIds, uint[] calldata expectedVotes) external onlyOwnerOrController {
        require(!isFinalized, "Already finalized");
        require(constituencyIds.length == candidateIds.length, "Mismatched lengths");
        require(candidateIds.length == expectedVotes.length, "Mismatched lengths");

        for (uint i = 0; i < candidateIds.length; i++) {
            uint trueVotes = votingBooth.getVoteCount(constituencyIds[i], candidateIds[i]);
            require(trueVotes == expectedVotes[i], "Vote count mismatch with blockchain");
            finalResults[constituencyIds[i]][candidateIds[i]] = Result({
                candidateId: candidateIds[i],
                voteCount: trueVotes,
                constituencyId: constituencyIds[i]
            });
        }
        
        isFinalized = true;
        emit ResultsFinalized(constituencyIds, candidateIds, expectedVotes);
    }

    function getCandidateResult(uint constituencyId, uint candidateId) external view returns (uint id, uint voteCount, uint cId) {
        require(isFinalized, "Results not finalized yet");
        Result memory res = finalResults[constituencyId][candidateId];
        return (res.candidateId, res.voteCount, res.constituencyId);
    }
}
