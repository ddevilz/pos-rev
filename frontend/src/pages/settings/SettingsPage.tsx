const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your application settings</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-500">Application settings will be available here.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;