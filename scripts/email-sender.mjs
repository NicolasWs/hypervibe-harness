// email-sender.mjs - Which sender variables /add-email pushes for a project (3.4.11): only those
// the project lacks. A sender already set (verified by the person, written by the domain's own
// sub-skill, or set by the organisation's administrator) is kept. Until 3.4.11 it was replaced by
// Resend's test address, which only delivers to the account's owner, or by the Brevo sender typed
// during /add-email (review of the lot 8). Read by setup-email.mjs; nothing here reads a file.

/** The sender a provider needs, with the value /add-email would give it: Resend's official test
 *  sender (it works at once, but only towards the account's owner), or the Brevo sender typed. */
function wanted({ provider, brevoSender, brevoSenderName }) {
  return provider === "resend"
    ? [["RESEND_FROM_EMAIL", "onboarding@resend.dev"]]
    : [
        ["BREVO_SENDER_EMAIL", brevoSender],
        ["BREVO_SENDER_NAME", brevoSenderName],
      ];
}

/** {kept, pushed}: the variables already set (kept as they are), and the KEY=value lines to push.
 *  `inPlace` maps a variable to the value the project has now (null or absent: none). */
export function senderPlan({ provider, inPlace = {}, brevoSender = null, brevoSenderName = null }) {
  const list = wanted({ provider, brevoSender, brevoSenderName });
  return {
    kept: list.filter(([key]) => inPlace[key]).map(([key]) => key),
    pushed: list.filter(([key]) => !inPlace[key]).map(([key, value]) => `${key}=${value}`),
  };
}
