pragma solidity ^0.4.24;

/**
 * @title Smart Auction Contract
 * @dev Implementation of a simple auction on the Ethereum chain
 */
contract SmartAuction {
    address public beneficiary;
    uint public auctionEnd;

    address public highestBidder;
    uint public highestBid;

    mapping(address => uint) private pendingReturns;

    bool private ended;

    event HighestBidIncreased(address bidder, uint amount);
    event AuctionEnded(address winner, uint amount);

    constructor(uint _biddingTime) public {
        beneficiary = msg.sender;
        auctionEnd = now + _biddingTime;
    }

    /// Bid on the auction with the value sent together with this transaction.
    function bid() public payable {
        require(now <= auctionEnd, "Auction already ended.");
        require(msg.value > highestBid, "There already is a higher bid.");

        if (highestBid != 0) {
            // Sending back the money by simply using highestBidder.send(highestBid) is a security risk
            pendingReturns[highestBidder] += highestBid;
        }

        highestBidder = msg.sender;
        highestBid = msg.value;

        emit HighestBidIncreased(msg.sender, msg.value);
    }

    /// Withdraw a bid that was overbid.
    function withdraw() public returns (bool) {
        uint amount = pendingReturns[msg.sender];

        if (amount > 0) {
            // It is important to set this to zero first
            pendingReturns[msg.sender] = 0;

            if (!msg.sender.send(amount)) {
                pendingReturns[msg.sender] = amount;
                return false;
            }
        }

        return true;
    }

    /// End the auction and send the highest bid to the beneficiary.
    function auctionEnd() public {
        require(now >= auctionEnd, "Auction not yet ended.");
        require(!ended, "auctionEnd has already been called.");

        ended = true;
        emit AuctionEnded(highestBidder, highestBid);

        beneficiary.transfer(highestBid);
    }

    /// Check if the auction is already over.
    function auctionAlreadyEnded() public view returns (bool) {
       return ended;
    }
}
