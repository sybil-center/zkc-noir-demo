import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import circuit from '../circuits/target/noirstarter.json';
import { PassportCred, Proved, ZkSybil } from '@sybil-center/zkc-core';
import { EthWalletProvider, IEIP1193Provider } from '../service/wallet-provider';
import { toZkInput } from '../service/tozk-input';
import styles from '../styles/Home.module.css';
import { CredModal } from './cred-modal';


const sybil = new ZkSybil(new URL('https://api.dev.sybil.center'));

function Component() {
  const [hasWallet, setHasWallet] = useState(false);
  const [proof, setProof] = useState(Uint8Array.from([]));
  const [proofVerified, setProofVerified] = useState(false);
  const [noir, setNoir] = useState<Noir | null>(null);
  const [backend, setBackend] = useState<BarretenbergBackend | null>(null);
  const [zkCred, setZkCred] = useState<Proved<PassportCred> | null>(null);
  const [walletProvider, setWalletProvider] = useState<EthWalletProvider | null>(null);
  const [address, setAddress] = useState('');
  const [openModal, setOpenModal] = useState(false);

  const calculateProof = async () => {
    const calc = new Promise(async (resolve, reject) => {
      console.log(JSON.stringify(zkCred, null, 2));
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
      setAddress(await walletProvider.getAddress());
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

  async function verifyProof() {
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
  }

  async function initNoir() {
    const backend = new BarretenbergBackend(circuit);
    setBackend(backend);
    const noir = new Noir(circuit, backend);
    await toast.promise(noir.init(), {
      pending: 'Initializing Noir...',
      success: 'Noir initialized!',
      error: 'Error initializing Noir',
    });
    setNoir(noir);
  }

  function showCredModal() {
    setOpenModal(true);

  }

  useEffect(() => {
    if ('ethereum' in window) setHasWallet(true);
    initNoir();
    return () => {
      backend?.destroy();
    };
  }, []);

  const walletComponent = () => {
    if (!hasWallet) return (
      <div className={styles.card}>
        Install <a href={'https://metamask.io/download/'}>Metamask</a>
      </div>
    );
    if (!walletProvider) return (
      <button className={styles.card} onClick={connectWallet}>
        Connect wallet
      </button>
    );

  };

  const credComponent = () => {
    if (!address) return (
      <div>
        Connect to Wallet first
      </div>
    );
    if (!zkCred) return (
      <button className={styles.card} onClick={getZkCred}>
        Get Passport ZK-Credential
      </button>
    );
    if (zkCred) return (
      <button className={styles.card} onClick={showCredModal}>
        Show Passport ZK-Credential
      </button>
    );
  };

  const zkProofComponent = () => {
    if (!zkCred) return (<></>);
    if (zkCred && proof.length === 0) return (
      <button className={styles.card} onClick={calculateProof}>
        Calculate proof
      </button>
    );
    if (proof.length > 0 && !proofVerified) return (
      <button className={styles.card} onClick={verifyProof}>
        Prove that you're adult person
      </button>
    );
    if (proofVerified) return (
      <div className={styles.card}>
        You proved that you're adult person
      </div>
    );
    return (<></>);
  };

  return (
    <>
      <CredModal credential={zkCred} isOpen={openModal} setIsOpen={setOpenModal} />
      <div className={styles.container}>
        <div>
          <h1 className={'text-[1.5em] border rounded-md p-3'}>Prove that you're adult person using Zero-Knowledge
            Credential with <a href={'https://noir-lang.org/'} target='_blank' rel='noreferrer'>Noir</a></h1>
          <h1 className={'text-[1.5em] text-center mt-5'}>
            with help <a href={'https://app.sybil.center/'} target='_blank' rel='noreferrer'>Sybil-Center</a></h1>
        </div>
        {walletComponent()}
        <div className={styles.row}>
          {credComponent()}
          {zkProofComponent()}
        </div>
        <div className={styles.row}>
          <a href={"https://github.com/sybil-center/zkc-noir-demo"} target='_blank' rel='noreferrer'>
          <div className={styles.card}>
            Source code
          </div>
          </a>
          <div className={styles.card}>
            Instructional video
          </div>
          <a href={'https://github.com/sybil-center/ZKCIPs'} target='_blank' rel='noreferrer'>
            <div className={styles.card}>
              What is ZK Credentials?
            </div>
          </a>

        </div>
      </div>
    </>
  );
}

export default Component;
