const SmartAuction = artifacts.require("SmartAuction");

contract('SmartAuction', async (accounts) => {
  it("bid", async () => {
    const sut = await SmartAuction.deployed();

    const tx = { from: accounts[1], value: web3.toWei(1, "ether") };

    await sut.bid.sendTransaction(tx);

    assert.equal(await sut.highestBidder(), accounts[1]);
    assert.equal(await sut.highestBid(), web3.toWei(1, "ether"));
  });

  it("overbid", async () => {
    const sut = await SmartAuction.deployed();

    const tx = { from: accounts[2], value: web3.toWei(2, "ether") };
    await sut.bid.sendTransaction(tx);

    assert.equal(await sut.highestBidder(), accounts[2]);
    assert.equal(await sut.highestBid(), web3.toWei(2, "ether"));
  });

  it("refund", async () => {
    const sut = await SmartAuction.deployed();

    const oldAmount = web3.eth.getBalance(accounts[1]).toNumber();

    const tx = { from: accounts[1] };
    await sut.withdraw.sendTransaction(tx);

    const newAmount = web3.eth.getBalance(accounts[1]).toNumber()

    assert.equal(oldAmount < newAmount, true);
  });

  it("refund impossible", async () => {
    const sut = await SmartAuction.deployed();

    const oldAmount = web3.eth.getBalance(accounts[2]).toNumber();

    const tx = { from: accounts[2] };
    await sut.withdraw.sendTransaction(tx);

    const newAmount = web3.eth.getBalance(accounts[2]).toNumber()

    assert.equal(oldAmount < newAmount, false);
  });

  it("is not ended", async () => {
    const sut = await SmartAuction.deployed();

    const endedResult = await sut.auctionAlreadyEnded.call();

    assert.equal(endedResult, false);
  });

  it("cannot end auction right after deployment", async () => {
    const sut = await SmartAuction.deployed();

    try {
      const tx = { from: accounts[3] };
      await sut.auctionEnd.sendTransaction(tx);
      assert.fail()
    } catch (error) {
      assert(error.toString().includes('Auction not yet ended'), error.toString())
    }
  });
})
