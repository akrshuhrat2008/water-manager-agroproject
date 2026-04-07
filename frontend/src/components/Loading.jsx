function Loading({ show }) {
  if (!show) return null;

  return (
    <div class="card text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
      <p class="text-primary-600 font-medium">Выполняется расчет...</p>
    </div>
  );
}

export default Loading;

