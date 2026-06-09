// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CommitmentVault is ReentrancyGuard, Ownable {

    IERC20 public immutable usdc;

    uint256 public nextCommitmentId;

    struct Commitment {
        address owner;
        uint256 amount;
        uint256 durationDays;
        uint256 checkins;
        uint256 threshold;       // e.g. 80 means 80%
        address penaltyAddress;
        uint256 startTime;
        uint256 lastCheckinTime;
        bool finalized;
    }

    mapping(uint256 => Commitment) public commitments;
    mapping(address => uint256[]) public userCommitments;

    uint256 public constant CHECKIN_COOLDOWN = 24 hours;

    event CommitmentCreated(
        uint256 indexed id,
        address indexed owner,
        uint256 amount,
        uint256 durationDays,
        address penaltyAddress
    );
    event CheckinRecorded(uint256 indexed id, address indexed owner, uint256 checkins);
    event CommitmentFinalized(uint256 indexed id, bool success, address recipient, uint256 amount);

    constructor(address _usdc) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    function createCommitment(
        uint256 amount,
        uint256 durationDays,
        address penaltyAddress,
        uint256 threshold
    ) external nonReentrant returns (uint256 id) {
        require(amount > 0, "Amount must be > 0");
        require(durationDays > 0, "Duration must be > 0");
        require(penaltyAddress != address(0), "Invalid penalty address");
        require(threshold > 0 && threshold <= 100, "Threshold must be 1-100");

        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );

        id = nextCommitmentId++;

        commitments[id] = Commitment({
            owner: msg.sender,
            amount: amount,
            durationDays: durationDays,
            checkins: 0,
            threshold: threshold,
            penaltyAddress: penaltyAddress,
            startTime: block.timestamp,
            lastCheckinTime: 0,
            finalized: false
        });

        userCommitments[msg.sender].push(id);

        emit CommitmentCreated(id, msg.sender, amount, durationDays, penaltyAddress);
    }

    function checkin(uint256 id) external nonReentrant {
        Commitment storage c = commitments[id];
        require(c.owner == msg.sender, "Not your commitment");
        require(!c.finalized, "Already finalized");
        require(c.checkins < c.durationDays, "All days completed");
        require(
            block.timestamp >= c.lastCheckinTime + CHECKIN_COOLDOWN,
            "Wait 24h between checkins"
        );

        c.checkins++;
        c.lastCheckinTime = block.timestamp;

        emit CheckinRecorded(id, msg.sender, c.checkins);

        if (c.checkins >= c.durationDays) {
            _finalize(id);
        }
    }

    // Anyone can call finalize after duration has elapsed
    function finalize(uint256 id) external nonReentrant {
        Commitment storage c = commitments[id];
        require(!c.finalized, "Already finalized");
        uint256 elapsed = (block.timestamp - c.startTime) / 1 days;
        require(elapsed >= c.durationDays, "Duration not yet elapsed");
        _finalize(id);
    }

    function _finalize(uint256 id) internal {
        Commitment storage c = commitments[id];
        c.finalized = true;

        bool success = (c.checkins * 100) / c.durationDays >= c.threshold;
        address recipient = success ? c.owner : c.penaltyAddress;

        require(usdc.transfer(recipient, c.amount), "USDC transfer failed");

        emit CommitmentFinalized(id, success, recipient, c.amount);
    }

    function getCommitment(uint256 id) external view returns (Commitment memory) {
        return commitments[id];
    }

    function getUserCommitments(address user) external view returns (uint256[] memory) {
        return userCommitments[user];
    }

    // Safety valve — only callable by owner, only for unfinalized stuck funds
    function emergencyWithdraw(uint256 id, address to) external onlyOwner {
        Commitment storage c = commitments[id];
        require(!c.finalized, "Already finalized");
        c.finalized = true;
        require(usdc.transfer(to, c.amount), "Transfer failed");
    }
}
