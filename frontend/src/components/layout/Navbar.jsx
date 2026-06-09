export default function Navbar() {
  return (
    <div className="flex w-full items-center justify-between border-b border-gray-200 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Dashboard
      </h2>

      <div className="flex items-center space-x-4">
        <span className="text-gray-700 dark:text-gray-300">Hello, User</span>
        <img
          src="https://via.placeholder.com/35"
          className="rounded-full border border-gray-200 dark:border-gray-700"
          alt="user"
        />
      </div>
    </div>
  );
}
