import { splitProps } from 'solid-js';

export function Badge(props) {
  const [local, others] = splitProps(props, ['variant', 'class', 'children']);

  const variantClasses = {
    default: 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600',
    success: 'bg-green-100 text-green-900 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    warning: 'bg-yellow-100 text-yellow-900 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
    error: 'bg-red-100 text-red-900 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
    info: 'bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    outline: 'bg-white border-2 border-gray-400 text-gray-800 dark:bg-gray-800 dark:border-gray-500 dark:text-gray-200',
  };

  const variantClass = variantClasses[local.variant || 'default'];

  return (
    <span
      class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantClass} ${local.class || ''}`}
      {...others}
    >
      {local.children}
    </span>
  );
}