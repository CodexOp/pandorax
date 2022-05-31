import React, {useState, useEffect} from 'react';
import './landing.css';
import Progress from 'react-progressbar';
import logo from '../../images/logo.png'
import Countdown from 'react-countdown';
import Timer from './Timer';
import { ethers, providers } from "ethers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import values from "../../values.json"
import stakingAbi from '../../abi/staking.json';
import tokenAbi from '../../abi/token.json';


const Landing = () => {
  let [connectedWallet, setConnectedWallet] = React.useState(false);
  let [walletAddress, setWalletAddress] = React.useState("Connect");
  let [poolId, setPoolId] = React.useState(1);
  let [poolInfo, setPoolInfo] = React.useState([]);
  let [userInfo, setUserInfo] = React.useState([]);
  let [whitelistedAddresses, setWalletAddresses] = React.useState([]);
  let [amount, setAmount] = React.useState(0);
  let [balance, setBalance] = React.useState(0);
  let [stakingBalance, setStackingBalance] = React.useState(0);
  let [currentPoolSize, setCurrentPoolSize] = React.useState(0);
  let [timeLock, setTimeLock] = React.useState(0);
  let [maxPoolSize, setMaxPoolSize] = React.useState(0);


  let [_signer, _setSigner]= React.useState(0);
  let [_provider, _setProvider]= React.useState(0);
  const [web3ModalRef, setWeb3ModalRef] = React.useState(""); // return the object with key named current


  React.useEffect(() => {
    let _web3ModalRef = new Web3Modal({
      network: "binance",
      cacheProvider: false,
      providerOptions: {
        walletconnect: {
          package: WalletConnectProvider, // required
          options: {
            rpc: {
              56: values.rpcUrl
            } // required
          }
        }
      },
    });
    setWeb3ModalRef(_web3ModalRef);
    // let web3 = new Web3Modal({});
    // web3.cachedProvider()

    // connectWallet();
    // web3ModalRef.clearCachedProvider();
    // console.log ( "Hellow", _web3ModalRef.cachedProvider)

  }, []);

  React.useEffect(()=>{
    getPoolInfo();
    getUserInfo();
    getWhiteListAddresses();
    
    async function fetch (){
      try{
        let _balance = await _getBalance(values.token);
        console.log("BAlance", _balance);
        setBalance(_balance);
      }catch (err){
        console.log("Error", err);
      }
    }
    fetch();
  }, [_provider, _signer, poolId]);

  async function getPoolInfo (){
    try{
      let rpcUrl = values.rpcUrl;
      let provider_ = new ethers.providers.JsonRpcProvider(rpcUrl);
      let staking = new ethers.Contract(
        values.stakingAddress,
        stakingAbi,
        provider_
      );
      var _poolInfo = await staking.poolInfo(poolId);
      console.log ("Pool Info: ", _poolInfo);
      setPoolInfo(_poolInfo);
      let temp = ethers.utils.formatUnits(_poolInfo[2].toString(), 5).toString()
      console.log ("temp: ", temp, " value: ", _poolInfo[2].toString());
      setCurrentPoolSize(temp);
      temp = ethers.utils.formatUnits(_poolInfo[1].toString(), 5).toString()
      setMaxPoolSize(temp)
    }catch(err){
      console.log(err);
    }
  }

  async function getUserInfo (){
    try{
      let rpcUrl = values.rpcUrl;
      let provider_ = new ethers.providers.JsonRpcProvider(rpcUrl);
      let staking = new ethers.Contract(
        values.stakingAddress,
        stakingAbi,
        provider_
      );
      let _wallet = _signer.getAddress();      
      let _userInfo = await staking.userInfo( poolId, _wallet);
      console.log ("USER Info: ", _userInfo);
      setStackingBalance(ethers.utils.formatUnits(_userInfo[0], 5).toString())
      setUserInfo(_userInfo);
      let _timestamp = parseInt(_userInfo[1].toString())* 1000;
      let _time = new Date(_timestamp);
      if (_timestamp >0) setTimeLock(_time);
      else setTimeLock(" Not staked yet");
    }catch(err){
      console.log("User error", err);
    }
  }

  async function _getBalance (tokenAddress, accountAddress){
    try {
      let rpcUrl = values.rpcUrl;
      let provider_ = new ethers.providers.JsonRpcProvider(rpcUrl);
      let token = new ethers.Contract(
        tokenAddress,
        tokenAbi,
        provider_
      );
      if (!accountAddress){
        accountAddress = await _signer.getAddress();
      }
      let balance = await token.balanceOf (accountAddress);
      console.log ("Balalala", balance)
      let decimals = await token.decimals();
      decimals = parseInt(decimals.toString());
      balance = ethers.utils.formatUnits(balance, decimals);
      return parseFloat(balance.toString()).toFixed(2);
    } catch (err){
      console.log (err, tokenAddress);
      return 0;
    }
  }

  async function getWhiteListAddresses (){
    try{
      let rpcUrl = values.rpcUrl;
      let provider_ = new ethers.providers.JsonRpcProvider(rpcUrl);
      let staking = new ethers.Contract(
        values.stakingAddress,
        stakingAbi,
        provider_
      );
      let _wallet = _signer.getAddress();      
      let _wlInfo = await staking.whitelistedAddress( poolId, _wallet);
      console.log ("Whitelist Info: ", _wlInfo);
      setWalletAddresses(_wlInfo);
    }catch(err){
      console.log("User error", err);
    }
  }

  async function stakeTokens () {
    try{
      let staking = new ethers.Contract(
        values.stakingAddress,
        stakingAbi,
        _signer
      );
      let _amount = ethers.utils.parseUnits(amount.toString(), 5);
      console.log (_amount.toString())
      let tx = await staking.stakeTokens(poolId, _amount);
      await tx.wait()
      getPoolInfo();
      getUserInfo();
    }catch (error) {
      alert(error.data.message);
      // console.log (error)
    }
  }

  async function unstakeTokens () {
    try{
      let staking = new ethers.Contract(
        values.stakingAddress,
        stakingAbi,
        _signer
      );
      let tx = await staking.unstakeTokens(poolId);
      await tx.wait()
      getPoolInfo();
      getUserInfo();
    }catch (error) {
      alert(error.data.message);
    }
  }

  async function emergencyWithdraw () {
    try{
      let staking = new ethers.Contract(
        values.stakingAddress,
        stakingAbi,
        _signer
      );
      let tx = await staking.emergencyWithdraw(poolId);
      await tx.wait()
      getPoolInfo();
      getUserInfo();
    }catch (error) {
      alert (error.data.message);
    }
  }

  async function approve () {
    try{
      let token = new ethers.Contract(
        values.token,
        tokenAbi,
        _signer
      );
      let _amount = ethers.utils.parseEther("10000000000000000000");
      console.log ("walletAddress", walletAddress)
      let _allowance = await token.allowance(walletAddress, values.stakingAddress);
      console.log ("Allowance: " + _allowance)
      if (_allowance.toString().length < 3){
        let _tx = await token.approve(values.stakingAddress, _amount);
        await _tx.wait();
      }
      stakeTokens()
    }catch (error) {
      // alert(error.data.message);
      console.log (error)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setAmount(value);
    // console.log (amount);
  }

  async function disconnectWallet () {
    try{
      
      await web3ModalRef.clearCachedProvider();
      setConnectedWallet(false);
      setBalance(0);
      setWalletAddress("Connect")
      setStackingBalance(0);
      setTimeLock(0)
      _setProvider("");
      _setSigner("");
      window.localStorage.clear();
    }catch(err){
      console.log(err);
    }
  }


  const connectWallet = async () => {
    try {
      if (!connectedWallet) await getSignerOrProvider(true);
      else disconnectWallet();
    } catch (error) {
      console.log(" error Bhai", error);
    }
  };

  const getSignerOrProvider = async (needSigner = false) => {
    try{
      const _provider = new providers.JsonRpcProvider(values.rpcUrl);
      _setProvider(_provider);
      const provider = await web3ModalRef.connect();
      const web3Provider = new providers.Web3Provider(provider);
      const { chainId } = await web3Provider.getNetwork();
      console.log ("ChainId: ", chainId);
      // if (chainId !== 4) {
      //   alert("USE RINKEEBY NETWORK");
      //   throw new Error("Change network to Rinkeby");
      // }

      if (chainId != 56){
        switchNetwork(web3Provider);
      }

      if (needSigner) {
        const signer = web3Provider.getSigner();
        _setSigner(signer)
        let temp = await signer.getAddress();
        setWalletAddress(temp.toString());
      }
      setConnectedWallet(true);
      provider.on("accountsChanged", (accounts) => {
        console.log(accounts);
        connectWallet();
      });
    } catch (error) {
      console.log (error);
      const provider = new providers.JsonRpcProvider(values.rpcUrl);
      _setProvider(provider);
    }
  };

  async function switchNetwork (library) {
    try {
      await library.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ethers.utils.hexlify(56) }],
      });
      console.log ("HIhIHIHIHIHI")
      
    } catch (switchError) {
        console.log ("HIIIIIIIIIIIIIIIII", switchError)
        // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await library.provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: ethers.utils.hexlify(56),
                chainName: "Binance Network",
                nativeCurrency: {
                  name: "Binance",
                  symbol: "BNB", // 2-6 characters long
                  decimals: 18
                },
                rpcUrls: ["https://bsc-dataseed.binance.org/"],
                blockExplorerUrls: ["https://bscscan.com"],
              },
            ],
          });
        } catch (addError) {
          throw addError;
        }
      }
    }
  }


