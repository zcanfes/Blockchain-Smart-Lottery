import { BigNumber, utils } from 'ethers'
import { Contract } from '@ethersproject/contracts'
import { useContractFunction, useContractCall, useEthers } from "@usedapp/core"

import { useEffect, useState } from "react";
import { tlAddress, tlAbi, lotteryAbi, lotteryAddress } from "../Contracts/contracts.js"
import TextField from "@mui/material/TextField";
import ProgressButton from '../components/ProgressButton.js';
import Chip from "@mui/material/Chip";

const tlInterface = new utils.Interface(tlAbi)
const tlContract = new Contract(tlAddress, tlInterface)

const lotteryInterface = new utils.Interface(lotteryAbi)
const lotteryContract = new Contract(lotteryAddress, lotteryInterface)


function LotteryInfo() {
    const { account } = useEthers();

    const { state: stateLotteryNo, send: sendLotteryNo } = useContractFunction(lotteryContract, 'getLotteryNo', {})
    const { state: stateMoneyCollected, send: sendMoneyCollected } = useContractFunction(lotteryContract, 'getTotalLotteryMoneyCollected', {})
    const { state: stateLastOwnedTicketNo, send: sendLastOwnedTicketNo } = useContractFunction(lotteryContract, 'getLastOwnedTicketNo', {})
    const { state: stateIthOwnedTicketNo, send: sendIthOwnedTicketNo } = useContractFunction(lotteryContract, 'getIthOwnedTicketNo', {})
    const { state: stateIthWinningTicketNo, send: sendIthWinningTicketNo } = useContractFunction(lotteryContract, 'getIthWinningTicket', {})
    const { state: stateIfTicketWon, send: sendIfTicketWon } = useContractFunction(lotteryContract, 'checkIfTicketWon', {})

    useEffect(() => {
        const epochTimeInSeconds = Math.round(new Date().getTime() / 1000)
        sendLotteryNo(epochTimeInSeconds)
    }, [])

    useEffect(() => {
        if (stateLotteryNo && stateLotteryNo.transaction && stateLotteryNo.transaction.toNumber()) {
            sendMoneyCollected(stateLotteryNo.transaction.toNumber())
            sendLastOwnedTicketNo(stateLotteryNo.transaction.toNumber())
        }
    }, [stateLotteryNo])


    const [index, setIndex] = useState(1)
    const handleIthOwnedTicketNo = async () => {
        await sendIthOwnedTicketNo(index, stateLotteryNo.transaction.toNumber())
    }

    const [winningIndex, setWinningIndex] = useState(1)
    const handleIthWinningTicketNo = async () => {
        await sendIthWinningTicketNo(winningIndex, stateLotteryNo.transaction.toNumber())
    }

    const [ticketId, setTicketId] = useState(1)
    const handleIfTicketWon = async () => {
        await sendIfTicketWon(ticketId)
    }


    return (
        <div className='row justify-content-center align-items-center mt-5'>
            <div className='col-8'>
                <Chip className="mb-5 me-1" label={<span>Lottery No: <b>{stateLotteryNo && stateLotteryNo.transaction ? stateLotteryNo.transaction.toNumber() : "..."}</b></span>} variant="outlined" />
                <Chip className="mb-5 me-1" label={<span>Total Money Collected by Lottery: <b>{stateMoneyCollected && stateMoneyCollected.transaction ? stateMoneyCollected.transaction.toNumber() : "..."}</b></span>} variant="outlined" />
                <Chip className="mb-5" label={<span>Last Owned Ticket Id: <b>{stateLastOwnedTicketNo && stateLastOwnedTicketNo.transaction ? stateLastOwnedTicketNo.transaction[0].toNumber() : "..."}</b></span>} variant="outlined" />
                <div className='row justify-content-center align-items-center mb-5'>
                    <TextField className='mb-2' type="number" label="Index" value={index} onChange={e => setIndex(e.target.value)} />
                    <ProgressButton onClick={handleIthOwnedTicketNo} text="Get Ith Owned Ticket Id" />
                    {stateIthOwnedTicketNo && stateIthOwnedTicketNo.transaction && stateIthOwnedTicketNo.errorMessage &&
                        <Chip className="mt-3" label={<span>Ticket Id: <b>{stateIthOwnedTicketNo.transaction[0].toNumber()}</b> Ticket Status: <b>{stateIthOwnedTicketNo.transaction[1]}</b></span>} variant="outlined" />
                    }
                    {stateIthOwnedTicketNo && !stateIthOwnedTicketNo.transaction && stateIthOwnedTicketNo.errorMessage &&
                        <Chip className="mt-3" label={stateIthOwnedTicketNo.errorMessage} variant="outlined" />
                    }
                </div>
                <div className='row justify-content-center align-items-center mb-5'>
                    <TextField className='mb-2' type="number" label="Index" value={winningIndex} onChange={e => setWinningIndex(e.target.value)} />
                    <ProgressButton onClick={handleIthWinningTicketNo} text="Get Ith Winning Ticket Id" />
                    {stateIthWinningTicketNo && stateIthWinningTicketNo.transaction && stateIthWinningTicketNo.errorMessage &&
                        <Chip className="mt-3" label={<span>Ticket Id: <b>{stateIthWinningTicketNo.transaction[0].toNumber()}</b> Ticket Status: <b>{stateIthWinningTicketNo.transaction[1]}</b></span>} variant="outlined" />
                    }
                    {stateIthWinningTicketNo && !stateIthWinningTicketNo.transaction && stateIthWinningTicketNo.errorMessage &&
                        <Chip className="mt-3" label={stateIthWinningTicketNo.errorMessage} variant="outlined" />
                    }
                </div>
                <div className='row justify-content-center align-items-center mb-5'>
                    <TextField className='mb-2' type="number" label="Ticket Id" value={ticketId} onChange={e => setTicketId(e.target.value)} />
                    <ProgressButton onClick={handleIfTicketWon} text="Check if ticket won" />
                    {stateIfTicketWon && stateIfTicketWon.transaction && stateIfTicketWon.errorMessage &&
                        <Chip className="mt-3" label={<span>Ticket Id: <b>{stateIfTicketWon.transaction[0].toNumber()}</b> Ticket Status: <b>{stateIfTicketWon.transaction[1]}</b></span>} variant="outlined" />
                    }
                    {stateIfTicketWon && !stateIfTicketWon.transaction && stateIfTicketWon.errorMessage &&
                        <Chip className="mt-3" label={stateIfTicketWon.errorMessage} variant="outlined" />
                    }
                </div>
            </div>
        </div>
    );
}

export default LotteryInfo;