// This component covers Functional Requirement 17, 20
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { ChangeEvent, Fragment, useState } from "react";

import {
    AuthenticatedTemplate,
    UnauthenticatedTemplate,
    useMsal,
  } from "@azure/msal-react";

import { loginRequest } from "authConfig";

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
  }

export function DashboardNavbar() {

    const { instance } = useMsal();

    let activeAccount;
  
    if (instance) activeAccount = instance.getActiveAccount();

    const handleLogoutRedirect = () => {
        instance.logoutRedirect();
    };
    
    const handleLoginRedirect = () => {
        instance.loginRedirect(loginRequest).catch((error) => console.log(error));
    };


    return (
      <Disclosure as="nav" className="bg-white">
      <>
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8" data-testid="dashboard-navbar">
          <div className="relative flex h-16 items-center justify-between">
            <div className="flex-shrink-0">
            </div>
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
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"></div>
        <hr className="border-2"></hr>
      </>
    </Disclosure>
    );
  }