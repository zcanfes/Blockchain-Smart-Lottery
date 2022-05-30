import { BigNumber, utils } from 'ethers'
import { Contract } from '@ethersproject/contracts'
import { useContractFunction, useContractCall, useEthers } from "@usedapp/core"

import { useEffect, useState } from "react";
import { tlAddress, tlAbi, lotteryAbi, lotteryAddress } from "../Contracts/contracts.js"
import TextField from "@mui/material/TextField";
import ProgressButton from '../components/ProgressButton.js';

const tlInterface = new utils.Interface(tlAbi)
const tlContract = new Contract(tlAddress, tlInterface)

const lotteryInterface = new utils.Interface(lotteryAbi)
const lotteryContract = new Contract(lotteryAddress, lotteryInterface)


function LotteryOperations() {
    const { account } = useEthers();

    const { state: stateRevealTicket, send: sendRevelTicket } = useContractFunction(lotteryContract, 'revealRndNumber', {})
    const { state: stateRefund, send: sendRefund } = useContractFunction(lotteryContract, 'collectTicketRefund', {})
    const { state: statePrize, send: sendPrize } = useContractFunction(lotteryContract, 'collectTicketPrize', {})

    const { state: stateLotteryNo, send: sendLotteryNo } = useContractFunction(lotteryContract, 'getLotteryNo', {})
    const { state: stateLastOwnedTicketNo, send: sendLastOwnedTicketNo } = useContractFunction(lotteryContract, 'getLastOwnedTicketNo', {})

    useEffect(() => {
        const epochTimeInSeconds = Math.round(new Date().getTime() / 1000)
        sendLotteryNo(epochTimeInSeconds)
    }, [])

    const [ticketIdReveal, setTicketIdReveal] = useState(1)
    const [randomNumber, setRandomNumber] = useState(0)
    const handleBuyTicket = async () => {
        await sendRevelTicket(ticketIdReveal, randomNumber)
    }

    const [ticketIdRefund, setTicketIdRefund] = useState(1)
    const handleRefund = () => {
        sendRefund(ticketIdRefund)
    }

    const [ticketIdPrize, setTicketIdPrize] = useState(1)
    const handlePrize = () => {
        sendPrize(ticketIdPrize)
    }

    return (
        <div className='row justify-content-center align-items-center mt-5'>
            <div className='col-8'>
                <h4 className='mb-5'><b>Lottery No {stateLotteryNo && stateLotteryNo.transaction ? stateLotteryNo.transaction.toNumber() : "..."}</b></h4>
                <div className='row justify-content-center align-items-center mb-5'>
                    <TextField className='mb-2' type="number" label="Ticket Id" value={ticketIdReveal} onChange={e => setTicketIdReveal(e.target.value)} />
                    <TextField className='mb-2' type="number" label="Random Number" value={randomNumber} onChange={e => setRandomNumber(e.target.value)} />
                    <ProgressButton onClick={handleBuyTicket} text="Reveal Ticket" state={stateRevealTicket} />
                </div>
                <div className='row justify-content-center align-items-center mb-5'>
                    <TextField className='mb-2' type="number" label="Ticket Id" value={ticketIdRefund} onChange={e => setTicketIdRefund(e.target.value)} />
                    <ProgressButton onClick={handleRefund} text="Collect Ticket Refund" state={stateRefund} />
                </div>
                <div className='row justify-content-center align-items-center mb-5'>
                    <TextField className='mb-2' type="number" label="Ticket Id" value={ticketIdPrize} onChange={e => setTicketIdPrize(e.target.value)} />
                    <ProgressButton onClick={handlePrize} text="Collect Ticket Prize" state={statePrize} />
                </div>
            </div>
        </div>
    );
}

export default LotteryOperations;