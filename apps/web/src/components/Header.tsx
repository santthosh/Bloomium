import Image from 'next/image';

interface HeaderProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-space-navy via-space-navy-800 to-sky-blue-900 text-white shadow-xl relative z-50">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center h-full gap-3">
            {/* Mobile hamburger button */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {sidebarOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
            {/* Logo Icon */}
            <div className="relative h-10 w-auto flex-shrink-0">
              <Image
                src="/bloomium-logo.png"
                alt="Bloomium Logo"
                width={40}
                height={40}
                className="object-contain"
                style={{ maxHeight: '40px', width: 'auto', height: 'auto' }}
                priority
                unoptimized
              />
            </div>
            
            {/* Logo Text and Tagline */}
            <div className="flex flex-col justify-center">
              <div className="relative h-5 w-auto">
                <Image
                  src="/bloomium-logo-text.png"
                  alt="Bloomium"
                  width={75}
                  height={20}
                  className="object-contain"
                  style={{ maxHeight: '20px', width: 'auto', height: 'auto' }}
                  priority
                  unoptimized
                />
              </div>
              <p className="text-[12px] text-white/90 leading-tight mt-0.5 hidden sm:block">
                Mapping Earth's Seasons, One Bloom at a Time.
              </p>
            </div>
          </div>
          
          <nav className="flex items-center">
            <a
              href="https://github.com/santthosh/Bloomium"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-blue-200 hover:text-petal-pink transition-colors text-sm font-medium flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-white/10"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}

