/** Validated guest-draft boundary over the generated API contract and existing CSRF transport. */
import { z } from "zod";
import {
  onboardingGuestCvClaimCreate,
  onboardingGuestCvCreate,
  onboardingGuestCvDestroy,
  onboardingGuestCvEmailCodeCreate,
  onboardingGuestCvRetrieve,
  onboardingGuestCvVerifyEmailCreate,
} from "./generated/endpoints/guest-onboarding/guest-onboarding";

const draftSchema = z.object({
  status: z.enum(["queued", "processing", "ready", "failed", "claimed"]),
  expires_at: z.string(),
  identity: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    verified: z.literal(false).optional(),
  }),
  email_verified: z.boolean(),
  claimed: z.boolean(),
});
export type GuestDraft = z.infer<typeof draftSchema>;
export const getGuestDraft = async () => draftSchema.parse(await onboardingGuestCvRetrieve());
export const deleteGuestDraft = onboardingGuestCvDestroy;
export const uploadGuestDraft = async (file: File) =>
  draftSchema.parse(await onboardingGuestCvCreate({ file }));
export const sendGuestCode = (email: string, locale: string) =>
  onboardingGuestCvEmailCodeCreate({
    email,
    locale: z.enum(["ar", "fr", "en", "es"]).parse(locale),
  });
export const verifyGuestCode = (code: string) => onboardingGuestCvVerifyEmailCreate({ code });
export const claimGuestDraft = () => onboardingGuestCvClaimCreate();
