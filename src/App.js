import React from "react";
import { Routes, Route } from "react-router-dom";

import TlOperations from "./screens/TlOperations";
import TicketBuyAndTransfer from "./screens/TicketBuyAndTransfer";
import LotteryOperations from "./screens/LotteryOperations";
import LotteryInfo from "./screens/LotteryInfo";
import { useEthers } from "@usedapp/core";
import Button from "@mui/material/Button";
import Navbar from "./components/Navbar";



/*
* Routes are defined here
* */
function App() {
  const { activateBrowserWallet, account } = useEthers();

  return (
    <>
      <Navbar />
      <div className="container">
        {!account &&
          <div className="row justify-content-center align-items-center mt-5">
            <div className="col-12 d-flex justify-content-center">
              <Button style={{ marginTop: 10, alignSelf: "center" }} variant="contained" onClick={() => activateBrowserWallet()}>Connect to metamask</Button>
            </div>
          </div>
        }
        {account &&
          <Routes>
            <Route path={"tl-operations"} element={<TlOperations />} />
            <Route path={"ticket-buy-and-transfer"} element={<TicketBuyAndTransfer />} />
            <Route path={"lottery-operations"} element={<LotteryOperations />} />
            <Route path={"lottery-info"} element={<LotteryInfo />} />
            <Route path={"*"} element={<TlOperations />} />
          </Routes>
        }
      </div>
    </>
  );
}

export default App;
