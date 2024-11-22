// @ts-nocheck
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { assertIsDeliverTxSuccess } from "@cosmjs/stargate";

import path from "path";
import fs from "fs";
import { getSigningJsdClient, jsd } from "hyperwebjs";
import { useChain, generateMnemonic } from "starshipjs";
import { sleep } from "../test-utils/sleep";
import "./setup.test";

describe("Contract 3: Escrow contract test", () => {
    let wallet, denom, address, queryClient, signingClient;
    let chainInfo, getCoin, getRpcEndpoint, creditFromFaucet;
    let contractCode, contractIndex;

    let buyerWallet, buyerAddress;
    let sellerWallet, sellerAddress;
    let fee;

    const uusdc = "uusdc";

    beforeAll(async () => {
        ({ chainInfo, getCoin, getRpcEndpoint, creditFromFaucet } =
        useChain("hyperweb"));
        denom = (await getCoin()).base;

        // Initialize wallet
        wallet = await DirectSecp256k1HdWallet.fromMnemonic(generateMnemonic(), {
            prefix: chainInfo.chain.bech32_prefix,
        });
        address = (await wallet.getAccounts())[0].address;
        console.log(`contract creator address: ${address}`);

        // Initialize buyerWallet
        buyerWallet = await DirectSecp256k1HdWallet.fromMnemonic(generateMnemonic(), {
            prefix: chainInfo.chain.bech32_prefix,
        });
        buyerAddress = (await buyerWallet.getAccounts())[0].address;
        console.log(`buyer address: ${buyerAddress}`);

        // Initialize sellerWallet
        sellerWallet = await DirectSecp256k1HdWallet.fromMnemonic(generateMnemonic(), {
            prefix: chainInfo.chain.bech32_prefix,
        });
        sellerAddress = (await sellerWallet.getAccounts())[0].address;
        console.log(`seller address: ${sellerAddress}`);

        // Create custom cosmos interchain client
        queryClient = await jsd.ClientFactory.createRPCQueryClient({
        rpcEndpoint: await getRpcEndpoint(),
        });

        signingClient = await getSigningJsdClient({
        rpcEndpoint: await getRpcEndpoint(),
        signer: wallet,
        });

        // set default fee
        fee = { amount: [{ denom, amount: "100000" }], gas: "550000" };

        await creditFromFaucet(address);
        await sleep(2000); // sleep for 1 sec to get tokens transferred from faucet successfully
        
        await creditFromFaucet(buyerAddress);
        await sleep(2000);

        await creditFromFaucet(sellerAddress);
        await sleep(2000);

    });

    it("check balances", async () => {
        let balance = await signingClient.getBalance(address, denom);
        expect(balance.denom).toEqual(denom);
        expect(balance.amount).toEqual("10000000000");

        balance = await signingClient.getBalance(buyerAddress, denom);
        expect(balance.denom).toEqual(denom);
        expect(balance.amount).toEqual("10000000000");

        balance = await signingClient.getBalance(sellerAddress, denom);
        expect(balance.denom).toEqual(denom);
        expect(balance.amount).toEqual("10000000000");
    });

    it('instantiate contract', async () => {
        // Read contract code from external file
        const contractPath = path.join(__dirname, '../dist/contracts/escrowContract.js');
        contractCode = fs.readFileSync(contractPath, 'utf8');
    
        const msg = jsd.jsd.MessageComposer.fromPartial.instantiate({
          creator: address,
          code: contractCode,
        });
    
        const result = await signingClient.signAndBroadcast(address, [msg], fee);
        assertIsDeliverTxSuccess(result);
    
        // Parse the response to get the contract index
        const response = jsd.jsd.MsgInstantiateResponse.fromProtoMsg(result.msgResponses[0]);
        contractIndex = response.index;
        expect(contractIndex).toBeGreaterThan(0);
        console.log(`contract index: ${contractIndex}`);
    });

    it('deposit funds to escrow', async () => {
        const msg = jsd.jsd.MessageComposer.fromPartial.eval({
            creator: address,
            index: contractIndex,
            fnName: "deposit",
            arg: `{"amount":1000, "buyer":"${buyerAddress}"}`
        });
    
        const result = await signingClient.signAndBroadcast(address, [msg], fee);
        assertIsDeliverTxSuccess(result);

        // Check if the escrow has the funds
        const msg2 = jsd.jsd.MessageComposer.fromPartial.eval({
            creator: address,
            index: contractIndex,
            fnName: "getDeposited",
            arg: `{}`,
        });

        const result2 = await signingClient.signAndBroadcast(address, [msg2], fee);
        assertIsDeliverTxSuccess(result2);

        const response = jsd.jsd.MsgEvalResponse.fromProtoMsg(result2.msgResponses[0]);
        console.log(response.result);
        expect(response.result).toEqual(`{\"amount\":1000,\"buyer\":\"${buyerAddress}\"}`);
    });


    it('release funds from escrow', async () => {
        const msg1 = jsd.jsd.MessageComposer.fromPartial.eval({
            creator: address,
            index: contractIndex,
            fnName: "deposit",
            arg: `{"amount":1000, "buyer":"${buyerAddress}"}`
        });
    
        const result1 = await signingClient.signAndBroadcast(address, [msg1], fee);
        assertIsDeliverTxSuccess(result1);
        
        const msg2 = jsd.jsd.MessageComposer.fromPartial.eval({
            creator: address,
            index: contractIndex,
            fnName: "release",
            arg: `{"tokenIn":"${uusdc}","seller":"${sellerAddress}"}`
        });
        
        if (msg2 === undefined) {
            throw new Error("msg2 is undefined");
        }
        const result2 = await signingClient.signAndBroadcast(address, [msg2], fee);
        console.log(result2);
        assertIsDeliverTxSuccess(result2);

        // Check if the escrow has the funds
        const msg3 = jsd.jsd.MessageComposer.fromPartial.eval({
            creator: address,
            index: contractIndex,
            fnName: "getDeposited",
            arg: `{}`,
        });

        const result3 = await signingClient.signAndBroadcast(address, [msg3], fee);
        assertIsDeliverTxSuccess(result3);

        const response = jsd.jsd.MsgEvalResponse.fromProtoMsg(result3.msgResponses[0]);
        expect(response.result).toEqual("0");
    });
});
