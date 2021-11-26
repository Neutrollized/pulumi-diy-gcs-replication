# README
I've been doing some work with [Pulumi](https://www.pulumi.com) lately, so I figured I'd make a repo that does what my [Medium article](https://medium.com/@glen.yu/diy-google-cloud-storage-replication-using-cloud-functions-51ae3a7124a7) talks about.


## Prerequisites
- `pulumi`
- `node` (version 14+)
- `npm`

Service account used needs to have the `roles/storage.objectAdmin` role added. 


## Setup
- install packages
```
npm install
```

- authenticate to GCP & Pulumi
```
gcloud auth application-default login
pulumi login gs://[MY_PULUMI_STATE_GCS_BUCKET]
```

- configure project
```
pulumi config set google-native:project [PROJECT_ID]
pulumi config set google-native:region northamerica-northeast1 (or whatever your location is)
```

## Example
Do `pulumi up`:
```
Previewing update (dev):
     Type                                         Name                          Plan
 +   pulumi:pulumi:Stack                          diy-gcs-with-replication-dev  create
 +   ├─ google-native:storage/v1:Bucket           cf-code-bucket-dev            create
 +   ├─ google-native:storage/v1:Bucket           glen-bucket-dev-mtl           create
 +   ├─ google-native:storage/v1:Bucket           glen-bucket-dev-tor           create
 +   ├─ google-native:storage/v1:BucketObject     copy_to_gcs                   create
 +   ├─ google-native:storage/v1:BucketObject     delete_from_gcs               create
 +   ├─ google-native:cloudfunctions/v1:Function  copy-to-dev-tor-gcs           create
 +   └─ google-native:cloudfunctions/v1:Function  delete-from-dev-tor-gcs       create

Resources:
    + 8 to create

Do you want to perform this update?  [Use arrows to move, enter to select, type to filter]
  yes
> no
  details
```

Say **yes** and...
```
Updating (dev):
     Type                                         Name                          Status
 +   pulumi:pulumi:Stack                          diy-gcs-with-replication-dev  created
 +   ├─ google-native:storage/v1:Bucket           cf-code-bucket-dev            created
 +   ├─ google-native:storage/v1:Bucket           glen-bucket-dev-mtl           created
 +   ├─ google-native:storage/v1:Bucket           glen-bucket-dev-tor           created
 +   ├─ google-native:storage/v1:BucketObject     copy_to_gcs                   created
 +   ├─ google-native:storage/v1:BucketObject     delete_from_gcs               created
 +   ├─ google-native:cloudfunctions/v1:Function  copy-to-dev-tor-gcs           created
 +   └─ google-native:cloudfunctions/v1:Function  delete-from-dev-tor-gcs       created

Resources:
    + 8 created

Duration: 2m10s
```

## TODO
- currently the google-native IAM API doesn't have all the functionality yet
- add in a service account with "least privilege" access
