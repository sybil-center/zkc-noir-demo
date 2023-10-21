import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import circuit from '../circuits/target/noirstarter.json';
import { PassportCred, Proved, ZkSybil } from '@sybil-center/zkc-core';
import { EthWalletProvider, IEIP1193Provider } from '../service/wallet-provider';
import { toZkInput } from '../service/tozk-input';


const sybil = new ZkSybil(new URL('https://api.dev.sybil.center'));

function Component() {
  const [proof, setProof] = useState(Uint8Array.from([]));
  const [proofVerified, setProofVerified] = useState(false);
  const [noir, setNoir] = useState<Noir | null>(null);
  const [backend, setBackend] = useState<BarretenbergBackend | null>(null);
  const [zkCred, setZkCred] = useState<Proved<PassportCred> | null>(null);
  const [walletProvider, setWalletProvider] = useState<EthWalletProvider | null>(null);

  const calculateProof = async () => {
    const calc = new Promise(async (resolve, reject) => {
      const proof = await noir!.generateFinalProof(toZkInput(zkCred!));
      console.log('Proof created: ', proof);
      setProof(proof);
      resolve(proof);
    });
    toast.promise(calc, {
      pending: 'Calculating proof...',
      success: 'Proof calculated!',
      error: 'Error calculating proof',
    });
  };

  function connectWallet() {
    toast.promise(new Promise(async (resolve, reject) => {
      const injected = 'ethereum' in window && (window.ethereum as IEIP1193Provider);
      if (!injected) throw new Error(`No window.ethereum available`);
      const walletProvider = new EthWalletProvider(injected);
      await walletProvider.connect();
      setWalletProvider(walletProvider);
      resolve(walletProvider);
    }), {
      pending: 'Wallet connecting...',
      success: 'Connected',
      error: 'Wallet connection failed',
    });
  }

  async function getZkCred() {
    if (!walletProvider) throw new Error(`Connect wallet first`);
    toast.promise(new Promise(async (resolve) => {
      const cred = await sybil.credential('passport', await walletProvider.getProof(), {});
      setZkCred(cred);
      resolve(cred);
    }), {
      pending: 'Getting ZK credential ...',
      success: 'You got Credential',
      error: 'Getting credential fail',
    });
  }

  const verifyProof = async () => {
    const verifyOffChain = new Promise(async (resolve) => {
      if (proof) {
        const verification = await noir!.verifyFinalProof(proof);
        console.log('Proof verified: ', verification);
        setProofVerified(true);
        resolve(verification);
      }
    });

    toast.promise(verifyOffChain, {
      pending: 'Verifying proof off-chain...',
      success: 'Proof verified off-chain!',
      error: 'Error verifying proof',
    });
  };

  const initNoir = async () => {
    const backend = new BarretenbergBackend(circuit);
    setBackend(backend);
    const noir = new Noir(circuit, backend);
    await toast.promise(noir.init(), {
      pending: 'Initializing Noir...',
      success: 'Noir initialized!',
      error: 'Error initializing Noir',
    });
    setNoir(noir);
  };

  useEffect(() => {
    initNoir();
    return () => {
      // TODO: Backend should be destroyed by Noir JS so we don't have to
      // store backend in state
      backend?.destroy();
    };
  }, []);

  return (
    <div className='container'>
      <h1>Example starter</h1>
      <button onClick={connectWallet}>Connect wallet</button>
      <button onClick={getZkCred}>Get ZK cred</button>
      <button onClick={calculateProof}>Calculate proof</button>
      <button onClick={verifyProof}>Verify proof</button>
    </div>
  );
}

export default Component;
