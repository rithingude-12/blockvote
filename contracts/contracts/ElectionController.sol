// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./VoterRegistry.sol";
import "./VotingBooth.sol";
import "./ResultsTallier.sol";

contract ElectionController {
    address public owner;

    VoterRegistry public voterRegistry;
    VotingBooth public votingBooth;
    ResultsTallier public resultsTallier;

    uint public electionId;
    string public electionName;
    uint public startTime;
    uint public endTime;
    
    enum Phase { Created, Active, Ended, Finalized }
    Phase public currentPhase;

    event ElectionStarted(uint startTime, uint endTime);
    event ElectionEnded();
    event ResultsAreFinalized();

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    modifier atPhase(Phase _phase) {
        require(currentPhase == _phase, "Invalid phase");
        _;
    }

    constructor(
        uint _electionId,
        string memory _electionName,
        address _voterRegistry,
        address _votingBooth,
        address _resultsTallier
    ) {
        owner = msg.sender;
        electionId = _electionId;
        electionName = _electionName;
        voterRegistry = VoterRegistry(_voterRegistry);
        votingBooth = VotingBooth(_votingBooth);
        resultsTallier = ResultsTallier(_resultsTallier);
        currentPhase = Phase.Created;
    }

    function registerVoter(bytes32 voterHash, uint constituencyId) external onlyOwner atPhase(Phase.Created) {
        voterRegistry.registerVoter(voterHash, constituencyId);
    }

    function startElection(uint _startTime, uint _endTime) external onlyOwner atPhase(Phase.Created) {
        require(_endTime > _startTime, "Invalid times");
        startTime = _startTime;
        endTime = _endTime;
        currentPhase = Phase.Active;
        emit ElectionStarted(startTime, endTime);
    }

    function submitVote(bytes32 voterHash, uint candidateId, uint constituencyId) external atPhase(Phase.Active) {
        // Can be called by backend relay or direct voter if they had gas
        // For our system, the backend acts as a relayer (owner) 
        // to pay for gas, but maintains anonymity via voterHash
        require(msg.sender == owner, "Must be submitted via authorized relayer");
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Not in voting period");
        require(voterRegistry.isEligible(voterHash), "Voter not eligible");
        require(voterRegistry.getVoterConstituency(voterHash) == constituencyId, "Wrong constituency");

        votingBooth.submitVote(voterHash, candidateId, constituencyId);
    }

    function closeElection() external onlyOwner atPhase(Phase.Active) {
        // require(block.timestamp > endTime, "Election time not over"); // Omitted for easy demo force-close
        currentPhase = Phase.Ended;
        emit ElectionEnded();
    }

    function tallyAndFinalize(uint[] calldata constituencyIds, uint[] calldata candidateIds, uint[] calldata expectedVotes) external onlyOwner atPhase(Phase.Ended) {
        resultsTallier.finalizeResults(constituencyIds, candidateIds, expectedVotes);
        currentPhase = Phase.Finalized;
        emit ResultsAreFinalized();
    }

    function getElectionSummary() external view returns (
        uint id, string memory name, Phase phase, uint totalRegistered, bool votingIsOpen, bool resultsFinalized
    ) {
        return (
            electionId,
            electionName,
            currentPhase,
            voterRegistry.getVoterCount(),
            (currentPhase == Phase.Active && block.timestamp >= startTime && block.timestamp <= endTime),
            currentPhase == Phase.Finalized
        );
    }
}
