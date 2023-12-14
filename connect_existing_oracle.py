# connect_to_contract.py
# Created by: IbsanjU on 06 Dec 2023
# github: https://github.com/ibsanju
# website: https://ibsanju.com
import json
import os
import time
import re
from requests import Request, Session
from requests.exceptions import ConnectionError, Timeout, TooManyRedirects
from solcx import compile_source, get_installed_solc_versions, install_solc, get_installable_solc_versions
from web3 import Web3
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Update me: set up my Alchemy API endpoint, CoinMarketCap API key, and test account info from Metamask wallet.
alchemy_url = "https://eth-sepolia.g.alchemy.com/v2/" + \
    os.getenv("ALCHEMY_API_KEY")
my_account = os.getenv("METAMASK_ACCOUNT")
private_key = os.getenv("METAMASK_PRIVATE_KEY")
deploy = os.getenv("DEPLOY_ENV_VAR", "true").lower() == "true"

# Update me: write a MyOracle contract.
MyOracleSource = os.path.join(os.path.dirname(
    __file__), "./contracts/MyOracle.sol")
# Directory to store ABI, bytecode, and address files
output_directory = os.path.join(os.path.dirname(__file__), "./output")
# Create the output directory if it doesn't exist
os.makedirs(output_directory, exist_ok=True)

gas_limit = 3000000
solc_version = '0.8.20'  # Choose the desired Solc version
last_checked_block = None


def get_contract_name():
    with open(MyOracleSource, 'r') as file:
        source_code = file.read()
    match = re.search(r'contract\s+(\w+)\s+is\s+\w+\s*{', source_code)
    return match.group(1) if match else None


contractname = get_contract_name()


def write_to_file(filename, content):
    content = content or ""
    with open(filename, 'w') as file:
        file.write(content)


def compile_contract(w3):
    print(f"Compiling {contractname} contract...")
    with open(MyOracleSource, 'r') as file:
        oracle_code = file.read()

    compiled_sol = compile_source(
        oracle_code,
        output_values=['abi', 'bin'],
        solc_version=solc_version
    )

    # contract_id, contract_interface = compiled_sol.popitem()
    # contract_interface = compiled_sol['<stdin>:OrderPaymentContract']
    c = compiled_sol[f'<stdin>:{contractname}']
    abi = c['abi']
    bin = c['bin']
    Contract = w3.eth.contract(abi=abi, bytecode=bin)

    # Write contract address, ABI, and bytecode to files
    abi_file_path = os.path.join(output_directory, f'{contractname}_abi.json')
    bytecode_file_path = os.path.join(
        output_directory, f'{contractname}_bytecode.txt')

    write_to_file(abi_file_path, json.dumps(abi, indent=4))
    write_to_file(bytecode_file_path, bin)

    print("ABI written to:", abi_file_path)
    print("Bytecode written to:", bytecode_file_path)
    return Contract


def deploy_oracle(w3, contract):
    print("default:", w3.eth.default_account, "accounts:", w3.eth.accounts)

    balance = w3.eth.get_balance(w3.eth.default_account)
    print("Balance of account:", balance)

    deploy_txn = contract.constructor().build_transaction(
        {
            "gasPrice": w3.eth.gas_price,
            "gas": gas_limit,
            "from": my_account,
            "nonce": w3.eth.get_transaction_count(my_account),
            "chainId": w3.eth.chain_id
        }
    )

    signed_txn = w3.eth.account.sign_transaction(
        deploy_txn, private_key=private_key)
    print(f"Deploying {contractname} Contract......")

    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)

    txn_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    oracle_address = txn_receipt.contractAddress
    print("blockNumber:", txn_receipt.blockNumber,
          "gasUsed:", txn_receipt.gasUsed)
    print("oracle_address:", oracle_address)
    address_file_path = os.path.join(
        output_directory, f"{contractname}_address.txt")

    write_to_file(address_file_path, oracle_address)
    print("Address written to:", address_file_path)

    print(f"Contract {contractname} deployed!")
    return oracle_address


def update_oracle(w3, contract, index, value_in_wei=0):
    set_txn = contract.functions.processAcceptedOrder(
        int(index)
    ).build_transaction({
        "gasPrice": w3.eth.gas_price,
        "gas": gas_limit,
        "from": my_account,
        "nonce": w3.eth.get_transaction_count(my_account),
        "value": value_in_wei,
    })

    signed_txn = w3.eth.account.sign_transaction(
        set_txn, private_key=private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)

    # wait for the transaction to be confirmed, and get the transaction receipt
    txn_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return txn_receipt


