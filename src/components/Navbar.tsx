import { Disclosure } from "@headlessui/react";
import { Link } from "react-router-dom";
import WalletConnect from "./WalletConnect";

const menu = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "About us",
    href: "/",
  },
  {
    label: "Whitepaper",
    href: "/",
  },
  {
    label: "Tokenomics",
    href: "/",
  },
];
export default function Navbar({
  wallets,
  handleWalletSelect,
  whichWalletSelected,
  closeWalletConnect,
  openWalletConnect,
  walletConnect,
  changeAddress
}: {
  wallets: any;
  handleWalletSelect: any;
  whichWalletSelected: any;
  closeWalletConnect: any;
  openWalletConnect: any;walletConnect: any;changeAddress:any
}) {
  
  return (
    <>
      <nav className="md:px-8 md:py-0 p-6 mt-4">
        <Disclosure>
          {({ open }) => (
            <>
              <div className="flex flex-wrap  justify-between md:gap-10 md:flex-nowrap">
                <img
                  src="/assets/logo.svg"
                  width={60}
                  height={60}
                  alt={"notfound"}
                  className="md:flex hidden"
                />
                <div className="items-center justify-center hidden w-full md:flex ">
                  {menu.map((item, index) => (
                    <Link
                      to={item.href}
                      key={index}
                      className="px-5 py-2 text-base font-medium text-[#E1E1E1]  hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                {!!whichWalletSelected ? (
                  <button
                    onClick={openWalletConnect}
                    className="leading-3 hidden md:flex items-center mt-4 py-3 px-4 text-center rounded-md border-[#14E8B6] green_gradient border text-white font-bold "
                  >
                    {changeAddress?.slice(0, 6)}...{changeAddress?.slice(-4)}
                  </button>
                ) : (
                  <Link
                  to={"https://zealy.io/c/replyada"}
                  target="_blank"
                  className="leading-3 hidden w-56 h-12 md:flex items-center px-4 text-center rounded-md border-[#14E8B6] green_gradient border text-white "
                >
                  Join whitelist
                </Link>
                  // <button
                  //   onClick={openWalletConnect}
                  //   className="leading-3 hidden w-56 h-12 md:flex items-center px-4 text-center rounded-md border-[#14E8B6] green_gradient border text-white "
                  // >
                  //   <span>Connect wallet</span>
                  //   <span className="ml-2">
                  //     <img src="/assets/Vector.svg" width={14} height={14} />
                  //   </span>
                  // </button>
                )}
                <div className="flex md:hidden  items-center justify-between w-full md:w-auto">
                  <img
                    src="/assets/logo.svg"
                    width={40}
                    height={40}
                    alt={"notfound"}
                    className="md:hidden"
                  />
                  <Disclosure.Button
                    aria-label="Toggle Menu"
                    className="px-2 py-1 ml-auto  rounded-md md:hidden text-white focus:outline-none"
                  >
                    <svg
                      className="w-6 h-6 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      {open && (
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"
                        />
                      )}
                      {!open && (
                        <path
                          fillRule="evenodd"
                          d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"
                        />
                      )}
                    </svg>
                  </Disclosure.Button>
                </div>
              </div>
              <Disclosure.Panel
                style={{
                  zIndex: 9999,
                }}
              >
                <div className="flex flex-col items-center justify-start order-2 w-full md:hidden">
                  {menu.map((item, index) => (
                    <Link
                      to={item.href}
                      key={index}
                      className="px-5 my-4 py-2 text-sm font-medium text-[#E1E1E1]  hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                  {!!whichWalletSelected ? (
                    <button
                      onClick={openWalletConnect}
                      className="leading-3 flex items-center mt-4 py-3 px-4 text-center rounded-md border-[#14E8B6] green_gradient border text-white font-bold "
                    >
                    {changeAddress?.slice(0, 6)}...{changeAddress?.slice(-4)}
                    </button>
                  ) : (
                    <Link
                    to={"https://zealy.io/c/replyada"}
                    target="_blank"
                    className="green_gradient disabled:cursor-not-allowed flex items-center gap-4 justify-center my-4 buy p-2.5 w-full text-white rounded-md text-sm border border-[#01CC9C]"
                  >
                    Join whitelist
                  </Link>
                    // <button
                    //   onClick={openWalletConnect}
                    //   className="leading-3 flex items-center mt-4 py-3 px-4 text-center rounded-md border-[#14E8B6] green_gradient border text-white font-bold "
                    // >
                    //   Connect wallet{" "}
                    //   <span className="ml-2">
                    //     <img src="/assets/Vector.svg" />
                    //   </span>
                    // </button>
                  )}
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </nav>
      <WalletConnect
        wallets={wallets}
        handleWalletSelect={handleWalletSelect}
        whichWalletSelected={whichWalletSelected}
        closeModal={closeWalletConnect}
        isOpen={walletConnect}
      />
    </>
  );
}
