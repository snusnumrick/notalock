declare module 'web-encoding' {
  export class TextEncoder {
    constructor();
    encode(input?: string): Uint8Array;
    encodeInto(source: string, destination: Uint8Array): { read: number; written: number };
    get encoding(): string;
  }

  export class TextDecoder {
    constructor(label?: string, options?: { fatal?: boolean; ignoreBOM?: boolean });
    decode(input?: ArrayBuffer | ArrayBufferView, options?: { stream?: boolean }): string;
    get encoding(): string;
    get fatal(): boolean;
    get ignoreBOM(): boolean;
  }
}
