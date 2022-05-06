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
  let [poolId, setPoolId] = React.useState(0);
  let [poolInfo, setPoolInfo] = React.useState([]);
  let [userInfo, setUserInfo] = React.useState([]);
  let [whitelistedAddresses, setWalletAddresses] = React.useState([]);
  let [amount, setAmount] = React.useState(0);

  const poolData= [
    {name: "DIAMOND",apy: "120", lock:"90", maxStake: "200,000", fee: "25", maxPool:"15m"},
    {name: "GOLD",apy: "60", lock:"60", maxStake: "1,000,000", fee: "25", maxPool:"20m"},
    {name: "BRONZE",apy: "20", lock:"30", maxStake: "2,000,000", fee: "25", maxPool:"20m"}
  ]

  let [_signer, _setSigner]= React.useState(0);
  let [_provider, _setProvider]= React.useState(0);
  const web3ModalRef = React.useRef(); // return the object with key named current


  React.useEffect(() => {
    web3ModalRef.current = new Web3Modal({
      network: "rinkeby",
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


  }, []);

  React.useEffect(()=>{
    getPoolInfo();
    getUserInfo();
    getWhiteListAddresses();
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
      setUserInfo(_userInfo);
    }catch(err){
      console.log("User error", err);
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
      let _amount = ethers.utils.parseEther(amount.toString());
      // console.log (_amount)
      let tx = await staking.stakeTokens(poolId, _amount);
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
      let tx = await token.approve(values.stakingAddress, _amount);
    }catch (error) {
      alert(error.data.message);
    }
  }

  const onclickhandlers = (e) => { 
    console.log(e.target.value);
    setPoolId(parseInt(e.target.value));
  }

  function handleChange(event) {
    const { name, value } = event.target;
    if (name === "tokenAmount") setAmount(value);
  }


  const connectWallet = async () => {
    try {
      await getSignerOrProvider(true);
    } catch (error) {
      console.log(" error Bhai", error);
    }
  };

  const getSignerOrProvider = async (needSigner = false) => {
    try{
      const _provider = new providers.JsonRpcProvider(values.rpcUrl);
      _setProvider(_provider);
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);
      const { chainId } = await web3Provider.getNetwork();
      console.log ("ChainId: ", chainId);
      // if (chainId !== 4) {
      //   alert("USE RINKEEBY NETWORK");
      //   throw new Error("Change network to Rinkeby");
      // }
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
            <Progress color="#20A7DB" completed={75} height={20} data-label={`75% Pool Filled`}/>
            </div>
            {/* <Timer /> */}
            <div className='stak_info'>
            <p>Estimated APY : <span className='text-blue'>{`330.36%`}</span></p>
            <p>My Balance : <span className='text-blue'>{`$345`}</span> </p>
            <p>My Stakable Balance :  <span className='text-blue'>{`$315`}</span></p>
            </div>  

            <div className='inputs'>
         
            <div className='inputbox'>
            <div>
            <label>Stake Your Token</label>
            </div>
            <div className="input1">
            <input placeholder='Enter Token Amount' type="number" />
                <div className='maxToken'>
                <p>MAX</p>
                </div>
                </div>
                <div className='inputbox'>
                <div>
                <label>Staked Token</label>
                </div>
                <input placeholder={`Show Staked Amount`} readOnly/>
            </div>
            </div>
            </div>


            <div className='stak_info'>
            <p>Claimable Token : <span className='text-blue'>{`330.36%`}</span> </p>
            <p>My Total Claimed Token : <span className='text-blue'>{`632123`}</span></p>
            <p>Unstake Fee : <span className='text-blue'>{`0%`}</span></p>
            </div>
            <div className='all_buttons'>
                <button className='greenButton'>STAKE</button>
                <button className='greenButton'>CLAIM</button>
                <button className='greenButton'>UNSTAKE</button>
                <button className='redbutton'>EMERGENCY UNSTAKE</button>
            </div>
            </div>
    </div>
    </div>
  )
}

export default Landing;
