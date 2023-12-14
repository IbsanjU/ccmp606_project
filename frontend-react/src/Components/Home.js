import React from 'react';
import { useState, useEffect } from 'react'; // Importing hooks from the react library
import abi from '../contracts/OrderPaymentContract_abi.json'; // Importing metadata for the smart contract functions
import './Home.css';
import contractHandler from '../utils/ContractHandler';
import FloatingConverter from './FloatingConverter';
import web3 from 'web3';

import Console from './Console';

function Home() {
	const [msg, setMsg] = useState(''); // Initializing state variable for displaying messages
	const [web3, setWeb3] = useState(); // Initializing state variable for displaying messages
	const [logList, setLogList] = useState([]); // Initializing state variable to store log list
	const [contract, setSetContract] = useState(null); // Initializing state variable for smart contract object

	const [accountList, setAccountList] = useState([]); // Initializing state variable for storing list of accounts
	const [myAccount, setAccount] = useState(''); // Initializing state variable for current account

	const checkWallet = async () => {
		if (window.ethereum) {
			// Check if MetaMask is installed
			setMsg('Wallet Found'); // Set the message state variable
		} else {
			setMsg('Please Install MetaMask');
		}
	};

	const connectSmartContract = async () => {
		if (window.ethereum) {
			// Check if MetaMask is installed
			console.log('Ethereum test network Connected!');

			const ch = contractHandler;
			await ch.connectContract();
			setSetContract(ch.getContract()); // Set the contract object in the state
			setAccountList(ch.getAccountList()); // Set the account list state variable
			setAccount(ch.getAccountList()[0]); // Set the account list state variable
			setWeb3(ch.getWeb3());
			setLogList((_) => [...ch.getLogList()]);
			setMsg('Contract Connected !');
		} else {
			alert('Get MetaMast to Connect');
		}
	};

	useEffect(() => {
		checkWallet(); // Call the function to check if wallet is installed
	}, []);

	return (
		<div className="App">
			<FloatingConverter web3={web3} />
			<div className="header">
				<h1 className="title">Smart Contract API</h1>
				<p className="message">Order Payment Contract</p>
			</div>
			{myAccount ? (
				<>
					<ApiForm setLogList={setLogList} contract={contract} account={myAccount} web3={web3} />
					<br />
					<Console logList={logList} setLogList={setLogList} />
				</>
			) : contract ? (
				<>
					<label className="account-label">
						Select your Account:
						<select className="account-select" value={myAccount} onChange={setAccount}>
							<option value="">Select Account</option>
							{accountList.map((accAddress) => (
								<option key={accAddress} value={accAddress}>
									{accAddress}
								</option>
							))}
						</select>
					</label>
				</>
			) : (
				<>
					<div className="connect-message">
						<p className="connect-message">Connect to the test network!</p>
						<button className="connect-button" onClick={connectSmartContract}>
							Connect
						</button>
					</div>
				</>
			)}
		</div>
	);
}

