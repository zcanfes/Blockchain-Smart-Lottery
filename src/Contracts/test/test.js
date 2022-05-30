// Right click on the script name and hit "Run" to execute

const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Start test", function () {
    let tl;
    let lottery;
    let owner;
    let addr1;
    let addr2;
    let deployed_time;
    before(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const Tl = await ethers.getContractFactory('TL');
        tl = await Tl.deploy(10000);
        await tl.deployed();

        const Lottery = await ethers.getContractFactory('Lottery');
        lottery = await Lottery.deploy(tl.address);
        await lottery.deployed();
        await tl.transfer(lottery.address, 10000 - 1000)
        deployed_time = Math.round((new Date()).getTime() / 1000);

    });
    it("Check deployed correctly", async function () {
        await expect((await tl.balanceOf(owner.address)).toNumber()).to.equal(1000);
    });
    it("Check Deposit TL without approval", async function () {

        await expect(lottery.depositTL(100)).to.be.reverted;
    });
    it("Check Deposit TL without insufficent currency", async function () {

        await tl.approve(lottery.address, 1100);
        await expect(lottery.depositTL(1100)).to.be.reverted;

    });
    it("Check Deposit TL correctly", async function () {

        await tl.approve(lottery.address, 100);
        await lottery.depositTL(100);
        expect((await lottery.checkBalance()).toNumber()).to.equal(100);
    });

    it("Withdraw TL correctly", async function () {

        await lottery.withdrawTL(50);
        expect((await lottery.checkBalance()).toNumber()).to.equal(50);
    });

    it("Try withdraw more then your balance", async function () {

        await expect(lottery.withdrawTL(200)).to.be.reverted;
    });

    it("Try buy ticket without enough credit", async function () {

        const hash = ethers.utils.solidityKeccak256(["uint256", "address"], [1, addr1.address]);
        await expect(lottery.connect(addr1).buyTicket(hash)).to.be.revertedWith("Unsufficient Currency");
    });

    it("Buy ticket for account", async function () {

        const hash = ethers.utils.solidityKeccak256(["uint256", "address"], [1, owner.address]);
        await lottery.connect(owner).buyTicket(hash)
        await lottery.connect(owner).buyTicket(hash)
        expect((await lottery.checkBalance()).toNumber()).to.equal(30);
    });

    it("Buy 2 ticket for remaining accounts", async function () {

        const address_list = await ethers.getSigners();
        for (let i = 1; i < 20; i++) {
            // add the provider from Hardhat
            const addr = address_list[i]
            // send ETH to the new wallet so it can perform a tx                
            await tl.connect(addr).approve(lottery.address, 100);
            await tl.connect(addr).takeAmount(100);
            await lottery.connect(addr).depositTL(100);
            const hash = ethers.utils.solidityKeccak256(["uint256", "address"], [1, addr.address]);
            await lottery.connect(addr).buyTicket(hash)
            await lottery.connect(addr).buyTicket(hash)
        }
        expect((await lottery.connect(address_list[19]).checkBalance()).toNumber()).to.equal(80);
    });

    it("getIthOwnedTicketNo Current lottery valid i", async function () {

        const res = await lottery.getIthOwnedTicketNo(2, 1);
        expect(res[0]).to.equal(2);
    });

    it("getIthOwnedTicketNo Current lottery invalid i", async function () {

        await expect(lottery.getIthOwnedTicketNo(9, 1)).to.be.revertedWith("You haven't bought that much ticket for this lottery.");
    });

    it("getLastOwnedTicketNo ivvalid lottery", async function () {

        await expect(lottery.getLastOwnedTicketNo(5)).to.be.revertedWith("This lottery hasn't started yet.");
    });

    it("getLastOwnedTicketNo valid lottery", async function () {

        const res = await lottery.connect(addr1).getLastOwnedTicketNo(1);
        expect(res[0]).to.equal(4);
    });

    it("getTotalLotteryMoneyCollected valid", async function () {

        expect((await lottery.getTotalLotteryMoneyCollected(1)).toNumber()).to.equal(400);
    });

    it("getLotteryNo valid input", async function () {

        expect((await lottery.getLotteryNo(deployed_time + 614800)).toNumber()).to.equal(2);
    });

    it("getLotteryNo invalid input", async function () {

        await expect(lottery.getLotteryNo(deployed_time - 20000)).to.be.revertedWith("There was no lottery at the given date.");
    });

    it("revealRndNumber try reveal on submission time", async function () {

        await expect(lottery.revealRndNumber(1, 2)).to.be.revertedWith("It is not reveal time.");
    });

    it("collectRefund invalid ticket number", async function () {

        await expect(lottery.collectTicketRefund(54)).to.be.revertedWith("No such ticket.");
    });

    it("getIthWinningTicket unfinished lottery", async function () {

        await expect(lottery.getIthWinningTicket(4, 1)).to.be.revertedWith("This lottery hasn't finished yet.");
    });

    it("collectTicketPrize ticket belongs to other user", async function () {

        await expect(lottery.collectTicketPrize(9)).to.be.revertedWith("You don't have permission!");
    });

    it("revealRndNumber try with wrong number", async function () {

        await ethers.provider.send("evm_mine", [deployed_time + 400000]);
        await expect(lottery.revealRndNumber(2, 2)).to.be.revertedWith("Values are not matched");
    });

    it("revealRndNumber reveal some tickets with accurate data", async function () {

        const address_list = await ethers.getSigners();
        await ethers.provider.send("evm_mine", [deployed_time + 400010]);
        for (let i = 0; i < 20; i++) {
            await lottery.connect(address_list[i]).revealRndNumber(2 * (i + 1), 1)
        }
        const revealed_ticket = await lottery.getIthOwnedTicketNo(2, 1);
        await expect(revealed_ticket[1]).to.equal(2);
    });

    it("revealRndNumber try already revealed", async function () {

        await expect(lottery.revealRndNumber(2, 1)).to.be.revertedWith("Already revealed.");
    });

    it("getLastOwnedTicketNo lottery that user haven't bought any ticket", async function () {

        await ethers.provider.send("evm_mine", [deployed_time + 614800]);
        await expect(lottery.getLastOwnedTicketNo(2)).to.be.revertedWith("You haven't bought any ticket for this lottery.");
    });

    it("collectRefund eligible for refund ", async function () {

        await ethers.provider.send("evm_mine", [deployed_time + 614810]);
        const prev_balance = await lottery.checkBalance();
        await lottery.collectTicketRefund(1);
        const next_balance = await lottery.checkBalance();
        expect(next_balance - prev_balance).to.equal(5);
    });

    it("collectRefund already refunded ticket ", async function () {

        await ethers.provider.send("evm_mine", [deployed_time + 614820]);
        await expect(lottery.collectTicketRefund(2)).to.be.revertedWith("No refund info found.");
    });

    it("getIthWinningTicket winner ticket ", async function () {

        const res = await lottery.getIthWinningTicket(1, 1)
        expect(res[0]).to.equal(2);
    });

    it("getIthWinningTicket winner ticket ", async function () {

        await expect(lottery.getIthWinningTicket(12, 1)).to.be.revertedWith("There is no such winner.");
    });

    it("checkIfTicketWon winner ticket ", async function () {

        expect((await lottery.checkIfTicketWon(2)).toNumber()).to.equal(200);
    });
    it("checkIfTicketWon not revealed ticket ", async function () {

        expect((await lottery.checkIfTicketWon(1)).toNumber()).to.equal(0);
    });

    it("collectTicketPrize loser ticket ", async function () {

        const address_list = await ethers.getSigners();
        await expect(lottery.connect(address_list[14]).collectTicketPrize(30)).to.be.revertedWith("Haven't won any prize.");
    });

    it("collectTicketPrize winner ticket ", async function () {

        const prev_balance = await lottery.checkBalance();
        await lottery.collectTicketPrize(2);
        const next_balance = await lottery.checkBalance();
        expect(next_balance - prev_balance).to.equal(200);
    });

    it("collectTicketPrize already collected ticket ", async function () {

        await expect(lottery.collectTicketPrize(2)).to.be.revertedWith("Already collected");
    });

});