---
name: cs-support-handoff
description: Prepare a clear Laurel Support handoff from a CSM's customer emails, meeting notes, or Slack context. Use when the CSM wants to loop in Support, turn notes into a support request, or decide how to route a customer issue. Produces a ready-to-send draft with the specific ask and follow-up contact.
---

# CSM Support handoff

Help a Laurel CSM get a customer issue to the right place with enough context to act. Default to a concise draft. Respect the CSM's choice to involve Support, including during onsite visits, travel, or busy weeks. Research and a complete template are not prerequisites for asking Support to help.

## Use the current guidance

When connected sources are available, read the [Working with Support guide](https://app.notion.com/p/40280a6931918101aedcc229ad355f65) for current expectations. Follow its linked product instructions when needed. Read the [CSM bug-reporting guide](https://app.notion.com/p/38a80a69319181719a6efa20e324cfae) for direct bug filing, and [How to declare an incident](https://app.notion.com/p/2f680a69319181e784d5eeadaec5f0ea) for suspected incidents.

Use available context and the defaults below if sources are inaccessible. State any material uncertainty; do not invent a source, ticket, contact, diagnosis, or completed action. Do not copy a permanent team-routing table into the output from memory.

## Understand the request

- Identify the firm, affected user email, actual and expected behavior, relevant dates and time zone, evidence, checks already tried, and customer impact. Use only supplied or verified facts.
- Pull the specific request out of a long email chain or meeting notes. Separate distinct asks into short numbered items. Follow the CSM's selection of which items to hand off; keep unrelated ideas or an unconfirmed AI observation separate.
- Identify what Support should do and who should receive the follow-up. The affected user and the customer contact may be different people.
- Respect the requested recipients. If the customer is not copied, name the contact and email Support should reach out to. Leave unknown addresses as placeholders rather than guessing. Do not automatically add the customer to an internal handoff.
- Use relevant links already provided. Search for an existing case or issue when useful or requested, but do not delay a requested handoff for an investigation.

## Choose the route

| Situation | Default next step |
| --- | --- |
| CSM wants Support to investigate or manage customer follow-up | Draft an email to support@laurel.ai, or draft the message for in-app Support if requested. Say exactly what Support should investigate and whether it should take over customer communication. |
| CSM wants to file a bug directly | Prepare the details for #report-bug → Bug Reporter using the bug guide. A suspected bug does not need a proven root cause. Link an existing issue when it matches. The CSM owns customer follow-up unless Support accepts a handoff. |
| General product question | Answer from current instructions when possible, or draft a focused #ask-support question with what is known and what remains unclear. Using Dust or Claude first is optional. |
| Additional internal context on an existing case | Draft a reply in the relevant #ask-support thread, including the Intercom link and only the new context or request. |
| Product setup, Implementation work, feature request, or priority advocacy | Use the live guide to identify the team and workflow. For priority advocacy, include the existing Linear link, impact, deadline and specific ask; keep Support informed if it owns the case. |
| Possible outage, failures across customers, data-integrity or security issue | Surface the incident route immediately. Follow the incident guide; a Slack heads-up or routine Support email alone does not start the incident process. Do not wait for #ask-support to respond. |

## Write the handoff

Lead with the ask. Use the following as a checklist, not a form that must be completed before producing a draft. Combine fields when that reads more naturally; show important gaps as missing information.

```text
To: support@laurel.ai
Subject: [Firm]: [specific issue or requested action]

Hi team,

Please [investigate these specific items / take over this issue and customer follow-up].

Firm and affected user email:
What is happening:
What should happen:
When it happened (date, time and time zone):
Examples and checks already tried:
Existing Intercom / Linear link, if any:
Customer impact or deadline:
Please follow up with: [name and email, if the customer is not copied]
```

For a forwarded or CC'd chain, put the summary and explicit ask above the earlier messages. Identify which questions are already resolved so Support knows what remains. Keep any internal-only account context out of a customer-visible draft.

Return the usable draft first, followed by a brief note about essential missing details or a routing uncertainty. Do not turn missing screenshots, a version number, reproduction steps, or unfinished research into a reason to withhold a Support draft.

## Avoid duplicate work

One Support email is usually enough. Do not also draft a #ask-support post by default. Add one when there is useful internal context, an incident signal, or the CSM explicitly requests it. Link the Intercom case when available; otherwise leave the link as pending and do not claim a case exists.

A request for a handoff is not confirmation that Support accepted it. For a directly filed bug, the CSM continues customer follow-up until Support confirms it has taken over.

## Actions and scope

Drafting does not send a message, create a ticket, change customer settings, or authorize a code change. Carry out those actions only when the user requests them, through the relevant workflow. Do not imply that a proposed AI diagnosis or fix has been verified, deployed, or resolved the customer's issue.
