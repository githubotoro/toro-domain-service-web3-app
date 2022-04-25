import React, { useState, useEffect } from "react";
import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import { ContractFactory, ethers } from "ethers";
import contractAbi from "./utils/contractABI.json";
import polygonLogo from "./assets/polygonlogo.png";
import ethLogo from "./assets/ethlogo.png";
import { networks } from "./utils/networks";
import Header from "./Header.js";
import Swal from "sweetalert2";

// constants
const TWITTER_HANDLE = "totorulla";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// adding for our minting domain
const tld = ".toro";
const CONTRACT_ADDRESS = "0x13fed7bc1D7CFa359C6a8C4b4857315E2bB7932f";

const App = () => {
	// changing account on account change
	// window.ethereum.on("accountsChanged", async () => {
	// 	connectWallet();
	// });

	// declaring contract owner
	const contractOwner = "0xD5a63CCE627372481b30AE24c31a3Fb94913D5Be";

	// tracking total toro domains
	const [totalToroDomains, setTotalToroDomains] = useState(0);

	// setting loading
	const [loading, setLoading] = useState(false);

	// tracking mints
	const [mints, setMints] = useState([]);

	// variable for editing mode
	const [editing, setEditing] = useState(false);

	// storing networks
	const [network, setNetwork] = useState("");

	// storing user's public wallet address
	const [currentAccount, setCurrentAccount] = useState("");

	// adding state data properties
	const [domain, setDomain] = useState("");
	const [record, setRecord] = useState("");

	// tracking total funds
	let [totalFunds, setTotalFunds] = useState(0);

	// setting initial variables
	const setInitialVariables = async () => {
		let provider = new ethers.providers.JsonRpcProvider(
			process.env.REACT_APP_ALCHEMY_KEY
		);

		// since we are just reading and not making any state change
		// we dont require the private key
		// but for other purposes, you can uncomment this
		// and pass wallet in place of provider
		// during calling of conrtract function
		// let privateKey = "";
		// let wallet = new ethers.Wallet(privateKey, provider);

		let contract = new ethers.Contract(
			CONTRACT_ADDRESS,
			contractAbi.abi,
			provider
		);

		let totalDomainsPromise = contract.getTotalDomains();

		totalDomainsPromise.then(function (result) {
			let totalDomains = result.toNumber();
			setTotalToroDomains(totalDomains);
			console.log(result);
		});
	};

	// setting initial total domains
	useEffect(() => {
		setInitialVariables();
	}, []);

	// implementing our connectWallet method
	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				alert("Get MetaMask -> https://metamask.io/");
				return;
			}

			// method for requesting access to the account
			const accounts = await ethereum.request({
				method: "eth_requestAccounts",
			});

			console.log("Connected", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error);
		}
	};

	// function to switch network
	const switchNetwork = async () => {
		if (window.ethereum) {
			try {
				// trying to switch to the mumbai testnet
				await window.ethereum.request({
					method: "wallet_switchEthereumChain",
					params: [{ chainId: "0x13881" }], // checking networks.js for hexadecimal network ids
				});
			} catch (error) {
				// this error code means that the chain we want has not been added to MetaMask
				// in this case we ask the user to add it to their MetaMask
				if (error.code === 4902) {
					try {
						await window.ethereum.request({
							method: "wallet_addEthereumChain",
							params: [
								{
									chainId: "0x13881",
									chainName: "Polygon Mumbai Testnet",
									rpcUrls: [
										"https://rpc-mumbai.maticvigil.com/",
									],
									nativeCurrency: {
										name: "Mumbai Matic",
										symbol: "MATIC",
										decimals: 18,
									},
									blockExplorerUrls: [
										"https://mumbai.polygonscan.com/",
									],
								},
							],
						});
					} catch (error) {
						console.log(error);
					}
				}
				console.log(error);
			}
		} else {
			// if window.ethereum is not found then MetaMask is not installed
			alert(
				"MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
			);
		}
	};

	// function to check if wallet is connected or not
	const checkIfWalletIsConnected = async () => {
		const { ethereum } = window;

		if (!ethereum) {
			console.log("Make sure you have Metamask!");
			return;
		} else {
			console.log("We have the ethereum object", ethereum);
		}

		const accounts = await ethereum.request({ method: "eth_accounts" });

		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log("Found an authorized account : ", account);
			setCurrentAccount(account);
		} else {
			console.log("No authorized account found");
		}

		// checking chain ID
		const chainId = await ethereum.request({ method: "eth_chainId" });
		setNetwork(networks[chainId]);

		ethereum.on("chainChanged", handleChainChanged);

		// reloading the page after chain change
		function handleChainChanged(_chainId) {
			window.location.reload();
		}
	};

	// function for minting domains
	const mintDomain = async () => {
		// don't run if the domain is empty
		if (!domain) {
			Swal.fire({
				icon: "question",
				title: "Whooops! 👀",
				text: "You forgot to enter the domain name! 🙃",
			});
			return;
		}

		// alert the user if the domain is too short
		if (domain.length < 3) {
			Swal.fire({
				icon: "warning",
				title: "Whooops! 👀",
				text: "Make sure domain length is >=3 and <=25 🙄",
			});
			return;
		}

		// alert the user if the domain is too long
		if (domain.length >= 25) {
			Swal.fire({
				icon: "warning",
				title: "Whooops! 👀",
				text: "Make sure domain length is >=3 and <=25 🙄",
			});
			return;
		}

		// setting price
		const price = "0.01";
		console.log("Minting domain", domain, "with price", price);

		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(
					CONTRACT_ADDRESS,
					contractAbi.abi,
					signer
				);

				const names = await contract.getAllNames();
				if (names.includes(domain, 0)) {
					Swal.fire({
						icon: "error",
						title: "Whooops! 👀",
						text: "This domain has been already minted! 🥺",
						footer: "Try something more toroic! 🙂",
					});

					return;
				}

				console.log("Going to pop wallet now to pay gas...");
				Swal.fire({
					position: "center",
					icon: "info",
					title: "Confirm the MetaMask Transaction for domain! 👀",
					showConfirmButton: false,
					timer: 1500,
				});

				let tx = await contract.register(domain, {
					value: ethers.utils.parseEther(price),
				});

				Swal.fire({
					position: "center",
					icon: "info",
					title: "Minting Domain!\n This might take a few minutes.\n Please wait... ⏳",
					showConfirmButton: true,
					timer: 6000,
				});

				// wait for the transaction to be mined
				const receipt = await tx.wait();

				// check if the transaction was successfully completed
				if (receipt.status === 1) {
					let mintedDomainId = await contract.getDomainId(domain);

					Swal.fire({
						position: "center",
						icon: "success",
						title: `Yaayyy! 🎉 <br/> ${domain}.toro has been minted ✅`,
						html: `Check it out on: <br /> <u><b><a style="color:black" target="_blank"
							rel="noopener noreferrer" href="https://mumbai.polygonscan.com/tx/${tx.hash}">PolygonScan</a></b></u> <br/> <u><b><a style="color:black" target="_blank"
							rel="noopener noreferrer" href="https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mintedDomainId}">OpenSea</a></b></u> <br/> <br/>It will take few minutes for domain to appear on PolygonScan and OpenSea ⏳`,
						showConfirmButton: true,
					});

					console.log(
						"Domain minted! https://mumbai.polygonscan.com/tx/" +
							tx.hash
					);

					if (record !== "") {
						// set the record for the domain
						tx = await contract.setRecord(domain, record);
						await tx.wait();

						let mintedDomainId = await contract.getDomainId(domain);

						Swal.fire({
							position: "center",
							icon: "success",
							title: `Yaayyy! 🎉 <br/> Record has been set for ${domain}.toro ✅`,
							html: `Check it out on: <br /> <u><b><a style="color:black" target="_blank"
								rel="noopener noreferrer" href="https://mumbai.polygonscan.com/tx/${tx.hash}">PolygonScan</a></b></u> <br/> <u><b><a style="color:black" target="_blank"
								rel="noopener noreferrer" href="https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mintedDomainId}">OpenSea</a></b></u> <br/> <br/>It will take few minutes for transaction to appear on PolygonScan ⏳`,
							showConfirmButton: true,
						});

						console.log(
							"Record set! https://mumbai.polygonscan.com/tx/" +
								tx.hash
						);
					}

					// calling fetchMints after 2 seconds
					setTimeout(() => {
						fetchMints();
					}, 2000);

					setRecord("");
					setDomain("");
				} else {
					contract.on("nameTaken", (_from, _name) => {
						console.log("Name already Taken");
					});
					alert("Transaction failed! Please try again");
				}
			}
		} catch (error) {
			console.log(error);
		}
	};

	// function to fetch all mints
	const fetchMints = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(
					CONTRACT_ADDRESS,
					contractAbi.abi,
					signer
				);

				// get all the domain names from our contract
				const names = await contract.getAllNames();

				let totalDomains = await contract.getTotalDomains();
				totalDomains = totalDomains.toNumber();

				setTotalToroDomains(totalDomains);

				console.log("Total Domains are ", totalToroDomains);

				// for each name, get the record and the address
				const mintRecords = await Promise.all(
					names.map(async (name) => {
						const mintRecord = await contract.records(name);
						const owner = await contract.domains(name);
						return {
							id: names.indexOf(name),
							name: name,
							record: mintRecord,
							owner: owner,
						};
					})
				);

				console.log("MINTS FETCHED ", mintRecords);
				setMints(mintRecords);
			}
		} catch (error) {
			console.log(error);
		}
	};

	// function to update the domain
	const updateDomain = async () => {
		if (!record || !domain) {
			return;
		}
		setLoading(true);
		console.log("Updating domain", domain, "with record", record);
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(
					CONTRACT_ADDRESS,
					contractAbi.abi,
					signer
				);

				let tx = await contract.setRecord(domain, record);
				await tx.wait();

				let mintedDomainId = await contract.getDomainId(domain);

				Swal.fire({
					position: "center",
					icon: "success",
					title: `Yaayyy! 🎉 <br/> Record has been set for ${domain}.toro ✅`,
					html: `Check it out on: <br /> <u><b><a style="color:black" target="_blank"
						rel="noopener noreferrer" href="https://mumbai.polygonscan.com/tx/${tx.hash}">PolygonScan</a></b></u> <br/> <u><b><a style="color:black" target="_blank"
						rel="noopener noreferrer" href="https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mintedDomainId}">OpenSea</a></b></u> <br/> <br/>It will take few minutes for transaction to appear on PolygonScan ⏳`,
					showConfirmButton: true,
				});

				console.log(
					"Record set https://mumbai.polygonscan.com/tx/" + tx.hash
				);

				fetchMints();
				setRecord("");
				setDomain("");
			}
		} catch (error) {
			console.log(error);
		}
		setLoading(false);
	};

	// function to render if wallet is not connected yet
	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
			<div className="gif-toro-img"></div>

			{/* calling the connectWallet function when the button is clicked */}
			<button
				onClick={connectWallet}
				className="cta-button connect-wallet-button"
			>
				Connect Wallet
			</button>
		</div>
	);

	// form for domain name and data
	const renderInputForm = () => {
		if (network !== "Polygon Mumbai Testnet") {
			return (
				<div className="please-switch">
					<div className="connect-wallet-container">
						<h2>Please switch to Polygon Mumbai Testnet</h2>
						{/* this button will call our switch network function */}
						<button
							className="cta-button mint-button"
							onClick={switchNetwork}
						>
							Click here to switch
						</button>
					</div>
				</div>
			);
		}

		return (
			<>
				<div className="form-container">
					<div className="first-row">
						<input
							type="text"
							value={domain}
							placeholder="Domain"
							onChange={(e) => setDomain(e.target.value)}
						/>
						<p className="tld"> {tld} </p>
					</div>

					<input
						type="text"
						value={record}
						placeholder="What's your toro ability?"
						onChange={(e) => setRecord(e.target.value)}
					/>
					{/* if the editing variable is true, return the "Set record" and "Cancel" button */}
					{editing ? (
						<div className="button-container">
							{/* this will call the updateDomain function */}
							<button
								className="cta-button mint-button"
								disabled={loading}
								onClick={updateDomain}
							>
								Set Record
							</button>
							{/* this will let us get out of editing mode by setting editing to false */}
							<button
								className="cta-button mint-button"
								onClick={() => {
									setEditing(false);
								}}
							>
								Cancel
							</button>
						</div>
					) : (
						// if editing is not true, the mint button will be returned instead
						<button
							className="cta-button mint-button"
							disabled={loading}
							onClick={mintDomain}
						>
							Mint
						</button>
					)}
				</div>
			</>
		);
	};

	// function to render mints
	const renderMints = () => {
		if (currentAccount && mints.length > 0) {
			return (
				<div className="mint-container">
					<p className="subtitle"> Recently minted domains!</p>
					<div className="mint-list">
						{mints.map((mint, index) => {
							return (
								<div className="mint-item" key={index}>
									<div className="mint-row">
										<a
											className="link"
											href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											<p className="underlined">
												{" "}
												{mint.name}
												{tld}{" "}
											</p>
										</a>
										{/* if mint.owner is currentAccount, add an "edit" button*/}
										{mint.owner.toLowerCase() ===
										currentAccount.toLowerCase() ? (
											<button
												className="edit-button"
												onClick={() =>
													editRecord(mint.name)
												}
											>
												<img
													className="edit-icon"
													src="https://img.icons8.com/metro/26/000000/pencil.png"
													alt="Edit button"
												/>
											</button>
										) : null}
									</div>
									<p> {mint.record} </p>
								</div>
							);
						})}
					</div>
				</div>
			);
		}
	};

	// this will take us into edit mode and show us the edit buttons!
	const editRecord = (name) => {
		console.log("Editing record for", name);
		setEditing(true);
		setDomain(name);
	};

	// running our function when the page loads.
	useEffect(() => {
		checkIfWalletIsConnected();
	}, []);

	// This will run any time currentAccount or network are changed
	useEffect(() => {
		if (network === "Polygon Mumbai Testnet") {
			fetchMints();
		}
	}, [currentAccount, network]);

	// function to render OpenSea link to all minted domains of user
	const renderOpenseaLink = () => {
		let openseaLink = "https://testnets.opensea.io/" + currentAccount;
		return (
			<>
				<div className="opensea-container">
					<div className="opensea-link">
						You can view your minted .toro domains from this OpenSea
						Link.
					</div>
					<a
						href={openseaLink.toString()}
						target="_blank"
						rel="noreferrer"
					>
						<button className="cta-button mint-button">
							Your Minted Domains
						</button>
					</a>
					<a
						href="https://testnets.opensea.io/collection/toro-domain-service"
						target="_blank"
						rel="noreferrer"
					>
						<button className="cta-button mint-button">
							OpenSea Collection Link
						</button>
					</a>
				</div>
			</>
		);
	};

	// function to render mints only of one user
	const renderUserMints = () => {
		if (currentAccount && mints.length > 0) {
			return (
				<div className="mint-container">
					<p className="subtitle">
						{" "}
						Your minted .toro domains will appear here!
					</p>
					<div className="mint-list">
						{mints.map((mint, index) => {
							return (
								<>
									{mint.owner.toLowerCase() ===
									currentAccount.toLowerCase() ? (
										<div className="mint-item" key={index}>
											<div className="mint-row">
												<a
													className="link"
													href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`}
													target="_blank"
													rel="noopener noreferrer"
												>
													<p className="underlined">
														{" "}
														{mint.name}
														{tld}{" "}
													</p>
												</a>
												{/* if mint.owner is currentAccount, add an "edit" button*/}
												{mint.owner.toLowerCase() ===
												currentAccount.toLowerCase() ? (
													<button
														className="edit-button"
														onClick={() =>
															editRecord(
																mint.name
															)
														}
													>
														<img
															className="edit-icon"
															src="https://img.icons8.com/metro/26/000000/pencil.png"
															alt="Edit button"
														/>
													</button>
												) : null}
											</div>
											<p> {mint.record} </p>
										</div>
									) : null}
								</>
							);
						})}
					</div>
				</div>
			);
		}
	};

	const fetchTotalFunds = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(
					CONTRACT_ADDRESS,
					contractAbi.abi,
					signer
				);

				let gettingTotalFunds = await contract.getTotalFunds();
				gettingTotalFunds = ethers.utils.formatEther(gettingTotalFunds);
				console.log(gettingTotalFunds);

				setTotalFunds(gettingTotalFunds);
			}
		} catch (error) {
			console.log(error);
		}
	};

	// function to withdraw funds
	const withdrawFunds = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(
					CONTRACT_ADDRESS,
					contractAbi.abi,
					signer
				);

				if (
					currentAccount.toLowerCase() === contractOwner.toLowerCase()
				) {
					const tx = await contract.withdraw();
					const receipt = await tx.wait();

					if (receipt.status === 1) {
						console.log("Funds have been withdrawn");
					}
				}
			}
		} catch (error) {
			console.log(error);
		}
	};

	const displayFunds = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(
					CONTRACT_ADDRESS,
					contractAbi.abi,
					signer
				);

				totalFunds = await contract.getTotalFunds();
				await totalFunds.wait();
			}
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<>
			<div className="App">
				<div className="container">
					<div className="header-container">
						<header>
							<div className="left">
								<a
									href="https://github.com/githubotoro/toro-domain-service-web3-app"
									target="_blank"
									rel="noreferrer"
								>
									Github &nbsp; |
								</a>
								&nbsp; &nbsp;{" "}
								<a
									href="https://opensea.io/collection/totorulla"
									target="_blank"
									rel="noreferrer"
								>
									OpenSea &nbsp; |
								</a>
								&nbsp; &nbsp;{" "}
								<a
									href="https://twitter.com/totorulla"
									target="_blank"
									rel="noreferrer"
								>
									Twitter &nbsp; |
								</a>{" "}
								&nbsp; &nbsp;{" "}
								<a
									href="https://www.instagram.com/totorulla/"
									target="_blank"
									rel="noreferrer"
								>
									Instagram &nbsp; |
								</a>
								&nbsp; &nbsp;{" "}
								<a
									href="https://mumbai.polygonscan.com/address/0x13fed7bc1d7cfa359c6a8c4b4857315e2bb7932f"
									target="_blank"
									rel="noreferrer"
								>
									Smart Contract &nbsp;
								</a>
							</div>

							{/* displaying sleeping totoru and wallet connection status */}
							<div className="right">
								<img
									alt="Network logo"
									className="logo"
									src={
										network.includes("Polygon")
											? polygonLogo
											: ethLogo
									}
								/>
								{currentAccount ? (
									<p>
										{" "}
										Wallet: {currentAccount.slice(0, 6)}
										...
										{currentAccount.slice(-4)}{" "}
									</p>
								) : (
									<p> Not connected </p>
								)}
							</div>
						</header>
					</div>
					<Header />

					<div className="domains-minted-so-far">
						<div className="domains-total">
							{totalToroDomains - 1}
						</div>
						.toro domains minted so far
					</div>

					{/* hide the connect button if currentAccount isn't empty */}
					{!currentAccount && renderNotConnectedContainer()}

					{/* rendering input form if account is connected */}
					{currentAccount && renderInputForm()}

					<div className="dont-have-matic">
						<div className="dont-have-matic-title">
							Don't have MATIC? Get some for free from Faucet!
						</div>

						<a
							href="https://faucet.polygon.technology/"
							target="_blank"
							rel="noreferrer"
						>
							<button className="cta-button mint-button">
								Polygon MATIC Faucet
							</button>
						</a>
					</div>

					{mints && renderUserMints()}

					{currentAccount && renderOpenseaLink()}

					{mints && renderMints()}

					{currentAccount.toLowerCase() ===
					contractOwner.toLowerCase() ? (
						<>
							<div className="dont-have-matic-title">
								Contract balance is {totalFunds}
							</div>

							<div className="button-container">
								<button
									className="cta-button mint-button"
									onClick={withdrawFunds}
								>
									Withdraw Funds
								</button>

								<button
									className="cta-button mint-button"
									onClick={fetchTotalFunds}
								>
									Refresh Funds
								</button>
							</div>
						</>
					) : (
						<p> Cannot Withdraw Funds </p>
					)}

					<div className="stay-toro">
						<a
							href="https://twitter.com/totorulla"
							target="_blank"
							rel="noreferrer"
						>
							<i>#stayTORO</i>
						</a>
					</div>
				</div>
			</div>
		</>
	);
};

export default App;
