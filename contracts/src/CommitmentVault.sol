// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Immutable-rule escrow: no administrator, upgrade or emergency withdrawal.
contract CommitmentVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    uint256 public nextCommitmentId;

    struct Commitment {
        address owner;
        uint256 amount;
        uint256 durationDays;
        uint256 checkins;
        uint256 threshold;       // Always 80; retained for ABI compatibility
        address penaltyAddress;
        uint256 startTime;
        uint256 lastCheckinTime;
        bool finalized;
    }

    mapping(uint256 => Commitment) public commitments;
    mapping(address => uint256[]) public userCommitments;

    uint256 public constant CHECKIN_COOLDOWN = 24 hours;
    // Bound timestamp arithmetic and supported commitment lengths to one year.
    uint256 public constant MAX_DURATION_DAYS = 365;
    uint256 public constant REQUIRED_THRESHOLD = 80;

    event CommitmentCreated(
        uint256 indexed id,
        address indexed owner,
        uint256 amount,
        uint256 durationDays,
        address penaltyAddress
    );
    event CheckinRecorded(uint256 indexed id, address indexed owner, uint256 checkins);
    event CommitmentFinalized(uint256 indexed id, bool success, address recipient, uint256 amount);

    constructor(address _usdc) {
        require(_usdc != address(0) && _usdc.code.length > 0, "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    function createCommitment(
        uint256 amount,
        uint256 durationDays,
        address penaltyAddress,
        uint256 threshold
    ) external nonReentrant returns (uint256 id) {
        require(amount > 0, "Amount must be > 0");
        require(durationDays > 0 && durationDays <= MAX_DURATION_DAYS, "Duration must be 1-365 days");
        require(penaltyAddress != address(0), "Invalid penalty address");
        require(threshold == REQUIRED_THRESHOLD, "Threshold must be 80");

        usdc.safeTransferFrom(msg.sender, address(this), amount);

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
        require(c.owner != address(0), "Commitment not found");
        require(c.owner == msg.sender, "Not your commitment");
        require(!c.finalized, "Already finalized");
        require(block.timestamp < c.startTime + c.durationDays * 1 days, "Commitment has ended");
        require(c.checkins < c.durationDays, "All days completed");
        require(
            c.checkins == 0 || block.timestamp >= c.lastCheckinTime + CHECKIN_COOLDOWN,
            "Wait 24h between checkins"
        );

        c.checkins++;
        c.lastCheckinTime = block.timestamp;

        emit CheckinRecorded(id, msg.sender, c.checkins);
    }

    // Anyone can call finalize after duration has elapsed
    function finalize(uint256 id) external nonReentrant {
        Commitment storage c = commitments[id];
        require(c.owner != address(0), "Commitment not found");
        require(!c.finalized, "Already finalized");
        require(block.timestamp >= c.startTime + c.durationDays * 1 days, "Duration not yet elapsed");
        _finalize(id);
    }

    function _finalize(uint256 id) internal {
        Commitment storage c = commitments[id];
        c.finalized = true;

        bool success = c.checkins * 100 >= c.durationDays * REQUIRED_THRESHOLD;
        address recipient = success ? c.owner : c.penaltyAddress;

        usdc.safeTransfer(recipient, c.amount);

        emit CommitmentFinalized(id, success, recipient, c.amount);
    }

    function getCommitment(uint256 id) external view returns (Commitment memory) {
        require(commitments[id].owner != address(0), "Commitment not found");
        return commitments[id];
    }

    function getUserCommitments(address user) external view returns (uint256[] memory) {
        return userCommitments[user];
    }
}
