function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decodeCreationOptions(options: any): PublicKeyCredentialCreationOptions {
  const publicKey = options.publicKey || options;
  return {
    ...publicKey,
    challenge: base64UrlToUint8Array(publicKey.challenge),
    user: {
      ...publicKey.user,
      id: base64UrlToUint8Array(publicKey.user.id),
    },
    excludeCredentials: (publicKey.excludeCredentials || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cred: any) => ({
        ...cred,
        id: base64UrlToUint8Array(cred.id),
      })
    ),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decodeRequestOptions(options: any): PublicKeyCredentialRequestOptions {
  const publicKey = options.publicKey || options;
  return {
    ...publicKey,
    challenge: base64UrlToUint8Array(publicKey.challenge),
    allowCredentials: (publicKey.allowCredentials || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cred: any) => ({
        ...cred,
        id: base64UrlToUint8Array(cred.id),
      })
    ),
  };
}

export function serializeCreationCredential(credential: PublicKeyCredential) {
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: uint8ArrayToBase64Url(new Uint8Array(credential.rawId)),
    type: credential.type,
    response: {
      attestationObject: uint8ArrayToBase64Url(
        new Uint8Array(response.attestationObject)
      ),
      clientDataJSON: uint8ArrayToBase64Url(
        new Uint8Array(response.clientDataJSON)
      ),
    },
  };
}

export function serializeAssertionCredential(credential: PublicKeyCredential) {
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: uint8ArrayToBase64Url(new Uint8Array(credential.rawId)),
    type: credential.type,
    response: {
      authenticatorData: uint8ArrayToBase64Url(
        new Uint8Array(response.authenticatorData)
      ),
      clientDataJSON: uint8ArrayToBase64Url(
        new Uint8Array(response.clientDataJSON)
      ),
      signature: uint8ArrayToBase64Url(
        new Uint8Array(response.signature)
      ),
      ...(response.userHandle
        ? {
            userHandle: uint8ArrayToBase64Url(
              new Uint8Array(response.userHandle)
            ),
          }
        : {}),
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractChallenge(options: any): string {
  const publicKey = options.publicKey || options;
  return publicKey.challenge as string;
}
