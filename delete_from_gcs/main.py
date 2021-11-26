import string
from google.cloud import storage 

def delete_from_gcs(event, context):
    """Background Cloud Function to be triggered by Cloud Storage.
       This generic function logs relevant data when a file is changed.

    Args:
        event (dict):  The dictionary with data specific to this type of event.
                       The `data` field contains a description of the event in
                       the Cloud Storage `object` format described here:
                       https://cloud.google.com/storage/docs/json_api/v1/objects#resource
        context (google.cloud.functions.Context): Metadata of triggering event.
    Returns:
        None; the output is written to Stackdriver Logging
    """

    print('Event ID: {}'.format(context.event_id))
    print('Event type: {}'.format(context.event_type))
    print('File: {}'.format(event['name']))

    storage_client = storage.Client()
    source_bucket = storage_client.bucket(event['bucket'])
    source_blob = source_bucket.blob(event['name'])

    # split on '-' and drop location identifier ('mtl')
    temp_bucket_name = event['bucket'].split('-')[:-1]
    # add 'tor' to the list and rejoin on '-'
    temp_bucket_name.append('tor')
    destination_bucket_name = '-'.join(temp_bucket_name)

    destination_bucket = storage_client.bucket(destination_bucket_name)
    destination_blob = destination_bucket.blob(event['name'])
    
    # https://googleapis.dev/python/storage/latest/buckets.html
    blob_delete = destination_bucket.delete_blob(destination_blob.name)

    print(
        "Deleted gs://{}/{}.".format(
            destination_bucket.name,
            destination_blob.name,
        )
    )
