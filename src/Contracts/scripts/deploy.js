async function main () {
    // We get the contract to deploy
    const Tl = await ethers.getContractFactory('TL');
    console.log('Deploying Tl...');
    const tl = await Tl.deploy(1000000);
    await tl.deployed();
    console.log('tl deployed to:', tl.address);

    const Lottery = await ethers.getContractFactory('Lottery');
    console.log('Deploying Lottery...');
    const lottery = await Lottery.deploy(tl.address);
    await lottery.deployed();
    console.log('Lottery deployed to:', lottery.address);


  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });