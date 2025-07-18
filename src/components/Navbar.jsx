import React from 'react';
import { Fragment, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const navigation = [
  { name: 'Dashboard', href: '/', current: true },
  { name: 'Learning Paths', href: '/learning-path', current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const navLinks = [
    ...navigation,
    { name: 'Quiz', href: '/quiz' },
    { name: 'Topic Dependency Graph', href: '/topic-graph' },
    { name: 'Resources', href: '/resources' },
    ...(user && user.role === 'admin' ? [{ name: 'Admin Panel', href: '/admin' }] : []),
  ];
  const linkRefs = useRef([]);
  const [highlightStyle, setHighlightStyle] = React.useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const activeIdx = navLinks.findIndex(link => link.href === location.pathname);
    if (activeIdx !== -1 && linkRefs.current[activeIdx]) {
      const el = linkRefs.current[activeIdx];
      const rect = el.getBoundingClientRect();
      const parentRect = el.parentNode.getBoundingClientRect();
      setHighlightStyle({
        left: rect.left - parentRect.left,
        width: rect.width,
        opacity: 1,
      });
    } else {
      setHighlightStyle({ left: 0, width: 0, opacity: 0 });
    }
    // eslint-disable-next-line
  }, [location.pathname, user]);

  return (
    <Disclosure as="nav" className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <button
                    type="button"
                    className="lg:hidden rounded-md p-3 text-white hover:bg-blue-700 hover:text-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                    onClick={onMenuClick}
                    aria-label="Open sidebar menu"
                  >
                    <Bars3Icon className="h-7 w-7" aria-hidden="true" />
                  </button>
                  <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-white ml-2 hover:text-gray-100 transition-colors duration-200">
                    <AcademicCapIcon className="h-8 w-8" />
                    <span>SkillForge</span>
                  </Link>
                </div>
                <div className="ml-8 hidden sm:flex items-center space-x-8 relative" style={{minHeight: 44}}>
                  {/* Animated highlight - only this box should be visible */}
                  <div
                    className="absolute top-0 left-0 h-full bg-white/20 pointer-events-none transition-all duration-300 z-0"
                    style={{
                      ...highlightStyle,
                      position: 'absolute',
                      transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
                    }}
                  />
                  {navLinks.map((item, idx) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      ref={el => linkRefs.current[idx] = el}
                      className={
                        'relative px-4 py-2 text-white font-medium transition-colors duration-200 z-10 hover:text-blue-200 focus:outline-none'
                      }
                      tabIndex={0}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationBell />

                {/* Profile dropdown */}
                <Menu as="div" className="relative">
                  <Menu.Button className="flex rounded-full bg-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 hover:bg-blue-600 transition-colors duration-200 p-1.5" aria-label="Open user menu">
                    <span className="sr-only">Open user menu</span>
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center border-2 border-blue-200">
                      <span className="text-base font-medium text-white">U</span>
                    </div>
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/profile"
                            className={classNames(
                              active ? 'bg-gray-50' : '',
                              'block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200'
                            )}
                          >
                            Your Profile
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/settings"
                            className={classNames(
                              active ? 'bg-gray-50' : '',
                              'block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200'
                            )}
                          >
                            Settings
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={logout}
                            className={classNames(
                              active ? 'bg-gray-50' : '',
                              'block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200'
                            )}
                          >
                            Sign out
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>
        </>
      )}
    </Disclosure>
  );
}