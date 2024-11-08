// import ecc from "@bitcoinerlab/secp256k1";
import BIP32Factory from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);
export { ECPairInterface } from 'ecpair';
export { ECPair, bitcoin, ecc, bip32 };
