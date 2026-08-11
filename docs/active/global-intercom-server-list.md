# Global Intercom Server List

## Objective

Show the connected Global Intercom servers and their current `#global` player
count beside the live chat.

## Ownership and compatibility

- The frontend consumes the optional `serverPresence` relay event only.
- Unknown or malformed presence frames are ignored, so older relays keep the
  existing chat experience.

## Risks and rollback

The list is an ephemeral display. A relay reconnect clears stale entries; no
browser persistence or backend contract is involved.

## Validation

- [ ] Parse and retain valid relay presence updates in the chat context.
- [ ] Render the responsive chat-side server list with DE/EN text.
- [ ] Run frontend tests, lint, build, and publish an RC Docker image.
