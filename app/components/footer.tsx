import React from 'react';

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full py-2 bg-background">
      <div className="container mx-auto text-center text-xs md:text-sm text-gray-500">
        <p>
          Made by{' '}
          <a
            href="https://x.com/defi_failure"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-400 hover:text-gray-200"
          >
            @defi_failure
          </a>{' '}
          with ❤️
        </p>
      </div>
    </footer>
  );
}
