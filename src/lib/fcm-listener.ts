
// This code runs on the client and creates the "bridge"
// for the Android app to send the token to.

// 1. Extend the 'window' object type to include our function
declare global {
  interface Window {
    receiveFCMToken: (token: string) => void;
    AndroidBridge: {
      requestFCMToken: () => void;
      triggerGoogleSignIn: () => void;
      triggerNativeSignOut: () => void;
      onEmailNotFound: (email: string) => void;
      triggerPhoneCall: (phoneNumber: string) => void;
      openExternalUrl: (url: string) => void;
      /**
       * Starts the device setup process.
       * @param ipAddress The IP of an existing device to view, or an empty string for a new device setup.
       */
      startDeviceSetup: (ipAddress: string) => void;
      /**
       * Tells the native app to open a URL inside its main WebView.
       * @param url The full URL to load (e.g., "http://192.168.1.100/app").
       */
      openInAppUrl: (url: string) => void;
    };
  }
}

// 2. Create the function on the window
if (typeof window !== 'undefined') {
  window.receiveFCMToken = (token: string) => {
    console.log("✅ [Step 1: The Bridge] 'receiveFCMToken' called by Android. Dispatching event now.");

    // 3. Create a new custom event and dispatch it.
    // This is how we pass the token from the plain JavaScript 'window'
    // into the React application.
    const event = new CustomEvent('fcmTokenReceived', { detail: token });
    window.dispatchEvent(event);
  };
}
