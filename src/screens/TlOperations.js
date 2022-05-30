import { BigNumber, utils } from 'ethers'
import { Contract } from '@ethersproject/contracts'
import { useContractFunction, useContractCall } from "@usedapp/core"

import { useEffect, useState } from "react";
import { tlAddress, tlAbi, lotteryAbi, lotteryAddress } from "../Contracts/contracts.js"
import TextField from "@mui/material/TextField";
import ProgressButton from '../components/ProgressButton.js';

const tlInterface = new utils.Interface(tlAbi)
const tlContract = new Contract(tlAddress, tlInterface)

const lotteryInterface = new utils.Interface(lotteryAbi)
const lotteryContract = new Contract(lotteryAddress, lotteryInterface)

function TlOperations() {
    const { state: stateTake, send: sendTake } = useContractFunction(tlContract, 'takeAmount', {})
    const { state: stateApprove, send: sendApprove } = useContractFunction(tlContract, 'approve', {})
    const { state: stateDeposit, send: sendDeposit } = useContractFunction(lotteryContract, 'depositTL', {})
    const { state: stateWithdraw, send: sendWithdraw } = useContractFunction(lotteryContract, 'withdrawTL', {})

    const { state: stateBalance, send: sendBalance } = useContractFunction(lotteryContract, 'checkBalance', {})

    useEffect(() => {
        sendBalance()
    }, [stateDeposit, stateWithdraw])

    const [amountTake, setAmountTake] = useState(0)
    const handleTake = () => {
        sendTake(BigNumber.from(amountTake))
    }

    const [amountDeposit, setAmountDeposit] = useState(0)
    const handleDeposit = async () => {
        await sendApprove(lotteryAddress, BigNumber.from(amountDeposit))
        await sendDeposit(BigNumber.from(amountDeposit))
    }

    const [amountWithdraw, setAmountWithdraw] = useState(0)
    const handleWithdraw = () => {
        sendWithdraw(BigNumber.from(amountWithdraw))
    }

    return (
        <div className='row justify-content-center align-items-center mt-5'>
            <div className='col-8'>
                <h4 className='mb-5'><b>Balance: {stateBalance && stateBalance.transaction ? stateBalance.transaction.toNumber() : "..."}</b></h4>

                <div className='row justify-content-center align-items-center mb-5'>
                    <TextField className='mb-2' type="number" label="Amount" value={amountTake} onChange={e => setAmountTake(e.target.value)} />
                    <ProgressButton onClick={handleTake} text="Take TL" state={stateTake} />
                </div>
                <div className='row justify-content-center align-items-center mb-5'>
                    <TextField className='mb-2' type="number" label="Amount" value={amountDeposit} onChange={e => setAmountDeposit(e.target.value)} />
                    <ProgressButton onClick={handleDeposit} text="Deposit TL to Lottery" state={(stateDeposit.status !== "None" && stateDeposit.status !== "Success") ? stateDeposit : stateApprove} />
                </div>
                <div className='row justify-content-center align-items-center mb-5'>
                    <TextField className='mb-2' type="number" label="Amount" value={amountWithdraw} onChange={e => setAmountWithdraw(e.target.value)} />
                    <ProgressButton onClick={handleWithdraw} text="Withdraw TL" state={stateWithdraw} />
                </div>
            </div>
        </div>
    );
}

export default TlOperations;