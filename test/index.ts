import { Noir } from "@noir-lang/noir_js";
import { ethers } from "ethers";
import hre from "hardhat";
import circuit from "../circuits/target/noirstarter.json";
import { UltraVerifier } from "../typechain-types/index.js";
import artifacts from "../artifacts/circuits/contract/noirstarter/plonk_vk.sol/UltraVerifier.json";
import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";
import { expect } from "chai";


const credData = {
  "sign": {
    "v": [
      "0x0000000000000000000000000000000003482f78d9c7172627187ca6b4543194",
      "0x00000000000000000000000000000000d86fe568ce566def1403ae722377db0e",
      "0x0000000000000000000000000000000060b98540c3279bd4c13f8c17ac7fb1fb",
      "0x00000000000000000000000000000000f6b55f22bc50d403291fe46bdffc1fd8"
    ]
  },
  "cred": {
    "isr_id_t": 1,
    "isr_id_k": {
      "v": [
        "0x00000000000000000000000000000000695dad8d0d6ca804ffad3c1809c32bcf",
        "0x0000000000000000000000000000000031b3cef11e1618f28df7af6716a42bea",
        "0x00000000000000000000000000000000a18e3aee6fec3afd219bb6853a834b72",
        "0x00000000000000000000000000000000f234335a17c6519c7e0eaca9f29c0a97"
      ]
    },
    "sch": 2,
    "isd": 1696790497147,
    "exd": 0,
    "sbj_id_t": 2,
    "sbj_id_k": "0x0000000000000000000000009ebd816fa99ce2101091203abd135fd08ce7c8ab",
    "sbj_bd": 3158350217000,
    "sbj_cc": 840,
    "sbj_doc_id": {
      "v": [
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x000000000000000000000000000000000000000000000000493132333132334b"
      ]
    },
    "sbj_doc_t": 1
  }
};

describe("It compiles noir program code, receiving circuit bytes and abi object.", () => {
  let noir: Noir;
  let correctProof: Uint8Array;
  let verifyContract: UltraVerifier;

  before(async () => {
    const verifierContract = await hre.ethers.deployContract("UltraVerifier");

    verifyContract = await verifierContract.deployed() as UltraVerifier;
    console.log(`Verifier deployed to ${verifyContract.address}`);

    const backend = new BarretenbergBackend(circuit);
    noir = new Noir(circuit, backend);
  });

  it("simple", () =>{
    const date = new Date("1900-01-01T00:00:00.000Z");
    console.log(-date.getTime());
  });

});
