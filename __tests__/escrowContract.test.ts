// @ts-nocheck
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { assertIsDeliverTxSuccess } from '@cosmjs/stargate';

import path from "path";
import fs from 'fs';
import { getSigningJsdClient, jsd } from 'hyperwebjs'
import { useChain, generateMnemonic } from 'starshipjs';
import { sleep } from '../test-utils/sleep';
import './setup.test';
import { sign } from 'crypto';

describe('JSD tests', () => {
  let wallet, denom, address, queryClient, signingClient;
  let chainInfo, getCoin, getRpcEndpoint, creditFromFaucet;
  let contractCode, contractIndex;

  let sellerWallet, sellerAddress, sellerSigningClient;
  let buyerWallet, buyerAddress, buyerSigningClient;
  let fee;
  const uusdc = "uusdc";

  beforeAll(async () => {
    ({
      chainInfo,
      getCoin,
      getRpcEndpoint,
      creditFromFaucet
    } = useChain('hyperweb'));
    denom = (await getCoin()).base;

    // Initialize wallet
    wallet = await DirectSecp256k1HdWallet.fromMnemonic(generateMnemonic(), {
      prefix: chainInfo.chain.bech32_prefix
    });
    address = (await wallet.getAccounts())[0].address;
    console.log(`contract creator address: ${address}`)

    sellerWallet = await DirectSecp256k1HdWallet.fromMnemonic(generateMnemonic(), {
        prefix: chainInfo.chain.bech32_prefix
    });
    sellerAddress = (await sellerWallet.getAccounts())[0].address;
    console.log(`user address: ${sellerAddress}`)

    buyerWallet = await DirectSecp256k1HdWallet.fromMnemonic(generateMnemonic(), {
        prefix: chainInfo.chain.bech32_prefix
    });
    buyerAddress = (await buyerWallet.getAccounts())[0].address;
    console.log(`user address: ${buyerAddress}`)

    // Create custom cosmos interchain client
    queryClient = await jsd.ClientFactory.createRPCQueryClient({
      rpcEndpoint: await getRpcEndpoint()
    });

    signingClient = await getSigningJsdClient({
      rpcEndpoint: await getRpcEndpoint(),
      signer: wallet
    });

    sellerSigningClient = await getSigningJsdClient({
        rpcEndpoint: await getRpcEndpoint(),
        signer: sellerWallet
    });

    buyerSigningClient = await getSigningJsdClient({
        rpcEndpoint: await getRpcEndpoint(),
        signer: buyerWallet
    });

    // set default fee
    fee = {amount: [{denom, amount: '100000'}], gas: '550000'};

    await creditFromFaucet(address);
    await creditFromFaucet(sellerAddress, denom);
    await creditFromFaucet(buyerAddress, denom);
    await sleep(6000);
  });

  it('check balance', async () => {
    const balance = await signingClient.getBalance(address, denom);
    
    expect(balance.amount).toEqual("10000000000");
    expect(balance.denom).toEqual(denom);
  });

  it('instantiate contract', async () => {
    // Read contract code from external file
    const contractPath = path.join(__dirname, '../dist/contracts/escrowContract.js');
    contractCode = fs.readFileSync(contractPath, 'utf8');

    const msg = jsd.jsd.MessageComposer.fromPartial.instantiate({
      creator: address,
      code: contractCode,
      initMsg: JSON.stringify({
        token: denom
      }),
    });

    const result = await signingClient.signAndBroadcast(address, [msg], fee);
    assertIsDeliverTxSuccess(result);

    // Parse the response to get the contract index
    const response = jsd.jsd.MsgInstantiateResponse.fromProtoMsg(result.msgResponses[0]);
    contractIndex = response.index;
    expect(contractIndex).toBeGreaterThan(0);
    console.log(`contract index: ${contractIndex}`);
  });

  it('query for contract based on index', async () => {
    const response = await queryClient.jsd.jsd.contracts({index: contractIndex});
    expect(response.contracts.code).toEqual(contractCode);
    expect(response.contracts.index).toEqual(contractIndex);
    expect(response.contracts.creator).toEqual(address);
  });

  it('query agent', async () => {
    const msg = jsd.jsd.MessageComposer.fromPartial.eval({
      creator: address,
      index: contractIndex,
      fnName: "getAgent",
      arg: "",
    });

    const result = await signingClient.signAndBroadcast(address, [msg], fee);
    assertIsDeliverTxSuccess(result);

    const response = jsd.jsd.MsgEvalResponse.fromProtoMsg(result.msgResponses[0]);
    expect(JSON.parse(response.result)).toEqual(address);
  });

  it('set buyer', async () => {
    const msg = jsd.jsd.MessageComposer.fromPartial.eval({
      creator: address,
      index: contractIndex,
      fnName: "setBuyerAddress",
      arg: JSON.stringify({address: buyerAddress}),
    });

    const result = await signingClient.signAndBroadcast(address, [msg], fee);
    assertIsDeliverTxSuccess(result);

    const response = jsd.jsd.MsgEvalResponse.fromProtoMsg(result.msgResponses[0]);
    expect(JSON.parse(response.result)).toEqual(buyerAddress);
  });

  it('set seller', async () => {
    const msg = jsd.jsd.MessageComposer.fromPartial.eval({
      creator: address,
      index: contractIndex,
      fnName: "setSellerAddress",
      arg: JSON.stringify({address: sellerAddress}),
    });

    const result = await signingClient.signAndBroadcast(address, [msg], fee);
    assertIsDeliverTxSuccess(result);

    const response = jsd.jsd.MsgEvalResponse.fromProtoMsg(result.msgResponses[0]);
    expect(JSON.parse(response.result)).toEqual(sellerAddress);
  });

  it('deposit', async () => {
    const msg = jsd.jsd.MessageComposer.fromPartial.eval({
      creator: buyerAddress,
      index: contractIndex,
      fnName: "deposit",
      arg: JSON.stringify({amount: 1}),
    });

    const result = await buyerSigningClient.signAndBroadcast(buyerAddress, [msg], fee);
    assertIsDeliverTxSuccess(result);

    const response = jsd.jsd.MsgEvalResponse.fromProtoMsg(result.msgResponses[0]);
    expect(JSON.parse(response.result)).toEqual(1);
  });

  it('release', async () => {
    const msg = jsd.jsd.MessageComposer.fromPartial.eval({
      creator: sellerAddress,
      index: contractIndex,
      fnName: "release",
      arg: "",
    });

    const result = await sellerSigningClient.signAndBroadcast(sellerAddress, [msg], fee);
    assertIsDeliverTxSuccess(result);

    const response = jsd.jsd.MsgEvalResponse.fromProtoMsg(result.msgResponses[0]);
  });
});