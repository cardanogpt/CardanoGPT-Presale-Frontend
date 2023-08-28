import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import SocialLink from "./components/SocialLink";
import { Buffer } from "buffer";
import { Component } from "react";
import axios from "axios";
import {
  Address,
  TransactionUnspentOutput,
  TransactionUnspentOutputs,
  TransactionOutput,
  Value,
  TransactionBuilder,
  TransactionBuilderConfigBuilder,
  LinearFee,
  BigNum,
  TransactionWitnessSet,
  Transaction,
} from "@emurgo/cardano-serialization-lib-asmjs";
import toast, { Toaster } from "react-hot-toast";
let baseurl = "https://eon.onrender.com/";
class Root extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTabId: "1",
      whichWalletSelected: undefined,
      walletFound: false,
      walletIsEnabled: false,
      walletName: undefined,
      walletIcon: undefined,
      walletAPIVersion: undefined,
      wallets: [],
      networkId: 1,
      Utxos: undefined,
      CollatUtxos: undefined,
      balance: undefined,
      changeAddress: undefined,
      rewardAddress: undefined,
      usedAddress: undefined,
      txBody: undefined,
      txBodyCborHex_unsigned: "",
      txBodyCborHex_signed: "",
      submittedTxHash: "",
      addressBech32SendADA:
        "addr_test1qz6zwp5nm5y2hweaf206jerj4ssecn0xqs6n68g4m872wjq036p0vxvnvmyl4phnz3dzu6s9axaw357zpjwugh8mwvpstg3qvx",
      lovelaceToSend: 0,
      assetNameHex: "4c494645",
      assetPolicyIdHex:
        "ae02017105527c6c0c9840397a39cc5ca39fabe5b9998ba70fda5f2f",
      assetAmountToSend: 5,
      addressScriptBech32:
        "addr_test1wpnlxv2xv9a9ucvnvzqakwepzl9ltx7jzgm53av2e9ncv4sysemm8",
      datumStr: "12345678",
      plutusScriptCborHex: "4e4d01000033222220051200120011",
      transactionIdLocked: "",
      transactionIndxLocked: 0,
      lovelaceLocked: 3000000,
      manualFee: 900000,
      showTransactionModal: false,
      walletConnect: false,
      allocationAmount: 0,
    };

    /**
     * When the wallet is connect it returns the connector which is
     * written to this API variable and all the other operations
     * run using this API object
     */
    this.API = undefined;
    /**
     * Protocol parameters
     * @type {{
     * keyDeposit: string,
     * coinsPerUtxoWord: string,
     * minUtxo: string,
     * poolDeposit: string,
     * maxTxSize: number,
     * priceMem: number,
     * maxValSize: number,
     * linearFee: {minFeeB: string, minFeeA: string}, priceStep: number
     * }}
     */
    this.protocolParams = {
      linearFee: {
        minFeeA: "44",
        minFeeB: "155381",
      },
      minUtxo: "34482",
      poolDeposit: "500000000",
      keyDeposit: "2000000",
      maxValSize: 5000,
      maxTxSize: 16384,
      priceMem: 0.0577,
      priceStep: 0.0000721,
      coinsPerUtxoWord: "34482",
    };
    this.pollWallets = this.pollWallets.bind(this);
  }

  /**
   * Poll the wallets it can read from the browser.
   * Sometimes the html document loads before the browser initialized browser plugins (like Nami or Flint).
   * So we try to poll the wallets 3 times (with 1 second in between each try).
   *
   * Note: CCVault and Eternl are the same wallet, Eternl is a rebrand of CCVault
   * So both of these wallets as the Eternl injects itself twice to maintain
   * backward compatibility
   *
   * @param count The current try count.
   */
  pollWallets = (count = 0) => {
    const wallets = [];
    for (const key in window.cardano) {
      if (window.cardano[key].enable && wallets.indexOf(key) === -1) {
        wallets.push(key);
      }
    }
    if (wallets.length === 0 && count < 3) {
      setTimeout(() => {
        this.pollWallets(count + 1);
      }, 1000);
      return;
    }
    this.setState(
      {
        wallets,
        whichWalletSelected: wallets[0],
      },
      () => {
        this.refreshData();
      }
    );
  };

  /**
   * Handles the radio buttons on the form that
   * let the user choose which wallet to work with
   * @param obj
   */
  handleWalletSelect = (event) => {
    const whichWalletSelected = event;
    this.setState({ whichWalletSelected }, () => {
      this.refreshData();
    });
    this.checkAllocation();
    this.closeWalletConnect();
  };

  handleInputChange = (event) => {
    this.setState({
      lovelaceToSend: event.target.value,
    });
  };
  /**
   * Checks if the wallet is running in the browser
   * Does this for Nami, Eternl and Flint wallets
   * @returns {boolean}
   */

  checkIfWalletFound = () => {
    const walletKey = this.state.whichWalletSelected;
    const walletFound = !!window?.cardano?.[walletKey];
    this.setState({ walletFound });
    return walletFound;
  };

  /**
   * Checks if a connection has been established with
   * the wallet
   * @returns {Promise<boolean>}
   */
  checkIfWalletEnabled = async () => {
    let walletIsEnabled = false;

    try {
      const walletName = this.state.whichWalletSelected;
      walletIsEnabled = await window.cardano[walletName].isEnabled();
    } catch (err) {
      console.log(err);
    }
    this.setState({ walletIsEnabled });

    return walletIsEnabled;
  };
  openWalletConnect = () => {
    this.setState({ walletConnect: true });
  };
  closeWalletConnect = () => {
    this.setState({ walletConnect: false });
  };
  checkAllocation = async () => {
    console.log("checkAllocation");
    const changeAddress = this.state.changeAddress;
    (async () => {
      const { data } = await axios.post(
        "https://eon.onrender.com/api/transactions/gettotal",
        {
          accounts: changeAddress,
        }
      );
      if (data.data.length === 0) {
        return this.setState({ allocationAmount: 0 });
      }
      let allocationAmount = data.data[0].totalAmount;
      this.setState({ allocationAmount: allocationAmount });
    })();
  };
  /**
   * Enables the wallet that was chosen by the user
   * When this executes the user should get a window pop-up
   * from the wallet asking to approve the connection
   * of this app to the wallet
   * @returns {Promise<boolean>}
   */

  enableWallet = async () => {
    const walletKey = this.state.whichWalletSelected;
    try {
      this.API = await window.cardano[walletKey].enable();
    } catch (err) {
      console.log(err);
    }
    return this.checkIfWalletEnabled();
  };

  /**
   * Get the API version used by the wallets
   * writes the value to state
   * @returns {*}
   */
  getAPIVersion = () => {
    const walletKey = this.state.whichWalletSelected;
    const walletAPIVersion = window?.cardano?.[walletKey].apiVersion;
    this.setState({ walletAPIVersion });
    return walletAPIVersion;
  };

  /**
   * Get the name of the wallet (nami, eternl, flint)
   * and store the name in the state
   * @returns {*}
   */

  getWalletName = () => {
    const walletKey = this.state.whichWalletSelected;
    const walletName = window?.cardano?.[walletKey].name;
    this.setState({ walletName });
    return walletName;
  };

  /**
   * Gets the Network ID to which the wallet is connected
   * 0 = testnet
   * 1 = mainnet
   * Then writes either 0 or 1 to state
   * @returns {Promise<void>}
   */
  getNetworkId = async () => {
    try {
      const networkId = await this.API.getNetworkId();
      this.setState({ networkId });
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Gets the UTXOs from the user's wallet and then
   * stores in an object in the state
   * @returns {Promise<void>}
   */

  getUtxos = async () => {
    let Utxos = [];

    try {
      const rawUtxos = await this.API.getUtxos();

      for (const rawUtxo of rawUtxos) {
        const utxo = TransactionUnspentOutput.from_bytes(
          Buffer.from(rawUtxo, "hex")
        );
        const input = utxo.input();
        const txid = Buffer.from(
          input.transaction_id().to_bytes(),
          "utf8"
        ).toString("hex");
        const txindx = input.index();
        const output = utxo.output();
        const amount = output.amount().coin().to_str(); // ADA amount in lovelace
        const multiasset = output.amount().multiasset();
        let multiAssetStr = "";

        if (multiasset) {
          const keys = multiasset.keys(); // policy Ids of thee multiasset
          const N = keys.len();
          // console.log(`${N} Multiassets in the UTXO`)

          for (let i = 0; i < N; i++) {
            const policyId = keys.get(i);
            const policyIdHex = Buffer.from(
              policyId.to_bytes(),
              "utf8"
            ).toString("hex");
            // console.log(`policyId: ${policyIdHex}`)
            const assets = multiasset.get(policyId);
            const assetNames = assets.keys();
            const K = assetNames.len();
            // console.log(`${K} Assets in the Multiasset`)

            for (let j = 0; j < K; j++) {
              const assetName = assetNames.get(j);
              const assetNameString = Buffer.from(
                assetName.name(),
                "utf8"
              ).toString();
              const assetNameHex = Buffer.from(
                assetName.name(),
                "utf8"
              ).toString("hex");
              const multiassetAmt = multiasset.get_asset(policyId, assetName);
              multiAssetStr += `+ ${multiassetAmt.to_str()} + ${policyIdHex}.${assetNameHex} (${assetNameString})`;
              // console.log(assetNameString)
              // console.log(`Asset Name: ${assetNameHex}`)
            }
          }
        }

        const obj = {
          txid: txid,
          txindx: txindx,
          amount: amount,
          str: `${txid} #${txindx} = ${amount}`,
          multiAssetStr: multiAssetStr,
          TransactionUnspentOutput: utxo,
        };
        Utxos.push(obj);
        // console.log(`utxo: ${str}`)
      }
      this.setState({ Utxos });
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Gets the current balance of in Lovelace in the user's wallet
   * This doesnt resturn the amounts of all other Tokens
   * For other tokens you need to look into the full UTXO list
   * @returns {Promise<void>}
   */
  getBalance = async () => {
    try {
      const balanceCBORHex = await this.API.getBalance();
      const balance = Value.from_bytes(Buffer.from(balanceCBORHex, "hex"))
        .coin()
        .to_str();
      console.log(Number(balance / 10e5), "balance");
      this.setState({ balance: Number(balance / 10e5).toFixed(2) });
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Get the address from the wallet into which any spare UTXO should be sent
   * as change when building transactions.
   * @returns {Promise<void>}
   */
  getChangeAddress = async () => {
    try {
      const raw = await this.API.getChangeAddress();
      const changeAddress = Address.from_bytes(
        Buffer.from(raw, "hex")
      ).to_bech32();
      this.setState({ changeAddress });
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * This is the Staking address into which rewards from staking get paid into
   * @returns {Promise<void>}
   */
  getRewardAddresses = async () => {
    try {
      const raw = await this.API.getRewardAddresses();
      const rawFirst = raw[0];
      const rewardAddress = Address.from_bytes(
        Buffer.from(rawFirst, "hex")
      ).to_bech32();
      // console.log(rewardAddress)
      this.setState({ rewardAddress });
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Gets previsouly used addresses
   * @returns {Promise<void>}
   */
  getUsedAddresses = async () => {
    try {
      const raw = await this.API.getUsedAddresses();
      const rawFirst = raw[0];
      const usedAddress = Address.from_bytes(
        Buffer.from(rawFirst, "hex")
      ).to_bech32();
      // console.log(rewardAddress)
      this.setState({ usedAddress });
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Refresh all the data from the user's wallet
   * @returns {Promise<void>}
   */
  refreshData = async () => {
    try {
      const walletFound = this.checkIfWalletFound();
      if (walletFound) {
        await this.getAPIVersion();
        await this.getWalletName();
        const walletEnabled = await this.enableWallet();
        if (walletEnabled) {
          await this.getNetworkId();
          await this.getUtxos();
          await this.getBalance();
          await this.getChangeAddress();
          await this.getRewardAddresses();
          await this.getUsedAddresses();
          await this.checkAllocation();
        } else {
          await this.setState({
            Utxos: null,
            CollatUtxos: null,
            balance: null,
            changeAddress: null,
            rewardAddress: null,
            usedAddress: null,
            txBody: null,
            txBodyCborHex_unsigned: "",
            txBodyCborHex_signed: "",
            submittedTxHash: "",
          });
        }
      } else {
        await this.setState({
          walletIsEnabled: false,
          Utxos: null,
          CollatUtxos: null,
          balance: null,
          changeAddress: null,
          rewardAddress: null,
          usedAddress: null,
          txBody: null,
          txBodyCborHex_unsigned: "",
          txBodyCborHex_signed: "",
          submittedTxHash: "",
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Every transaction starts with initializing the
   * TransactionBuilder and setting the protocol parameters
   * This is boilerplate
   * @returns {Promise<TransactionBuilder>}
   */
  initTransactionBuilder = async () => {
    const txBuilder = TransactionBuilder.new(
      TransactionBuilderConfigBuilder.new()
        .fee_algo(
          LinearFee.new(
            BigNum.from_str(this.protocolParams.linearFee.minFeeA),
            BigNum.from_str(this.protocolParams.linearFee.minFeeB)
          )
        )
        .pool_deposit(BigNum.from_str(this.protocolParams.poolDeposit))
        .key_deposit(BigNum.from_str(this.protocolParams.keyDeposit))
        .coins_per_utxo_word(
          BigNum.from_str(this.protocolParams.coinsPerUtxoWord)
        )
        .max_value_size(this.protocolParams.maxValSize)
        .max_tx_size(this.protocolParams.maxTxSize)
        .prefer_pure_change(true)
        .build()
    );

    return txBuilder;
  };

  /**
   * Builds an object with all the UTXOs from the user's wallet
   * @returns {Promise<TransactionUnspentOutputs>}
   */
  getTxUnspentOutputs = async () => {
    let txOutputs = TransactionUnspentOutputs.new();
    for (const utxo of this.state.Utxos) {
      txOutputs.add(utxo.TransactionUnspentOutput);
    }
    return txOutputs;
  };

  /**
   * The transaction is build in 3 stages:
   * 1 - initialize the Transaction Builder
   * 2 - Add inputs and outputs
   * 3 - Calculate the fee and how much change needs to be given
   * 4 - Build the transaction body
   * 5 - Sign it (at this point the user will be prompted for
   * a password in his wallet)
   * 6 - Send the transaction
   * @returns {Promise<void>}
   */
  buildSendADATransaction = async () => {
    if (this.state.networkId === 1) {
      return toast.error("Please Connect to Testnet");
    }
    try {
      const txBuilder = await this.initTransactionBuilder();
      const shelleyOutputAddress = Address.from_bech32(
        this.state.addressBech32SendADA
      );
      const shelleyChangeAddress = Address.from_bech32(
        this.state.changeAddress
      );

      txBuilder.add_output(
        TransactionOutput.new(
          shelleyOutputAddress,
          Value.new(BigNum.from_str(String(this.state.lovelaceToSend * 1e6)))
        )
      );

      // Find the available UTXOs in the wallet and
      // us them as Inputs
      const txUnspentOutputs = await this.getTxUnspentOutputs();
      txBuilder.add_inputs_from(txUnspentOutputs, 1);

      // calculate the min fee required and send any change to an address
      txBuilder.add_change_if_needed(shelleyChangeAddress);

      // once the transaction is ready, we build it to get the tx body without witnesses
      const txBody = txBuilder.build();

      // Tx witness
      const transactionWitnessSet = TransactionWitnessSet.new();

      const tx = Transaction.new(
        txBody,
        TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
      );

      let txVkeyWitnesses = await this.API.signTx(
        Buffer.from(tx.to_bytes(), "utf8").toString("hex"),
        true
      );

      console.log(txVkeyWitnesses);

      txVkeyWitnesses = TransactionWitnessSet.from_bytes(
        Buffer.from(txVkeyWitnesses, "hex")
      );

      transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

      const signedTx = Transaction.new(tx.body(), transactionWitnessSet);

      const submittedTxHash = await this.API.submitTx(
        Buffer.from(signedTx.to_bytes(), "utf8").toString("hex")
      );
      console.log(submittedTxHash);
      this.setState({ submittedTxHash });
      this.setState({ showTransactionModal: true });
      toast.success("Transaction sent");
      await axios.post(`${baseurl}api/transactions/toadmin`, {
        accounts: this.state.changeAddress,
        txid: submittedTxHash,
        amount: this.state.lovelaceToSend * 9,
      });
    } catch (error) {
      toast.error("Error sending transaction");
    } finally {
      this.refreshData();
    }
  };
  closeModal = () => {
    this.setState({ showTransactionModal: false });
  };
  async componentDidMount() {
    const wallets = [];
    for (const key in window.cardano) {
      if (window.cardano[key].enable && wallets.indexOf(key) === -1) {
        wallets.push(key);
      }
    }
    if (wallets.length === 0 && count < 3) {
      setTimeout(() => {
        this.pollWallets(count + 1);
      }, 1000);
      return;
    }
    this.setState({
      wallets,
    });
    // this.refreshData();
    // this.setState(
    //   {
    //     wallets,
    //   },
    //   () => this.initTransactionBuilder()
    // );
  }
  render() {
    return (
      <>
        <Toaster />
        <Navbar
          changeAddress={this.state.changeAddress}
          openWalletConnect={this.openWalletConnect}
          closeWalletConnect={this.closeWalletConnect}
          {...this.state}
          handleWalletSelect={this.handleWalletSelect}
        />
        <Hero
          openWalletConnect={this.openWalletConnect}
          handleInputChange={this.handleInputChange}
          buildSendADATransaction={this.buildSendADATransaction}
          {...this.state}
          closeModal={this.closeModal}
        />
        <SocialLink />
      </>
    );
  }
}

const router = createBrowserRouter(
  createRoutesFromElements(<Route path="*" element={<Root />} />)
);

const App = () => <RouterProvider router={router} />;

export default App;
