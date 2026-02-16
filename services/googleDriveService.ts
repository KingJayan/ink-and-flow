declare global { interface Window { gapi: any; google: any; } }
const API_KEY = process.env.API_KEY;
const APP_ID = "560477878104";
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '560477878104-placeholder.apps.googleusercontent.com';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const loadGoogleScripts = () => {
  return new Promise<void>((resolve) => {
    const checkGapi = setInterval(() => {
      if (window.gapi) {
        clearInterval(checkGapi);
        window.gapi.load('client:picker', async () => {
          await window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
          });
          gapiInited = true;
          if (gisInited) resolve();
        });
      }
    }, 100);

    const checkGis = setInterval(() => {
      if (window.google) {
        clearInterval(checkGis);
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '',
        });
        gisInited = true;
        if (gapiInited) resolve();
      }
    }, 100);

    setTimeout(() => {
      if (!gapiInited || !gisInited) {
        console.warn("Google Scripts load timeout.");
        resolve();
      }
    }, 5000);
  });
};

export const pickGoogleDoc = (): Promise<{ title: string; content: string }> => {
  return new Promise(async (resolve, reject) => {
    if (!gapiInited || !gisInited) await loadGoogleScripts();

    tokenClient.callback = async (response: any) => {
      if (response.error) {
        reject(response);
        return;
      }
      createPicker(response.access_token, resolve, reject);
    };

    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

const createPicker = (accessToken: string, resolve: any, reject: any) => {
  const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
  view.setMimeTypes("application/vnd.google-apps.document");

  const picker = new window.google.picker.PickerBuilder()
    .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
    .setAppId(APP_ID)
    .setOAuthToken(accessToken)
    .addView(view)
    .setDeveloperKey(API_KEY)
    .setCallback((data: any) => pickerCallback(data, resolve, reject))
    .build();

  picker.setVisible(true);
};

const pickerCallback = async (data: any, resolve: any, reject: any) => {
  if (data.action === window.google.picker.Action.PICKED) {
    const fileId = data.docs[0].id;
    const title = data.docs[0].name;

    try {
      const response = await window.gapi.client.drive.files.export({
        fileId: fileId,
        mimeType: 'text/html',
      });

      const content = response.body;
      const bodyContent = content.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || content;

      resolve({ title, content: bodyContent });
    } catch (err) {
      console.error("Error exporting file", err);
      reject(err);
    }
  } else if (data.action === window.google.picker.Action.CANCEL) {
    reject("Cancelled");
  }
};