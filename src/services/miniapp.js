// Optional host integration must never gate the standalone application.
export async function notifyMiniAppReady(loadSdk = () => import('@farcaster/miniapp-sdk')) {
  try {
    const { sdk } = await loadSdk();
    if (!await sdk.isInMiniApp()) return false;
    await sdk.actions.ready();
    return true;
  } catch {
    return false;
  }
}
