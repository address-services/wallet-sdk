import { expect } from 'chai';
import { sendAllBTC, sendBTC } from '../../src/tx-helpers';
import { AddressType, UnspentOutput } from '../../src/types';
import { LocalWallet } from '../../src/wallet';
import { printPsbt } from '../utils';

let dummyUtxoIndex = 0;

/**
 * generate dummy utxos
 */
export function genDummyUtxos(wallet: LocalWallet, satoshisArray: number[]) {
  return satoshisArray.map((v, index) => genDummyUtxo(wallet, satoshisArray[index]));
}

/**
 * generate a dummy utxo
 */
export function genDummyUtxo(wallet: LocalWallet, satoshis: number, txid?: string, vout?: number): UnspentOutput {
  return {
    txid: txid || '0000000000000000000000000000000000000000000000000000000000000000',
    voutIndex: vout !== undefined ? vout : dummyUtxoIndex++,
    satoshis: satoshis,
    scriptPkHex: wallet.scriptPk,
    addressType: wallet.addressType,
    pubkey: wallet.pubkey
  };
}

/**
 * For P2PKH, the signature length is not fixed, so we need to handle it specially
 */
export function expectFeeRate(addressType: AddressType, feeRateA: number, feeRateB: number) {
  if (addressType === AddressType.P2PKH) {
    expect(feeRateA).lt(feeRateB * 1.01);
    expect(feeRateA).gt(feeRateB * 0.99);
  } else {
    expect(feeRateA).eq(feeRateB);
  }
}

/**
 * create a dummy send btc psbt for test
 */
export async function dummySendBTC({
  wallet,
  btcUtxos,
  tos,
  feeRate,
  dump,
  enableRBF,
  memo
}: {
  wallet: LocalWallet;
  btcUtxos: UnspentOutput[];
  tos: { address: string; satoshis: number }[];
  feeRate: number;
  dump?: boolean;
  enableRBF?: boolean;
  memo?: string;
}) {
  const { psbt, toSignInputs } = await sendBTC({
    btcUtxos,
    tos,
    networkType: wallet.networkType,
    changeAddress: wallet.address,
    feeRate,
    enableRBF,
    memo
  });

  await wallet.signPsbt(psbt, { autoFinalized: true, toSignInputs });
  const tx = psbt.extractTransaction(true);
  const txid = tx.getId();
  const inputCount = psbt.txInputs.length;
  const outputCount = psbt.txOutputs.length;
  const fee = psbt.getFee();
  const virtualSize = tx.virtualSize();
  const finalFeeRate = parseFloat((fee / virtualSize).toFixed(1));
  if (dump) {
    printPsbt(psbt);
  }
  return { psbt, txid, inputCount, outputCount, feeRate: finalFeeRate };
}

/**
 * create a dummy send all btc psbt for test
 */
export async function dummySendAllBTC({
  wallet,
  btcUtxos,
  toAddress,
  feeRate,
  dump,
  enableRBF
}: {
  wallet: LocalWallet;
  btcUtxos: UnspentOutput[];
  toAddress: string;
  feeRate: number;
  dump?: boolean;
  enableRBF?: boolean;
}) {
  const { psbt, toSignInputs } = await sendAllBTC({
    btcUtxos,
    toAddress,
    feeRate,
    enableRBF,
    networkType: wallet.networkType
  });
  await wallet.signPsbt(psbt, { autoFinalized: true, toSignInputs });

  const inputCount = psbt.txInputs.length;
  const outputCount = psbt.txOutputs.length;
  if (dump) {
    printPsbt(psbt);
  }

  const fee = psbt.getFee();
  const tx = psbt.extractTransaction(true);
  const virtualSize = tx.virtualSize();
  const txid = tx.getId();
  const finalFeeRate = parseFloat((fee / virtualSize).toFixed(1));
  return { psbt, txid, inputCount, outputCount, feeRate: finalFeeRate };
}
