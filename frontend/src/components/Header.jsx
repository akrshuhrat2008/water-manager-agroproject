import ThemeToggle from './ThemeToggle';
import { Droplet, Waves } from 'lucide-solid';

function Header() {
  return (
    <header class="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900 text-white shadow-lg">
      <div class="container mx-auto px-4 py-8">
        <div class="flex justify-between items-center">
          <div class="flex-1"></div>

          <div class="text-center flex-1">
            <div class="flex items-center justify-center gap-3 mb-2">
              <div class="relative">
                <Droplet size={40} class="text-blue-100" />
                <Waves size={20} class="absolute -bottom-1 -right-1 text-cyan-200 opacity-70" />
              </div>
              <h1 class="text-4xl font-bold tracking-tight">
                Water Manager
              </h1>
            </div>
            <p class="text-base text-blue-50 font-normal max-w-2xl mx-auto">
              Цифровое решение для эффективного управления водными ресурсами
            </p>
            <div class="flex items-center justify-center gap-6 mt-3 text-xs text-blue-100 opacity-90">
              <div class="flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span>FAO-56 метод</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 bg-blue-300 rounded-full"></div>
                <span>Реальная погода</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 bg-cyan-300 rounded-full"></div>
                <span>Точные расчеты</span>
              </div>
            </div>
          </div>

          <div class="flex-1 flex justify-end">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

