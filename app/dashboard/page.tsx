import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader 
        title="Dashboard" 
        description="Track your learning progress and access saved content"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm text-blue-600 font-medium">+12%</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">24</div>
          <div className="text-sm text-blue-700">Total Notes</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm text-green-600 font-medium">+8%</span>
          </div>
          <div className="text-2xl font-bold text-green-900">156</div>
          <div className="text-sm text-green-700">Quiz Questions</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm text-purple-600 font-medium">+24%</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">18</div>
          <div className="text-sm text-purple-700">Images Processed</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-2xl border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="text-sm text-orange-600 font-medium">+45%</span>
          </div>
          <div className="text-2xl font-bold text-orange-900">42</div>
          <div className="text-sm text-orange-700">Audio Minutes</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card title="Recent Notes">
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Chapter 5: Photosynthesis</h4>
                <p className="text-sm text-gray-500">OCR • 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Lecture Notes: Calculus</h4>
                <p className="text-sm text-gray-500">Summary • 5 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">History Podcast Episode</h4>
                <p className="text-sm text-gray-500">Speech • 1 day ago</p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Quiz Performance">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
              <div>
                <h4 className="font-medium text-gray-900">Biology Quiz #3</h4>
                <p className="text-sm text-gray-500">Yesterday</p>
              </div>
              <div className="text-2xl font-bold text-green-600">85%</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h4 className="font-medium text-gray-900">Chemistry Quiz #2</h4>
                <p className="text-sm text-gray-500">2 days ago</p>
              </div>
              <div className="text-2xl font-bold text-blue-600">92%</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50">
              <div>
                <h4 className="font-medium text-gray-900">Mathematics Quiz #1</h4>
                <p className="text-sm text-gray-500">3 days ago</p>
              </div>
              <div className="text-2xl font-bold text-orange-600">78%</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-400 transition-colors">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">New Note</span>
          </button>
          
          <button className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 hover:border-green-400 transition-colors">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Summarize</span>
          </button>
          
          <button className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 hover:border-purple-400 transition-colors">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Quiz</span>
          </button>
          
          <button className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 hover:border-orange-400 transition-colors">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Settings</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
