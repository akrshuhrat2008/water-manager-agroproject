import { createSignal, onMount } from 'solid-js';

function ThemeToggle() {
  const [isDark, setIsDark] = createSignal(false);

  onMount(() => {
    // Проверяем сохраненную тему
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved === 'dark' || (!saved && prefersDark);
    setIsDark(dark);
    applyTheme(dark);
  });

  const applyTheme = (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark();
    setIsDark(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      title={isDark() ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
    >
      {isDark() ? '☀️' : '🌙'}
    </button>
  );
}

export default ThemeToggle;

