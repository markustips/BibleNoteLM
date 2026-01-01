# Fix Cloud Functions Deployment Permissions

## Error

```
Build failed: Access to bucket gcf-sources-904170610776-us-central1 denied.
You must grant Storage Object Viewer permission to 904170610776-compute@developer.gserviceaccount.com
```

## Quick Fix (2 minutes)

### Method 1: Using Google Cloud Console (Recommended)

**Step 1: Open Cloud Storage Console**
```
https://console.cloud.google.com/storage/browser?project=biblenotelm-6cf80
```

**Step 2: Find the GCF Sources Bucket**
- Look for bucket named: `gcf-sources-904170610776-us-central1`
- If you don't see it, it will be created automatically. Continue anyway.

**Step 3: Grant IAM Permission to Service Account**

Go to IAM permissions page:
```
https://console.cloud.google.com/iam-admin/iam?project=biblenotelm-6cf80
```

**Step 4: Find the Compute Service Account**
- Look for: `904170610776-compute@developer.gserviceaccount.com`
- If you don't see it, click **"GRANT ACCESS"** to add it

**Step 5: Add Role**
1. Click **"GRANT ACCESS"** button
2. In "New principals" field, enter:
   ```
   904170610776-compute@developer.gserviceaccount.com
   ```
3. In "Select a role" dropdown, type: `Storage Object Viewer`
4. Select **"Storage Object Viewer"**
5. Click **"SAVE"**

**Step 6: Add Additional Required Role**
Repeat Step 5, but this time select **"Cloud Build Service Account"** role:
1. Click **"GRANT ACCESS"** again
2. Same principal: `904170610776-compute@developer.gserviceaccount.com`
3. Role: Search for **"Cloud Build Service Account"**
4. Click **"SAVE"**

---

### Method 2: Using Command Line (Alternative)

If you prefer command line, run this:

```bash
# Grant Storage Object Viewer role
gcloud projects add-iam-policy-binding biblenotelm-6cf80 \
  --member=serviceAccount:904170610776-compute@developer.gserviceaccount.com \
  --role=roles/storage.objectViewer

# Grant Cloud Build Service Account role
gcloud projects add-iam-policy-binding biblenotelm-6cf80 \
  --member=serviceAccount:904170610776-compute@developer.gserviceaccount.com \
  --role=roles/cloudbuild.builds.builder
```

---

## After Fixing Permissions

Once you've granted the permissions, deploy again:

```bash
cd D:\Dev\BibleNoteLm\backend
firebase deploy --only functions
```

This time the deployment should succeed!

---

## What These Permissions Do

**Storage Object Viewer**:
- Allows Cloud Functions build system to read source code from Cloud Storage
- Required for every Cloud Functions deployment

**Cloud Build Service Account**:
- Allows Cloud Build to create container images
- Required for building Node.js 22 functions

---

## Why This Happened

When you first deploy Cloud Functions to a new Firebase project, Firebase needs to set up IAM permissions automatically. Sometimes this doesn't happen properly, especially on new Blaze plan projects.

This is a one-time setup. After granting these permissions, future deployments won't have this issue.

---

## Verification

After granting permissions, you can verify they were applied:

```bash
gcloud projects get-iam-policy biblenotelm-6cf80 \
  --flatten="bindings[].members" \
  --filter="bindings.members:904170610776-compute@developer.gserviceaccount.com"
```

You should see both roles listed:
- `roles/storage.objectViewer`
- `roles/cloudbuild.builds.builder`

---

## Next Steps

1. **Grant the 2 IAM roles** (using Method 1 or Method 2 above)
2. **Deploy again**: `firebase deploy --only functions`
3. **Wait 5-8 minutes** for all 46 functions to deploy
4. **Verify success**: Check Firebase Console → Functions

---

**Start here**: https://console.cloud.google.com/iam-admin/iam?project=biblenotelm-6cf80

Grant the two roles, then come back and run `firebase deploy --only functions`! 🚀
