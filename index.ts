import * as pulumi from "@pulumi/pulumi";
import * as storage from "@pulumi/google-native/storage/v1";
import * as cloudfunctions from "@pulumi/google-native/cloudfunctions/v1";
import { project, region } from "@pulumi/google-native/config";


const ENV = pulumi.getStack();
const GCS_BUCKET = "glen-bucket";
const LOCATION_ID = "mtl";
const BACKUP_REGION = "northamerica-northeast2";
const BACKUP_LOCATION_ID = "tor";	// disaster recovery/backup location


// https://www.pulumi.com/registry/packages/google-native/api-docs/storage/v1/bucket/
const sourceBucket = new storage.Bucket(`${GCS_BUCKET}-${ENV}-${LOCATION_ID}`, {
   name: `${GCS_BUCKET}-${ENV}-${LOCATION_ID}`, // disable auto-naming (no random hex suffix)
   location: `${region}`,
});

const backupBucket = new storage.Bucket(`${GCS_BUCKET}-${ENV}-${BACKUP_LOCATION_ID}`, {
   name: `${GCS_BUCKET}-${ENV}-${BACKUP_LOCATION_ID}`,
   location: `${BACKUP_REGION}`,
});

/**
 * Deploy a function using an explicitly set runtime.
 */

// https://github.com/pulumi/examples/blob/master/gcp-ts-serverless-raw/index.ts
const cfCodeBucket = new storage.Bucket(`cf-code-bucket-${ENV}`, {
    location: `${region}`,
});

const copyCf = new storage.BucketObject("copy_to_gcs", {
    bucket: cfCodeBucket.name,
    source: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./copy_to_gcs"),
    }),
});

const COPY_CF_ARCHIVE_URL = pulumi.all([cfCodeBucket.name, copyCf.name]).apply(([bucketname,objectname]) => {
    const COPY_CF_ARCHIVE_URL = `gs://${bucketname}/${objectname}`;
    return COPY_CF_ARCHIVE_URL;
});

// https://www.pulumi.com/registry/packages/google-native/api-docs/cloudfunctions/v1/function/
const copyFunction = new cloudfunctions.Function(`copy-to-${ENV}-${BACKUP_LOCATION_ID}-gcs`, {
    runtime: "python39",
    description: `copies new objects in ${GCS_BUCKET}-${ENV}-${LOCATION_ID} to ${GCS_BUCKET}-${ENV}-${BACKUP_LOCATION_ID}`,
    location: `${region}`,
    availableMemoryMb: 128,
    sourceArchiveUrl: COPY_CF_ARCHIVE_URL,
    entryPoint: "copy_to_gcs",	// this should be the python function name
    eventTrigger: {
        eventType: "google.storage.object.finalize",
        resource: `projects/${project}/buckets/${GCS_BUCKET}-${ENV}-${LOCATION_ID}`,
    },
});

const deleteCf = new storage.BucketObject("delete_from_gcs", {
    bucket: cfCodeBucket.name,
    source: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive("./delete_from_gcs"),
    }),
});

const DELETE_CF_ARCHIVE_URL = pulumi.all([cfCodeBucket.name, deleteCf.name]).apply(([bucketname,objectname]) => {
    const DELETE_CF_ARCHIVE_URL = `gs://${bucketname}/${objectname}`;
    return DELETE_CF_ARCHIVE_URL;
});

const delete_function = new cloudfunctions.Function(`delete-from-${ENV}-${BACKUP_LOCATION_ID}-gcs`, {
    runtime: "python39",
    description: `deletes objects from ${GCS_BUCKET}-${ENV}-${BACKUP_LOCATION_ID}`,
    location: `${region}`,
    availableMemoryMb: 128,
    sourceArchiveUrl: DELETE_CF_ARCHIVE_URL,
    entryPoint: "delete_from_gcs",	// this should be the python function name
    eventTrigger: {
        eventType: "google.storage.object.delete",
        resource: `projects/${project}/buckets/${GCS_BUCKET}-${ENV}-${LOCATION_ID}`,
    },
});