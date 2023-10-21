import { Noir } from '@noir-lang/noir_js';
import hre from 'hardhat';
import circuit from '../circuits/target/noirstarter.json';
import { UltraVerifier } from '../typechain-types/index.js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';

describe('It compiles noir program code, receiving circuit bytes and abi object.', () => {
  let noir: Noir;
  let correctProof: Uint8Array;
  let verifyContract: UltraVerifier;

  before(async () => {
    const verifierContract = await hre.ethers.deployContract('UltraVerifier');

    verifyContract = await verifierContract.deployed() as UltraVerifier;
    console.log(`Verifier deployed to ${verifyContract.address}`);

    const backend = new BarretenbergBackend(circuit);
    noir = new Noir(circuit, backend);
  });

  it('simple', () => {
    const date = new Date('1900-01-01T00:00:00.000Z');
    console.log(-date.getTime());
  });

});
