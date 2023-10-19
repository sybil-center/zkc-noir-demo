import { type PassportCred, Preparator, type TransCredSchema } from "@sybil-center/zkc-core";
import { secp256k1 } from "@noble/curves/secp256k1";
import { ethers } from "ethers";
import { sha256 } from "@noble/hashes/sha256";

const preparator = new Preparator();

const FROM_1900_TO_1970_MS = -(new Date("1900-01-01T00:00:00.000Z").getTime());
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

  const zkInputSchema: TransCredSchema = {
    isr: {
      id: {
        t: ["uint16"],
        k: ["hex-bytes", "bytes-uint"]
      },
    },
    sch: ["uint16"],
    isd: ["uint64"],
    exd: ["uint64"],
    sbj: {
      id: {
        t: ["uint16"],
        k: ["hex-bytes", "bytes-uint"]
      },
      bd: ["uint64"],
      cc: ["uint16"],
      doc: {
        t: ["uint16"],
        id: ["utf8-bytes", "bytes-uint256"]
      }
    }
  };
  const prepared = preparator.prepare<number[]>(zkCred, transSchema);
  const msgHash = sha256(new Uint8Array(prepared));
  const signature = (await secp256k1.sign(msgHash, issuerPrivateKey)).toCompactRawBytes();

  return {
    zkCred,
    signature,
    prepared,
    toZkpInput: () => {
      const [
        isr_id_t,
        isr_id_k,
        sch,
        isd,
        exd,
        sbj_id_t,
        sbj_id_k,
        sbj_bd,
        sbj_cc,
        sbj_doc_id,
        sbj_doc_t
      ] = preparator.prepare<bigint[]>(zkCred, zkInputSchema);
      console.log(`sbj_doc_id after preparator`, sbj_doc_id);
      const output = {
        issuer_id: noir.Uint512.fromNumber(isr_id_k).toZkABI(),
        subject_address: ethers.utils.hexZeroPad(`0x${sbj_id_k.toString(16)}`, 32),
        current_date: new Date().getTime(),
        sign: noir.Uint512.fromBytes(signature).toZkABI(),
        cred: {
          isr_id_t: Number(isr_id_t),
          isr_id_k: noir.Uint512.fromNumber(isr_id_k).toZkABI(),
          sch: Number(sch),
          isd: Number(isd),
          exd: Number(exd),
          sbj_id_t: Number(sbj_id_t),
          sbj_id_k: ethers.utils.hexZeroPad(`0x${sbj_id_k.toString(16)}`, 32),
          sbj_bd: Number(sbj_bd),
          sbj_cc: Number(sbj_cc),
          sbj_doc_id: noir.Uint256.fromNumber(sbj_doc_id).toZkABI(),
          sbj_doc_t: Number(sbj_doc_t)
        }
      };
      console.log(JSON.stringify(output, null, 2));
      return output;
    }
  };
}

class NoirUint512 {
  private readonly v: number[];

  private constructor(bytes: Uint8Array | number[]) {
    let target: Uint8Array;
    if (bytes instanceof Uint8Array) target = bytes;
    else target = new Uint8Array(bytes);
    const dif = 64 - target.length;
    if (dif > 0) {
      const zeroes = new Array(dif).fill(0);
      target = new Uint8Array([...zeroes, ...target]);
    } else if (dif < 0) {
      target = target.slice(-dif, target.length);
    }
    this.v = [
      target.slice(0, 16),
      target.slice(16, 32),
      target.slice(32, 48),
      target.slice(48, 64)
    ].map((it) => preparator.transform(it, ["bytes-uint"]));
  }

  static fromBytes(bytes: Uint8Array | number[]): NoirUint512 {
    return new NoirUint512(bytes);
  }

  static fromNumber(num: number | bigint): NoirUint512 {
    let target: bigint;
    if (typeof num === "bigint") target = num;
    else target = BigInt(num);
    if (target < 0) throw new Error(`Can't create noir Uint512 from negative number`);
    const bytes = preparator.transform<Uint8Array>(target, ["uint-bytes"]);
    return NoirUint512.fromBytes(bytes);
  }

  toZkABI(): { v: string[] } {
    const value = this.v
      .map((it) => ethers.utils.hexZeroPad(`0x${it.toString(16)}`, 32));
    return { v: value };
  }
}

class NoirUint256 {
  private readonly v: number[];

  static fromBytes(bytes: Uint8Array | number[]): NoirUint256 {
    return new NoirUint256(bytes);
  }

  static fromNumber(num: number | bigint): NoirUint256 {
    let target: bigint;
    if (typeof num === "bigint") target = num;
    else target = BigInt(num);
    if (target < 0) throw new Error(`Can't create noir Uint256 from negative number`);
    const bytes = preparator.transform<Uint8Array>(target, ["uint-bytes"]);
    return NoirUint256.fromBytes(bytes);
  }

  private constructor(bytes: Uint8Array | number[]) {
    let target: Uint8Array;
    if (bytes instanceof Uint8Array) target = bytes;
    else target = new Uint8Array(bytes);
    const dif = 32 - target.length;
    if (dif > 0) {
      const zeroes = new Array(dif).fill(0);
      target = new Uint8Array([...zeroes, ...target]);
    } else if (dif < 0) {
      target = target.slice(-dif, target.length);
    }
    this.v = [
      target.slice(0, 16),
      target.slice(16, 32)
    ].map((it) => preparator.transform(it, ["bytes-uint"]));
  }

  toZkABI(): { v: string[] } {
    const value = this.v
      .map((it) => ethers.utils.hexZeroPad(`0x${it.toString(16)}`, 32));
    return { v: value };
  }
}


const noir = {
  Uint512: NoirUint512,
  Uint256: NoirUint256
};