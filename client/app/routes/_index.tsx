import { ActionFunction, json, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { ClientOnly } from "remix-utils/client-only";

import Map  from "app/components/map.client";
import Dashboard from "app/components/dashboard";

import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { AuthenticationResult, EventType, IdTokenClaims } from "@azure/msal-browser";
import { b2cPolicies } from "authConfig";
import { Alert, createAlert, deleteAlert, getAlerts } from "~/alerts.service";

export const meta: MetaFunction = () => {
  return [
    { title: "Air-Quality Dashboard" },
    // { name: "description", content: "Welcome to Remix!" },
  ];
};

function skeleton() {
  
  return (
    <div className="animate-pulse p-4" data-testid="skeleton">
        <div className="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 max-w-[640px] mb-2.5 mx-auto"></div>
        <div className="h-2.5 mx-auto bg-gray-300 rounded-full dark:bg-gray-700 max-w-[540px]"></div>
        <div className="flex justify-center mt-4">
            <div className="w-20 h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 me-3"></div>
            <div className="w-24 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
        <span className="sr-only">Loading...</span>
    </div>
  );
}

declare var process: {
  env: {
    Apim_Key: string;
    Maps_key: string;
  };
};

export async function loader() {
  try {
    const url =
      "https://apim-airqualitydashboard-prod.azure-api.net/func-airqualitydashboard-prod/GetSensors";
    const headers = new Headers({
      "Ocp-Apim-Subscription-Key": process.env.Apim_Key,
    });

    const response = await fetch(url, { headers });
    const sensors = await response.json();
    return { sensors };
  } catch (error) {
    console.error(error);
    return json({ sensors: [] });
  }
}

export const action: ActionFunction = async ({ request }) => {

  const formData = await request.formData();

  if (!formData.get("_action")) {
    throw new Error("_action does not exist in formData");
  }

  if (formData.get("_action") === "send") {
    const name = formData.get("name")?.toString() || "";
    const username = formData.get("username")?.toString() || "";
    const longitude = +(formData.get("lon")?.toString() || "");
    const latitude = +(formData.get("lat")?.toString() || "");
    const threshold = +(formData.get("threshold")?.toString() || 5);
    const isabove = false;
    
    const id = await createAlert({
      latitude,
      longitude,
      name,
      username,
      threshold,
      isabove
    });
    
    return new Response(JSON.stringify({ done: true, id }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  if (formData.get("_action") === "delete") {
    const id = formData.get("id")?.toString();
    if (id) {
      const success = await deleteAlert(id);
      if (success) {
        return new Response(JSON.stringify({ done: true }), {
          headers: {
            "Content-Type": "application/json",
          },
        });
      } else {
        return new Response(JSON.stringify({ error: "Failed to delete alert" }), {
          headers: {
            "Content-Type": "application/json",
          },
          status: 500, // Internal server error
        });
      }
    } else {
      return new Response(JSON.stringify({ error: "Missing ID parameter" }), {
        headers: {
          "Content-Type": "application/json",
        },
        status: 400, // Bad request
      });
    }
  }
};

export default function Index() {
  ///Fahrin///

  const [view, setView] = useState("dashboard");

  const [alerts, setAlerts] = useState([])
  
  const { instance, accounts } = useMsal();

  useEffect(() => {
    const fetcher = async () => {

      const userAccount = accounts[0] || null;

      if (!userAccount)
        return
      
      const username = userAccount ? userAccount.username : "";
      const alerts = await getAlerts(username);
      setAlerts(alerts)
    };

    fetcher()

  }, [instance])

  useEffect(() => {

    const callbackId = instance.addEventCallback(async (event) => {
      if (
        (event.eventType === EventType.LOGIN_SUCCESS ||
          event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) &&
        event.payload
      ) {

        console.log("WOOO")

        const payload = event.payload as AuthenticationResult;
        const idTokenClaims = payload.idTokenClaims as IdTokenClaims;

        // check if user is returning frm reset password flow
        // if so, ask the user to reauthenticate with their new password
        if (
          idTokenClaims["tfp"]?.toLowerCase() ===
          b2cPolicies.names.forgotPassword.toLowerCase()
        ) {
          const signUpSignInFlowRequest = {
            authority: b2cPolicies.authorities.signUpSignIn.authority,
            scopes: [],
          };
          await instance.loginRedirect(signUpSignInFlowRequest);
        }
      }

      if (event.eventType === EventType.LOGIN_FAILURE) {
        // check for forgot password error
        if (event.error && event.error.message.includes("AADB2C90118")) {
          const resetPasswordRequest = {
            authority: b2cPolicies.authorities.forgotPassword.authority,
            scopes: [],
          };
          await instance.loginRedirect(resetPasswordRequest);
        }
      }
    });

    return () => {
      if (callbackId) {
        instance.removeEventCallback(callbackId);
      }
    };
  }, [instance]);


  // will only update map if new data is recieved
  const { sensors } = useLoaderData<typeof loader>();

  if (sensors === null)
    return <div className="flex flex-col h-screen">{skeleton()}</div>;

  const toggleView = () => {
    setView((currentView) => (currentView === "map" ? "dashboard" : "map"));
  };

  return (
    <div>
      {/* <button
        onClick={toggleView}
        className="absolute top-4 left-4 z-10 p-2 bg-blue-500 text-white rounded shadow-lg focus:outline-none hover:bg-blue-700 transition duration-300"
        data-testid="toggle-view-button"
      >
        {view === "map" ? "Go to Dashboard" : "Go to Map"}
      </button> */}

      <ClientOnly fallback={skeleton()}>
        {() =>
          view === "map" ? (
            <> </> 
            // <Map sensors={sensors} latitude={53.5461} longitude={-113.4937} lat={lat} lon={lon}/>
          ) : (
            <Dashboard sensors={sensors} alerts={alerts} />
          )
        }
      </ClientOnly>
    </div>
  );
}

