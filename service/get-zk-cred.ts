import { type PassportCred, Preparator, type TransCredSchema } from "@sybil-center/zkc-core";
import { secp256k1 } from "@noble/curves/secp256k1";
import { ethers } from "ethers";
import { sha256 } from "@noble/hashes/sha256";

const FROM_1900_TO_1970_MS = -(new Date("1900-01-01T00:00:00").getTime());
const issuerPrivateKey = new Uint8Array(Buffer.from("c7c2e7d5584bb3be90fa7f3767ecdb6c62d9486baa9be385c93b82e165fadd5f", "hex"));
const issuerPublicKey = secp256k1.getPublicKey(issuerPrivateKey, false).slice(1, 65);

const subjectWallet = new ethers.Wallet("d35fa997e5632d27aad9fc211ee517d424b3fda177f0505f0fcf96bf43a735b2");

export async function getZkCred() {
  const subjectAddress = await subjectWallet.getAddress();

  const zkCred: PassportCred = {
    isr: {
      id: {
        // @ts-ignore
        t: 1, // secp256k1 public key
        k: Buffer.from(issuerPublicKey).toString("hex"),
      }
    },
    sch: 2,
    isd: 1696790497147,
    exd: 0,
    sbj: {
      id: {
        // @ts-ignore
        t: 2, // ethereum address
        k: subjectAddress.replace("0x", "").toLowerCase()
      },
      bd: FROM_1900_TO_1970_MS + new Date(2000, 1, 1).getTime(),
      cc: 840,
      doc: {
        t: 1,
        id: "I123123K"
      }
    }
  };

  const transSchema: TransCredSchema = {
    isr: {
      id: {
        t: ["uint16-bytes"],
        k: ["hex-bytes"], // secp256k1 public key length is 64 bytes
      }
    },
    sch: ["uint16-bytes"],
    isd: ["uint64-bytes"],
    exd: ["uint64-bytes"],
    sbj: {
      id: {
        t: ["uint16-bytes"],
        k: ["hex-bytes"] // ethereum address length is 20 bytes
      },
      bd: ["uint64-bytes"],
      cc: ["uint16-bytes"],
      doc: {
        t: ["uint16-bytes"],
        id: ["utf8-bytes", "bytes-uint256", "uint256-bytes"]
      }
    }
  };
  const preparator = new Preparator();
  const prepared = preparator.prepare<number[]>(zkCred, transSchema);
  const msgHash = sha256(new Uint8Array(prepared));
  const signature = (await secp256k1.sign(msgHash, issuerPrivateKey)).toCompactRawBytes();

  return {
    zkCred,
    signature,
    prepared,
    toZkpInput: () => {
      const slicer = new ArraySlicer(prepared);
      return {
        signature: [...signature],
        cred: {
          isr_id_t: slicer.slice(2),
          isr_id_k_x: slicer.slice(32),
          isr_id_k_y: slicer.slice(32),
          sch: slicer.slice(2),
          isd: slicer.slice(8),
          exd: slicer.slice(8),
          sbj_id_t: slicer.slice(2),
          sbj_id_k: slicer.slice(20),
          sbj_bd: slicer.slice(8),
          sbj_cc: slicer.slice(2),
          sbj_doc_id: slicer.slice(32),
          sbj_doc_t: slicer.slice(2)
        }
      };
    }
  };
}

class ArraySlicer {
  private carriage = 0;
  constructor(private readonly bytes: Uint8Array | number[]) {}

  slice(to: number) {
    const result: number[] = [];
    if (this.carriage >= this.bytes.length) throw new Error(`ByteSlicer carriage is not in array range`);
    for (let i = 0; i < to; i++) {
      result[i] = this.bytes[this.carriage];
      this.carriage++;
    }
    return result;
  }
}