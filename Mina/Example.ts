import { Credential } from '@custom-sdk/credentials';
import credentialProgram from '@custom-sdk/credentialProgram';
import { Operations } from '@custom-sdk/credentialProgram';
import { PrivateKey, PublicKey } from '@custom-sdk';

// Define the VerifyComplexAge program using modular operations from the library
const VerifyComplexAgeProgramConfig = {
  name: 'VerifyComplexAge',
  input: { minAge: 'number', maxAge: 'number' },
  output: { valid: 'boolean' },
  logic: Operations.and([
    Operations.greaterThanOrEqual('credential.age', 'input.minAge'),
    Operations.lessThanOrEqual('credential.age', 'input.maxAge')
  ])
};

// Create the VerifyComplexAge program instance
const VerifyComplexAge = credentialProgram.create(VerifyComplexAgeProgramConfig);

// Generate issuer private and public keys
const issuerPrvKey = PrivateKey.random();
const issuerPubKey = issuerPrvKey.toPublicKey().toBase58(); // Convert to string format for use in the challenge

// Generate subject private and public keys
const subjectPrvKey = PrivateKey.random();
const subjectPubKey = subjectPrvKey.toPublicKey().toBase58(); // Convert to string format for use in the challenge

// Construct a claim about the subject, including a signature by the issuer
const claimsObject = { age: 21, subject: subjectPubKey, signature: issuerPrvKey.sign('age:21') };
const claims = JSON.stringify(claimsObject);

// Construct a credential using the claim
const credential = Credential.create(claims);

// Prove the credential satisfies the challenge using the VerifyComplexAge program
const proofResponse = await credential.prove('age', { minAge: 18, maxAge: 65, issuerPublicKey: issuerPubKey }, VerifyComplexAge);

console.log(proofResponse);

// ==================================================================

interface MinaWallet {
  attestation: AttestationAPI;
}

interface AttestationAPI {
  initialize(config: AttestationConfig): Promise<void>;
}

interface AttestationConfig {
  apiKey: string;
  endpoint: string;
}