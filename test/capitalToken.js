var TokenHolderRegistry = artifacts.require("TokenHolderRegistry")
var Project = artifacts.require("Project")

accounts = web3.eth.accounts

var account1 = accounts[1]    //account 0 is THR
var tokens = 102
var burnAmount = 2

var weiPool = 0
var mintEvents;

//utils = require("../js/utils.js")

contract('Token holder', function(accounts) {
  it("mints capital tokens", function() {
    return TokenHolderRegistry.deployed().then(function(instance) {
      THR = instance
      mintEvents = THR.LogMint({fromBlock: 0, toBlock: 'latest'});
      mintEvents.watch(function(error, event){
        if (!error)
          console.log(event.args);
      });
      return THR.mint(tokens, {from: account1, value: 502934896893435110})
    }).then(function() {
      return THR.totalCapitalTokenSupply.call()
    }).then(function(tokensupply) {
      assert.equal(tokensupply, tokens, "total token supply not updated correctly")
      return THR.totalFreeCapitalTokenSupply.call()
    }).then(function(tokensupply) {
      assert.equal(tokensupply, tokens, "free token supply not updated correctly")
      return THR.balances.call(account1)
    }).then(function(balance) {
      assert.equal(balance, tokens, 'balances mapping not updated correctly')
      mintEvents.stopWatching();
    });
  });

  it("burns capital tokens", function() {
    return TokenHolderRegistry.deployed().then(function(instance) {
      THR = instance
      return THR.balances.call(account1)
    }).then(function(balance) {
      assert.equal(balance, tokens, "balance call failed")
      return THR.burnAndRefund(burnAmount, {from: account1})
    }).then(function() {
      return THR.balances.call(account1)
    }).then(function(balance) {
      assert.equal(balance, (tokens - burnAmount), 'balances mapping not updated correctly')
      return THR.totalCapitalTokenSupply.call();
    }).then(function(tokensupply) {
      //console.log(tokensupply)
      assert.equal(tokensupply, (tokens - burnAmount), "total token supply not updated correctly")
      return THR.totalFreeCapitalTokenSupply.call()
    }).then(function(tokensupply) {
      assert.equal(tokensupply, (tokens - burnAmount), "free token supply not updated correctly")
    });
  });

  it("proposes a project", function() {
    return TokenHolderRegistry.deployed().then(function(instance) {
      THR = instance
      return THR.weiBal.call()
    }).then(function(weiBal) {
      weiPool = weiBal
      //console.log('\nwei balance of pool before creation of project is ' + weiPool.toNumber() + '\n')
      return THR.totalCapitalTokenSupply.call();
    }).then(function(tokensupply) {
      var _timePeriod = Date.now() + 120000000000 //long time from now
      //console.log(weiPool/tokensupply)
      var _projectCost = Math.round(20*(weiPool/tokensupply))      //cost of 20 tokens will be project cost, so proposer stake should be 1 token
      return THR.proposeProject(_projectCost, _timePeriod, {from: account1})
    }).then(function() {
      return THR.projectNonce.call()
    }).then(function(nonce) {
      assert.notEqual(nonce, 0, "nonce not incremented")
      //assert projectNonce incremented
      //assert account1 balances decreased
      //assert freeCapitalTokenSupply and totalCapitalTokenSupply decremented appropriately
    });
  });

});