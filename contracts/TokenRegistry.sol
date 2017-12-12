pragma solidity ^0.4.8;

//import files
import "./Project.sol";
import "./DistributeToken.sol";
import "./library/PLCRVoting.sol";


contract TokenRegistry {

// =====================================================================
// STATE VARIABLES
// =====================================================================
  ReputationRegistry reputationRegistry;
  ProjectRegistry projectRegistry;
  DistributeToken distributeToken;
  address dtAddress;
  address rrAddress;
  PLCRVoting plcrVoting;

  uint256 proposeProportion = 20;                           // tokensupply/proposeProportion is the number of tokens the proposer must stake
  uint256 rewardProportion = 100;


// =====================================================================
// EVENTS
// =====================================================================

  event LogProposal(uint256 nonce, uint256 proposalCostInTokens);

// =====================================================================
// MODIFIERS
// =====================================================================

  /*modifier onlyRR() {
    require(msg.sender == address(reputationRegistry));
    _;
  }*/

  modifier sentFromProject(uint256 _projectId) {
      require(projectRegistry.getProjectAddress(_projectId) == msg.sender);
      _;
  }

// =====================================================================
// FUNCTIONS
// =====================================================================

  // =====================================================================
  // QUASI-CONSTRUCTOR
  // =====================================================================
  function init(address _distributeToken, address _reputationRegistry, address _projectRegistry, address _plcrVoting) public {       //contract is created
    require(address(distributeToken) == 0 && address(reputationRegistry) == 0 && address(projectRegistry) == 0 && address(plcrVoting) == 0);
    rrAddress = _reputationRegistry;
    dtAddress = _distributeToken;
    distributeToken = DistributeToken(_distributeToken);
    reputationRegistry = ReputationRegistry(_reputationRegistry);
    projectRegistry = ProjectRegistry(_projectRegistry);
    plcrVoting = PLCRVoting(_plcrVoting);
    //updateMintingPrice(0);
  }

  // =====================================================================
  // PROPOSER FUNCTIONS
  // =====================================================================

  function proposeProject(uint256 _cost, uint256 _stakingPeriod) public {    //_cost of project in ether, _projectDeadline is for end of active period
    //calculate cost of project in tokens currently (_cost in wei)
    //check proposer has at least 5% of the proposed cost in tokens
    require(now < _stakingPeriod && _cost > 0);
    uint256 proposerTokenCost = (_cost / distributeToken.currentPrice()) / proposeProportion;           //divide by 20 to get 5 percent of tokens
    uint256 costProportion = _cost / distributeToken.weiBal();
    require(distributeToken.balanceOf(msg.sender) >= proposerTokenCost);
    distributeToken.transferToEscrow(msg.sender, proposerTokenCost);

    projectRegistry.incrementProjectNonce();
    LogProposal(projectRegistry.projectNonce(), proposerTokenCost);                                                     //determine project id
    Project newProject = new Project(projectRegistry.projectNonce(),
                                     _cost,
                                     _stakingPeriod,
                                     proposerTokenCost,
                                     costProportion,
                                     rrAddress,
                                     dtAddress
                                     );
    address _projectAddress = address(newProject);
    projectRegistry.setProject(projectRegistry.projectNonce(), _projectAddress);
    projectRegistry.setProposer(_projectAddress, msg.sender, proposerTokenCost, _cost);
  }
  function refundProposer(uint256 _projectId) public {                                 //called by proposer to get refund once project is active
    address _projectAddress = projectRegistry.getProjectAddress(_projectId);
    require(projectRegistry.getProposerAddress(_projectAddress) == msg.sender);
    uint256 proposerStake = Project(_projectAddress).refundProposer();        //call project to "send back" staked tokens to put in proposer's balances
    uint256 proposerReward = proposerStake * 20 / 100;
    distributeToken.transferFromEscrow(msg.sender, proposerStake + proposerReward);
  }

  // =====================================================================
  // PROPOSED PROJECT - STAKING FUNCTIONALITYå
  // =====================================================================

  function stakeTokens(uint256 _projectId, uint256 _tokens) public {
    require(projectRegistry.projectExists(_projectId));
    require(distributeToken.balanceOf(msg.sender) >= _tokens);   //make sure project exists & TH has tokens to stake
    uint256 weiVal = distributeToken.currentPrice() * _tokens;
    address projectAddress = projectRegistry.getProjectAddress(_projectId);
    distributeToken.transferWeiTo(projectAddress, weiVal);
    uint256 returnedTokens = Project(projectAddress).stakeTokens(_tokens, msg.sender, weiVal);
    distributeToken.transferToEscrow(msg.sender, _tokens - returnedTokens);
  }

  function unstakeTokens(uint256 _projectId, uint256 _tokens) public {
    require(projectRegistry.projectExists(_projectId));
    distributeToken.transferFromEscrow(msg.sender, _tokens);
    Project(projectRegistry.getProjectAddress(_projectId)).unstakeTokens(_tokens, dtAddress);
  }

  // =====================================================================
  // OPEN/DISPUTE PROJECT
  // =====================================================================

  function submitTaskHash(uint256 _projectId, bytes32 _taskHash) public {
    require(projectRegistry.projectExists(_projectId));
    Project(projectRegistry.getProjectAddress(_projectId)).addTaskHash(_taskHash, msg.sender);
  }

  // =====================================================================
  // ACTIVE PROJECT
  // =====================================================================

  function submitHashList(uint256 _projectId, bytes32[] _hashes) public {
    Project(projectRegistry.getProjectAddress(_projectId)).submitHashList(_hashes);
  }

  // =====================================================================
  // COMPLETED PROJECT - VALIDATION & VOTING FUNCTIONALITY
  // =====================================================================

  function validate(uint256 _projectId, uint256 _tokens, bool _validationState) public {
    require(projectRegistry.projectExists(_projectId));
    require(distributeToken.balanceOf(msg.sender) >= _tokens);
    distributeToken.transferToEscrow(msg.sender, _tokens);
    Project(projectRegistry.getProjectAddress(_projectId)).validate(msg.sender, _tokens, _validationState);
  }

  function startPoll(uint256 _projectId, uint256 _commitDuration, uint256 _revealDuration) public sentFromProject(_projectId) {       //can only be called by project in question
      projectRegistry.setPollId(_projectId, plcrVoting.startPoll(50, _commitDuration, _revealDuration));
    }

  function voteCommit(uint256 _projectId, uint256 _tokens, bytes32 _secretHash, uint256 _prevPollID) public {     //_secretHash Commit keccak256 hash of voter's choice and salt (tightly packed in this order), done off-chain
    require(projectRegistry.projectExists(_projectId));
    uint256 pollId = projectRegistry.getPollId(_projectId);
    //calculate available tokens for voting
    uint256 availableTokens = plcrVoting.voteTokenBalance(msg.sender) - plcrVoting.getLockedTokens(msg.sender);
    //make sure msg.sender has tokens available in PLCR contract
    //if not, request voting rights for token holder
    if (availableTokens < _tokens) {
      require(distributeToken.balanceOf(msg.sender) >= _tokens - availableTokens);
      distributeToken.transferToEscrow(msg.sender, _tokens);
      plcrVoting.requestVotingRights(msg.sender, _tokens - availableTokens);
    }
    plcrVoting.commitVote(msg.sender, pollId, _secretHash, _tokens, _prevPollID);
  }

  function voteReveal(uint256 _projectId, uint256 _voteOption, uint _salt) public {
    plcrVoting.revealVote(projectRegistry.getPollId(_projectId), _voteOption, _salt);
  }

  function refundVotingTokens(uint256 _tokens) public {
    distributeToken.transferFromEscrow(msg.sender, _tokens);
    plcrVoting.withdrawVotingRights(msg.sender, _tokens);
  }

  // =====================================================================
  // FAILED / VALIDATED PROJECT
  // =====================================================================

  function pollEnded(uint256 _projectId) public sentFromProject(_projectId) view returns (bool) {
    return plcrVoting.pollEnded(projectRegistry.getPollId(_projectId));
  }

  function isPassed(uint256 _projectId) public sentFromProject(_projectId) view returns (bool) {
    return plcrVoting.isPassed(projectRegistry.getPollId(_projectId));
  }
  function burnTokens(uint256 _projectId, uint256 _tokens) public sentFromProject(_projectId) {                            //check that valid project is calling this function
    distributeToken.burnTokens(_tokens);
  }

  function refundStaker(uint256 _projectId) public {
    uint256 refund = Project(projectRegistry.getProjectAddress(_projectId)).refundStaker(msg.sender);
    distributeToken.transferFromEscrow(msg.sender, refund);
    //rescue locked tokens that weren't revealed
    uint256 pollId = projectRegistry.getPollId(_projectId);
    plcrVoting.rescueTokens(msg.sender, pollId);
  }

  function rewardValidator(uint256 _projectId, address _validator, uint256 _reward) public sentFromProject(_projectId) {
    distributeToken.transferWeiTo(_validator, _reward);
  }

  function() public payable {

  }
}
