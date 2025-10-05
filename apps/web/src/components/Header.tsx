export default function Header() {
  return (
    <header className="bg-gradient-to-r from-bloom-600 to-bloom-800 text-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-4xl">🪷</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Bloomium</h1>
              <p className="text-sm text-bloom-100">Global Flowering Phenology</p>
            </div>
          </div>
          
          <nav className="flex items-center space-x-6">
            <a
              href="https://github.com/yourusername/bloomium"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bloom-100 hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="/about"
              className="text-bloom-100 hover:text-white transition-colors"
            >
              About
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}

