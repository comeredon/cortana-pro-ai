Azure deployment and GitHub Actions for cortanaback

Overview

This document describes how to deploy the project to a second Azure Static Web App in the resource group `cortanaback`, and how to ensure the Container App has access to the same secrets used for Web PubSub and Azure Speech (TTS).

What the supplied workflow does

- Builds the app (npm ci && npm run build)
- Logs into Azure using the AZURE_CREDENTIALS repository secret (service principal)
- Attempts to create a Static Web App named by the workflow (default: cortanaback-ui-${{ github.run_id }}) in the `cortanaback` resource group if it does not exist
- Applies application settings (VITE_* environment values) to the Static Web App
- Deploys built artifacts using the Static Web Apps CLI as a fallback
- Writes secrets to the specified Container App using `az containerapp secret set`
- Patches the Container App to reference secrets as environment variables so the container can read them at runtime

Required GitHub repository secrets

- AZURE_CREDENTIALS
  - Create a service principal with contributor access scoped at least to the `cortanaback` resource group. Example:

    az ad sp create-for-rbac --name "github-cortanaback-sp" --role contributor --scopes /subscriptions/<subscription-id>/resourceGroups/cortanaback --sdk-auth

  - Copy the JSON output and add it to the repository secret named `AZURE_CREDENTIALS`.

- VITE_WEBPUBSUB_ENDPOINT
  - Your Azure Web PubSub endpoint or connection string.

- VITE_WEBPUBSUB_KEY
  - Web PubSub primary key (if using separate endpoint/key rather than a single connection string).

- VITE_AZURE_SPEECH_KEY
  - Azure Speech resource key for TTS.

- VITE_AZURE_SPEECH_REGION
  - Azure Speech resource region (e.g., eastus/centralus).

Optional repository secrets

- CONTAINER_APP_NAME
  - If you have a specific Container App that should receive secrets, add it as a secret so the workflow can update it. Otherwise edit the workflow to set the variable `CONTAINER_APP_NAME` to the correct container app name.

How to verify after deployment

1. Open the Static Web App default hostname returned by the workflow (it prints the hostname at the end).
2. Confirm the site loads and that the application can connect to Web PubSub (open browser console to check WebPubSub connection logs).
3. Verify speech synthesis works by invoking a TTS action (you will need the Speech key/region set; check browser console for TTS logs/requests).
4. Inspect the Container App configuration in the Azure Portal to confirm the secrets are present (Configuration → Secrets) and environment variables reference them.

Troubleshooting tips

- If the workflow cannot create resources, ensure the service principal JSON in `AZURE_CREDENTIALS` has access to the subscription and resource group.
- If the Static Web App name collides or is invalid, change `STATIC_WEBAPP_NAME` in the workflow or make it stable by using a deterministic name (but Static Web App names must be globally unique).
- If your Container App is using Azure Key Vault or other secret stores, the workflow will need adjustments to place secrets there instead.

Security notes

- Do not check credentials or keys into source control. Always use GitHub repository secrets.
- Limit the service principal privileges to the minimum scope (resource group) required for the deployment.

If you want, I can:
- Add a Bicep template to provision the Static Web App and Container App (recommended for repeatable infra-as-code), or
- Modify the workflow to deploy only to an existing Static Web App (no create step), or
- Update the workflow to support multiple branches and preview environments.
