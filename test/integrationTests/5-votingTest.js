/* eslint-env mocha */
/* global assert contract artifacts */

const projectHelper = require('../utils/projectHelper')
const assertThrown = require('../utils/assertThrown')
const evmIncreaseTime = require('../utils/evmIncreaseTime')
const taskDetails = require('../utils/taskDetails')

const ethers = require('ethers')

contract('Voting State', (accounts) => {
  // set up project helper
  let projObj = projectHelper(accounts)

  // get project helper variables
  let TR, RR, PR, PLCR
  let {user, project, utils, returnProject, task} = projObj
  let {repYesVoter, repNoVoter, tokenYesVoter, tokenNoVoter, notVoter} = user
  let {projectCost, stakingPeriod, ipfsHash} = project

  // set up task details & hashing functions
  let {taskSet1} = taskDetails

  // local test variables
  let projArray
  let errorThrown
  let projAddrT, projAddrR

  // define indices
  let valTrueOnly = 0
  let valFalseOnly = 1
  let valTrueMore = 2
  let valFalseMore = 3
  let valNeither = 4

  let valType = [valTrueOnly, valFalseOnly, valTrueMore, valFalseMore, valNeither]

  // CHANGE THIS BACK TO 9 WHEN RUNNING WITH ALL THE TESTS
  let fastForwards = 0 // ganache 9 weeks ahead at this point from previous tests' evmIncreaseTime()

  let secretSalt = 10000
  let voteYes = 1
  let voteNo = 0

  let voteAmount = 100
  let voteAmountMore = 150

  before(async () => {
    // get contract
    await projObj.contracts.setContracts()
    TR = projObj.contracts.TR
    RR = projObj.contracts.RR
    PR = projObj.contracts.PR
    PLCR = projObj.contracts.PLCR

    // get voting projects
    // moves ganache forward 4 more weeks
    projArray = await returnProject.voting(projectCost, stakingPeriod + (fastForwards * 604800), ipfsHash, taskSet1, taskSet1.length - 1, valType)
    projAddrT = projArray[0][0]
    projAddrR = projArray[0][1]

    // fund & register voters
    await utils.mintIfNecessary(tokenYesVoter)
    await utils.mintIfNecessary(tokenNoVoter)
    await utils.register(repYesVoter)
    await utils.register(repNoVoter)
  })

  describe('committing yes votes with tokens', () => {
    it('token voter can commit a yes vote to a task validated more yes from TR voting project', async () => {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrT, valTrueMore)
      let attrUUID = await PLCR.attrUUID(tokenYesVoter, pollId)
      let expectedUUID = ethers.utils.solidityKeccak256(['address', 'uint'], [tokenYesVoter, pollId])
      let commitHashBefore = await PLCR.getCommitHash(tokenYesVoter, pollId)
      let numTokensBefore = await PLCR.getNumTokens(tokenYesVoter, pollId)

      // checks
      assert.strictEqual(attrUUID, expectedUUID, 'attrUUID was computed incorrectly')
      assert.equal(commitHashBefore, 0, 'nothing should have been committed yet')
      assert.equal(numTokensBefore, 0, 'no tokens should have been committed yet')

      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenYesVoter)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      // commit yes vote
      await TR.voteCommit(projAddrT, valTrueMore, voteAmount, secretHash, 0, {from: tokenYesVoter})

      // take stock of variables after
      let commitHashAfter = await PLCR.getCommitHash(tokenYesVoter, pollId)
      let numTokensAfter = await PLCR.getNumTokens(tokenYesVoter, pollId)

      // checks
      assert.equal(commitHashAfter, secretHash, 'incorrect hash committed')
      assert.equal(numTokensAfter, voteAmount, 'incorrect number of tokens committed')
    })

    it('token voter can commit a yes vote to a task validated more yes from RR voting project', async () => {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrR, valTrueMore)
      let attrUUID = await PLCR.attrUUID(tokenYesVoter, pollId)
      let expectedUUID = ethers.utils.solidityKeccak256(['address', 'uint'], [tokenYesVoter, pollId])
      let commitHashBefore = await PLCR.getCommitHash(tokenYesVoter, pollId)
      let numTokensBefore = await PLCR.getNumTokens(tokenYesVoter, pollId)

      // checks
      assert.strictEqual(attrUUID, expectedUUID, 'attrUUID was computed incorrectly')
      assert.equal(commitHashBefore, 0, 'nothing should have been committed yet')
      assert.equal(numTokensBefore, 0, 'no tokens should have been committed yet')

      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenYesVoter)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      // commit yes vote
      await TR.voteCommit(projAddrR, valTrueMore, voteAmount, secretHash, 0, {from: tokenYesVoter})

      // take stock of variables after
      let commitHashAfter = await PLCR.getCommitHash(tokenYesVoter, pollId)
      let numTokensAfter = await PLCR.getNumTokens(tokenYesVoter, pollId)

      // checks
      assert.equal(commitHashAfter, secretHash, 'incorrect hash committed')
      assert.equal(numTokensAfter, voteAmount, 'incorrect number of tokens committed')
    })

    it('token voter can commit a yes vote to a task validated more no from TR voting project', async () => {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrT, valFalseMore)

      // checks

      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenYesVoter)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      // commit yes vote
      await TR.voteCommit(projAddrT, valFalseMore, voteAmount, secretHash, 0, {from: tokenYesVoter})

      // take stock of variables after

      // checks
    })

    it('token voter can commit a yes vote to a task validated more no from RR voting project', async () => {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrR, valFalseMore)

      // checks

      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenYesVoter)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      // commit yes vote
      await TR.voteCommit(projAddrR, valFalseMore, voteAmount, secretHash, 0, {from: tokenYesVoter})

      // take stock of variables after

      // checks
    })

    it('token voter cannot commit a yes vote to a task validated only yes from TR voting project', async () => {
      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenYesVoter, voteAmount)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      errorThrown = false
      try {
        await TR.voteCommit(projAddrT, valTrueOnly, voteAmount, secretHash, 0, {from: tokenYesVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })

    it('token voter cannot commit a yes vote to a task validated only yes from RR voting project', async () => {
      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenYesVoter, voteAmount)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      errorThrown = false
      try {
        await TR.voteCommit(projAddrR, valTrueOnly, voteAmount, secretHash, 0, {from: tokenYesVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })

    it('token voter cannot commit a yes vote to a task validated only no from TR voting project', async () => {
      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenYesVoter, voteAmount)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      errorThrown = false
      try {
        await TR.voteCommit(projAddrT, valFalseOnly, voteAmount, secretHash, 0, {from: tokenYesVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })

    it('token voter cannot commit a yes vote to a task validated only no from RR voting project', async () => {
      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenYesVoter, voteAmount)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      errorThrown = false
      try {
        await TR.voteCommit(projAddrR, valFalseOnly, voteAmount, secretHash, 0, {from: tokenYesVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })

    it('token voter cannot commit a yes vote to a task not validated from TR voting project', async () => {
      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenYesVoter, voteAmount)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      errorThrown = false
      try {
        await TR.voteCommit(projAddrT, valNeither, voteAmount, secretHash, 0, {from: tokenYesVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })

    it('token voter cannot commit a yes vote to a task not validated from RR voting project', async () => {
      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenYesVoter, voteAmount)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      errorThrown = false
      try {
        await TR.voteCommit(projAddrR, valNeither, voteAmount, secretHash, 0, {from: tokenYesVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
  })

  describe('committing no votes with tokens', () => {
    it('token voter can commit a no vote to a task validated more yes from TR voting project', async () => {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrT, valTrueMore)

      // checks

      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenNoVoter)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      // commit yes vote
      await TR.voteCommit(projAddrT, valTrueMore, voteAmount, secretHash, 0, {from: tokenNoVoter})

      // take stock of variables after

      // checks
    })

    it('token voter can commit a no vote to a task validated more yes from RR voting project', async () => {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrR, valTrueMore)

      // checks

      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenNoVoter)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      // commit yes vote
      await TR.voteCommit(projAddrR, valTrueMore, voteAmount, secretHash, 0, {from: tokenNoVoter})

      // take stock of variables after

      // checks
    })

    it('token voter can commit a no vote to a task validated more no from TR voting project', async () => {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrT, valFalseMore)

      // checks

      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenNoVoter)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      // commit yes vote
      await TR.voteCommit(projAddrT, valFalseMore, voteAmount, secretHash, 0, {from: tokenNoVoter})

      // take stock of variables after

      // checks
    })

    it('token voter can commit a no vote to a task validated more no from RR voting project', async () => {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrR, valFalseMore)

      // checks

      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenNoVoter)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      // commit yes vote
      await TR.voteCommit(projAddrR, valFalseMore, voteAmount, secretHash, 0, {from: tokenNoVoter})

      // take stock of variables after

      // checks
    })

    it('token voter cannot commit a no vote to a task validated only yes from TR voting project', async () => {
      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenNoVoter, voteAmount)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      errorThrown = false
      try {
        await TR.voteCommit(projAddrT, valTrueOnly, voteAmount, secretHash, 0, {from: tokenNoVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })

    it('token voter cannot commit a no vote to a task validated only yes from RR voting project', async () => {
      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenNoVoter, voteAmount)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      errorThrown = false
      try {
        await TR.voteCommit(projAddrR, valTrueOnly, voteAmount, secretHash, 0, {from: tokenNoVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
    it('token voter cannot commit a no vote to a task validated only no from TR voting project', async function () {
      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenNoVoter, voteAmount)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      errorThrown = false
      try {
        await TR.voteCommit(projAddrT, valFalseOnly, voteAmount, secretHash, 0, {from: tokenNoVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
    it('token voter cannot commit a no vote to a task validated only no from RR voting project', async function () {
      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenNoVoter, voteAmount)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      errorThrown = false
      try {
        await RR.voteCommit(projAddrR, valFalseOnly, voteAmount, secretHash, 0, {from: tokenNoVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
    it('token voter cannot commit a no vote to a task not validated from TR voting project', async function () {
      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenNoVoter, voteAmount)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      errorThrown = false
      try {
        await TR.voteCommit(projAddrT, valNeither, voteAmount, secretHash, 0, {from: tokenNoVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
    it('token voter cannot commit a no vote to a task not validated from RR voting project', async function () {
      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenNoVoter, voteAmount)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      errorThrown = false
      try {
        await TR.voteCommit(projAddrR, valNeither, voteAmount, secretHash, 0, {from: tokenNoVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
  })

  describe('committing yes votes with reputation', () => {
    it('reputation voter can commit a yes vote to a task validated more yes from TR voting project', async function () {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrT, valTrueMore)

      // checks

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      // commit yes vote
      await RR.voteCommit(projAddrT, valTrueMore, voteAmount, secretHash, 0, {from: repYesVoter})

      // take stock of variables after

      // checks

    })
    it('reputation voter can commit a yes vote to a task validated more yes from RR voting project', async function () {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrR, valTrueMore)

      // checks

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      // commit yes vote
      await RR.voteCommit(projAddrR, valTrueMore, voteAmount, secretHash, 0, {from: repYesVoter})

      // take stock of variables after

      // checks
    })
    it('reputation voter can commit a yes vote to a task validated more no from TR voting project', async function () {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrT, valFalseMore)

      // checks

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      // commit yes vote
      await RR.voteCommit(projAddrT, valFalseMore, voteAmount, secretHash, 0, {from: repYesVoter})

      // take stock of variables after

      // checks

    })
    it('reputation voter can commit a yes vote to a task validated more no from RR voting project', async function () {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrR, valFalseMore)

      // checks

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      // commit yes vote
      await RR.voteCommit(projAddrR, valFalseMore, voteAmount, secretHash, 0, {from: repYesVoter})

      // take stock of variables after

      // checks
    })
    it('reputation voter cannot commit a yes vote to a task validated only yes from TR voting project', async function () {
      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      errorThrown = false
      try {
        await RR.voteCommit(projAddrT, valTrueOnly, voteAmount, secretHash, 0, {from: repYesVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
    it('reputation voter cannot commit a yes vote to a task validated only yes from RR voting project', async function () {
      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      errorThrown = false
      try {
        await RR.voteCommit(projAddrR, valTrueOnly, voteAmount, secretHash, 0, {from: repYesVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
    it('reputation voter cannot commit a yes vote to a task validated only no from TR voting project', async function () {
      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      errorThrown = false
      try {
        await RR.voteCommit(projAddrT, valFalseOnly, voteAmount, secretHash, 0, {from: tokenYesVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
    it('reputation voter cannot commit a yes vote to a task validated only no from RR voting project', async function () {
      // fund voter with tokens if necessary
      await utils.mintIfNecessary(repYesVoter, voteAmount)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      errorThrown = false
      try {
        await RR.voteCommit(projAddrR, valFalseOnly, voteAmount, secretHash, 0, {from: repYesVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
    it('reputation voter cannot commit a yes vote to a task not validated from TR voting project', async function () {
      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      errorThrown = false
      try {
        await RR.voteCommit(projAddrT, valNeither, voteAmount, secretHash, 0, {from: repYesVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
    it('reputation voter cannot commit a yes vote to a task not validated from RR voting project', async function () {
      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteYes, secretSalt])

      errorThrown = false
      try {
        await RR.voteCommit(projAddrR, valNeither, voteAmount, secretHash, 0, {from: repYesVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
  })

  describe('committing no votes with reputation', () => {
    it('reputation voter can commit a no vote to a task validated more yes from TR voting project', async function () {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrT, valTrueMore)

      // checks
      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      // commit yes vote
      await RR.voteCommit(projAddrT, valTrueMore, voteAmount, secretHash, 0, {from: repNoVoter})

      // take stock of variables after

      // checks

    })
    it('reputation voter can commit a no vote to a task validated more yes from RR voting project', async function () {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrR, valTrueMore)

      // checks
      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      // commit yes vote
      await RR.voteCommit(projAddrR, valTrueMore, voteAmount, secretHash, 0, {from: repNoVoter})

      // take stock of variables after

      // checks

    })
    it('reputation voter can commit a no vote to a task validated more no from TR voting project', async function () {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrT, valFalseMore)

      // checks

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      // commit yes vote
      await RR.voteCommit(projAddrT, valFalseMore, voteAmount, secretHash, 0, {from: repNoVoter})

      // take stock of variables after

      // checks
    })
    it('reputation voter can commit a no vote to a task validated more no from RR voting project', async function () {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrR, valFalseMore)

      // checks
      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      // commit yes vote
      await RR.voteCommit(projAddrR, valFalseMore, voteAmount, secretHash, 0, {from: repNoVoter})

      // take stock of variables after

      // checks
    })
    it('token voter cannot commit a no vote to a task validated only yes from TR voting project', async function () {
      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      errorThrown = false
      try {
        await RR.voteCommit(projAddrT, valTrueOnly, voteAmount, secretHash, 0, {from: repNoVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
    it('reputation voter cannot commit a no vote to a task validated only yes from RR voting project', async function () {
      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      errorThrown = false
      try {
        await RR.voteCommit(projAddrR, valTrueOnly, voteAmount, secretHash, 0, {from: repNoVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
    it('reputation voter cannot commit a no vote to a task validated only no from TR voting project', async function () {
      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenNoVoter, voteAmount)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      errorThrown = false
      try {
        await RR.voteCommit(projAddrT, valFalseOnly, voteAmount, secretHash, 0, {from: repNoVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
    it('reputation voter cannot commit a no vote to a task validated only no from RR voting project', async function () {
      // fund voter with tokens if necessary
      await utils.mintIfNecessary(tokenNoVoter, voteAmount)

      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      errorThrown = false
      try {
        await RR.voteCommit(projAddrR, valFalseOnly, voteAmount, secretHash, 0, {from: repNoVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
    it('repuation voter cannot commit a no vote to a task not validated from TR voting project', async function () {
      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      errorThrown = false
      try {
        await RR.voteCommit(projAddrT, valNeither, voteAmount, secretHash, 0, {from: repNoVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })
    it('token voter cannot commit a no vote to a task not validated from RR voting project', async function () {
      // make commit hash
      let secretHash = ethers.utils.solidityKeccak256(['int', 'int'], [voteNo, secretSalt])

      errorThrown = false
      try {
        await RR.voteCommit(projAddrR, valNeither, voteAmount, secretHash, 0, {from: repNoVoter})
      } catch (e) {
        errorThrown = true
      }
      assertThrown(errorThrown, 'An error should have been thrown')
    })

  describe('revealing yes votes with tokens', () => {
    before(async () => {
      // fast forward time
      await evmIncreaseTime(604801) // 1 week
    })

    it('token voter can reveal a yes vote to a task validated more yes from TR voting project', async () => {
      // take stock of variables before
      let pollId = await task.getPollNonce(projAddrT, valTrueMore)

      // checks

      // reveal yes vote
      await TR.voteReveal(projAddrT, valTrueMore, voteYes, secretSalt, {from: tokenYesVoter})

      // take stock of variables after

      // checks
    })
  })

    it('Reputation Voter can commit vote to a validated task yes from TR validating project', async () => {})
    it('Voter can commit vote to a validated task no from TR validating project', async () => {})
    it('Reputation can commit vote to a validated task no from TR validating project', async () => {})

    it('Token Voter can commit vote to a validated task yes from RR validating project', async () => {})
    it('Reputation Voter can commit vote to a validated task yes from RR validating project', async () => {})
    it('Voter can commit vote to a validated task no from RR validating project', async () => {})
    it('Reputation can commit vote to a validated task no from RR validating project', async () => {})

    it('Voter can reveal yes vote on a validated task from TR validating project', async () => {})
    it('Reputation can reveal no vote on a validated task from from RR validating project', async () => {})
    it('Voter can reveal yes vote on a validated task from TR validating project', async () => {})
    it('Reputation can reveal no vote on a validated task from from RR validating project', async () => {})
})
