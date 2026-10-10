# KaloriKu 2.12.8 — atomic photo intake

- A meal photo and all linked consumption records now commit in one IndexedDB transaction, including synchronization deletion states and a single data-revision increment. A failed component write rolls back every record and leaves the draft intact for retry.
- Photo-linked edits commit the photo component and consumption record together. Existing-record guards reject stale edits rather than overwriting another committed change.
- Saving/editing ignores concurrent submits, disables controls during persistence, and blocks cancellation while a write is pending. Failure re-enables controls and preserves input.
- Photo amounts retain their exact positive ratio, including fractional grams. Gram input and stored/displayed gram labels no longer round small values to whole grams or raise them to 0.01 portions.
- Eight photo regression scenarios cover rollback, unchanged revision/memory, retry, double submit, precise quantities, stale edit rejection, and cancellation during persistence.
- Runtime/cache version: 2.12.8. Existing inconsistent photo records are not rewritten automatically.

Validation: npm test and npm run audit. Browser hardware, camera, cache and native IndexedDB still require Chrome device verification.
