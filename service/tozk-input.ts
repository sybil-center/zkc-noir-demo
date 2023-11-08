import { ethers } from 'ethers';
import { AttributeSchema, PassportCred, Preparator, SignSchema, SybilPreparator } from '@sybil-center/zkc-core';
import * as u8a from 'uint8arrays';

const signSchema: SignSchema = {
  isr: {
    id: {
      t: ['uint16'],
      k: ['hex-bytes', 'bytes-uint'],
    },
  },
  sign: ['hex'],
};

const attrSchema: AttributeSchema = {
  sch: ['uint16'],
  isd: ['uint64'],
  exd: ['uint64'],
  sbj: {
    id: {
      t: ['uint16'],
      k: ['hex-bytes', 'bytes-uint'],
    },
    fn: [
      'utf8-bytes',
      'bytes-uint',
      'mod.uint128',
    ],
    ln: [
      'utf8-bytes',
      'bytes-uint',
      'mod.uint128',
    ],
    bd: ['uint64'],
    cc: ['uint16'],
    doc: {
      t: ['uint16'],
      id: ['utf8-bytes', 'bytes-uint', 'mod.uint256'],
    },
  },
};

const preparator = new Preparator();

export function toZkInput(cred: PassportCred) {
  const preparator = new SybilPreparator();
  const { proof: { signature } } = preparator.selectProof(cred, {
    proof: { type: 'Sha256Secp256k1' },
  });

  const [
    sign,
    isr_id_t,
    isr_id_k,
  ] = preparator.prepareSign<[string, bigint, bigint]>({
    signAttributes: signature,
    signSchema: signSchema,
  });
  const attrPrepared = preparator.prepareAttributes<bigint[]>({
    attributes: cred.attributes,
    attributesSchema: attrSchema,
  });
  const [
    sch,
    isd,
    exd,
    sbj_id_t,
    sbj_id_k,
    sbj_bd,
    sbj_cc,
    sbj_doc_id,
    sbj_doc_t,
    fn,
    ln,
  ] = attrPrepared
  return {
    issuer_id: noir.Uint512.fromNumber(isr_id_k).toZkABI(),
    subject_address: ethers.utils.hexZeroPad(`0x${sbj_id_k.toString(16)}`, 32),
    current_date: new Date().getTime(),
    sign: noir.Uint512.fromHex(sign).toZkABI(),
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
      sbj_doc_t: Number(sbj_doc_t),
      sbj_fn: ethers.utils.hexZeroPad(`0x${fn.toString(16)}`, 32),
      sbj_ln: ethers.utils.hexZeroPad(`0x${ln.toString(16)}`, 32),
    },
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
      target.slice(48, 64),
    ].map((it) => preparator.transform(it, ['bytes-uint']));
  }

  static fromBytes(bytes: Uint8Array | number[]): NoirUint512 {
    return new NoirUint512(bytes);
  }

  static fromNumber(num: number | bigint): NoirUint512 {
    let target: bigint;
    if (typeof num === 'bigint') target = num;
    else target = BigInt(num);
    if (target < 0) throw new Error(`Can't create noir Uint512 from negative number`);
    const bytes = preparator.transform<Uint8Array>(target, ['uint-bytes']);
    return NoirUint512.fromBytes(bytes);
  }

  static fromHex(hex: string): NoirUint512 {
    return NoirUint512.fromBytes(u8a.fromString(hex, 'hex'));
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
    if (typeof num === 'bigint') target = num;
    else target = BigInt(num);
    if (target < 0) throw new Error(`Can't create noir Uint256 from negative number`);
    const bytes = preparator.transform<Uint8Array>(target, ['uint-bytes']);
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
      target.slice(16, 32),
    ].map((it) => preparator.transform(it, ['bytes-uint']));
  }

  toZkABI(): { v: string[] } {
    const value = this.v
      .map((it) => ethers.utils.hexZeroPad(`0x${it.toString(16)}`, 32));
    return { v: value };
  }
}


const noir = {
  Uint512: NoirUint512,
  Uint256: NoirUint256,
};