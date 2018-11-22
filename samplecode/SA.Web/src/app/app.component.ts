import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import * as Web3 from 'web3';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  public isLoading = false;

  public reason = "***";

  public highestBid = 0;
  public auctionAlreadyEnded: boolean;
  public amount: number;

  private web3: Web3;

  private ethPrecision = 10 ** 18;

  private smartAuction: Web3.eth.Contract;
  private accounts: Web3.eth.Account[];

  readonly contractAbi = [
    {
      "constant": true,
      "inputs": [],
      "name": "beneficiary",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "highestBidder",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "_biddingTime",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "bidder",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "HighestBidIncreased",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "winner",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "AuctionEnded",
      "type": "event"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "bid",
      "outputs": [],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "withdraw",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "auctionEnd",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "auctionAlreadyEnded",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "highestBid",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
  ];

  readonly contractAddress = "0x45f3485480ffe178dc88c84c524c55439cff04e6";

  constructor(
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private changeDetector: ChangeDetectorRef) {

    // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    this.web3 = new Web3(Web3.givenProvider || 'ws://localhost:8546');

    if (typeof this.web3 === 'undefined') {
      console.log('No Web3 found, get MetaMask!');
    } else {
      console.log('Web3 found!');
    }

    // update the accounts every time the user changes his main account
    this.web3.currentProvider.publicConfigStore.on('update', async () => {
      this.accounts = await this.web3.eth.getAccounts();
    });
  }

  async ngOnInit() {
    try {
      this.isLoading = true;

      this.route.queryParams.subscribe(params => {
        const reason = this.route.snapshot.queryParamMap.get('reason');

        if (reason && reason !== null && reason.length > 0) {
          this.reason = reason;
        }
      });

      this.web3.eth.net.getId().then(id => console.log(`You are connected to network: ${this.getNet(id)}`));

      this.accounts = await this.web3.eth.getAccounts();

      this.smartAuction = new this.web3.eth.Contract(this.contractAbi, this.contractAddress);

      // console.log(this);

      this.smartAuction.events.HighestBidIncreased({}, async (error, result) => {
        if (!error) {

          //         Callback return
          //         Object - An event object as follows:

          //         address: String, 32 Bytes - address from which this log originated.
          //         args: Object - The arguments coming from the event.
          //         blockHash: String, 32 Bytes - hash of the block where this log was in. null when its pending.
          //         blockNumber: Number - the block number where this log was in. null when its pending.
          //         logIndex: Number - integer of the log index position in the block.
          //         event: String - The event name.
          //         removed: bool - indicate if the transaction this event was created from was removed from the blockchain
          //                         (due to orphaned block) or never get to it (due to rejected transaction).
          //         transactionIndex: Number - integer of the transactions index position log was created from.
          //         transactionHash: String, 32 Bytes - hash of the transactions this log was created from.

          // event arguments cointained in result.args object
          // const { eventArg1, eventArg2, eventArg3 } = result.args;
          // new data have arrived. it is good idea to udpate data & UI

          console.log(result);

          await this.fetchCurrentValues();

          this.changeDetector.detectChanges();
        } else {
          // log error here
          console.log(error);
        }
      });

      await this.fetchCurrentValues();
    } catch (ex) {
      console.error("exception while initializing the app", ex);
    } finally {
      this.isLoading = false;
    }
  }

  public async bid() {
    try {
      if (this.isLoading) {
        return;
      }

      this.isLoading = true;

      const bidResult = await this.smartAuction.methods.bid().send({ from: this.accounts[0], value: this.amount * this.ethPrecision });
      console.log("bidResult", bidResult);

      // not really needed here since we work with the corresponding event but better once more ;)
      await this.fetchCurrentValues();

      await this.notificationService.notify('Your bid has been placed successfully.');
    } catch (ex) {
      console.error("exception while bidding", ex);
      await this.notificationService.notifyError('An error while placing your bid occured - please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  public async fetchCurrentValues() {
    try {
      this.isLoading = true;

      this.highestBid = (await this.smartAuction.methods.highestBid().call()) / this.ethPrecision;
      this.auctionAlreadyEnded = await this.smartAuction.methods.auctionAlreadyEnded().call();
      console.log("update state finished...");

    } catch (ex) {
      console.error("exception while fetching current values", ex);
      await this.notificationService.notifyError('An internal error occured - please reaload the page.');
    } finally {
      this.isLoading = false;
    }
  }

  public async withdraw() {
    try {

      if (this.isLoading) {
        return;
      }

      this.isLoading = true;

      const withdrawResult = await this.smartAuction.methods.withdraw().send({ from: this.accounts[0] });

      console.log('withdrawResult', withdrawResult);

      if (!withdrawResult) {
        await this.notificationService.notifyError('An error while withdrawing your funds occured - please try again.');
        console.log("An error while withdrawing your funds occured - please try again.");
      } else {
        await this.notificationService.notify('Your withdrawal has been finished successfully.');
      }
    } catch (ex) {
      console.error("exception while withdrawing", ex);
      await this.notificationService.notifyError('An internal error while withdrawing your funds occured - please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  public async end() {
    try {

      if (this.isLoading) {
        return;
      }

      this.isLoading = true;

      await this.smartAuction.methods.auctionEnd().send({ from: this.accounts[0] });

      await this.notificationService.notify('The auction is over now - thanks for using our service ;)');

      await this.fetchCurrentValues();
    } catch (ex) {
      console.error("exception during ending", ex);

      await this.notificationService.notifyError('An error while ending the auction occured - please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  private getNet(id: number): string {
    const networks = {
      1: 'mainnet',
      3: 'ropsten',
      4: 'rinkeby',
      42: 'koven'
    };
    return networks[id];
  }
}
