import type { DocumentMeta, Envelope, Recipient } from '@prisma/client';
import { DocumentDistributionMethod, DocumentSource, EnvelopeType, RecipientRole } from '@prisma/client';

import { extractDocumentAuthMethods } from '../../utils/document-auth';

type PhoneSigningEnvelope = Pick<Envelope, 'type' | 'source' | 'templateId' | 'signatureLevel' | 'authOptions'> & {
  documentMeta: Pick<DocumentMeta, 'distributionMethod' | 'allowDictateNextSigner'> | null;
};

type PhoneSigningRecipient = Pick<Recipient, 'identityType' | 'phone' | 'email' | 'name' | 'role' | 'authOptions'>;

const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Single source of truth for whether a recipient may complete via the
 * phone-signing flow (no OTP/SMS, no auth, Documenso-only restrictions).
 *
 * Request-level concerns such as `recipientOverride` and `dictatedNextSigner`
 * remain the responsibility of the completion service.
 */
export const isPhoneSigningAllowedForRecipient = ({
  envelope,
  recipient,
}: {
  envelope: PhoneSigningEnvelope;
  recipient: PhoneSigningRecipient;
}): boolean => {
  if (process.env.REYLO_PHONE_SIGNING_ENABLED !== 'true') {
    return false;
  }

  if (recipient.identityType !== 'PHONE') {
    return false;
  }

  if (recipient.email.trim() !== '') {
    return false;
  }

  if (!recipient.phone || !E164_PHONE_REGEX.test(recipient.phone)) {
    return false;
  }

  if (!recipient.name.trim()) {
    return false;
  }

  if (recipient.role !== RecipientRole.SIGNER) {
    return false;
  }

  if (envelope.type !== EnvelopeType.DOCUMENT) {
    return false;
  }

  if (envelope.source !== DocumentSource.DOCUMENT) {
    return false;
  }

  if (envelope.templateId !== null) {
    return false;
  }

  if (envelope.signatureLevel !== 'SES') {
    return false;
  }

  if (envelope.documentMeta?.distributionMethod !== DocumentDistributionMethod.NONE) {
    return false;
  }

  if (envelope.documentMeta?.allowDictateNextSigner) {
    return false;
  }

  const { documentAuthOption, recipientAuthOption } = extractDocumentAuthMethods({
    documentAuth: envelope.authOptions,
    recipientAuth: recipient.authOptions,
  });

  return (
    documentAuthOption.globalAccessAuth.length === 0 &&
    documentAuthOption.globalActionAuth.length === 0 &&
    recipientAuthOption.accessAuth.length === 0 &&
    recipientAuthOption.actionAuth.length === 0
  );
};
