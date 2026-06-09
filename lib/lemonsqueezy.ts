// Stub — implemented in Phase 2
export async function createCheckoutUrl(
  _userId: string,
  _email: string,
  _fullName: string
): Promise<string> {
  throw new Error('Not implemented')
}

export async function getCustomerPortalUrl(
  _lsCustomerId: string
): Promise<string> {
  throw new Error('Not implemented')
}

export function verifyWebhookSignature(
  _rawBody: string,
  _signature: string
): boolean {
  return false
}
