export class TextEncoder {
  encode(input = '') {
    const encoder = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) {
      encoder[i] = input.charCodeAt(i);
    }
    return encoder;
  }

  encodeInto(source: string, destination: Uint8Array) {
    const encoded = this.encode(source);
    destination.set(encoded);
    return { read: source.length, written: encoded.length };
  }

  get encoding() {
    return 'utf-8';
  }
}

export class TextDecoder {
  #encoding: string;
  #fatal: boolean;
  #ignoreBOM: boolean;

  constructor(label = 'utf-8', options?: { fatal?: boolean; ignoreBOM?: boolean }) {
    this.#encoding = label;
    this.#fatal = options?.fatal ?? false;
    this.#ignoreBOM = options?.ignoreBOM ?? false;
  }

  decode(input?: ArrayBuffer | ArrayBufferView): string {
    if (!input) return '';
    const view =
      input instanceof ArrayBuffer ? new Uint8Array(input) : new Uint8Array(input.buffer);
    return String.fromCharCode.apply(null, Array.from(view));
  }

  get encoding() {
    return this.#encoding;
  }
  get fatal() {
    return this.#fatal;
  }
  get ignoreBOM() {
    return this.#ignoreBOM;
  }
}
