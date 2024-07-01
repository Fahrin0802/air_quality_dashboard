// This component covers Functional Requirements 23, 24, 26
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { DashboardNavbar } from "./dashboardNavbar";
import { TrashIcon, UserCircleIcon } from "@heroicons/react/24/outline";
/*
  email: developerairquality@gmail.com
  password: air_quality_dashboard
*/

import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  useMsal,
} from "@azure/msal-react";

import type { loader } from "~/root";
import { Form, useRouteLoaderData } from "@remix-run/react";
import { Alert } from "~/alerts.service";
import { DashboardSearch } from "./dashboardSearch";

export default function Dashboard({ sensors, alerts }: { sensors: any; alerts: Alert[] }) {
  const data = useRouteLoaderData<typeof loader>("root")!;
  const env = data?.env;

  // const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertSearchResults, setAlertSearchResults] = useState([]);
  const [alertName, setAlertName] = useState("");
  const [alertAddress, setAlertAddress] = useState("");
  const [alertLat, setAlertLat] = useState("");
  const [alertLon, setAlertLon] = useState("");
  const [threshold, setThreshold] = useState(5);
  const [nameError, setNameError] = useState("");
  const [addressError, setAddressError] = useState("");
  const alertAddressSearchRef = useRef<HTMLElement | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isTrashIconDisabled, setIsTrashIconDisabled] = useState(false);

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement

    if (alertAddressSearchRef.current && !alertAddressSearchRef.current.contains(event.target as Node)) {
      if (target.classList.contains('result'))
        return
      setAlertSearchResults([])
    }

  }
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [alertAddressSearchRef])

  // Used to extract the email of the user
  const { accounts } = useMsal();
  const userAccount = accounts[0] || null;
  
  // Used for the address lookup
  async function alertSearch(event: ChangeEvent<HTMLElement>) {
    event.preventDefault();
    const target = event.target as HTMLInputElement;
    setAlertAddress(target.value);

    if (!alertAddress) return;

    setAlertLat("")
    setAlertLon("")

    const query_bytes = encodeURIComponent(alertAddress);
    try {
      const url = `https://atlas.microsoft.com/search/address/json?subscription-key=${env.Maps_key}&api-version=1.0&idxSet=PAD,Addr&typeahead=true&countrySet=CA&query=${query_bytes}`;
      const response = await fetch(url);
      const locations = await response.json();

      const res: any = [];
      locations.results.forEach((result: any) => {
        res.push(result);
      });

      setAlertSearchResults(res);
    } catch (error) {
      console.log(error);
    }
  }

  // Gets the current lat and lon and stores it in the global variables
  const getAlertCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setAlertLat(latitude.toString());
          setAlertLon(longitude.toString());
          setAlertAddress("Current Location");
        },
        (error) => {
          console.error("Error getting user location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  const handleAlertNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAlertName(event.target.value);
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
  
    // Check if alertName is empty
    if (!alertName.trim()) {
      setNameError("Alert name cannot be empty");
      return;
    } else {
      setNameError("");
    }
  
    // Check if address is empty
    if (!alertAddress.trim()) {
      setAddressError("Please select a valid address");
      return;
    } else {
      setAddressError("");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <DashboardNavbar />
      <div className="pt-8 w-full flex flex-col items-center space-y-4 px-4">
        <div className="bg-white rounded-lg shadow-md p-5 w-full max-w-4xl">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome to the Edmonton Air-Quality Monitoring Dashboard!</h1>
        <AuthenticatedTemplate>
            {/* Need to fix this, not sure how to extract email from the user account, because I couldn't find the field */}
            {/*<h2 className="text-xl text-center">
              Welcome {userAccount ? userAccount.username : ""}!
            </h2>*/}
          </AuthenticatedTemplate>

          <UnauthenticatedTemplate>
            {/*<h2 className="text-2xl font-bold text-center">Welcome!</h2>*/}
          </UnauthenticatedTemplate>
          <p className="mt-4 text-lg text-center">
            This dashboard reports the <a href="https://capitalairshed.ca/monitoring-data/aqhi/" className="text-blue-500 underline">AQHI</a> from <a href="https://airquality.alberta.ca/map/" className="text-blue-500 underline">Continuous Air Quality Monitoring Stations</a> and the PM2.5 concentration from <a href="https://map.purpleair.com/1/mAQI/a10/p604800/cC0#10.39/53.4941/-113.5398" className="text-blue-500 underline"> microsensors</a>, to provide up-to-date and local information
            on your location . The recommended use of this dashboard is to monitor the AQHI from the Stations, which is calculated using 3 major pollutants (nitogen dioxide, ozone and PM2.5), and the
            PM2.5 concentration from the microsensors for risk assessment.
          </p>
        </div>

        <DashboardSearch sensors={sensors} />

        <div className="w-full max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-xl font-semibold mb-4 border-b-2 border-gray-300 pb-2 text-center">
        Create Alerts to Recieve Emails when the AQHI/AQHI+ crosses a threshold value
        </h2>
        <div className="flex flex-col md:flex-row gap-4">
          {/* FR23 - Alert.Subscription - The system shall allow users to subscribe to receive alerts through email. */}
          <div className="flex-1 bg-white rounded-lg shadow-md p-4 mb-4 md:mb-0">
            <h3 className="text-xl font-semibold mb-4 border-b-2 border-gray-300 pb-2 text-center">
              Add New Alerts 
            </h3>
            <UnauthenticatedTemplate>
              <p className="mt-2">Please log in to add new alerts.</p>
            </UnauthenticatedTemplate>
            <AuthenticatedTemplate>
              {/* FR26 - Alert.Customization - The system shall allow users to customize their alerts settings, including alert name, address and threshold for receiving alerts. */}
              <Form method="post" className="space-y-7" reloadDocument>
              <div>
                  <input
                    type="hidden"
                    id="username"
                    name="username"
                    value={userAccount ? userAccount.username : ""}
                  />
                </div>
                <div>
                  <label
                    htmlFor="alertName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Alert Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter Alert Name"
                    onChange={(e) => setAlertName(e.target.value)}
                    value={alertName}
                  />
                  {submitAttempted && !alertName.trim() && (
                    <p className="text-red-500 text-xs italic font-bold text-lg mt-2"></p>
                  )}
                </div>

                <div className="relative block text-sm font-medium text-gray-700">
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Address
                  </label>
                  <input
                    // @ts-ignore
                    ref={alertAddressSearchRef}
                    type="search"
                    id="address"
                    name="address"
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter Address"
                    onChange={alertSearch}
                    value={alertAddress}
                    autoComplete="off"
                  />
                  {submitAttempted && !alertAddress.trim() && (
                    <p className="text-red-500 text-xs italic font-bold text-lg mt-2"></p>
                  )}
                  <input type="hidden" name="lat" value={alertLat} id="lat" />
                  <input type="hidden" name="lon" value={alertLon} id="lon" />

                  <div className="absolute z-50 rounded-md bg-white  w-full max-h-60 overflow-auto">
                    {alertSearchResults.map((result: any) => {
                      return (
                        <button
                          key={result.id}
                          className="w-full text-left p-2 text-sm hover:bg-gray-100 result"
                          onClick={() => {
                            setAlertAddress(result.address.freeformAddress);
                            setAlertLat(result.position.lat);
                            setAlertLon(result.position.lon);
                            setAlertSearchResults([]);
                          }}
                        >
                          {result.address.freeformAddress}
                        </button>
                      );
                    })}
                  </div>

                  {addressError && (
                    <p className="text-red-500 text-xs italic font-bold text-lg">
                      {addressError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={getAlertCurrentLocation}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full mt4 mx-auto block mt-2"
                  >
                    Use Current Location
                  </button>
                </div>

                <div className="relative block text-sm font-medium text-gray-700">
                  <label htmlFor="threshold" className="block">
                    AQHI/AQHI+ Threshold (1-10)
                  </label>
                  <input
                    type="range"
                    id="threshold"
                    name="threshold"
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt(e.target.value))}
                    min="1"
                    max="10"
                    className="mt-1 block w-full"
                  />

                  <div
                    className="absolute bottom-0 text-xs w-full flex justify-between"
                    style={{
                      transform: `translateX(${(threshold - 5.5) * 11}%)`,
                    }}
                  >
                    <span className="absolute left-1/2 transform -translate-x-1/2 -bottom-6 font-bold text-lg">
                      {threshold}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  name="_action"
                  value="send"
                  style={{ marginTop: "3rem", backgroundColor: (!alertName.trim() || !alertLat || !alertLon) ? '#CCCCCC' : '#4CAF50' }}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full m mx-auto block"
                  disabled={!alertName.trim() || !alertLat || !alertLon }
                >
                  Add Alert
                </button>
              </Form>
            </AuthenticatedTemplate>
          </div>

          {/* List */}
          <div className="flex-1 bg-white rounded-lg shadow-md p-4">
            <h3 className="text-xl font-semibold mb-2 border-b-2 border-gray-300 pb-2 text-center">
              View Existing Alerts
            </h3>
            <UnauthenticatedTemplate>
              <p className="mt-2">Please log in to view existing alerts.</p>
            </UnauthenticatedTemplate>
            <AuthenticatedTemplate>
            <table className="min-w-full border-collapse">
                <thead>
                <tr>
                    <th className="px-4 py-2 text-center border-b border-gray-300">Name</th>
                    <th className="px-4 py-2 text-center border-b border-gray-300">Threshold</th>
                    <th className="px-4 py-2 text-center border-b border-gray-300">Delete</th>
                </tr>
                </thead>
                <tbody>
                {/* FR24 - Alert.Unsubscription - The system shall allow users to delete alerts they have signed up for. */}
                {alerts.map((alert, index) => (
                    <tr key={index} >
                    <td className="px-4 py-2 text-center">{alert.name}</td>
                    <td className="px-4 py-2 text-center">{alert.threshold}</td>
                    <td className="px-4 py-2 flex justify-center items-center">
                        <Form method="post" reloadDocument>
                        <input type="hidden" name="id" value={alert.id} />
                        <button
                            name="_action"
                            value="delete"
                            type="submit"
                            className="flex items-center justify-center"
                        >
                            <TrashIcon
                            className="block h-5 w-5 text-gray-700 hover:text-gray-900"
                            aria-hidden="true"
                            />
                        </button>
                        </Form>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </AuthenticatedTemplate>
          </div>
          </div>
        </div>
        </div>

        <div className="w-full max-w-4xl mt-4">
        <div className="flex items-center bg-white rounded-lg shadow-md p-5">
            
            <div className="flex-shrink-0">
            <img src="/img/UofA.png" alt="University of Alberta" className="h-24 w-24 object-cover rounded-full"/>
            </div>
            
            {/* Text in the middle */}
            <div className="flex-grow px-4">
            <p className="text-md">
                This dashboard was developed by Roberto Villarreal, Jay Pasrija and Pranj Patel at the University of Alberta, in collaboration with the <a href = "https://tomorrowfoundation.ca/" className="text-blue-500 underline">Tomorrow Foundation</a>. Please contact aehussein@ualberta.ca with questions about it. 
            </p>
            <br/>
            <p className="text-sm">
                Weather Station AQHI values are sourced from: <a href = "https://api.weather.gc.ca/collections/aqhi-observations-realtime?lang=en" className="text-blue-500 underline">https://api.weather.gc.ca/</a> <br/>
                Microsensor PM2.5 values are sourced from Purple Air sensors at: <a href = "https://api.purpleair.com/" className="text-blue-500 underline">https://api.purpleair.com/</a>
            </p>
            </div>

            <div className="flex-shrink-0">
            <img src="/img/Tomorrow.jpg" alt="Tomorrrow Foundation" className="h-24 w-24 object-cover rounded-full"/>
            </div>

        </div>
        </div>
      </div>
    </div>
  );
}