def install_required_solc(version):
    installed_versions = [str(v) for v in get_installed_solc_versions()]

    print("Installed Solc versions:", installed_versions)

    if version in installed_versions:
        print(f"Solc version {version} is already installed.")
        return

    try:
        print(f"Installing Solc version {version}...")
        install_solc(version)
        print(f"Solc version {version} installed successfully.")
    except Exception as e:
        if "Solc is not installed" in str(e):
            print(f"Error: Solc is not installed. Please install it manually.")
        else:
            print(f"Error installing Solc version {version}: {e}")
        exit(-1)

    while str(version) not in installed_versions:
        print(f"Waiting for Solc version {version} to be installed...")
        time.sleep(1)


def connect_to_existing_contract(w3):
    # Load ABI from file
    abi_file_path = os.path.join(output_directory, f"{contractname}_abi.json")
    with open(abi_file_path, 'r') as file:
        abi = json.load(file)

    # Load contract address from file
    address_file_path = os.path.join(
        output_directory, f"{contractname}_address.txt")
    with open(address_file_path, 'r') as file:
        contract_address = file.read().strip()

    # Get the contract instance
    contract = w3.eth.contract(address=contract_address, abi=abi)

    print("Connected to existing contract at address:", contract.address)
    return contract


def isAlive():
    current_time = time.localtime()
    if current_time.tm_sec % 10 == 0:
        return True
    return False


def monitor_oracle(w3, MyOracleContract):
    event_filter = MyOracleContract.events.OrderAccepted.create_filter(
        fromBlock='latest')

    while True:
        if (isAlive()):
            print("Im alive!", " waiting for updates...")
        for event in event_filter.get_new_entries():
            if event.event == "OrderAccepted":
                print("------------------------------------------")
                print("Callback found:")

                index = event.args['orderIndex']
                orderId = event.args['orderId']
                order = event.args['order']

                print("Order Index:", index)
                print("Order ID:", orderId)
                print("Order:", order)

                value_in_wei = w3.to_wei(order['total'], 'ether')

                print("Writing to blockchain...")
                txn = update_oracle(w3, MyOracleContract,  index, value_in_wei)
                print("Transaction complete!")

                # print transaction all info
                print(txn)
                print("blockNumber:", txn.blockNumber, "gasUsed:", txn.gasUsed)
                print("------------------------------------------")
        time.sleep(2)


def monitor_oracle_events(w3, MyOracleContract, last_checked_block=None):
    print("events monnitor is on...")
    while True:
        # Get the latest block number
        latest_block = w3.eth.getBlock('latest')['number']

        # Check if there are new blocks since the last check
        if last_checked_block is None or last_checked_block < latest_block:
            # Iterate through transactions in the latest block
            block = w3.eth.getBlock(latest_block, full_transactions=True)
            for tx in block.transactions:
                tx_receipt = w3.eth.getTransactionReceipt(tx.hash)

                # Check if the transaction is from the target contract
                if tx_receipt and tx_receipt['to'] == MyOracleContract.address:
                    # Parse the logs to get the events
                    events = MyOracleContract.events.all_events.processReceipt(
                        tx_receipt)

                    # Loop through all events in the transaction
                    for event in events:
                        print(f"Event: {event.event}, Args: {event.args}")

            # Update the last_checked_block
            last_checked_block = latest_block

        time.sleep(2)


def main():
    w3 = Web3(Web3.HTTPProvider(alchemy_url))
    w3.eth.default_account = my_account

    if not w3.is_connected():
        print('Not connected to Alchemy endpoint')
        exit(-1)
    else:
        print('Connected to Alchemy endpoint:', alchemy_url)

    MyOracleContract = None
    if deploy:
        print("Deploying a new contract.")
        MyOracleContract = compile_contract(w3)
        MyOracleContract.address = deploy_oracle(w3, MyOracleContract)
        print("Deployed MyOracle contract to address:", MyOracleContract.address)
    else:
        print("Connecting to an existing contract.")
        MyOracleContract = connect_to_existing_contract(w3)

    try:
        print("Waiting for an oracle update request...")
        monitor_oracle(w3, MyOracleContract)
        monitor_oracle_events(w3, MyOracleContract)
    except Exception as e:
        print("Exiting... e:", e)
        exit(0)


install_required_solc(solc_version)

if __name__ == "__main__":
    main()
