import * as u8a from 'uint8arrays';
import { normalizeID, SybilID, SybilWalletProof, WalletProvider } from '@sybil-center/zkc-core';

export interface RequestArguments {
  readonly method: string;
  readonly params?: readonly unknown[] | object;
}

export interface IEIP1193Provider {
  enable?: () => Promise<void>;
  request<T = unknown>(args: RequestArguments): Promise<T>;
}

export class EthWalletProvider implements WalletProvider {
  constructor(private readonly provider: IEIP1193Provider) {
    this.sign = this.sign.bind(this);
    this.getAddress = this.getAddress.bind(this);
    this.getSubjectId = this.getSubjectId.bind(this);
    this.getProof = this.getProof.bind(this);
  }

  async getSubjectId(): Promise<SybilID> {
    const address = await this.getAddress();
    return normalizeID({
      t: 1,
      k: address,
    });
  };

  async getProof(): Promise<SybilWalletProof> {
    const subjectId = await this.getSubjectId();
    return {
      subjectId: subjectId,
      signFn: this.sign,
    };
  };

  async sign(args: { message: string }): Promise<string> {
    const message = args.message;
    const address = await this.getAddress();
    const hex = u8a.toString(u8a.fromString(message), 'hex');
    return await this.#signMessage(address, hex);
  }

  async getAddress(): Promise<string> {
    const accounts = (await this.provider.request<string[]>({
      method: 'eth_accounts',
    }));
    const account = accounts[0];
    if (!account) {
      throw new Error(`Enable Ethereum provider`);
    }
    return account;
  }

  /**
   * Return signature as base64 string
   * @param address - ethereum 0x<address>
   * @param hexMessage - message as hex string
   */
  async #signMessage(address: string, hexMessage: string): Promise<string> {
    try {
      return await this.provider.request<`0x${string}`>({
          method: 'eth_sign',
          params: [address, hexMessage],
        },
      );
    } catch (err) {
      const reason = err as Error;
      if ('code' in reason && (reason.code === -32602 || reason.code === -32601)) {
        return await this.provider.request<`0x${string}`>({
            method: 'personal_sign',
            params: [address, hexMessage],
          },
        );
      }
      throw reason;
    }
  }

  async connect(): Promise<string> {
    return this.provider.request<string>({ method: 'eth_requestAccounts' });
  }
}