return (
  <div>
  <div className='navbar_outer'>
            
            <div className='logo_container'><img className="logo" src={logo} /><h2>PandoraX</h2></div>
            <div className='connect_wallet_container'>
                <button className='wallet' onClick={connectWallet}>{walletAddress === 'Connect' ? 'Connect' : `${walletAddress.slice(0,4)}...${walletAddress.slice(-4,-1)}`}</button>
            </div>
        </div>
    <div className='landing'>
        <div className='stak_box'>  
            <div className='stak_heading'>
                <h2>STAKE YOUR TOKEN</h2>
            </div>
            <div className='stak_bar'>
            <Progress color="#20A7DB" completed={(parseFloat(currentPoolSize)* 100)/parseFloat(maxPoolSize)} height={20} data-label={`${(parseFloat(currentPoolSize)* 100)/parseFloat(maxPoolSize)}% Pool Filled`} />
            </div>
            {/* <Timer /> */}
            <div className='stak_info'>
            <p>Estimated APY : <span className='text-blue'>{`200%`}</span></p>
            <p>My Balance : <span className='text-blue'>{balance}</span> </p>
            <p>My Staked Balance :  <span className='text-blue'>{stakingBalance}</span></p>
            <p>Lock Deadline :  <span className='text-blue'>{timeLock.toString()}</span></p>
            </div>  

            <div className='inputs'>
         
            <div className='inputbox'>
            <div>
            <label>Stake Your Token</label>
            </div>
            <div className="input1">
            <input placeholder='Enter Token Amount' onChange= {(e)=> handleChange(e)} value= {amount} type="number" />
                <div className='maxToken'>
                <p onClick= {()=> setAmount(balance)} >MAX</p>
                </div>
                </div>
                <div className='inputbox'>
                {/* <div>
                <label>Staked Token</label>
                </div>
                <input placeholder={`Show Staked Amount`} readOnly/> */}
            </div>
            </div>
            </div>


            <div className='stak_info'>
            {/* <p>Claimable Token : <span className='text-blue'>{`330.36%`}</span> </p>
            <p>My Total Claimed Token : <span className='text-blue'>{`632123`}</span></p> */}
            <p>Current Pool Size :  <span className='text-blue'>{currentPoolSize}</span></p>
            <p>Unstake Fee : <span className='text-blue'>{`15%`}</span></p>
            </div>
            <div className='all_buttons'>
                <button className='greenButton' onClick={approve} >Stake</button>
                {/* <button className='greenButton'>CLAIM</button> */}
                <button className='greenButton' onClick={unstakeTokens} >Unstake</button>
                <button className='redbutton' onClick={emergencyWithdraw} >Emergency Withdraw</button>
            </div>
            </div>
    </div>
    </div>
  )
}

export default Landing;
