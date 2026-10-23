import { ZRecipientAccessAuthTypesSchema, ZRecipientActionAuthTypesSchema } from '@documenso/lib/types/document-auth';
import {
  ZEnvelopeRecipientLiteSchema,
  ZRecipientEmailSchema,
  ZRecipientSigningOrderSchema,
} from '@documenso/lib/types/recipient';
import { IdentityType, RecipientRole } from '@prisma/client';
import { z } from 'zod';

import type { TrpcRouteMeta } from '../../trpc';

export const createEnvelopeRecipientsMeta: TrpcRouteMeta = {
  openapi: {
    method: 'POST',
    path: '/envelope/recipient/create-many',
    summary: 'Create envelope recipients',
    description: 'Create multiple recipients for an envelope',
    tags: ['Envelope Recipients'],
  },
};

export const ZCreateEnvelopeRecipientBaseSchema = z.object({
  email: ZRecipientEmailSchema,
  identityType: z.nativeEnum(IdentityType).default(IdentityType.EMAIL),
  phone: z.string().trim().max(32).optional(),
  name: z.string().max(255),
  role: z.nativeEnum(RecipientRole),
  signingOrder: ZRecipientSigningOrderSchema.optional(),
  accessAuth: z.array(ZRecipientAccessAuthTypesSchema).default([]).optional(),
  actionAuth: z.array(ZRecipientActionAuthTypesSchema).default([]).optional(),
});

export type TCreateEnvelopeRecipientInput = z.infer<typeof ZCreateEnvelopeRecipientBaseSchema>;

/**
 * Validation shared by create-envelope (which extends the recipient with
 * fields) and create-many.
 */
export const refineCreateEnvelopeRecipient = (recipient: TCreateEnvelopeRecipientInput, ctx: z.RefinementCtx) => {
  if (recipient.identityType !== IdentityType.PHONE) {
    return;
  }

  if (recipient.email !== '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['email'],
      message: 'Phone recipients must not have an email',
    });
  }

  if (!recipient.phone || !/^\+[1-9]\d{1,14}$/.test(recipient.phone)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['phone'],
      message: 'A valid E.164 phone number is required',
    });
  }

  if (!recipient.name.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['name'],
      message: 'A name is required for phone recipients',
    });
  }

  if (recipient.role !== RecipientRole.SIGNER) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['role'],
      message: 'Phone recipients must be signers',
    });
  }

  if ((recipient.accessAuth?.length ?? 0) > 0 || (recipient.actionAuth?.length ?? 0) > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['accessAuth'],
      message: 'Phone recipients cannot require authentication',
    });
  }
};

export const ZCreateEnvelopeRecipientSchema =
  ZCreateEnvelopeRecipientBaseSchema.superRefine(refineCreateEnvelopeRecipient);

export const ZCreateEnvelopeRecipientsRequestSchema = z.object({
  envelopeId: z.string(),
  data: ZCreateEnvelopeRecipientSchema.array(),
});

export const ZCreateEnvelopeRecipientsResponseSchema = z.object({
  data: ZEnvelopeRecipientLiteSchema.array(),
});

export type TCreateEnvelopeRecipientsRequest = z.infer<typeof ZCreateEnvelopeRecipientsRequestSchema>;
export type TCreateEnvelopeRecipientsResponse = z.infer<typeof ZCreateEnvelopeRecipientsResponseSchema>;
