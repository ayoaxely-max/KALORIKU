# KaloriKu 2.12.3 — safe intake and manual label saving

- Adding food ignores overlapping actions and disables add buttons while the IndexedDB transaction is pending. Write failures show an error and leave consumption records unchanged; retry remains available.
- Manual products require explicit nonnegative energy, protein, carbohydrate, and fat. Blank macro fields are no longer converted to zero. The form explains when an explicit zero is appropriate.
- Manual saving disables form controls and ignores concurrent submits. Failed writes preserve inputs and re-enable the form. The close button is a non-submit action.
- Quick entry respects failed writes and keeps its input instead of announcing that all items were saved. Concurrent quick-entry submissions are ignored; partial completion is reported.
- EAN-8/EAN-13, UPC-A/UPC-E, and GTIN-14 use checksum validation. Leading zeros are preserved. Scanner-reported Code 128/39 remain separate from retail checksum rules, including label fallback. Numeric manual input retains the existing 8–14 digit limit; 9–11 digit non-retail values are not assigned a GS1 checksum.
- Runtime query versions and the service-worker cache move to 2.12.3. Existing stored entries are not rewritten; previous duplicates or incorrect zero macros need user review.

## Validation

`npm test`: 26 unit tests, existing DOM + IndexedDB integration, and 34 additional safety/regression scenarios. The additional harness is part of the normal test command and exits unsuccessfully if any scenario fails. API, camera, service worker, and write failures use deterministic mocks. The barcode timeout is exercised at its real 15-second duration.

`npm run audit`: no structural catalog errors; existing catalog/source warnings remain.

Chrome Android camera, real browser storage/cache behavior, and installed-PWA update flow still require device verification. DOM tests are not a substitute for physical-device tests.

## Fixture correction

Earlier test-plan EAN examples `8991234567899` and `8999876543210` had incorrect check digits. Their valid forms are `8991234567891` and `8999876543211`. Existing integration fixtures with arbitrary final digits now use distinct valid EAN values. This correction does not change real product records.
