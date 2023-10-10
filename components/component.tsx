import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Noir } from "@noir-lang/noir_js";
import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";
import circuit from "../circuits/target/noirstarter.json";
import { getZkCred } from "../service/get-zk-cred";

type GetZkCredType = Awaited<ReturnType<typeof getZkCred>>

function Component() {
  const [proof, setProof] = useState(Uint8Array.from([]));
  const [noir, setNoir] = useState<Noir | null>(null);
  const [backend, setBackend] = useState<BarretenbergBackend | null>(null);
  const [credData, setCredData] = useState<GetZkCredType | null>();


  // Calculates proof
  const calculateProof = async () => {
    const calc = new Promise(async (resolve, reject) => {
      const proof = await noir!.generateFinalProof(credData!.toZkpInput());
      console.log("Proof created: ", proof);
      setProof(proof);
      resolve(proof);
    });
    toast.promise(calc, {
      pending: "Calculating proof...",
      success: "Proof calculated!",
      error: "Error calculating proof",
    });
  };

  const verifyProof = async () => {
    const verifyOffChain = new Promise(async (resolve, reject) => {
      if (proof) {
        const verification = await noir!.verifyFinalProof(proof);
        console.log("Proof verified: ", verification);
        resolve(verification);
      }
    });

    // const verifyOnChain = new Promise(async (resolve, reject) => {
    //   if (!proof) return reject(new Error('No proof'));
    //   if (!window.ethereum) return reject(new Error('No ethereum provider'));
    //   try {
    //     const ethers = new Ethers();
    //
    //     const publicInputs = proof.slice(0, 32);
    //     const slicedProof = proof.slice(32);
    //
    //     const verification = await ethers.contract.verify(slicedProof, [publicInputs]);
    //     resolve(verification);
    //   } catch (err) {
    //     console.log(err);
    //     reject(new Error("Couldn't verify proof on-chain"));
    //   }
    // });

    toast.promise(verifyOffChain, {
      pending: "Verifying proof off-chain...",
      success: "Proof verified off-chain!",
      error: "Error verifying proof",
    });

    // toast.promise(verifyOnChain, {
    //   pending: 'Verifying proof on-chain...',
    //   success: 'Proof verified on-chain!',
    //   error: {
    //     render({ data }: any) {
    //       return `Error: ${data.message}`;
    //     },
    //   },
    // });
  };

  // Verifier the proof if there's one in state
  useEffect(() => {
    if (proof.length > 0) {
      verifyProof();

      return () => {
        // TODO: Backend should be destroyed by Noir JS so we don't have to
        // store backend in state
        backend!.destroy();
      };
    }
  }, [proof]);

  const initNoir = async () => {
    const backend = new BarretenbergBackend(circuit);
    setBackend(backend);
    const noir = new Noir(circuit, backend);
    await toast.promise(noir.init(), {
      pending: "Initializing Noir...",
      success: "Noir initialized!",
      error: "Error initializing Noir",
    });
    setNoir(noir);
  };

  useEffect(() => {
    initNoir();
    (async () => setCredData(await getZkCred()))();
  }, []);

  return (
    <div className="container">
      <h1>Example starter</h1>
      <h2>This circuit checks that x and y are different</h2>
      <p>Try it!</p>
      <input name="x" type={"number"}/>
      <input name="y" type={"number"}/>
      <button onClick={calculateProof}>Calculate proof</button>
    </div>
  );
}

export default Component;
