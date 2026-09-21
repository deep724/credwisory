# Testimonial security migration and backup plan

## Safety rules

- No existing `Testimonial` document or upload is deleted during deployment.
- Existing `DRAFT` and `PUBLISHED` values remain valid; migration only adds fields and maps no status automatically.
- Any record with an unreadable or unsupported image reference is retained unchanged, marked for manual review, and reported by ID.
- A rollback restores application code first; stored records and private assets remain recoverable until a separately approved retention window ends.

## Pre-deploy backup gate

1. Put the application in maintenance/read-only mode for testimonial submissions.
2. Run `mongodump` against only the `crd` database and verify the archive with `mongorestore --dryRun` in an isolated environment.
3. Export a JSON manifest of every testimonial: `_id`, status, consent, timestamps, photo URL/reference, and content hash. Do not include private contact details in operational logs.
4. Inventory uploads referenced by the manifest. Copy public/local assets to versioned backup storage without deleting their original locations.
5. Record counts and SHA-256 hashes of manifest and backup archive; require an operator to confirm both before enabling migration.

## Migration sequence

1. Deploy additive schema support for private asset metadata and moderation history; do not remove `photoUrl`.
2. Backfill only records whose current asset can be read and copied successfully. Attach the private asset reference alongside the old URL.
3. Keep the previous public `photoUrl` active until the corresponding approved public delivery reference has been verified.
4. For legacy local/public URLs that cannot be copied, retain their original reference and add a manual-review report entry; never delete them automatically.
5. Enable new private temporary uploads only after the migration manifest and sample retrieval checks pass.
6. After an approved retention period, request separate approval before deleting superseded public copies or unreferenced temporary objects.

## Validation and rollback

- Verify a sample of draft, pending, rejected, and published testimonials by ID before and after migration.
- Verify public APIs return only published, consent-confirmed records and exclude contact/asset-private metadata.
- Verify Super Admin retrieval works for pending private images and public delivery works only for approved images.
- On failure, disable new upload/submission endpoints, roll back code, restore the Mongo archive if documents were modified, and retain copied assets for investigation.

## Reporting

The migration reports counts for scanned, copied, skipped, failed, and manual-review records. Reports contain IDs and reason codes only—never private contacts, credentials, signed URLs, or raw file paths.
