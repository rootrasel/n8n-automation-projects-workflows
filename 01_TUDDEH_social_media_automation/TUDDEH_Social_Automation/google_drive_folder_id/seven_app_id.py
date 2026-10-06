from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import os
import json

SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly"
]

ROOT_FOLDER_ID = "12hJxfZKyoBrXiGjzE0jRdweTX30HNX0K"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_FILE = os.path.join(BASE_DIR, "credentials.json")
TOKEN_FILE = os.path.join(BASE_DIR, "token.json")
OUTPUT_FILE = os.path.join(BASE_DIR, "folder_ids.json")


def authenticate():
    creds = None

    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(
            TOKEN_FILE,
            SCOPES
        )

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_FILE):
                raise FileNotFoundError(
                    f"Missing credentials file: '{CREDENTIALS_FILE}'.\n"
                    "Please download your OAuth client credentials from Google Cloud Console "
                    "and save it as 'credentials.json' in this directory."
                )
            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_FILE,
                SCOPES
            )
            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, "w") as token:
            token.write(creds.to_json())

    return build("drive", "v3", credentials=creds)


def get_subfolders(service, parent_id):
    query = (
        f"'{parent_id}' in parents "
        "and mimeType = 'application/vnd.google-apps.folder' "
        "and trashed = false"
    )

    results = service.files().list(
        q=query,
        spaces="drive",
        fields="files(id,name,webViewLink)",
        orderBy="name",
        includeItemsFromAllDrives=True,
        supportsAllDrives=True
    ).execute()

    return results.get("files", [])


def main():
    service = authenticate()

    folders = get_subfolders(
        service,
        ROOT_FOLDER_ID
    )

    print("\nTUDDEH SOCIAL AUTOMATION - GOOGLE DRIVE FOLDER IDS")
    print("=" * 70)

    folder_data = {}

    for folder in folders:
        name = folder["name"]
        folder_id = folder["id"]

        print(f"📁 {name}")
        print(f"   ID:  {folder_id}")
        print(f"   URL: https://drive.google.com/drive/folders/{folder_id}")
        print()

        folder_data[name] = {
            "id": folder_id,
            "url": f"https://drive.google.com/drive/folders/{folder_id}"
        }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(folder_data, f, indent=2)

    print("=" * 70)
    print(f"Found {len(folders)} folders.")
    print(f"Saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
