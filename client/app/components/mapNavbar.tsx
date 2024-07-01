// This component covers Functional Requirements 8, 9, 10, 17, 20
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { ChangeEvent, Fragment, useEffect, useRef, useState } from "react";

import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  useMsal,
} from "@azure/msal-react";
import { loginRequest } from "authConfig";

import type { loader } from "~/root";
import { useRouteLoaderData } from "@remix-run/react";
import L from "leaflet";
import { getSensorsWithDistance, MIN_DISTANCE } from "./utils";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// Function to calculate distance between two geographical coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const firstLat = toRadians(lat1);
  const secondLat = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(firstLat) *
      Math.cos(secondLat);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export default function MapNavbar({map, station_data, purpleair_data}: {map: L.Map; station_data: {[key: string]: [any, L.Marker]}; purpleair_data: {[key: string]: [any, L.Marker]}}) {
  const data = useRouteLoaderData<typeof loader>("root")!;
  const env = data?.env;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const searchRef = useRef<HTMLElement | null>(null);


  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement

    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      if (target.classList.contains('result'))
        return
      setResults([])
    }

  }
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [searchRef])
  
  async function search(event: ChangeEvent<HTMLElement>) {
    event.preventDefault();
    const target = event.target as HTMLInputElement;
    setQuery(target.value);

    const query_bytes = encodeURIComponent(query);
    try {

      // "" to be able to do test cases where env varaibles not availble
      const key = env ? env.Maps_key || "" : "";

      const url = `https://atlas.microsoft.com/search/address/json?subscription-key=${key}&api-version=1.0&idxSet=PAD,Addr&typeahead=true&countrySet=CA&query=${query_bytes}`;
      const response = await fetch(url);
      
      const locations = await response.json();

      const res: any = [];
      locations.results.forEach((result: any) => {
        res.push(result);
      });

      setResults(res);
    } catch (error) {
      console.log(error);
    }
  }

  const { instance } = useMsal();

  let activeAccount;

  if (instance) activeAccount = instance.getActiveAccount();

  const handleLogoutRedirect = () => {
    instance.logoutRedirect();
  };

  const handleLoginRedirect = () => {
    instance.loginRedirect(loginRequest).catch((error) => console.log(error));
  };

  // function used when navigation search is clicked
  const onClick = function (lat: number, lon: number, address: string) {
    const station = Object.values(station_data).map((data) => data[0]);
    const purpleair = Object.values(purpleair_data).map((data) => data[0]);
    // Find nearest sensor
    const sensorsDistances = getSensorsWithDistance(lat, lon, [
      ...station,
      ...purpleair,
    ]);
    const nearest = sensorsDistances[0];

    const sensor = nearest.type === "purpleair" ? purpleair_data[nearest.id][0] : station_data[nearest.id][0];
    const marker = nearest.type === "purpleair" ? purpleair_data[nearest.id][1] : station_data[nearest.id][1];

    const bounds = L.latLngBounds(L.latLng(sensor.latitude, sensor.longitude), L.latLng(lat, lon)).pad(1);
    const center = bounds.getCenter();
    const zoom = map.getBoundsZoom(bounds);
    marker.openPopup();

    // FR9 - Check.Distance - The system shall check the distance from the address to the nearest sensor. If no sensor is found within 100m, let the user know and choose the closest sensor to the address.
    if (nearest.distance <= MIN_DISTANCE)
      L.popup().setLatLng([lat, lon]).setContent(`
        <div data-testid="map-search-popup">
          <span class="font-bold">${address}</span></br>
          Sensor is within confortable distance of ${MIN_DISTANCE} km<br/>
          Distance to sensor is ${nearest.distance.toFixed(2)} km
        </div>
    `).openOn(map);
    else
      L.popup().setLatLng([lat, lon]).setContent(`
      <div data-testid="map-search-popup">
        <span class="font-bold">${address}</span></br>
        Sensor is <span class="font-bold">not</span> within confortable distance of ${MIN_DISTANCE} km<br/>
        Distance to sensor is ${nearest.distance.toFixed(2)} km
      </div>
      </div>
    `).openOn(map);

    // FR10 - Display.Nearest.Sensor - The system shall display data from the nearest sensor and the distance from the sensor.
    map.setView(center, zoom-1);
    
  };
  

  return (
    <Disclosure as="nav" className="bg-white">
      <>
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8" data-testid="navbar">
          <div className="relative flex h-16 items-center">
            <div className="flex">
            </div>

            {/* FR8 - Address.Input - The system shall provide an interface for the user to enter addresses to retrieve AQIs for. */}
            <div className="flex-grow flex justify-center items-center">
              {/* Search bar */}
              <div className="relative mx-autotext-gray-600">
                <input
                  // @ts-ignore
                  ref={searchRef}
                  type="search"
                  className="p-2 flex-grow border border-gray-300 rounded-md w-full"
                  name="search"
                  placeholder="Search"
                  onChange={search}
                  value={query}
                  autoComplete="off"
                  data-testid="map-address-search"
                />
                <div className="flex flex-col absolute z-50 rounded-lg min-w-full">
                  {results.map((result: any) => {
                    return (
                      <button
                        key={result.id}
                        data-testid="map-search-result"
                        className="w-full text-left p-2 text-sm hover:bg-gray-100 bg-white result"
                        onClick={() => {
                          onClick(result.position.lat, result.position.lon, result.address.freeformAddress);
                          // to hide results. could be changed to something more effective
                          setResults([]);
                          setQuery(result.address.freeformAddress)
                        }}
                      >
                        {result.address.freeformAddress}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center ml-6">
                {/* FR17 - Request.Registration - The system shall provide the option of registering a new user, with 
                    an email address and secure password, redirecting to the registration form on request. */}
                {/* FR20 - Request.Login - The system should allow the user to request to login and redirect to the login form. */}
                <UnauthenticatedTemplate>
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
                    onClick={handleLoginRedirect}
                >
                    Login
                </button>
                </UnauthenticatedTemplate>
                {/* Profile dropdown */}
                <AuthenticatedTemplate>
                <Menu as="div" className="relative ml-3 z-50">
                    <div>
                    <Menu.Button className="relative flex rounded-full text-sm hover:outline-none hover:ring-2 hover:ring-black">
                        <span className="absolute -inset-1.5" />
                        <span className="sr-only">Open user menu</span>
                        <UserCircleIcon
                        className="block h-8 w-8"
                        aria-hidden="true"
                        />
                    </Menu.Button>
                    </div>
                    <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                    >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-2 ring-black ring-opacity-5 focus:outline-none">
                        <Menu.Item>
                        {({ active }) => (
                            <button
                            className={classNames(
                                active ? "bg-gray-100" : "",
                                "px-4 py-2 text-sm text-gray-700 w-full text-start"
                            )}
                            onClick={handleLogoutRedirect}
                            >
                            Logout
                            </button>
                        )}
                        </Menu.Item>
                    </Menu.Items>
                    </Transition>
                </Menu>
                </AuthenticatedTemplate>
            </div>
          </div>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"></div>
        <hr className="border-2"></hr>
      </>
    </Disclosure>
  );
}

