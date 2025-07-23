from supabase import create_client, Client
from config import Config  # Make sure SUPABASE_URL, SUPABASE_KEY, SUPABASE_BUCKET are defined

# Initialize Supabase client
url = Config.SUPABASE_URL
key = Config.SUPABASE_KEY
supabase: Client = create_client(url, key)

def get_media_url(path: str) -> str:
    """
    Build the public URL to a file stored in a public Supabase bucket.
    :param path: Path within the bucket (e.g., images/myimage.jpg)
    :return: Public URL of the file.
    """
    try:
        bucket_name = Config.SUPABASE_BUCKET
        cleaned_path = path.strip("/")  # Remove leading/trailing slashes
        return f"{Config.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{cleaned_path}"
    except Exception as e:
        print(f"Error generating public media URL for path '{path}': {e}")
        return None

def upload_file_to_supabase(file_path: str, storage_path: str) -> str:
    """
    Upload a file to Supabase Storage and return the public URL.
    :param file_path: Local file path (e.g., ./uploads/image.jpg)
    :param storage_path: Path in Supabase bucket (e.g., images/image.jpg)
    :return: Public URL of the uploaded file, or None if failed.
    """
    try:
        with open(file_path, "rb") as file:
            response = supabase.storage.from_(Config.SUPABASE_BUCKET).upload(storage_path, file, {"content-type": "auto"})

        if response.get('status_code') == 200 or 'error' not in response:
            return get_media_url(storage_path)
        else:
            print(f"Upload failed: {response}")
            return None
    except Exception as e:
        print(f"Error uploading file to Supabase: {e}")
        return None
