import { LogLevel } from "@azure/msal-browser";

export const b2cPolicies = {
  names: {
    signUpSignIn: "B2C_1_signupsignin",
    forgotPassword: "B2C_1_reset"
  },
  authorities: {
    signUpSignIn: {
      authority: "https://tomorrowairquality.b2clogin.com/tomorrowairquality.onmicrosoft.com/B2C_1_signupsignin"
    },
    forgotPassword: {
      authority: "https://tomorrowairquality.b2clogin.com/tomorrowairquality.onmicrosoft.com/B2C_1_reset"
    }
  },
  authorityDomain: "tomorrowairquality.b2clogin.com"
}

export const msalConfig = {
  auth: {
    clientId: "b01e5092-1803-4f0e-8932-200f49ca89fe",
    authority: b2cPolicies.authorities.signUpSignIn.authority,
    knownAuthorities: [b2cPolicies.authorityDomain],
    redirectUri: "https://localhost:8000/",
    postLogoutRedirectUri: 'https://localhost:8000/',
    navigateToLoginRequestUrl: false, // If "true", will navigate back to the original request location before processing the auth code response.
    cache: {
      cacheLocation: "localStorage",
      storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    }
  },
  system: {
    allowNativeBroker: false, // Disables WAM Broker
    loggerOptions: {
      loggerCallback: (level: any, message: any, containsPii: any) => {
        if (containsPii) {
            return;
        }
        switch (level) {
            case LogLevel.Error:
                console.error(message);
                return;
            case LogLevel.Info:
                console.info(message);
                return;
            case LogLevel.Verbose:
                console.debug(message);
                return;
            case LogLevel.Warning:
                console.warn(message);
                return;
            default:
                return;
        }
      }
    }
  }
}

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit:
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
export const loginRequest = {
  scopes: [],
};