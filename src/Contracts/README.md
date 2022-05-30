## Install Requirements

- `npm install --save-dev hardhat`

- `npm install --save-dev @openzeppelin/contracts`

- `npm install --save-dev @nomiclabs/hardhat-waffle 'ethereum-waffle@^3.0.0' @nomiclabs/hardhat-ethers 'ethers@^5.0.0'`

- `npm install --save-dev @nomiclabs/hardhat-waffle ethereum-waffle chai @nomiclabs/hardhat-ethers ethers`

## Compile Code

`npx hardhat compile`

## Starting Hardhat Node
- We are using hardhat so before deployment we need to start a local node of Hardhat. Therefore, run: 

- `npx hardhat node`

## Deployment
- After starting the hardhat node, you can deploy the contracts with the following code:

- `npx hardhat run --network localhost scripts/deploy.js`

## Test

- `npx hardhat test`