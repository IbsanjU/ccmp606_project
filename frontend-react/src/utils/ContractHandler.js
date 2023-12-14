import abi from '../contracts/OrderPaymentContract_abi.json'; // Importing smart contract artifact
import Web3 from 'web3'; // Importing Web3.js library to interact with the Ethereum blockchain

class ContractHandler {
	constructor() {
		this.accountList = [];
		this.web3 = null;
		this.contract = null;
		this.logList = [];
	}

	async connectContract() {
		const account = await window.ethereum.request({ method: 'eth_requestAccounts' });
		this.accountList = account;
		const contractABI = abi;
		const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
		const web3 = new Web3(Web3.givenProvider);
		this.web3 = web3;
		const CONTRACT = new web3.eth.Contract(contractABI, contractAddress);
		this.contract = CONTRACT;
		alert('Contract Connected !');
		this.logList.push('Contract Connected !');
	}

	getAccountList() {
		return this.accountList;
	}

	getWeb3() {
		return this.web3;
	}

	getContract() {
		return this.contract;
	}

	getLogList() {
		return this.logList;
	}

	addToLogList(newValue) {
		this.logList.push(newValue);
		return this.logList;
	}
}

const contractHandler = new ContractHandler();

export default contractHandler;
