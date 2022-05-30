// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./tl.sol";

//ERC721 contract for Lottery
contract Lottery is ERC721 {
    struct HashStruct { 
      uint256 value;
      bool isHashed;
      uint8 status;
   }
   //mapping to store balance
    mapping(address => uint256) private balance_dict;

    address private deployer;
    //currency's address to access in this contract
    address private currency_deployer;
    //ERC20 contract
    TL private currency;
    //this is a counter for tokenId
    uint256 private tokenId;
    //stores the hash value status etc.
    mapping(uint256 => HashStruct) private ticket_hashes;
    //stores ticketid list for each lottery
    mapping(uint256 => uint256[]) private lottery_to_tickets;
    //stores only revealed tickets for each lottery to determine the winner
    mapping(uint256 => uint256[]) private revealed_tickets;
    //with this dictionary we can search for the ticket belongs to specific user
    mapping(uint256 => mapping(address=>uint256[]))private lottery_to_account_to_tickets;
    //mapping from ticketid to lottery number
    mapping(uint256 => uint256) private ticket_to_lottery;
    // only stores last bought ticket id for user
    mapping(uint256 => mapping(address=>uint256))private last_tickets; 
    // with each reveal we update this dict to store de xor'ed value
    mapping(uint256 => uint256) private xored_value;
    //total money collected from this lottery
    mapping(uint256 => uint256) private collected_from_lottery;
    uint256 private deployment_time;
    uint256 private unit_cost;
    //constructor takes TL's deployment address and creates an instance of it.
    constructor(address currency_address) ERC721("", "") {
        deployer = msg.sender;
        currency_deployer = currency_address;
        currency = TL(currency_address);
        tokenId = 1;
        deployment_time = block.timestamp;
        unit_cost = 10;
    }
    //Basic deposit function
    function depositTL(uint256 amnt) public{
        require(currency.transferFrom(msg.sender,address(this),amnt));
        balance_dict[msg.sender] = balance_dict[msg.sender] + amnt;
    }
    //Basic withdraw function
    function withdrawTL(uint amnt) public{
        require(balance_dict[msg.sender]>=amnt,"You don't have enough credit.");
        require(currency.transfer(msg.sender,amnt));
        balance_dict[msg.sender] = balance_dict[msg.sender] - amnt;
    } 
    //To check user's balance inside the lottery
    function checkBalance() public view returns(uint){
        return balance_dict[msg.sender];
    } 
    //Users can only transfer the ticket between them after tickets lottery round ends. With his we aim to get rid of conflicts caused by owner change.
    function _transfer(address from, address to, uint256 tokenId) internal virtual override {
        uint256 current_lottery = ((block.timestamp-deployment_time)/(7 days))+1;
        uint lottery_no = ticket_to_lottery[tokenId];
        require(current_lottery>lottery_no,"You can only transfer from after lottery ends.");
        super._transfer(from,to,tokenId);
    }
    //This method to buy tickets for the lottery
    function buyTicket(bytes32 hash_rnd_number)	public{
        require((((block.timestamp-deployment_time) % (7 days)) < 4 days),"Submission time is over"); 
        require(balance_dict[msg.sender]>=unit_cost,"Unsufficient Currency"); 
        _safeMint(msg.sender, tokenId);
        balance_dict[msg.sender] = balance_dict[msg.sender] - unit_cost;
        uint256 lotteryno = ((block.timestamp-deployment_time)/(7 days))+1;
        lottery_to_tickets[lotteryno].push(tokenId);
        last_tickets[lotteryno][msg.sender] = tokenId;
        collected_from_lottery[lotteryno] = collected_from_lottery[lotteryno]+10;
        lottery_to_account_to_tickets[lotteryno][msg.sender].push(tokenId);
        ticket_to_lottery[tokenId] = lotteryno;
        ticket_hashes[tokenId] = HashStruct(uint256(hash_rnd_number),true,0);
        tokenId = tokenId + 1;
    } 
    //If the lottery round ends and ticket is not revealed, users can refund half of the price.
    function collectTicketRefund(uint ticket_no) public{
        require(ticket_no != 0,"No such ticket.");
        require(ticket_no < tokenId,"No such ticket.");
        require(ownerOf(ticket_no)==msg.sender,"You don't have permission!");
        uint256 lotteryno = ticket_to_lottery[ticket_no];
        bool isLotteryFinished = (block.timestamp - deployment_time) > (lotteryno * 7 days);
        //Checks for, is lottery finished and is already revealed
        bool isExpired = isLotteryFinished && ticket_hashes[ticket_no].isHashed && ticket_hashes[ticket_no].status == 0;
        require(isExpired,"No refund info found.");
        ticket_hashes[ticket_no].status = 1;
        balance_dict[msg.sender] = balance_dict[msg.sender] + (unit_cost/2);
    }

    //After submission tour, users can reveal the ticket following 3 days
    function revealRndNumber(uint ticketno,	uint rnd_number) public{
        require(ticketno != 0,"No such ticket.");
        require(ticketno < tokenId,"No such ticket.");
        require(ownerOf(ticketno)==msg.sender,"You don't have permission!");
        uint256 current_lottery = ((block.timestamp-deployment_time)/(7 days))+1; 
        require((((block.timestamp-deployment_time) % (7 days)) >= 4 days),"It is not reveal time."); 
        require(current_lottery == ticket_to_lottery[ticketno],"This ticket is expired.");
        require(ticket_hashes[ticketno].status != 2,"Already revealed.");
        //Hash the rnd_number with address and check if same as submitted.
        bytes32 localhash = keccak256(abi.encodePacked(rnd_number,msg.sender));
        uint256 convertedhash = uint256(localhash);
        require(convertedhash == ticket_hashes[ticketno].value,"Values are not matched");
        ticket_hashes[ticketno].status = 2;
        ticket_hashes[ticketno].value = rnd_number;
        //After each reveal, xor'ed value is recalculated.
        xored_value[current_lottery] = xored_value[current_lottery] ^ rnd_number;
        revealed_tickets[current_lottery].push(ticketno);
        ticket_hashes[ticketno].isHashed = false;
    }
    //Internal log function to calculate iteration
    function calculate_iterator(uint local_collected) private view returns(uint){
        uint iterator = 1;
            while(local_collected>=2){
                if(local_collected>= 2**128){
                    local_collected = local_collected >> 128;
                    iterator = iterator + 128;
                }
                if(local_collected>= 2**64){
                    local_collected = local_collected >> 64;
                    iterator = iterator + 64;
                }
                if(local_collected>= 2**32){
                    local_collected = local_collected >> 32;
                    iterator = iterator + 32;
                }
                if(local_collected>= 2**16){
                    local_collected = local_collected >> 16;
                    iterator = iterator + 16;
                }
                if(local_collected>= 2**8){
                    local_collected = local_collected >> 8;
                    iterator = iterator + 8;
                }
                if(local_collected>= 2**4){
                    local_collected = local_collected >> 4;
                    iterator = iterator + 4;
                }
                if(local_collected>= 2**2){
                    local_collected = local_collected >> 2;
                    iterator = iterator + 2;
                }
                if(local_collected>= 2**1){
                    local_collected = local_collected >> 1;
                    iterator = iterator + 1;
                }
            }
        return iterator;
    }
    //Pays the ticket and increases users' balance if user won any prize.
    function collectTicketPrize(uint ticket_no)	 public{
        require(ticket_no != 0,"No such ticket.");
        require(ticket_no < tokenId,"No such ticket.");
        require(ownerOf(ticket_no)==msg.sender,"You don't have permission!");
        uint256 current_lottery = ((block.timestamp-deployment_time)/(7 days))+1; //cmt uint256 current_lottery = ((block.timestamp-deployment_time)/(7 days))+1;
        uint lottery_no = ticket_to_lottery[ticket_no];
        require(current_lottery>lottery_no,"This lottery hasn't finished yet.");
        require( ticket_hashes[ticket_no].status!=3,"Already collected");
        require( ticket_hashes[ticket_no].status==2,"Number is not revealed");

         uint local_collected = collected_from_lottery[lottery_no];
            uint iterator = calculate_iterator(local_collected);
            uint ctr = 1;
            uint numoftickets = revealed_tickets[lottery_no].length;
            uint winner = xored_value[lottery_no];
            uint256[] memory winner_tickets  = new uint[](iterator);
            uint gained_amount = 0;
            //In the loop tickets' all prizes are calculated
            for(ctr = 1; ctr <= iterator;ctr ++){
                winner = winner % numoftickets;
                uint tckt  = revealed_tickets[lottery_no][winner];                
                winner_tickets[ctr-1] = tckt;
                winner = uint256(keccak256(abi.encodePacked(winner)));
                if(tckt == ticket_no){
                uint amt = (local_collected/(2 ** ctr)) + ((local_collected/(2 ** (ctr - 1)))%2);
                gained_amount = gained_amount + amt;
                }
            } 

        require(gained_amount != 0,"Haven't won any prize.");
        ticket_hashes[ticket_no].status=3;
        balance_dict[msg.sender] = balance_dict[msg.sender]+gained_amount;
    }	
    //Does the same operations as the collectTicketPrice except this function returns the amount instead of paying it.
    function checkIfTicketWon(uint ticket_no) public view returns (uint	amount){
        require(ticket_no != 0,"No such ticket.");
        require(ticket_no < tokenId,"No such ticket.");
        require(ownerOf(ticket_no)==msg.sender,"You don't have permission!");
        uint lottery_no = ticket_to_lottery[ticket_no];
        uint256 current_lottery = ((block.timestamp-deployment_time)/(7 days))+1;
        require(current_lottery>lottery_no,"This lottery hasn't finished yet.");

        uint local_collected = collected_from_lottery[lottery_no];
            uint iterator = calculate_iterator(local_collected);
            uint ctr = 1;
            uint numoftickets = revealed_tickets[lottery_no].length;
            uint winner = xored_value[lottery_no];
            uint256[] memory winner_tickets  = new uint[](iterator);
            uint gained_amount = 0;
            for(ctr = 1; ctr <= iterator;ctr ++){
                winner = winner % numoftickets;
                uint tckt  = revealed_tickets[lottery_no][winner];                
                winner_tickets[ctr-1] = tckt;
                winner = uint256(keccak256(abi.encodePacked(winner)));
                if(tckt == ticket_no){
                uint amt = (local_collected/(2 ** ctr)) + ((local_collected/(2 ** (ctr - 1)))%2);
                gained_amount = gained_amount + amt;
                }
            } 

        return gained_amount;
    }
    //This function first calculates all of the winenrs and then returns the specific index.
    function getIthWinningTicket(uint i, uint lottery_no) public view returns (uint	ticket_no,uint amount){
            require(i>0,"i cannot be zero");
            require(lottery_no>0,"lottery_no cannot be zero");
            uint256 current_lottery = ((block.timestamp-deployment_time)/(7 days))+1; //cmt uint256 current_lottery = ((block.timestamp-deployment_time)/(7 days))+1;
            require(current_lottery>lottery_no,"This lottery hasn't finished yet.");
            uint local_collected = collected_from_lottery[lottery_no];
            uint iterator = calculate_iterator(local_collected);
            require(i <= iterator,"There is no such winner.");
            local_collected = collected_from_lottery[lottery_no];
            uint ctr = 1;
            uint numoftickets = revealed_tickets[lottery_no].length;
            uint winner = xored_value[lottery_no];
            uint original_winner = winner;
            uint256[] memory winner_tickets  = new uint[](iterator);
            uint gained_amount = 0;
            for(ctr = 1; ctr <= iterator;ctr ++){
                winner = winner % numoftickets;
                uint tckt  = revealed_tickets[lottery_no][winner];                
                winner_tickets[ctr-1] = tckt;
                winner = uint256(keccak256(abi.encodePacked(winner)));
            }
            winner = original_winner;
            for(ctr = 1; ctr <= iterator;ctr ++){
                winner = winner % numoftickets;
                uint tckt  = revealed_tickets[lottery_no][winner];
                winner = uint256(keccak256(abi.encodePacked(winner)));
                if(tckt == winner_tickets[i-1]){
                uint amt = (local_collected/(2 ** ctr)) + ((local_collected/(2 ** (ctr - 1)))%2);
                gained_amount = gained_amount + amt;
                }
            }    
        uint winnerticket = winner_tickets[i-1];
        return (winnerticket,gained_amount);
    }

    //Gets the unix time and calculates the lottery number corresponds to given time
    function getLotteryNo(uint unixtimeinweek) public view returns (uint lottery_no){
        require(unixtimeinweek>deployment_time,"There was no lottery at the given date.");
       return ((unixtimeinweek-deployment_time)/(7 days))+1; //cmt return ((unixtimeinweek-deployment_time)/(7 days))+1;
    }

    //Returns the amount of collected money for specific lottery round
    function getTotalLotteryMoneyCollected(uint	lottery_no)	public view	returns	(uint amount){
        require(lottery_no>0,"lottery_no cannot be zero");
        uint256 current_lottery = ((block.timestamp-deployment_time)/(7 days))+1;//cmt uint256 current_lottery = ((block.timestamp-deployment_time)/(7 days))+1;
        require(current_lottery>=lottery_no,"This lottery hasn't started yet.");
        return collected_from_lottery[lottery_no];
    }

    //Returns a specific users' last owned ticket for specific lottery round
    function getLastOwnedTicketNo(uint lottery_no) public view returns(uint,uint8	status){
        require(lottery_no>0,"lottery_no cannot be zero");
        uint256 current_lottery = ((block.timestamp-deployment_time)/(7 days))+1; //cmt uint256 current_lottery = ((block.timestamp-deployment_time)/(7 days))+1;
        require(current_lottery>=lottery_no,"This lottery hasn't started yet.");
        require(lottery_to_account_to_tickets[lottery_no][msg.sender].length>0,"You haven't bought any ticket for this lottery.");
        uint256 ticket_no = last_tickets[lottery_no][msg.sender];
        return (ticket_no,ticket_hashes[ticket_no].status);
    }
    //Returns a specific users' ith owned ticket for specific lottery round
    function getIthOwnedTicketNo(uint i,uint lottery_no) public view returns(uint,uint8	status){
        require(i>0,"lottery_no cannot be zero");
        uint256 current_lottery = ((block.timestamp-deployment_time)/(7 days))+1; //cmt uint256 current_lottery = ((block.timestamp-deployment_time)/(7 days))+1;
        require(current_lottery>=lottery_no,"This lottery hasn't started yet.");
        require(lottery_to_account_to_tickets[lottery_no][msg.sender].length>=i,"You haven't bought that much ticket for this lottery.");
        uint256 ticket_no = lottery_to_account_to_tickets[lottery_no][msg.sender][i-1];
        return (ticket_no,ticket_hashes[ticket_no].status);
    }
}