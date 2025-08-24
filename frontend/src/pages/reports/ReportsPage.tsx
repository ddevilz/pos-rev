const ReportsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">View business analytics and reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Report</h3>
          <p className="text-gray-500">Revenue analytics will be displayed here.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Analytics</h3>
          <p className="text-gray-500">Order analytics will be displayed here.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Analytics</h3>
          <p className="text-gray-500">Customer analytics will be displayed here.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Service Performance</h3>
          <p className="text-gray-500">Service performance metrics will be displayed here.</p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;