function ApiForm(props) {
	// Initialize state for selected function and its inputs
	const [selectedFunction, setSelectedFunction] = useState('');
	const [functionInputs, setFunctionInputs] = useState({});

	// Helper function to create a new function instance with given dynamic properties
	function createFuncCall(funcName, dynamicProps) {
		// Create a new object with dynamic properties and 'invoke' method
		const newFunc = {
			...dynamicProps,
			invoke: async () => {
				const ch = contractHandler;
				const contract = ch.getContract();
				// Get the contract function with given name and arguments
				const contractFunction = contract.methods[funcName](...Object.values(dynamicProps));

				let response = {};
				// Find the function data in ABI with the given name
				const functionData = abi.find((f) => f.name === funcName);

				// Call or send the contract function based on its state mutability
				if (functionData.stateMutability === 'view') {
					response = await contractFunction.call();
				} else if (functionData.stateMutability === 'payable') {
					const obj = {};
					obj['from'] = ch.getAccountList()[0];
					if (funcName === 'placeOrderAndProcessPayment') obj['value'] = web3.utils.toWei(dynamicProps['total'].toString(), 'ether');
					// if (funcName === 'processAcceptedOrder' ) obj['value'] = web3.utils.toWei(dynamicProps['order'].toString(), 'ether');
					console.log(obj);
					// return
					response = await contractFunction.send({ ...obj });
				} else {
					response = await contractFunction.send({ from: ch.getAccountList()[0] });
				}
				return response;
			}
		};

		// console.log(newFunc);
		return newFunc.invoke;
	}

	// Handler for function selection change
	function handleFunctionChange(event) {
		const selectedFunction = event.target.value;
		setSelectedFunction(selectedFunction);

		// Get the input data for the selected function from ABI
		const functionData = abi.find((f) => f.name === selectedFunction);
		const inputs = {};

		// Create an object with input names as keys and empty strings as values
		if (functionData && functionData.inputs) {
			functionData.inputs.forEach((input) => {
				inputs[input.name] = '';
			});
		}
		setFunctionInputs(inputs);
	}

	// Get the placeholder type for an input field
	function getPlaceholderType(event) {
		// Find the function data in ABI with the selected function name
		const functionData = abi.find((f) => f.name === selectedFunction);
		let ph = '';
		if (functionData && functionData.inputs) {
			// Find the input data with the given name and return its type
			functionData.inputs.forEach((input) => {
				if (event === input.name) return (ph = input.type);
			});
		}
		return ph;
	}

	// Handler for input field change
	function handleInputChange(event) {
		let { name, value, placeholder: type } = event.target;
		let parsedValue;
		// Parse the value based on its type
		if (type === 'uint256') {
			parsedValue = value && !isNaN(value) ? parseFloat(value) : 0;
		} else if (type === 'boolean') {
			parsedValue = value === 'true';
		} else if (type === 'address') {
			// Check if the address is valid
			try {
				const web3 = contractHandler.getWeb3();
				if (!web3.utils.isAddress(value)) console.log('Invalid Ethereum address');
				// Convert the address to checksum format
				parsedValue = web3.utils.toChecksumAddress(value);
			} catch (error) {}
		} else {
			parsedValue = value;
		}
		value = parsedValue;
		setFunctionInputs((prevInputs) => ({ ...prevInputs, [name]: value }));
	}

	// Handler for form submission
	async function handleSubmit(event) {
		event.preventDefault();
		// console.log(selectedFunction, functionInputs);

		let output = {};
		try {
			// Create a new function instance with selected function name and inputs, and invoke it
			let response = await createFuncCall(selectedFunction, functionInputs)();
			output = { ...output, response };
		} catch (error) {
			output = { ...output, error: error.message ? error.message : JSON.stringify(error) };
		}

		// Add the function call
		props.setLogList((prev) => [...contractHandler.addToLogList({ [selectedFunction]: functionInputs, output: { ...output }, date: new Date() })]);
		// if (output.error) alert(output.error.message ? output.error.message : output.error);
	}

	function isFirstLetterCapitalized(str) {
		return str.charAt(0).toUpperCase() === str.charAt(0);
	}

	function isFuncThere(name) {
		const list = [
			'changeAdmin',
			'checkAdminRole',
			'confirmOrder',
			'getContractBalance',
			'getOrderById',
			'getOrderByIndex',
			'getUserBalance',
			'orderIndex',
			'orders',
			'placeOrderAndProcessPayment',
			'processAcceptedOrder',
			'raiseDispute',
			'removeAcceptedOrders',
			'resolveDispute'
		];
		if (list.includes(name)) return true;
		else return false;
	}

	return (
		<form className="function-form" onSubmit={handleSubmit}>
			<label className="form-label">
				Select a function:
				<select className="form-select" value={selectedFunction} onChange={handleFunctionChange}>
					<option value="">Select a function</option>
					{abi.map((func) =>
						func.name && isFuncThere(func.name) && !isFirstLetterCapitalized(func.name) ? (
							<option className="form-option" key={func.name} value={func.name}>
								{func.name}
							</option>
						) : (
							''
						)
					)}
				</select>
			</label>
			{selectedFunction && (
				<>
					<h2 className="form-section-title">Function inputs:</h2>
					{Object.entries(functionInputs).map(([name, value]) => (
						<div className="form-input" key={name}>
							<label>
								<b>{name || 'Input'}: </b>
								{getPlaceholderType(name) === 'uint256' && name === 'total' ? (
									<input className="input-field" min={0} type="number" step={0.1} name={name} value={value} placeholder={getPlaceholderType(name)} onChange={handleInputChange} />
								) : (
									<input className="input-field" type="text" name={name} value={value} placeholder={getPlaceholderType(name)} onChange={handleInputChange} />
								)}
							</label>
						</div>
					))}
					<button className="submit-button" type="submit">
						Call function
					</button>
				</>
			)}
		</form>
	);
}

export default Home;
