import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
} from "@remix-run/react";

import stylesheet from "~/tailwind.css"

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "stylesheet", href: stylesheet },
];

import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "authConfig";
import { AuthenticationResult, EventType, PublicClientApplication } from "@azure/msal-browser";

export const msalInstance  = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(() => {

  // deafult to using the first acount if not account is active on page load
  if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0)
    msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0])

})

msalInstance.enableAccountStorageEvents();

msalInstance.addEventCallback((event) => {
  if (
    (event.eventType === EventType.LOGIN_SUCCESS || event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS|| event.eventType === EventType.SSO_SILENT_SUCCESS)
    && event.payload
    ) {
      const payload = event.payload as AuthenticationResult;
      const account = payload.account;
      // const idTokenClaims = payload.idTokenClaims as IdTokenClaims;

      msalInstance.setActiveAccount(account);
    }
});

export async function loader() {
  return json({
    env: {
      Apim_Key: process.env.Apim_Key!,
      Maps_key: process.env.Maps_key!,
      PurpleAir_Key: process.env.PurpleAir_Key!
    }
  });
}

export default function App() {

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no" />
        <Meta />
        <Links />
      </head>
      <body>
        <MsalProvider instance={msalInstance}>
          <Outlet />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </MsalProvider>
      </body>
    </html>
  );
}
